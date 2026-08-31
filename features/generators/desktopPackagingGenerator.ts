export interface DesktopPackageOptions {
  appName: string;
  bundleIdentifier: string;
  version: string;
  engine: 'tauri' | 'electron';
  windowTitle: string;
  width: number;
  height: number;
  resizable: boolean;
  enableNativeFs: boolean;
  enablePrinter: boolean;
  enableAutoUpdate: boolean;
}

export interface GeneratedDesktopFile {
  filePath: string;
  description: string;
  code: string;
}

export class DesktopPackagingGenerator {
  /**
   * Generates all necessary files for Tauri 2.0 or Electron package
   */
  public static generateDesktopPackage(options: DesktopPackageOptions): GeneratedDesktopFile[] {
    if (options.engine === 'tauri') {
      return this.generateTauriFiles(options);
    } else {
      return this.generateElectronFiles(options);
    }
  }

  private static generateTauriFiles(opts: DesktopPackageOptions): GeneratedDesktopFile[] {
    const tauriConf = {
      $schema: 'https://schema.tauri.app/config/2',
      productName: opts.appName,
      version: opts.version,
      identifier: opts.bundleIdentifier,
      build: {
        beforeDevCommand: 'npm run dev',
        devUrl: 'http://localhost:3000',
        beforeBuildCommand: 'npm run build',
        frontendDist: '../dist',
      },
      app: {
        windows: [
          {
            title: opts.windowTitle,
            width: opts.width,
            height: opts.height,
            resizable: opts.resizable,
            fullscreen: false,
          },
        ],
        security: {
          csp: null,
        },
      },
      bundle: {
        active: true,
        targets: 'all',
        icon: [
          'icons/32x32.png',
          'icons/128x128.png',
          'icons/128x128@2x.png',
          'icons/icon.icns',
          'icons/icon.ico',
        ],
      },
    };

    const cargoToml = `[package]
name = "${opts.appName.toLowerCase().replace(/[^a-z0-9]/g, '_')}"
version = "${opts.version}"
description = "${opts.appName} - Native Enterprise Desktop Client"
authors = ["DB Studio Pro Architecture Team"]
edition = "2021"

[lib]
name = "${opts.appName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
tauri = { version = "2.0.0", features = ["tray-icon"] }
tauri-plugin-shell = "2.0.0"
tauri-plugin-fs = "2.0.0"
tauri-plugin-dialog = "2.0.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
`;

    const mainRs = `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// GAEB / DATANORM Direct File Stream Command
#[tauri::command]
fn read_enterprise_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_system_hardware_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": "${opts.version}",
        "engine": "Tauri 2.0 (Rust)",
        "offlineCapable": true
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_enterprise_file,
            get_system_hardware_info
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Tauri 2.0 Desktop-Anwendung");
}
`;

    const githubActions = `name: 🚀 1-Klick Desktop Release (Windows .msi & macOS .dmg)

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
            args: '--target x86_64-pc-windows-msvc'
          - platform: 'macos-latest'
            args: '--target universal-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''

    runs-on: \${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Rust Stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: \${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Install Linux Dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Build Desktop Binaries via Tauri Action
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v\${{ github.ref_name }}
          releaseName: '${opts.appName} v__VERSION__'
          releaseBody: 'Automatisch generiertes Enterprise Desktop Release für Windows (.msi / .exe), macOS (.dmg) und Linux (.AppImage).'
          releaseDraft: false
          prerelease: false
          args: \${{ matrix.args }}
`;

    return [
      {
        filePath: 'src-tauri/tauri.conf.json',
        description: 'Tauri 2.0 Hauptkonfiguration',
        code: JSON.stringify(tauriConf, null, 2),
      },
      {
        filePath: 'src-tauri/Cargo.toml',
        description: 'Rust Paket- & Dependency-Definition',
        code: cargoToml,
      },
      {
        filePath: 'src-tauri/src/main.rs',
        description: 'Rust Native Entrypoint & System-Bridge',
        code: mainRs,
      },
      {
        filePath: '.github/workflows/desktop-release.yml',
        description: 'Automatisierte GitHub Actions Multi-OS CI/CD Build-Pipeline',
        code: githubActions,
      },
    ];
  }

  private static generateElectronFiles(opts: DesktopPackageOptions): GeneratedDesktopFile[] {
    const mainTs = `import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: '${opts.windowTitle}',
    width: ${opts.width},
    height: ${opts.height},
    resizable: ${opts.resizable},
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native IPC Bridges for GAEB / File Systems
ipcMain.handle('read-local-file', async (_event, filePath: string) => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (err: any) {
    throw new Error('Datei konnte nicht gelesen werden: ' + err.message);
  }
});

ipcMain.handle('select-file-dialog', async (_event, filters: any[]) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'Alle Dateien', extensions: ['*'] }],
  });
  return result.filePaths[0] || null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`;

    const preloadTs = `import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronBridge', {
  platform: process.platform,
  version: '${opts.version}',
  readLocalFile: (filePath: string) => ipcRenderer.invoke('read-local-file', filePath),
  selectFileDialog: (filters?: any[]) => ipcRenderer.invoke('select-file-dialog', filters),
  isDesktop: true,
});
`;

    const electronBuilderYml = `appId: ${opts.bundleIdentifier}
productName: "${opts.appName}"
copyright: "Copyright © 2026 ${opts.appName} Inc."
directories:
  output: release
  buildResources: build
files:
  - dist/**/*
  - electron/**/*
win:
  target:
    - target: nsis
      arch:
        - x64
        - arm64
    - target: msi
      arch:
        - x64
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: always
mac:
  target:
    - target: dmg
      arch:
        - universal
    - target: zip
  icon: assets/icon.icns
  category: public.app-category.business
linux:
  target:
    - AppImage
    - deb
  category: Office
`;

    const packageJsonSnippet = JSON.stringify(
      {
        name: opts.appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        version: opts.version,
        main: 'electron/dist/main.js',
        scripts: {
          'electron:dev': 'concurrently "npm run dev" "wait-on http://localhost:3000 && electron ."',
          'electron:build': 'npm run build && electron-builder',
        },
        devDependencies: {
          electron: '^34.0.0',
          'electron-builder': '^25.1.8',
          concurrently: '^9.1.0',
          'wait-on': '^8.0.0',
        },
      },
      null,
      2
    );

    return [
      {
        filePath: 'electron/main.ts',
        description: 'Electron Main Process (Node.js & Native Bridge)',
        code: mainTs,
      },
      {
        filePath: 'electron/preload.ts',
        description: 'Sichere ContextBridge Preload-Datei',
        code: preloadTs,
      },
      {
        filePath: 'electron-builder.yml',
        description: 'Electron-Builder Konfiguration (.exe, .msi, .dmg)',
        code: electronBuilderYml,
      },
      {
        filePath: 'package.desktop.json',
        description: 'Desktop npm Scripts & Abhängigkeiten',
        code: packageJsonSnippet,
      },
    ];
  }
}
