import { BackendConfig, Table, Relationship, Query, VirtualFile, DbType } from '../../../types/index';
import { generateDatabaseScripts } from '../databaseGenerator';

export const generateTauriFiles = (
    config: BackendConfig, 
    root: string, 
    target: string,
    tables: Table[] = [],
    relationships: Relationship[] = [],
    queries: Query[] = []
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'tauri') {
        const dbScripts = generateDatabaseScripts(tables, relationships, { ...config, dbType: DbType.SQLite }, queries);
        const seedSqlFile = dbScripts.find(f => f.name === 'schema.sql');
        const seedSqlContent = seedSqlFile ? seedSqlFile.content : '';

        const cargoToml = `[package]
name = "${config.projectName.toLowerCase()}-app"
version = "0.1.0"
description = "High Performance Tauri Desktop Client for DB Studio Pro"
authors = ["DB Studio Pro Generator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5" }

[dependencies]
tauri = { version = "1.5", features = ["api-all", "custom-protocol"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.31", features = ["bundled"] }

[features]
# this feature is used for production builds or when \`devPath\` points to the filesystem
# DO NOT REMOVE!!
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
`;

        const tauriConf = `{
  "build": {
    "beforeDevCommand": "",
    "beforeBuildCommand": "",
    "devPath": "../dist",
    "distDir": "../dist"
  },
  "package": {
    "productName": "${config.projectName}",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": true
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.${config.projectName.toLowerCase()}.desktop",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "${config.projectName} Desktop Studio (Tauri)",
        "width": 1280,
        "height": 850,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
`;

        const buildRs = `fn main() {
  tauri_build::build()
}
`;

        const mainRs = `#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Serialize, Deserialize};
use std::fs;
use std::path::{Path, PathBuf};
use rusqlite::Connection;

#[derive(Serialize, Deserialize, Debug)]
pub struct QueryResult {
    pub success: bool,
    pub rows_affected: u32,
    pub data: String,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DbConfig {
    pub db_type: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub is_sqlite: bool,
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

// 1. High Performance Rust Command for Local Storage Query Executions
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

// 2. Local Network Database Diagnostics (Low Latency Sockets)
#[tauri::command]
fn check_database_latency(host: String) -> Result<u64, String> {
    let start = std::time::Instant::now();
    match std::net::TcpStream::connect_timeout(
        &format!("{}:80", host).parse().unwrap_or("127.0.0.1:80".parse().unwrap()),
        std::time::Duration::from_millis(1500)
    ) {
        Ok(_) => Ok(start.elapsed().as_millis() as u64),
        Err(e) => Err(format!("Latency ping call failed: {}", e))
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
fn get_db_info() -> DbConfig {
    DbConfig {
        db_type: "sqlite".to_string(),
        host: "localhost".to_string(),
        port: 0,
        database: "${config.projectName.toLowerCase()}".to_string(),
        is_sqlite: true,
    }
}

fn main() {
    // 1. Auto initialize & seed SQLite database on startup
    if let Err(e) = init_sqlite_database() {
        eprintln!("[Tauri SQLite Init Warning] {}", e);
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            execute_local_query,
            check_database_latency,
            get_seed_sql,
            get_db_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;

        const readmeTauri = `# Tauri Premium Desktop Integration

Tauri replaces high-cost client wrappers with a **Rust-Native High Performance Backend**.

## Schnelle Einrichtung (Lokale Entwicklung)

1. **Systemvoraussetzungen (Rust Compiler)**:
   * macOS / Linux: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\`
   * Windows: Installationsassistent von [tauri.app](https://tauri.app/v1/guides/getting-started/prerequisites) ausführen.

2. **Tauri CLI installieren**:
   \`\`\`bash
   npm install -D @tauri-apps/cli
   \`\`\`

3. **Desktop Developer Server starten**:
   \`\`\`bash
   npm run tauri dev
   \`\`\`

## Produktion Ready Native Installer Builden

\`\`\`bash
npm run tauri build
\`\`\`
Die fertige, kompilierte Standalone Desktop-App (\`< 15MB\` Dateigröße, \`< 40MB RAM\` Verbrauch) wird unter \`src-tauri/target/release/bundle/\` abgelegt!
`;

        const tauriPackageJsonContent = `{
  "name": "${config.projectName.toLowerCase()}-tauri-desktop",
  "version": "1.0.0",
  "description": "Desktop version of ${config.projectName} with Tauri",
  "scripts": {
    "tauri": "tauri",
    "dev": "npm run build && tauri dev",
    "build": "node copy-dist.js",
    "tauri:build": "npm run build && tauri build",
    "frontend:install": "cd ../../Frontend && npm install",
    "frontend:build": "cd ../../Frontend && npm run build"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0"
  }
}`;

        const tauriCopyDistJsContent = `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('[Tauri Build] Transpiling Frontend in ../../Frontend...');
  let frontendDir = path.join(__dirname, '..', '..', 'Frontend');
  if (!fs.existsSync(frontendDir)) {
    frontendDir = path.join(__dirname, '..', '..', 'AngularFrontend');
  }
  
  if (fs.existsSync(frontendDir)) {
    const hasLocalModules = fs.existsSync(path.join(frontendDir, 'node_modules'));
    const hasParentModules = fs.existsSync(path.join(frontendDir, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, 'node_modules'));
    if (!hasLocalModules && !hasParentModules) {
      console.log('[Tauri Build] Running npm install in ' + frontendDir + '...');
      try {
        execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
      } catch (e) {
        console.log('[Tauri Build] npm install warning (continuing):', e.message);
      }
    } else {
      console.log('[Tauri Build] node_modules folder detected, skipping npm install...');
    }
    console.log('[Tauri Build] Running npm run build in ' + frontendDir + '...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    
    const srcDist = path.join(frontendDir, 'dist');
    const targetDist = path.join(__dirname, 'dist');
    
    if (fs.existsSync(targetDist)) {
      fs.rmSync(targetDist, { recursive: true, force: true });
    }
    
    if (fs.existsSync(srcDist)) {
      let actualSrc = srcDist;
      
      // If there is no index.html in the root of dist, look inside subdirectories (e.g., Angular/Vite builds)
      if (!fs.existsSync(path.join(srcDist, 'index.html'))) {
        try {
          const subdirs = fs.readdirSync(srcDist, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          for (const sub of subdirs) {
            const subPath = path.join(srcDist, sub);
            if (fs.existsSync(path.join(subPath, 'index.html'))) {
              actualSrc = subPath;
              break;
            }
            const browserPath = path.join(subPath, 'browser');
            if (fs.existsSync(path.join(browserPath, 'index.html'))) {
              actualSrc = browserPath;
              break;
            }
          }
        } catch (e) {
          console.log('[Tauri Build] Warning scanning subdirs:', e.message);
        }
      }
      
      console.log('[Tauri Build] Copying files from ' + actualSrc + ' to ' + targetDist + '...');
      copyDir(actualSrc, targetDist);
      console.log('[Tauri Build] Copy completed successfully!');
    } else {
      console.error('[Tauri Build] Error: Frontend dist folder not found at ' + srcDist);
    }
  } else {
    console.error('[Tauri Build] Error: Frontend directory not found!');
  }
} catch (error) {
  console.error('[Tauri Build] Build failed:', error);
  process.exit(1);
}
`;

        files.push({
            name: 'package.json',
            path: `${root}/package.json`,
            content: tauriPackageJsonContent,
            language: 'json'
        });

        files.push({
            name: 'copy-dist.js',
            path: `${root}/copy-dist.js`,
            content: tauriCopyDistJsContent,
            language: 'javascript'
        });

        files.push({
            name: 'Cargo.toml',
            path: `${root}/src-tauri/Cargo.toml`,
            content: cargoToml,
            language: 'toml'
        });

        files.push({
            name: 'tauri.conf.json',
            path: `${root}/src-tauri/tauri.conf.json`,
            content: tauriConf,
            language: 'json'
        });

        files.push({
            name: 'main.rs',
            path: `${root}/src-tauri/src/main.rs`,
            content: mainRs,
            language: 'rust'
        });

        files.push({
            name: 'build.rs',
            path: `${root}/src-tauri/build.rs`,
            content: buildRs,
            language: 'rust'
        });

        files.push({
            name: 'seed.sql',
            path: `${root}/seed.sql`,
            content: seedSqlContent,
            language: 'sql'
        });

        files.push({
            name: 'seed.sql',
            path: `${root}/src-tauri/seed.sql`,
            content: seedSqlContent,
            language: 'sql'
        });

        files.push({
            name: 'README_TAURI.md',
            path: `${root}/README_TAURI.md`,
            content: readmeTauri,
            language: 'markdown'
        });

        // Add run.bat and run.sh scripts for Tauri deployment
        const tauriBatContent = `@echo off
title Tauri Manager
cls

:MENU
cls
echo =================================================
echo   Tauri Desktop Manager
echo =================================================
echo.
echo  [1] Dependencies installieren (inkl. Frontend)
echo  [2] Frontend transpilieren (dist)
echo  [3] Tauri Dev-Modus starten (npm run dev)
echo  [4] Native Desktop App bauen (npm run tauri:build)
echo  [5] Standard App-Icons herunterladen und generieren
echo  [6] Beenden
echo.
set /p choice="Auswahl (1-6): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto DEV
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" goto ICONS
if "%choice%"=="6" exit

goto MENU

:INSTALL
cls
echo Installiere Tauri-Dependencies...
call npm install
if exist ..\\..\\Frontend (
    echo Installiere Frontend-Dependencies...
    cd ..\\..\\Frontend
    call npm install
    cd ..\\Backend\\${config.projectName}
)
echo.
echo Downloade standard Tauri-Icons...
if not exist src-tauri\\\\icons mkdir src-tauri\\\\icons
curl -s -L -o src-tauri\\\\icons\\\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\\\icons\\\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\\\icons\\\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
echo.
pause
goto MENU

:BUILDFE
cls
echo Transpiliere Frontend und kopiere Assets...
call npm run build
echo.
pause
goto MENU

:DEV
cls
echo Starte Tauri Dev-Modus...
call npm run dev
pause
goto MENU

:BUILD
cls
echo Baue native Desktop App mit Tauri...
call npm run tauri:build
pause
goto MENU

:ICONS
cls
echo Downloade standard Tauri-Icons...
if not exist src-tauri\\\\icons mkdir src-tauri\\\\icons
curl -s -L -o src-tauri\\\\icons\\\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\\\icons\\\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\\\icons\\\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"

if exist src-tauri\\\\icons\\\\icon.ico (
    echo Icons wurden erfolgreich heruntergeladen!
) else (
    echo Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung...
    node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
    if exist src-tauri\\\\temp_icon.png (
        echo Generiere Icons im Tauri-Format...
        call npx tauri icon src-tauri\\\\temp_icon.png
        del src-tauri\\\\temp_icon.png
        echo Icons wurden erfolgreich generiert!
    ) else (
        echo Fehler: Konnte Fallback-Icon nicht erstellen.
    )
)
pause
goto MENU
`;

        const tauriShContent = `#!/bin/bash
# Tauri Desktop Manager

show_menu() {
  clear
  echo "================================================="
  echo "  Tauri Desktop Manager"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (inkl. Frontend)"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Tauri Dev-Modus starten (npm run dev)"
  echo "  [4] Native Desktop App bauen (npm run tauri:build)"
  echo "  [5] Standard App-Icons herunterladen & generieren"
  echo "  [6] Beenden"
  echo ""
  read -p "Auswahl (1-6): " choice
  case $choice in
    1) 
      npm install
      if [ -d "../../Frontend" ]; then
        cd ../../Frontend
        npm install
        cd "../Backend/${config.projectName}"
      fi
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    2) npm run build ;;
    3) npm run dev ;;
    4) npm run tauri:build ;;
    5) 
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      if [ -f src-tauri/icons/icon.ico ]; then
        echo "Icons erfolgreich heruntergeladen!"
      else
        echo "Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung..."
        node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
        if [ -f src-tauri/temp_icon.png ]; then
          echo "Generiere Icons im Tauri-Format..."
          npx tauri icon src-tauri/temp_icon.png
          rm src-tauri/temp_icon.png
          echo "Icons erfolgreich generiert!"
        else
          echo "Fehler: Konnte Fallback-Icon nicht erstellen."
        fi
      fi
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    6) exit 0 ;;
    *) show_menu ;;
  esac
}

show_menu
`;

        files.push({
            name: 'run.bat',
            path: `${root}/run.bat`,
            content: tauriBatContent,
            language: 'text'
        });

        files.push({
            name: 'run.sh',
            path: `${root}/run.sh`,
            content: tauriShContent,
            language: 'text'
        });
    }
    return files;
};
