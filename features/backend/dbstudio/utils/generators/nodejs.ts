import JSZip from 'jszip';

export function generateNodejsBackend(
  zip: JSZip, 
  schemaSql: string, 
  subfolderPath: string = '', 
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

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
  zip.file(".env", `PORT=3000\nBASE_PATH=${normalizedSubfolder}\nNODE_ENV=production\n`);

  const serverJs = `/**
 * DB Studio Pro - Complete Self-Host Backend Server (Node.js Express)
 * Supports full Subfolder / wwwroot Base Path configuration & IndexedDB state sync.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '${normalizedSubfolder}';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'dbstudio_meta.db');
const db = new sqlite3.Database(dbPath);

// Create express router to handle both root and subfolder paths without 404s
const router = express.Router();

// Health check
router.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'DB Studio Pro Self-Host Backend (Node.js)', 
    version: '1.0.0',
    basePath: BASE_PATH || '/'
  });
});

// GET /api/projects - List projects
router.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM sys_projects ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/projects/:id - Load single project + full data payload
router.get('/api/projects/:id', (req, res) => {
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
router.post('/api/projects', (req, res) => {
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
router.delete('/api/projects/:id', (req, res) => {
  db.run('DELETE FROM sys_projects WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET /api/data/:tableName - Dynamic User Table Data Rows
router.get('/api/data/:tableName', (req, res) => {
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
router.post('/api/data/:tableName', (req, res) => {
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
router.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM sys_users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/sync
router.post('/api/sync', (req, res) => {
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

// Attach router to root and subfolder base path
app.use('/', router);
if (BASE_PATH && BASE_PATH !== '/') {
  app.use(BASE_PATH, router);
}

// Serve wwwroot static files
const wwwrootPath = path.join(__dirname, 'wwwroot');
if (fs.existsSync(wwwrootPath)) {
  app.use(express.static(wwwrootPath));
  if (BASE_PATH && BASE_PATH !== '/') {
    app.use(BASE_PATH, express.static(wwwrootPath));
  }
}

app.listen(PORT, () => {
  console.log(\`DB Studio Node.js Backend läuft auf Port \${PORT}\`);
  if (BASE_PATH) console.log(\`Unterordner / Base Path aktiv: http://localhost:\${PORT}\${BASE_PATH}\`);
});
`;
  zip.file("server.js", serverJs);

  if (includeWwwroot) {
    const wwwrootIndex = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Studio Pro Self-Host API</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 560px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 1.6rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
        .subfolder-badge { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; padding: 0.35rem 0.85rem; border-radius: 0.5rem; font-family: monospace; font-weight: 600; font-size: 0.85rem; display: inline-block; margin: 1rem 0; }
        .endpoints { text-align: left; background: #0f172a; padding: 1rem; border-radius: 0.5rem; border: 1px solid #334155; font-family: monospace; font-size: 0.8rem; margin-top: 1.5rem; color: #38bdf8; }
        a { color: #38bdf8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro Self-Host API</h1>
        <p>Das Node.js Express Backend ist online und für Ihren Unterordner konfiguriert.</p>
        ${normalizedSubfolder ? `<div class="subfolder-badge">Aktiver Unterordner: ${normalizedSubfolder}</div>` : ''}
        <div class="endpoints">
            <div style="color:#a5b4fc; font-weight:bold; margin-bottom:0.5rem;">Verfügbare API-Routen:</div>
            <div>GET  ${normalizedSubfolder}/api/health</div>
            <div>GET  ${normalizedSubfolder}/api/projects</div>
            <div>POST ${normalizedSubfolder}/api/projects</div>
            <div>GET  ${normalizedSubfolder}/api/data/:tableName</div>
            <div>POST ${normalizedSubfolder}/api/data/:tableName</div>
        </div>
        <p style="margin-top:1.5rem;"><a href="${normalizedSubfolder}/api/health" target="_blank">API Health-Check öffnen &rarr;</a></p>
    </div>
</body>
</html>`;
    zip.file("wwwroot/index.html", wwwrootIndex);

    const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="DBStudio Subfolder SPA and API Routing" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="${normalizedSubfolder ? normalizedSubfolder + '/' : ''}index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="Detailed" />
  </system.webServer>
</configuration>`;
    zip.file("wwwroot/web.config", webConfig);

    const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${normalizedSubfolder ? normalizedSubfolder + '/' : '/'}
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . index.html [L]
</IfModule>`;
    zip.file("wwwroot/.htaccess", htaccess);
  }

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
  zip.file("README.md", `# DB Studio Pro - Node.js Self-Host Backend\n\nUnterstützt Unterordner (${normalizedSubfolder || 'root'}) und wwwroot Uploads.\n\n1. \`npm install\`\n2. \`npm run initdb\`\n3. \`npm start\``);
  zip.file("start.bat", `@echo off\ncall npm install\ncall npm run initdb\ncall npm start\npause`);
  zip.file("start.sh", `#!/bin/bash\nnpm install\nnpm run initdb\nnpm start`);
  zip.file("build_webserver.bat", `@echo off\necho [DB Studio Pro] Erstelle Webserver Build für Node.js Express...\ncall npm install --production=false\ncall npm run initdb\necho.\necho [OK] Webserver Build erfolgreich abgeschlossen!\necho Das Backend ist betriebsbereit fuer IIS / Apache / Nginx / Node.js Host.\npause`);
  zip.file("build_webserver.sh", `#!/bin/bash\necho "[DB Studio Pro] Erstelle Webserver Build für Node.js Express..."\nnpm install --production=false\nnpm run initdb\necho "[OK] Build abgeschlossen!"`);
}

