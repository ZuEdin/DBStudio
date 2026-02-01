
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { generateSequelizeModels } from './nodejs/models';
import { toCamelCase, toPascalCase } from './common';

export const generateNodeJs = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  const integrations = config.integrations || { storage: { provider: 'local' }, sso: [], webhooks: [] };

  let dbDriverInfo = '"tedious": "^16.0.0"';
  if (config.dbType === DbType.MySQL) dbDriverInfo = '"mysql2": "^3.0.0"';
  else if (config.dbType === DbType.SQLite) dbDriverInfo = '"sqlite3": "^5.1.6"';

  // --- Dependencies ---
  let dependencies = `
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "axios": "^1.6.2",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    ${dbDriverInfo}`;

  if (integrations.sso.length > 0) {
      dependencies += `,\n    "passport": "^0.6.0",\n    "passport-google-oauth20": "^2.0.0"`; 
  }
  if (integrations.storage.provider === 's3') {
      dependencies += `,\n    "aws-sdk": "^2.1495.0",\n    "multer-s3": "^3.0.1"`;
  }

  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{
  "name": "${config.projectName.toLowerCase()}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {${dependencies}
  }
}`, language: 'json' });

  // --- ENV Files ---
  const generateEnvContent = (conn: string) => {
      let dbName = 'my_db', user = 'user', pass = 'pass', host = 'localhost';
      if (config.dbType === DbType.SQLite) {
          // For SQLite, typically file path
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

  // Base .env (Development by default)
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

  // --- Scheduler ---
  const schedulerJs = `const cron = require('node-cron');
const db = require('./models');

const initJobs = () => {
    console.log("Initializing Scheduler...");
    
    // Example: A job running every minute to check connection
    cron.schedule('* * * * *', async () => {
        // console.log("System Health Check: OK");
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

  // --- CRUD Routes with Webhooks ---
  let routes = "";
  tables.forEach(t => {
      const modelName = toPascalCase(t.name);
      const routeName = toCamelCase(t.name);
      const searchableFields = t.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT').map(f => f.name);

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
        const item = await db.${modelName}.create(req.body, { transaction: t }); 
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
        const [updated] = await db.${modelName}.update(req.body, { 
            where: { [db.${modelName}.primaryKeyAttribute]: req.params.id },
            transaction: t
        });
        
        if (updated) { 
            const updatedItem = await db.${modelName}.findByPk(req.params.id, { transaction: t }); 
            await t.commit();
            webhooks.notify('update', updatedItem); // Trigger Webhook
            res.json(updatedItem); 
        } else { 
            await t.rollback();
            res.status(404).json({error: 'Not found'});
        }
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
app.use(cors());
app.use(express.json());

// Auth Setup
${integrations.sso.length > 0 ? `
app.use(passport.initialize());
// Configure strategies here (Placeholder)
// passport.use(new GoogleStrategy(...));
` : ""}

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

## Integrations
- **Webhooks:** ${integrations.webhooks.length} configured.
- **Storage:** ${integrations.storage.provider}
- **SSO:** ${integrations.sso.map(s => s.provider).join(', ') || 'None'}

## Environments
Env files wurden generiert:
- .env (default)
${config.environments?.map(e => `- .env.${e.name === 'Production' ? 'production' : e.name === 'Staging' ? 'staging' : 'development'}`).join('\n') || ''}

## Start
\`\`\`bash
npm install
node server.js
\`\`\`
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
