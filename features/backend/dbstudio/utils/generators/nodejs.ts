import JSZip from 'jszip';

export function generateNodejsBackend(zip: JSZip, schemaSql: string) {
  // Node.js Express Backend
  const packageJson = {
    name: "db-studio-pro-selfhost-backend",
    version: "1.0.0",
    description: "Self-Hosting Metadata, Dynamic Data & Sync Backend for DB Studio Pro (Node.js Express)",
    main: "server.js",
    scripts: {
      start: "node server.js",
      dev: "nodemon server.js",
      initdb: "node scripts/initdb.js"
    },
    dependencies: {
      express: "^4.19.2",
      cors: "^2.8.5",
      dotenv: "^16.4.5",
      jsonwebtoken: "^9.0.2",
      bcryptjs: "^2.4.3",
      sqlite3: "^5.1.7"
    },
    devDependencies: {
      nodemon: "^3.1.0"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  const serverJs = `/**
 * DB Studio Pro - Complete Self-Host Backend Server (Node.js Express)
 * Supports full IndexedDB state sync: Projects, Payload, Tables, Fields, Queries, Forms, Reports, Custom Components, Data Rows, Users & Chats.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'dbstudio_meta.db');
const db = new sqlite3.Database(dbPath);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DB Studio Pro Self-Host Backend (Node.js)', version: '1.0.0' });
});

// GET /api/projects - List projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM sys_projects ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/projects/:id - Load single project + full data payload
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM sys_projects WHERE id = ?', [id], (err, proj) => {
    if (err || !proj) return res.status(404).json({ error: 'Projekt nicht gefunden' });
    db.get('SELECT data_json FROM sys_project_payloads WHERE project_id = ?', [id], (err2, payload) => {
      let data = {};
      if (payload && payload.data_json) {
        try { data = JSON.parse(payload.data_json); } catch(e){}
      }
      res.json({ ...proj, data });
    });
  });
});

// POST /api/projects - Create or update full project state
app.post('/api/projects', (req, res) => {
  const { id, name, description, data, dbType, language } = req.body;
  const projId = id || 'proj_' + Date.now();
  const projName = name || 'Neues Projekt';
  const now = Date.now();

  db.run(
    \`INSERT INTO sys_projects (id, name, description, db_type, language, last_modified) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, last_modified=excluded.last_modified\`,
    [projId, projName, description || '', dbType || 'SQLite', language || 'nodejs', now],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (data) {
        const payloadStr = JSON.stringify(data);
        db.run(
          \`INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?)
           ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json, updated_at=CURRENT_TIMESTAMP\`,
          [projId, payloadStr]
        );
      }
      res.json({ success: true, id: projId, name: projName });
    }
  );
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', (req, res) => {
  db.run('DELETE FROM sys_projects WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET /api/data/:tableName - Dynamic User Table Data Rows
app.get('/api/data/:tableName', (req, res) => {
  const { tableName } = req.params;
  const projectId = req.query.projectId || 'proj_default';
  db.all('SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?', [tableName, projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const records = rows.map(r => {
      try { return JSON.parse(r.data_json); } catch(e){ return null; }
    }).filter(Boolean);
    res.json(records);
  });
});

// POST /api/data/:tableName - Insert or Update Dynamic Table Data Row
app.post('/api/data/:tableName', (req, res) => {
  const { tableName } = req.params;
  const record = req.body;
  const projectId = req.query.projectId || record.projectId || 'proj_default';
  const recordId = record.id ? String(record.id) : 'rec_' + Date.now();
  const sysId = \`\${tableName}_\${recordId}\`;

  db.run(
    \`INSERT INTO sys_table_data (id, project_id, table_name, record_id, data_json) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=CURRENT_TIMESTAMP\`,
    [sysId, projectId, tableName, recordId, JSON.stringify(record)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, recordId });
    }
  );
});

// GET /api/users - Users management
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM sys_users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/sync
app.post('/api/sync', (req, res) => {
  const { projectId, prompt, metadata } = req.body;
  const syncId = 'sync_' + Date.now();
  db.run(
    'INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, metadata_payload) VALUES (?, ?, ?, ?, ?, ?)',
    [syncId, projectId || 'proj_default', 'admin', 'LOCAL_TO_CLOUD', prompt || 'Sync', JSON.stringify(metadata || {})],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, syncId, message: 'DB Studio Metadaten & IndexedDB erfolgreich synchronisiert' });
    }
  );
});

app.listen(PORT, () => console.log(\`DB Studio Node.js Backend läuft auf http://localhost:\${PORT}\`));
`;
  zip.file("server.js", serverJs);

  const initDbJs = `const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../dbstudio_meta.db');
const sqlPath = path.resolve(__dirname, '../schema.sql');
const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');
db.exec(sql, (err) => {
  if (err) console.error('Fehler:', err);
  else console.log('Alle DB Studio Metadaten & Data Tables erfolgreich initialisiert!');
  db.close();
});
`;
  zip.file("scripts/initdb.js", initDbJs);
  zip.file("Dockerfile", `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`);
  zip.file("docker-compose.yml", `version: '3.8'\nservices:\n  dbstudio-backend:\n    build: .\n    ports:\n      - "3000:3000"\n    restart: always`);
  zip.file("README.md", `# DB Studio Pro - Node.js Self-Host Backend\n\nUnterstützt alle IndexedDB Object Stores (Projects, Tables, Fields, Queries, Forms, Reports, Custom Components, Data Rows, Users).\n\n1. \`npm install\`\n2. \`npm run initdb\`\n3. \`npm start\``);
  zip.file("start.bat", `@echo off\ncall npm install\ncall npm run initdb\ncall npm start\npause`);
  zip.file("start.sh", `#!/bin/bash\nnpm install\nnpm run initdb\nnpm start`);
}
