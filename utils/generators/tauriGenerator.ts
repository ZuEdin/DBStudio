import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../types/index';
import { generateReact } from './reactGenerator';
import i18n from '../../i18n';

export const generateTauri = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  config: BackendConfig, 
  forms: Form[], 
  reports: Report[]
): VirtualFile[] => {
  const root = `TauriApp`;
  const files: VirtualFile[] = [];
  
  const safeTables = tables || [];
  const safeRelationships = relationships || [];
  const safeQueries = queries || [];
  const safeForms = forms || [];
  const safeReports = reports || [];

  const fePort = config.frontendPort || 3000;

  // --- 1. Frontend Generation (Folder: TauriApp/Frontend) ---
  const reactFiles = generateReact(safeTables, safeRelationships, safeQueries, config, safeForms, safeReports);
  
  if (Array.isArray(reactFiles)) {
    reactFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');
      
      // Vite Config: Base Path for Tauri (relative assets) and output directly to ../dist
      if (f.name === 'vite.config.ts') {
        f.content = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Wichtig fuer Tauri: Relative Pfade fuer Assets
  build: {
    outDir: '../dist', // Generiert das Frontend direkt im TauriApp/dist Ordner
    emptyOutDir: true
  },
  server: {
    port: ${fePort}
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`;
      }

      f.path = `${root}/Frontend/${relativePath}`;
      files.push(f);
    });
  }

  // --- 2. Root Package.json (Orchestrator) ---
  const packageJson = {
    name: `${config.projectName.toLowerCase()}-tauri`,
    version: "1.0.0",
    description: "Generated Tauri Desktop App by DB Studio Pro",
    scripts: {
      "tauri": "tauri",
      "dev": "tauri dev",
      "build": "tauri build",
      "frontend:install": "cd Frontend && npm install",
      "frontend:build": "cd Frontend && npm run build",
      "install-all": "npm install && cd Frontend && npm install"
    },
    devDependencies: {
      "@tauri-apps/cli": "^2.0.0"
    }
  };

  files.push({
    name: 'package.json',
    path: `${root}/package.json`,
    content: JSON.stringify(packageJson, null, 2),
    language: 'json'
  });

  // --- 3. Tauri v2 Cargo.toml ---
  const cargoToml = `[package]
name = "${config.projectName.toLowerCase()}-app"
version = "0.1.0"
description = "High Performance Tauri Desktop Client for ${config.projectName}"
authors = ["DB Studio Pro Generator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0" }

[dependencies]
tauri = { version = "2.0.0", features = [] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
`;

  files.push({
    name: 'Cargo.toml',
    path: `${root}/src-tauri/Cargo.toml`,
    content: cargoToml,
    language: 'toml'
  });

  // --- 4. Tauri v2 tauri.conf.json ---
  const tauriConf = {
    productName: config.projectName,
    version: "1.0.0",
    identifier: `com.${config.projectName.toLowerCase()}.desktop`,
    v2: true,
    build: {
      beforeDevCommand: "npm run dev --prefix Frontend",
      beforeBuildCommand: "npm run build --prefix Frontend",
      frontendDist: "../dist"
    },
    app: {
      windows: [
        {
          title: `${config.projectName} Desktop Studio (Tauri)`,
          width: 1280,
          height: 900,
          resizable: true,
          fullscreen: false
        }
      ],
      security: {
        csp: null
      }
    },
    bundle: {
      active: true,
      targets: "all",
      icon: [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    }
  };

  files.push({
    name: 'tauri.conf.json',
    path: `${root}/src-tauri/tauri.conf.json`,
    content: JSON.stringify(tauriConf, null, 2),
    language: 'json'
  });

  // --- 5. Rust Core Files ---
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

  const mainRs = `// Prevents additional console window on Windows in release, do not remove!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
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

  // --- 6. run.bat ---
  const batContent = `@echo off
title ${config.projectName} - Tauri Manager
cls

:MENU
cls
echo =================================================
echo   ${config.projectName} - Tauri App Manager
echo =================================================
echo.
echo  [1] Dependencies fuer Frontend und CLI installieren
echo  [2] Frontend manuell bauen (generiert 'dist' Ordner)
echo  [3] Tauri Dev-Modus starten (npx tauri dev)
echo  [4] Desktop App bauen (npx tauri build)
echo  [5] Beenden
echo.
set /p choice="Waehlen Sie eine Option (1-5): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto START
if "%choice%"=="4" goto BUILDTAURI
if "%choice%"=="5" exit

goto MENU

:INSTALL
cls
echo Installiere Tauri CLI Dependencies...
call npm install
echo.
echo Installiere Frontend Dependencies...
cd Frontend
call npm install
cd ..
echo.
echo Fertig! Beliebige Taste druecken zum Zurueckkehren...
pause >nul
goto MENU

:BUILDFE
cls
echo Baue Frontend...
cd Frontend
call npm run build
cd ..
echo.
echo Fertig! Beliebige Taste druecken zum Zurueckkehren...
pause >nul
goto MENU

:START
cls
echo Starte Tauri Dev-Modus...
call npx tauri dev
pause
goto MENU

:BUILDTAURI
cls
echo Baue Desktop App mit Tauri...
call npx tauri build
pause
goto MENU
`;

  files.push({
    name: 'run.bat',
    path: `${root}/run.bat`,
    content: batContent,
    language: 'text'
  });

  // --- 7. run.sh ---
  const shContent = `#!/bin/bash
# ${config.projectName} Tauri App Manager for macOS/Linux

show_menu() {
  clear
  echo "================================================="
  echo "  ${config.projectName} - Tauri App Manager (macOS/Linux)"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren"
  echo "  [2] Frontend manuell bauen (generiert 'dist' Ordner)"
  echo "  [3] Tauri Dev-Modus starten (npx tauri dev)"
  echo "  [4] Desktop App bauen (npx tauri build)"
  echo "  [5] Beenden"
  echo ""
  read -p "Auswahl (1-5): " choice
  case $choice in
    1) install_deps ;;
    2) build_fe ;;
    3) start_tauri ;;
    4) build_tauri ;;
    5) exit 0 ;;
    *) show_menu ;;
  esac
}

install_deps() {
  clear
  echo "Installiere Root Dependencies..."
  npm install
  echo ""
  echo "Installiere Frontend Dependencies..."
  cd Frontend && npm install && cd ..
  echo ""
  echo "Fertig! Beliebige Taste druecken zum Zurueckkehren..."
  read -n 1 -s
  show_menu
}

build_fe() {
  clear
  echo "Baue Frontend..."
  cd Frontend && npm run build && cd ..
  echo ""
  echo "Fertig! Beliebige Taste druecken zum Zurueckkehren..."
  read -n 1 -s
  show_menu
}

start_tauri() {
  clear
  echo "Starte Tauri Dev-Modus..."
  npx tauri dev
  read -n 1 -s
  show_menu
}

build_tauri() {
  clear
  echo "Baue Desktop App mit Tauri..."
  npx tauri build
  read -n 1 -s
  show_menu
}

# Start the menu
show_menu
`;

  files.push({
    name: 'run.sh',
    path: `${root}/run.sh`,
    content: shContent,
    language: 'text'
  });

  // --- 8. README_TAURI.md ---
  const readmeTauri = `# ${config.projectName} - Tauri Desktop Application

Tauri ist ein modernes, extrem leichtgewichtiges Framework zur Erstellung nativer Desktop-Anwendungen unter Verwendung von Rust im Backend und standardmäßigen Web-Technologien im Frontend.

## Ordnerstruktur

- **Frontend/**: Die vollständige React- & Vite-Anwendung.
- **src-tauri/**: Die native Rust-Anwendung, die das Anwendungs-Window steuert und native Systemfunktionen bereitstellt.
- **dist/**: Der Build-Ordner des Frontends. Wird automatisch beim Ausführen von \`npm run build\` im Frontend-Verzeichnis erstellt.

## Systemvoraussetzungen (Rust Compiler)

Um Tauri-Apps lokal ausführen oder bauen zu können, müssen Sie Rust auf Ihrem System installiert haben:
- **macOS / Linux**: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\`
- **Windows**: Befolgen Sie die offizielle Anleitung unter [tauri.app/v1/guides/getting-started/prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites).

## Schnelle Einrichtung

### Windows:
Doppelklicken Sie auf die Datei \`run.bat\` im Hauptverzeichnis des Projekts. Sie führt Sie durch die Installation aller Abhängigkeiten und das Starten der Anwendung.

### macOS / Linux:
Machen Sie das Skript \`run.sh\` ausführbar und starten Sie es:
\`\`\`bash
chmod +x run.sh
./run.sh
\`\`\`

---

## Manuelle Befehle

Sollten Sie das Projekt lieber manuell über das Terminal verwalten wollen:

1. **Abhängigkeiten installieren:**
   \`\`\`bash
   npm install
   cd Frontend && npm install && cd ..
   \`\`\`

2. **Frontend bauen:**
   \`\`\`bash
   cd Frontend && npm run build && cd ..
   \`\`\`

3. **Entwicklungsmodus (Live-Reload):**
   \`\`\`bash
   npx tauri dev
   \`\`\`

4. **Kompilieren / Produktions-Installer erstellen:**
   \`\`\`bash
   npx tauri build
   \`\`\`
`;

  files.push({
    name: 'README_TAURI.md',
    path: `${root}/README_TAURI.md`,
    content: readmeTauri,
    language: 'markdown'
  });

  return files;
};
