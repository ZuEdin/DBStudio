import JSZip from 'jszip';

export function generatePythonBackend(
  zip: JSZip, 
  schemaSql: string,
  subfolderPath: string = '',
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

  // Python FastAPI Backend
  zip.file("requirements.txt", `fastapi>=0.110.0\nuvicorn>=0.28.0\npydantic>=2.6.0\nsqlite3-to-mysql>=1.4.0\n`);

  zip.file("main.py", `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3, os, time, json
from pydantic import BaseModel
from typing import Optional, Any

BASE_PATH = os.getenv("BASE_PATH", "${normalizedSubfolder}")

app = FastAPI(
    title="DB Studio Pro Self-Host Backend (Python FastAPI)",
    root_path=BASE_PATH if BASE_PATH else ""
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "dbstudio_meta.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/health")
def health():
    return {
        "status": "ok", 
        "service": "DB Studio Self-Host (Python FastAPI)", 
        "version": "1.0.0",
        "basePath": BASE_PATH or "/"
    }

@app.get("/api/projects")
def get_projects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sys_projects ORDER BY created_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/projects/{proj_id}")
def get_project(proj_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sys_projects WHERE id = ?", (proj_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    cursor.execute("SELECT data_json FROM sys_project_payloads WHERE project_id = ?", (proj_id,))
    payload = cursor.fetchone()
    conn.close()
    result = dict(proj)
    result["data"] = json.loads(payload["data_json"]) if payload and payload["data_json"] else {}
    return result

class ProjectSave(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    data: Optional[Any] = None
    dbType: Optional[str] = "SQLite"
    language: Optional[str] = "python"

@app.post("/api/projects")
def save_project(proj: ProjectSave):
    conn = get_db()
    cursor = conn.cursor()
    proj_id = proj.id if proj.id else f"proj_{int(time.time())}"
    now = int(time.time())
    cursor.execute(
        "INSERT INTO sys_projects (id, name, description, db_type, language, last_modified) VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, last_modified=excluded.last_modified",
        (proj_id, proj.name or "Neues Projekt", proj.description or "", proj.dbType or "SQLite", "python", now)
    )
    if proj.data is not None:
        cursor.execute(
            "INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) "
            "ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json",
            (proj_id, json.dumps(proj.data))
        )
    conn.commit()
    conn.close()
    return {"success": True, "id": proj_id}

@app.get("/api/data/{table_name}")
def get_table_data(table_name: str, projectId: str = "proj_default"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?", (table_name, projectId))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        try:
            records.append(json.loads(r["data_json"]))
        except Exception:
            pass
    return records

if os.path.exists("wwwroot"):
    app.mount("/wwwroot", StaticFiles(directory="wwwroot"), name="wwwroot")
    app.mount("/", StaticFiles(directory="wwwroot", html=True), name="static_root")
`);

  if (includeWwwroot) {
    const wwwrootIndex = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>DB Studio Pro Python FastAPI</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; max-width: 480px; }
        h1 { color: #38bdf8; }
        a { color: #38bdf8; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro Python FastAPI</h1>
        <p>Python FastAPI Self-Host Backend ist aktiv.</p>
        ${normalizedSubfolder ? `<p><strong>Unterordner:</strong> <code>${normalizedSubfolder}</code></p>` : ''}
        <p><a href="${normalizedSubfolder}/docs">Swagger Docs / API Dokumentation öffnen &rarr;</a></p>
    </div>
</body>
</html>`;
    zip.file("wwwroot/index.html", wwwrootIndex);
    zip.file("wwwroot/web.config", `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Python Subfolder Rewrite" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`);
  }

  zip.file("Dockerfile", `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`);
  zip.file("README.md", `# DB Studio Pro - Python FastAPI Self-Host Backend\n\nUnterstützt Unterordner: \`${normalizedSubfolder || 'root'}\`\n\n1. \`pip install -r requirements.txt\`\n2. \`uvicorn main:app --reload\``);
  zip.file("start.bat", `@echo off\nuvicorn main:app --reload\npause`);
  zip.file("start.sh", `#!/bin/bash\nuvicorn main:app --reload`);
  zip.file("build_webserver.bat", `@echo off\necho [DB Studio Pro] Installiere Python Dependencies fuer Webserver Deployment...\ncall pip install -r requirements.txt\necho.\necho [OK] Webserver Vorbereitung abgeschlossen!\npause`);
  zip.file("build_webserver.sh", `#!/bin/bash\necho "[DB Studio Pro] Installiere Python Dependencies für Webserver..."\npip install -r requirements.txt\necho "[OK] Build abgeschlossen!"`);
}

