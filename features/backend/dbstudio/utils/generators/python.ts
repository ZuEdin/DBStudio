import JSZip from 'jszip';

export function generatePythonBackend(zip: JSZip, schemaSql: string) {
  // Python FastAPI Backend
  zip.file("requirements.txt", `fastapi>=0.110.0\nuvicorn>=0.28.0\npydantic>=2.6.0\nsqlite3-to-mysql>=1.4.0\n`);

  zip.file("main.py", `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3, os, time, json
from pydantic import BaseModel
from typing import Optional, Any

app = FastAPI(title="DB Studio Pro Self-Host Backend (Python FastAPI)")

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
    return {"status": "ok", "service": "DB Studio Self-Host (Python FastAPI)", "version": "1.0.0"}

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
    name: str = "Neues Projekt"
    db_type: str = "SQLite"
    language: str = "python"
    data: Optional[Any] = None

@app.post("/api/projects")
def save_project(proj: ProjectSave):
    conn = get_db()
    cursor = conn.cursor()
    proj_id = proj.id or f"proj_{int(time.time())}"
    now = int(time.time() * 1000)
    cursor.execute(
        """INSERT INTO sys_projects (id, name, db_type, language, last_modified) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, last_modified=excluded.last_modified""",
        (proj_id, proj.name, proj.db_type, proj.language, now)
    )
    if proj.data is not None:
        cursor.execute(
            """INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?)
               ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json""",
            (proj_id, json.dumps(proj.data))
        )
    conn.commit()
    conn.close()
    return {"success": True, "id": proj_id, "name": proj.name}

@app.get("/api/data/{table_name}")
def get_table_data(table_name: str, project_id: str = "proj_default"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?", (table_name, project_id))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        try: records.append(json.loads(r["data_json"]))
        except: pass
    return records

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`);

  zip.file("Dockerfile", `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["python", "main.py"]`);
  zip.file("docker-compose.yml", `version: '3.8'\nservices:\n  dbstudio-python-backend:\n    build: .\n    ports:\n      - "8000:8000"\n    restart: always`);
  zip.file("README.md", `# DB Studio Pro - Python FastAPI Self-Host Backend\n\n1. \`pip install -r requirements.txt\`\n2. \`python main.py\``);
  zip.file("start.bat", `@echo off\npip install -r requirements.txt\npython main.py\npause`);
  zip.file("start.sh", `#!/bin/bash\npip install -r requirements.txt\npython main.py`);
}
