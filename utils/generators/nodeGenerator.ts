
import { Table, Relationship, Query, SelectQuery, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType, isNullable } from './common';

export const generateNodeJs = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // Determine Dialect
  let dialect = 'mssql'; // Default SQL Server
  let dbDriverInfo = '"tedious": "^16.0.0"'; // MSSQL driver
  
  if (config.dbType === DbType.MySQL) {
      dialect = 'mysql';
      dbDriverInfo = '"mysql2": "^3.0.0"';
  } else if (config.dbType === DbType.SQLite) {
      dialect = 'sqlite';
      dbDriverInfo = '"sqlite3": "^5.1.6"';
  }

  // 0. CLI_COMMANDS.txt
  const cliCommands = `===============================================================
ANLEITUNG: ${config.projectName} (Node.js / Express)
===============================================================

VORAUSSETZUNGEN:
----------------
1. Node.js (v16 oder höher) und npm müssen installiert sein.
2. Datenbank:
   ${config.dbType === DbType.SQL ? '- SQL Server muss laufen (Zugangsdaten in models.js prüfen).' : ''}
   ${config.dbType === DbType.MySQL ? '- MySQL Server muss laufen (Zugangsdaten in models.js prüfen).' : ''}
   ${config.dbType === DbType.SQLite ? '- Keine Installation nötig (Datei wird erstellt).' : ''}

BEFEHLE ZUM STARTEN (Terminal / CMD / PowerShell):
--------------------------------------------------

1. In das Projektverzeichnis wechseln:
   cd Backend/${config.projectName}

2. Abhängigkeiten installieren:
   npm install

   (Dies lädt alle Pakete herunter, die in package.json stehen,
   wie 'express', 'sequelize' und den Datenbanktreiber.)

3. Server starten:
   node server.js

   Hinweis: Beim Start prüft Sequelize automatisch die Datenbanktabellen 
   und legt sie an, falls sie nicht existieren.

4. API Testen:
   ${config.useSwagger ? 'Öffnen Sie im Browser: http://localhost:' + config.port + '/api-docs' : 'Nutzen Sie Postman oder Curl unter http://localhost:' + config.port + '/api/...'}

WICHTIG:
--------
Passen Sie ggf. die Datenbank-Verbindungseinstellungen in der Datei 'models.js' an,
wenn Sie keine Standard-Verbindung nutzen.
`;
  files.push({ name: 'CLI_COMMANDS.txt', path: `${root}/CLI_COMMANDS.txt`, content: cliCommands, language: 'text' });

  // 1. package.json
  const packageJson = `{
  "name": "${config.projectName.toLowerCase()}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "cors": "^2.8.5",
    ${dbDriverInfo}${config.useSwagger ? ',\n    "swagger-ui-express": "^5.0.0"' : ''}
  }
}`;
  files.push({ name: 'package.json', path: `${root}/package.json`, content: packageJson, language: 'json' });

  // 2. Models & Associations
  // Connection String parsing logic for Sequelize
  let sequelizeConstructor = '';
  
  if (dialect === 'sqlite') {
      // Extract filename from "Data Source=app.db" or use default
      const storage = config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'database.sqlite';
      sequelizeConstructor = `const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '${storage}'
});`;
  } else {
      // Standard connection string or params
      let db = 'database_name';
      let user = 'user';
      let pass = 'password';
      let host = 'localhost';
      
      if (config.dbConnection.includes(';')) {
          const parts = config.dbConnection.split(';');
          parts.forEach(p => {
              const [k, v] = p.split('=');
              if (!k || !v) return;
              const key = k.trim().toLowerCase();
              if (key === 'database' || key === 'initial catalog') db = v.trim();
              if (key === 'server' || key === 'data source') host = v.trim();
              if (key === 'user' || key === 'uid' || key === 'user id') user = v.trim();
              if (key === 'password' || key === 'pwd') pass = v.trim();
          });
      }

      sequelizeConstructor = `const sequelize = new Sequelize('${db}', '${user}', '${pass}', {
  host: '${host}',
  dialect: '${dialect}'
});`;
  }

  let sequelizeInit = `const { Sequelize, DataTypes } = require('sequelize');

// Database Connection (${config.dbType})
${sequelizeConstructor}

const db = {};
`;

  tables.forEach(table => {
    const fields = table.fields.map(f => {
      const type = resolveType(f, 'sequelize');
      const props = [`        type: ${type}`];
      
      if (f.isPrimaryKey) props.push('        primaryKey: true');
      if (f.isAutoIncrement) props.push('        autoIncrement: true');
      if (!isNullable(f)) props.push('        allowNull: false');
      
      return `    ${f.name}: {\n${props.join(',\n')}\n    }`;
    }).join(',\n');

    sequelizeInit += `
db.${table.name} = sequelize.define('${table.name}', {
${fields}
});
`;
  });

  // Relationships
  let associations = '\n// Relationships\n';
  relationships.forEach(rel => {
      const parent = tables.find(t => t.id === rel.fromTableId);
      const child = tables.find(t => t.id === rel.toTableId);
      const childField = child?.fields.find(f => f.id === rel.toFieldId);
      
      if (parent && child && childField) {
          if (rel.type === '1:n') {
              associations += `db.${parent.name}.hasMany(db.${child.name}, { foreignKey: '${childField.name}' });\n`;
              associations += `db.${child.name}.belongsTo(db.${parent.name}, { foreignKey: '${childField.name}' });\n`;
          } else {
              associations += `db.${parent.name}.hasOne(db.${child.name}, { foreignKey: '${childField.name}' });\n`;
              associations += `db.${child.name}.belongsTo(db.${parent.name}, { foreignKey: '${childField.name}' });\n`;
          }
      }
  });

  sequelizeInit += associations;

  sequelizeInit += `
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;`;

  files.push({ name: 'models.js', path: `${root}/models.js`, content: sequelizeInit, language: 'javascript' });

  // 3. Server.js
  const swaggerImport = config.useSwagger ? "const swaggerUi = require('swagger-ui-express');\nconst swaggerDocument = require('./swagger.json');" : "";
  const swaggerRoute = config.useSwagger ? "app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));" : "";

  let routes = "";
  tables.forEach(t => {
      routes += `
// --- CRUD for ${t.name} ---
app.get('/api/${t.name.toLowerCase()}', async (req, res) => {
    try {
        const items = await db.${t.name}.findAll({ include: { all: true } });
        res.json(items);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/${t.name.toLowerCase()}/:id', async (req, res) => {
    try {
        const item = await db.${t.name}.findByPk(req.params.id);
        if (item) res.json(item); else res.status(404).send({message: 'Not found'});
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/${t.name.toLowerCase()}', async (req, res) => {
    try {
        const item = await db.${t.name}.create(req.body);
        res.json(item);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/${t.name.toLowerCase()}/:id', async (req, res) => {
    try {
        const item = await db.${t.name}.findByPk(req.params.id);
        if (item) { await item.update(req.body); res.json(item); } else res.status(404).send({message: 'Not found'});
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/${t.name.toLowerCase()}/:id', async (req, res) => {
    try {
        const item = await db.${t.name}.findByPk(req.params.id);
        if (item) { await item.destroy(); res.json({ message: 'Deleted' }); } else res.status(404).send({message: 'Not found'});
    } catch (e) { res.status(500).json({ error: e.message }); }
});
`;
  });

  queries.forEach(q => {
      if (q.type !== 'SELECT') return;
      routes += `
// Query: ${q.name}
app.get('/api/queries/${q.name.replace(/\s+/g, '-').toLowerCase()}', async (req, res) => {
    // TODO: Use sequelize.query('SELECT ...')
    res.json({ message: "Query implementation required" });
});
`;
  });

  const serverJs = `const express = require('express');
const cors = require('cors');
const db = require('./models');
${swaggerImport}

const app = express();
app.use(cors());
app.use(express.json());

${swaggerRoute}

${routes}

const PORT = process.env.PORT || ${config.port};

// sync({ alter: true }) checks the state of the table in the database 
// and performs changes to match the model.
db.sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
        console.log(\`Server running on port \${PORT}\`);
    });
});`;

  files.push({ name: 'server.js', path: `${root}/server.js`, content: serverJs, language: 'javascript' });

  // Swagger JSON
  if (config.useSwagger) {
      files.push({
          name: 'swagger.json',
          path: `${root}/swagger.json`,
          content: JSON.stringify({
              swagger: "2.0",
              info: { version: "1.0.0", title: config.projectName },
              paths: {}
          }, null, 2),
          language: 'json'
      });
  }

  return files;
};
