
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { generateSequelizeModels } from './nodejs/models';
import { toCamelCase, toPascalCase } from './common';

export const generateNodeJs = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  let dbDriverInfo = '"tedious": "^16.0.0"';
  if (config.dbType === DbType.MySQL) dbDriverInfo = '"mysql2": "^3.0.0"';
  else if (config.dbType === DbType.SQLite) dbDriverInfo = '"sqlite3": "^5.1.6"';

  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{
  "name": "${config.projectName.toLowerCase()}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "cors": "^2.8.5",
    ${dbDriverInfo}
  }
}`, language: 'json' });

  files.push({ name: 'models.js', path: `${root}/models.js`, content: generateSequelizeModels(tables, relationships, config), language: 'javascript' });

  let routes = "";
  tables.forEach(t => {
      const modelName = toPascalCase(t.name);
      const routeName = toCamelCase(t.name);
      routes += `
app.get('/api/${routeName}', async (req, res) => {
    try { const items = await db.${modelName}.findAll({ include: { all: true } }); res.json(items); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/${routeName}', async (req, res) => {
    try { const item = await db.${modelName}.create(req.body); res.json(item); } catch (e) { res.status(500).json({ error: e.message }); }
});`;
  });

  const serverJs = `const express = require('express');
const cors = require('cors');
const db = require('./models');
const app = express();
app.use(cors());
app.use(express.json());
${routes}
const PORT = process.env.PORT || ${config.port};
db.sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
});`;

  files.push({ name: 'server.js', path: `${root}/server.js`, content: serverJs, language: 'javascript' });
  return files;
};
