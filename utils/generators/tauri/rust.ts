import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateTauriRustFiles = (
  config: BackendConfig,
  root: string,
  dbTypeStr: string,
  defaultDbPort: number
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const buildRs = `fn main() {
  tauri_build::build()
}
`;
  files.push({
    name: 'build.rs',
    path: `${root}/src-tauri/build.rs`,
    content: buildRs,
    language: 'rust'
  });

  const mainRs = `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use rusqlite::Connection;

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub success: bool,
    pub rows_affected: u32,
    pub data: String,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DbConfig {
    db_type: String,
    host: String,
    port: u16,
    database: String,
    is_sqlite: bool,
}

// Embedded seed SQL bundled directly into the binary
const EMBEDDED_SEED_SQL: &str = include_str!("../seed.sql");

fn get_db_path() -> PathBuf {
    let db_filename = "${config.projectName.toLowerCase()}.db";
    let local = PathBuf::from(db_filename);
    if local.exists() {
        return local;
    }
    let parent = PathBuf::from("..").join(db_filename);
    if parent.exists() {
        return parent;
    }
    local
}

fn init_sqlite_database() -> Result<(), String> {
    let db_path = get_db_path();
    println!("[Tauri SQLite] Connecting to database at: {:?}", db_path);
    
    let mut conn = Connection::open(&db_path).map_err(|e| format!("Failed to open SQLite database: {}", e))?;
    
    // Check if database was already seeded
    let already_seeded: bool = conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='__studio_seeded'",
        [],
        |_| Ok(true)
    ).unwrap_or(false);
    
    if !already_seeded {
        println!("[Tauri SQLite] Seeding database schema and initial records...");
        
        let seed_sql = if Path::new("seed.sql").exists() {
            fs::read_to_string("seed.sql").unwrap_or_else(|_| EMBEDDED_SEED_SQL.to_string())
        } else if Path::new("src-tauri/seed.sql").exists() {
            fs::read_to_string("src-tauri/seed.sql").unwrap_or_else(|_| EMBEDDED_SEED_SQL.to_string())
        } else {
            EMBEDDED_SEED_SQL.to_string()
        };

        if !seed_sql.trim().is_empty() {
            let _ = conn.execute_batch("PRAGMA foreign_keys = OFF;");
            
            let tx = conn.transaction().map_err(|e| format!("Failed to start transaction: {}", e))?;
            tx.execute_batch(&seed_sql).map_err(|e| {
                eprintln!("[Tauri SQLite] Batch execution note: {}", e);
                format!("Batch seed error: {}", e)
            })?;
            
            let _ = tx.execute("CREATE TABLE IF NOT EXISTS __studio_seeded (id INTEGER PRIMARY KEY, seeded_at DATETIME DEFAULT CURRENT_TIMESTAMP);", []);
            let _ = tx.execute("INSERT OR REPLACE INTO __studio_seeded (id) VALUES (1);", []);
            
            tx.commit().map_err(|e| format!("Failed to commit seeding transaction: {}", e))?;
            let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");
            println!("[Tauri SQLite] Seeding completed successfully!");
        }
    } else {
        println!("[Tauri SQLite] Database already initialized and seeded.");
    }
    Ok(())
}

#[tauri::command]
fn get_db_info() -> DbConfig {
    DbConfig {
        db_type: "${dbTypeStr}".to_string(),
        host: "localhost".to_string(),
        port: ${defaultDbPort},
        database: "${config.projectName.toLowerCase()}".to_string(),
        is_sqlite: ${dbTypeStr === 'sqlite' ? 'true' : 'false'},
    }
}

#[tauri::command]
fn get_seed_sql() -> String {
    if Path::new("seed.sql").exists() {
        fs::read_to_string("seed.sql").unwrap_or_else(|_| EMBEDDED_SEED_SQL.to_string())
    } else if Path::new("src-tauri/seed.sql").exists() {
        fs::read_to_string("src-tauri/seed.sql").unwrap_or_else(|_| EMBEDDED_SEED_SQL.to_string())
    } else {
        EMBEDDED_SEED_SQL.to_string()
    }
}

#[tauri::command]
fn force_reseed_db() -> Result<String, String> {
    let db_path = get_db_path();
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let _ = conn.execute_batch("PRAGMA foreign_keys = OFF;");
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute_batch(EMBEDDED_SEED_SQL).map_err(|e| e.to_string())?;
    let _ = tx.execute("CREATE TABLE IF NOT EXISTS __studio_seeded (id INTEGER PRIMARY KEY, seeded_at DATETIME DEFAULT CURRENT_TIMESTAMP);", []);
    let _ = tx.execute("INSERT OR REPLACE INTO __studio_seeded (id) VALUES (1);", []);
    tx.commit().map_err(|e| e.to_string())?;
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");
    Ok("Database reseeded successfully".to_string())
}

#[tauri::command]
async fn execute_local_query(sql: String) -> Result<QueryResult, String> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let trimmed = sql.trim().to_uppercase();
    if trimmed.starts_with("SELECT") || trimmed.starts_with("PRAGMA") {
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let column_names: Vec<String> = stmt.column_names().into_iter().map(|s| s.to_string()).collect();
        
        let rows = stmt.query_map([], |row| {
            let mut map = serde_json::Map::new();
            for (i, col) in column_names.iter().enumerate() {
                let val: rusqlite::types::Value = row.get(i)?;
                let json_val = match val {
                    rusqlite::types::Value::Null => serde_json::Value::Null,
                    rusqlite::types::Value::Integer(n) => serde_json::json!(n),
                    rusqlite::types::Value::Real(f) => serde_json::json!(f),
                    rusqlite::types::Value::Text(s) => serde_json::json!(s),
                    rusqlite::types::Value::Blob(b) => serde_json::json!(format!("[BLOB {} bytes]", b.len())),
                };
                map.insert(col.clone(), json_val);
            }
            Ok(serde_json::Value::Object(map))
        }).map_err(|e| e.to_string())?;
        
        let mut results = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                results.push(item);
            }
        }
        
        Ok(QueryResult {
            success: true,
            rows_affected: results.len() as u32,
            data: serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string()),
            error: None,
        })
    } else {
        let affected = conn.execute(&sql, []).map_err(|e| e.to_string())?;
        Ok(QueryResult {
            success: true,
            rows_affected: affected as u32,
            data: "[]".to_string(),
            error: None,
        })
    }
}

fn main() {
    // 1. Auto initialize & seed SQLite database on startup
    if let Err(e) = init_sqlite_database() {
        eprintln!("[Tauri SQLite Init Warning] {}", e);
    }

    // 2. Launch Tauri application
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_db_info, 
            get_seed_sql, 
            force_reseed_db,
            execute_local_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;

  files.push({
    name: 'main.rs',
    path: `${root}/src-tauri/src/main.rs`,
    content: mainRs,
    language: 'rust'
  });

  return files;
};
