
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { generateSequelizeModels } from './nodejs/models';
import { generatePrismaSchema } from './nodejs/prisma';
import { generateTypeOrmModels } from './nodejs/typeorm';
import { generateDrizzleSchema } from './nodejs/drizzle';
import { toCamelCase, toPascalCase } from './common';

export const generateNodeJs = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  const integrations = config.integrations || { storage: { provider: 'local' }, sso: [], webhooks: [] };

  let dbDriverInfo = '"tedious": "^18.6.1"';
  if (config.dbType === DbType.MySQL) dbDriverInfo = '"mysql2": "^3.11.0"';
  else if (config.dbType === DbType.SQLite) dbDriverInfo = '"sqlite3": "^5.1.7"';

  // --- Dependencies ---
  let dependencies = `
    "express": "^4.21.2",
    "sequelize": "^6.37.5",
    "@prisma/client": "^5.10.0",
    "prisma": "^5.10.0",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "axios": "^1.7.9",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.7",
    ${dbDriverInfo}`;

  if (integrations.sso.length > 0) {
      dependencies += `,\n    "passport": "^0.7.0",\n    "passport-google-oauth20": "^2.0.0"`; 
  }
  if (integrations.storage.provider === 's3') {
      dependencies += `,\n    "aws-sdk": "^2.1692.0",\n    "multer-s3": "^3.0.1"`;
  }

  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{
  "name": "${config.projectName.toLowerCase()}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {${dependencies}
  },
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}`, language: 'json' });

  // --- ENV Files ---
  const generateEnvContent = (conn: string) => {
      let dbName = 'my_db', user = 'user', pass = 'pass', host = 'localhost';
      if (config.dbType === DbType.SQLite) {
          return `DB_DIALECT=sqlite\nDB_STORAGE=${conn.replace('Data Source=', '')}\nPORT=${config.port}`;
      }
      
      const parts = conn.split(';');
      parts.forEach(p => {
          const [k, v] = p.split('=');
          if(!k || !v) return;
          const key = k.trim().toLowerCase();
          const val = v.trim();
          if (key.includes('database')) dbName = val;
          if (key.includes('server') || key.includes('host')) host = val;
          if (key.includes('user')) user = val;
          if (key.includes('password') || key.includes('pwd')) pass = val;
      });

      return `DB_HOST=${host}\nDB_USER=${user}\nDB_PASS=${pass}\nDB_NAME=${dbName}\nDB_DIALECT=${config.dbType === DbType.MySQL ? 'mysql' : 'mssql'}\nPORT=${config.port}`;
  };

  // Base .env
  files.push({ name: '.env', path: `${root}/.env`, content: generateEnvContent(config.dbConnection), language: 'text' });

  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
          files.push({ 
              name: `.env.${suffix}`, 
              path: `${root}/.env.${suffix}`, 
              content: generateEnvContent(env.dbConnection || config.dbConnection), 
              language: 'text' 
          });
      });
  }

  files.push({ name: 'models.js', path: `${root}/models.js`, content: generateSequelizeModels(tables, relationships, config), language: 'javascript' });
  
  files.push({ name: 'schema.prisma', path: `${root}/prisma/schema.prisma`, content: generatePrismaSchema(tables, relationships, config.dbType), language: 'text' });
  files.push({ name: 'entity.ts', path: `${root}/typeorm/entity.ts`, content: generateTypeOrmModels(tables, relationships, config.dbType), language: 'typescript' });
  files.push({ name: 'schema.ts', path: `${root}/drizzle/schema.ts`, content: generateDrizzleSchema(tables, relationships, config.dbType), language: 'typescript' });

  // --- Scheduler ---
  const schedulerJs = `const cron = require('node-cron');
const db = require('./models');

const initJobs = () => {
    console.log("Initializing Scheduler...");
    cron.schedule('* * * * *', async () => {
    });
};

module.exports = initJobs;`;
  files.push({ name: 'scheduler.js', path: `${root}/scheduler.js`, content: schedulerJs, language: 'javascript' });

  // --- Webhook Service ---
  const webhookJs = `const axios = require('axios');

const webhooks = ${JSON.stringify(integrations.webhooks, null, 2)};

const notify = async (event, payload) => {
    webhooks.forEach(hook => {
        if (hook.events.includes(event)) {
            axios.post(hook.url, { event, data: payload, timestamp: new Date() })
                .then(() => console.log('Webhook sent to', hook.url))
                .catch(err => console.error('Webhook failed:', err.message));
        }
    });
};

module.exports = { notify };`;
  files.push({ name: 'webhookService.js', path: `${root}/services/webhookService.js`, content: webhookJs, language: 'javascript' });

  // --- Storage Service ---
  let storageJs = `const multer = require('multer');\n`;
  if (integrations.storage.provider === 'local') {
      storageJs += `
const upload = multer({ dest: 'uploads/' });
module.exports = upload;`;
  } else if (integrations.storage.provider === 's3') {
      storageJs += `
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: '${integrations.storage.region || 'us-east-1'}'
});

const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: '${integrations.storage.bucketName}',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname)
        }
    })
});
module.exports = upload;`;
  }
  files.push({ name: 'storageService.js', path: `${root}/services/storageService.js`, content: storageJs, language: 'javascript' });

  // --- CRUD Routes ---
  let routes = "";
  tables.forEach(t => {
      const modelName = toPascalCase(t.name);
      const routeName = toCamelCase(t.name);
      const searchableFields = t.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT').map(f => f.name);

      const createdByField = t.fields.find(f => ['createdby', 'created_by', 'erstellt_von', 'erstelltvon', 'created_user', 'createduser'].includes(f.name.toLowerCase()));
      const modifiedByField = t.fields.find(f => ['modifiedby', 'modified_by', 'updatedby', 'updated_by', 'geaendert_von', 'bearbeitetvon', 'bearbeitet_von'].includes(f.name.toLowerCase()));
      const createdDateField = t.fields.find(f => ['createddate', 'created_date', 'createdat', 'created_at', 'erstellt_am', 'erstelltam'].includes(f.name.toLowerCase()));
      const modifiedDateField = t.fields.find(f => ['modifieddate', 'modified_date', 'updatedat', 'updated_at', 'geaendert_am', 'bearbeitet_am'].includes(f.name.toLowerCase()));

      const nowDefaultFields = t.fields.filter(f => {
          const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
          const hasNowDefault = f.defaultValue && (
              f.defaultValue.toLowerCase().includes('now') ||
              f.defaultValue.toLowerCase().includes('current_timestamp') ||
              f.defaultValue.toLowerCase().includes('getdate')
          );
          return isDateType && hasNowDefault;
      });

      let postAuditCode = `        const payload = { ...req.body };
        const username = getLoggedInUser(req);
`;
      if (createdByField) postAuditCode += `        payload.${createdByField.name} = username;\n`;
      if (modifiedByField) postAuditCode += `        payload.${modifiedByField.name} = username;\n`;
      if (createdDateField) postAuditCode += `        payload.${createdDateField.name} = new Date();\n`;
      if (modifiedDateField) postAuditCode += `        payload.${modifiedDateField.name} = new Date();\n`;
      nowDefaultFields.forEach(df => {
          postAuditCode += `        if (!payload.${df.name}) payload.${df.name} = new Date();\n`;
      });

      let putAuditCode = `        const payload = { ...req.body };
        const username = getLoggedInUser(req);
`;
      if (createdByField) putAuditCode += `        payload.${createdByField.name} = existing.${createdByField.name};\n`;
      if (createdDateField) putAuditCode += `        payload.${createdDateField.name} = existing.${createdDateField.name};\n`;
      if (modifiedByField) putAuditCode += `        payload.${modifiedByField.name} = username;\n`;
      if (modifiedDateField) putAuditCode += `        payload.${modifiedDateField.name} = new Date();\n`;

      routes += `
// ${modelName} Routes
app.get('/api/${routeName}', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            whereClause[db.Sequelize.Op.or] = [
                ${searchableFields.map(f => `{ ${f}: { [db.Sequelize.Op.like]: \`%\${search}%\` } }`).join(',\n                ')}
            ];
        }

        const { count, rows } = await db.${modelName}.findAndCountAll({ 
            where: whereClause,
            limit: limit,
            offset: offset,
            include: { all: true, nested: false } 
        });
        
        res.json({
            data: rows,
            total: count,
            page: page,
            pageSize: limit,
            totalPages: Math.ceil(count / limit)
        });
    } 
    catch (e) { console.error('Error fetching ${routeName}:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/${routeName}/:id', async (req, res) => {
    try { const item = await db.${modelName}.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching ${routeName} id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/${routeName}', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
${postAuditCode}
        const item = await db.${modelName}.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/${routeName}/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.${modelName}.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
${putAuditCode}
        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/${routeName}/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.${modelName}.findByPk(req.params.id);
        const deleted = await db.${modelName}.destroy({ 
            where: { [db.${modelName}.primaryKeyAttribute]: req.params.id },
            transaction: t
        });
        if (deleted) {
            await t.commit();
            webhooks.notify('delete', item); // Trigger Webhook
            res.json({ message: 'Deleted' }); 
        } else {
            await t.rollback();
            res.status(404).json({error: 'Not found'});
        }
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error deleting ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});`;
  });

  // --- Main Server ---
  const serverJs = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const initJobs = require('./scheduler');
const webhooks = require('./services/webhookService');
const upload = require('./services/storageService');
${integrations.sso.length > 0 ? "const passport = require('passport');" : ""}

const app = express();

const getLoggedInUser = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('dummy-jwt-token-for-')) {
            return token.replace('dummy-jwt-token-for-', '');
        }
        if (token.startsWith('dummy-jwt-token-sso-')) {
            return token.replace('dummy-jwt-token-sso-', '') + ' User';
        }
        return token;
    }
    return 'System';
};

// Enable CORS with Credentials support (fixes Status 0 errors in fetch)
app.use(cors({
    origin: true, // Reflect request origin
    credentials: true 
}));

app.use(express.json());

// Auth Setup
${integrations.sso.length > 0 ? `
app.use(passport.initialize());
` : ""}

// Auth Routes
if (${config.authConfig?.useUserLogin !== undefined ? config.authConfig?.useUserLogin : false}) {
app.post('/api/auth/login', (req, res) => {
    res.json({ token: "dummy-jwt-token-for-" + (req.body.username || 'user'), user: { username: req.body.username || 'user', role: 'Admin' } });
});
app.post('/api/auth/register', (req, res) => {
    res.status(201).json({ message: "User registered successfully" });
});
app.post('/api/auth/login-sso', (req, res) => {
    const provider = req.body.provider || 'unknown';
    res.json({ token: "dummy-jwt-token-sso-" + provider, user: { username: provider + ' User', role: 'User' } });
});
}

// Routes
${routes}

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
});

const PORT = process.env.PORT || ${config.port};

// Sync Database and Start Server
db.sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced successfully.');
        initJobs(); // Start Scheduler
        app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });`;

  files.push({ name: 'server.js', path: `${root}/server.js`, content: serverJs, language: 'javascript' });

  const readmeContent = `# ${config.projectName} (Node.js / Express)

Dieses Backend basiert auf **Node.js, Express und Sequelize**.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **Node.js** (LTS v20+).
* Laufende Datenbank (${config.dbType}).

### 2. Installation
\`\`\`bash
npm install
\`\`\`

### 3. Konfiguration (.env)
Prüfen Sie die Datei \`.env\`.
${config.dbType === DbType.SQLite ? 'Für SQLite wird die Datei automatisch erstellt.' : 'Stellen Sie sicher, dass Host, User und Passwort stimmen.'}

### 4. Starten
\`\`\`bash
# Startet den Server (Node 20+ mit --watch Support)
npm run dev
\`\`\`

Die API läuft unter **http://localhost:${config.port}/api**.

## 🧩 Features
* **ORM:** Sequelize (Auto-Sync beim Start).
* **Uploads:** ${integrations.storage.provider}.
* **Webhooks:** ${integrations.webhooks.length} konfiguriert.
* **SSO:** ${integrations.sso.map(s => s.provider).join(', ') || 'Keine'}.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
