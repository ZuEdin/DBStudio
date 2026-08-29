/**
 * Mobile Companion Wrapper Scaffolding Generator
 * Generates standalone, compile-ready scaffolding for:
 * - Capacitor 6 (Android / iOS with Camera & SQLite plugin)
 * - Tauri 2.0 (Rust Desktop & Mobile Native Webview)
 * - Offline Camera & Photo Compression Service
 */

import { Table } from '../../types';

export interface MobileScaffoldFile {
  filePath: string;
  language: 'json' | 'typescript' | 'toml' | 'markdown' | 'xml';
  content: string;
  description: string;
}

export class MobileScaffoldGenerator {
  public static generateCapacitorProject(appName: string = 'DBStudioCompanion', appId: string = 'com.dbstudio.companion'): MobileScaffoldFile[] {
    const files: MobileScaffoldFile[] = [];

    // 1. capacitor.config.json
    const capConfig = {
      appId,
      appName,
      webDir: 'dist',
      server: {
        androidScheme: 'https',
      },
      plugins: {
        CapacitorSQLite: {
          iosDatabaseLocation: 'Library/CapacitorDatabase',
          iosIsEncryption: false,
          androidIsEncryption: false,
        },
        Camera: {
          permissions: ['camera', 'photos'],
        },
      },
    };

    files.push({
      filePath: 'capacitor.config.json',
      language: 'json',
      content: JSON.stringify(capConfig, null, 2),
      description: 'Capacitor 6 Konfiguration mit SQLite- & Kamera-Rechten',
    });

    // 2. package.json for Mobile Wrapper
    const pkgJson = {
      name: appId.toLowerCase(),
      version: '1.0.0',
      private: true,
      scripts: {
        'build': 'vite build',
        'cap:sync': 'cap sync',
        'cap:android': 'cap run android',
        'cap:ios': 'cap run ios',
      },
      dependencies: {
        '@capacitor/core': '^6.0.0',
        '@capacitor/android': '^6.0.0',
        '@capacitor/ios': '^6.0.0',
        '@capacitor/camera': '^6.0.0',
        '@capacitor-community/sqlite': '^6.0.0',
        '@capacitor/geolocation': '^6.0.0',
        'react': '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        '@capacitor/cli': '^6.0.0',
        'typescript': '^5.4.5',
        'vite': '^5.2.11',
      },
    };

    files.push({
      filePath: 'package.json',
      language: 'json',
      content: JSON.stringify(pkgJson, null, 2),
      description: 'NPM Abhängigkeiten für Capacitor Mobile Build',
    });

    // 3. Native Camera & Photo Attachment Service
    const cameraServiceTs = `// Native Mobile Camera & Offline Photo Storage Service
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedConstructionPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}

export async function takeConstructionPhoto(): Promise<CapturedConstructionPhoto> {
  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  return {
    id: 'photo_' + Date.now(),
    dataUrl: photo.dataUrl || '',
    timestamp: new Date().toISOString(),
  };
}
`;

    files.push({
      filePath: 'src/services/nativeCameraService.ts',
      language: 'typescript',
      content: cameraServiceTs,
      description: 'Nativer Foto- & Mängelerfassungs-Service für Baustellen-Tablets',
    });

    // 4. Tauri Configuration
    const tauriConf = {
      build: {
        beforeDevCommand: 'npm run dev',
        beforeBuildCommand: 'npm run build',
        devUrl: 'http://localhost:3000',
        frontendDist: '../dist',
      },
      package: {
        name: appName.toLowerCase(),
        version: '1.0.0',
      },
      tauri: {
        allowlist: {
          all: false,
          fs: {
            all: true,
            scope: ['$APPDATA/*', '$DOCUMENT/*'],
          },
          dialog: {
            all: true,
          },
        },
        bundle: {
          active: true,
          identifier: appId,
          icon: ['icons/icon.png'],
        },
      },
    };

    files.push({
      filePath: 'src-tauri/tauri.conf.json',
      language: 'json',
      content: JSON.stringify(tauriConf, null, 2),
      description: 'Tauri 2.0 Rust Desktop & Mobile Konfiguration',
    });

    // 5. Build Guide
    const guideMd = `# Mobile Companion Build & Deployment Anleitung

## Schritt 1: Projekt-Dateien einrichten
1. Speichern Sie alle generierten Dateien in einem neuen Projektordner.
2. Führen Sie im Terminal aus:
   \`\`\`bash
   npm install
   npm run build
   \`\`\`

## Schritt 2: Android Plattform hinzufügen
\`\`\`bash
npx cap add android
npx cap sync
npx cap open android
\`\`\`
*In Android Studio: Klick auf "Run" zum Starten auf dem Baustellen-Tablet oder Emulator.*

## Schritt 3: iOS Plattform hinzufügen (macOS)
\`\`\`bash
npx cap add ios
npx cap sync
npx cap open ios
\`\`\`
`;

    files.push({
      filePath: 'MOBILE_BUILD_GUIDE.md',
      language: 'markdown',
      content: guideMd,
      description: 'Schritt-für-Schritt Build-Anleitung für Android & iOS',
    });

    return files;
  }
}
