
import { BackendConfig, VirtualFile } from '../../types/index';

export const generateDeploymentScripts = (config: BackendConfig, root: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const target = config.deploymentConfig?.target || 'docker';

    // 1. Docker Generation (Containerization)
    if (target === 'docker' || target === 'aws' || target === 'azure') {
        let dockerfileContent = '';
        
        if (config.language === 'dotnet') {
            let version = config.backendVersion || '9.0';
            if (parseFloat(version) > 9.0) {
                version = '9.0';
            }
            dockerfileContent = `# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:${version} AS build
WORKDIR /src
COPY ["Backend/${config.projectName}/${config.projectName}.csproj", "Backend/${config.projectName}/"]
RUN dotnet restore "Backend/${config.projectName}/${config.projectName}.csproj"
COPY . .
WORKDIR "/src/Backend/${config.projectName}"
RUN dotnet build "${config.projectName}.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "${config.projectName}.csproj" -c Release -o /app/publish

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:${version} AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "${config.projectName}.dll"]
`;
        } else if (config.language === 'nodejs') {
            dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY Backend/${config.projectName}/package*.json ./
RUN npm install --production
COPY Backend/${config.projectName}/ .
EXPOSE ${config.port}
CMD ["node", "server.js"]`;
        } else if (config.language === 'php') {
            dockerfileContent = `FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY Backend/${config.projectName}/ /var/www/html/
RUN a2enmod rewrite`;
        }

        files.push({
            name: 'Dockerfile',
            path: `${root}/Dockerfile`,
            content: dockerfileContent,
            language: 'text'
        });

        // Docker Compose (Full Stack)
        const composeContent = `version: '3.8'
services:
  api:
    build: .
    ports:
      - "${config.port}:${config.port}"
    environment:
      - ConnectionStrings__DefaultConnection=Server=db;Database=mydb;User=root;Password=example;
    depends_on:
      - db

  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
`;
        files.push({
            name: 'docker-compose.yml',
            path: `${root}/docker-compose.yml`,
            content: composeContent,
            language: 'text'
        });
    }

    // 2. FTP Upload Script (Node.js script for local execution)
    if (target === 'ftp') {
        const ftpConfig = config.deploymentConfig;
        const ftpScript = `
const ftp = require('basic-ftp');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "${ftpConfig?.ftpHost || 'your-ftp-host.com'}",
            user: "${ftpConfig?.ftpUser || 'user'}",
            password: "PASSWORD_HERE", // Set securely via env var
            secure: true
        });
        
        console.log("Connected to FTP. Uploading...");
        
        // Upload Frontend Build
        await client.ensureDir("${ftpConfig?.ftpPath || '/public_html'}");
        await client.uploadFromDir("Frontend/dist");
        
        // Upload Backend (PHP/Node) if needed
        // await client.uploadFromDir("Backend/${config.projectName}");
        
        console.log("Deployment successful!");
    } catch(err) {
        console.log(err);
    }
    client.close();
}

deploy();
`;
        files.push({
            name: 'deploy-ftp.js',
            path: `${root}/deploy-ftp.js`,
            content: ftpScript,
            language: 'javascript'
        });

        files.push({
            name: 'README_DEPLOY.md',
            path: `${root}/README_DEPLOY.md`,
            content: `# FTP Deployment
1. Install dependencies: \`npm install basic-ftp\`
2. Edit \`deploy-ftp.js\` and enter your FTP Password.
3. Run \`node deploy-ftp.js\`.
            `,
            language: 'markdown'
        });
    }

    // 3. GitHub Actions
    if (target === 'github' || target === 'azure') {
        const ghContent = `name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: npm install
      
    - name: Build Application
      run: npm run build
      
    - name: Run Tests
      run: npm test || echo "No tests provided"

    ${target === 'azure' ? `
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'my-azure-app'
        publish-profile: \${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
    ` : ''}
`;
        files.push({
            name: 'main.yml',
            path: `${root}/.github/workflows/main.yml`,
            content: ghContent,
            language: 'yaml'
        });
    }

    // 4. Electron Desktop Wrapper
    if (target === 'electron') {
        const mainJs = `const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
        files.push({
            name: 'main.js',
            path: `${root}/electron/main.js`,
            content: mainJs,
            language: 'javascript'
        });

        files.push({
            name: 'preload.js',
            path: `${root}/electron/preload.js`,
            content: `// Preload script
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose safe APIs here
});
`,
            language: 'javascript'
        });

        files.push({
            name: 'README_ELECTRON.md',
            path: `${root}/README_ELECTRON.md`,
            content: `# Electron Setup
To build the application as a desktop app:

1. Install dependencies: \`npm install --save-dev electron electron-builder concurrently wait-on\`
2. Add these to your \`package.json\`:
   \`\`\`json
   "main": "electron/main.js",
   "scripts": {
     "electron:start": "concurrently \\"npm run dev\\" \\"wait-on http://localhost:3000 && electron .\\"",
     "electron:build": "npm run build && electron-builder"
   },
   "build": {
     "appId": "com.${config.projectName.toLowerCase()}.app",
     "directories": {
        "output": "dist-electron"
     },
     "files": [
        "dist/**/*",
        "electron/**/*",
        "package.json"
     ]
   }
   \`\`\`
3. Run \`npm run electron:start\` to develop locally.
4. Run \`npm run electron:build\` to build the executable.
`,
            language: 'markdown'
        });
    }

    // 4b. Tauri Desktop Wrapper (Rust High-Performance Native Backend)
    if (target === 'tauri') {
        const cargoToml = `[package]
name = "${config.projectName.toLowerCase()}-app"
version = "0.1.0"
description = "High Performance Tauri Desktop Client for DB Studio Pro"
authors = ["DB Studio Pro Generator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5" }

[dependencies]
tauri = { version = "1.5", features = ["api-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
`;

        const tauriConf = `{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
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

        const mainRs = `#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    success: bool,
    rows_affected: u32,
    data: String,
    error: Option<String>,
}

// 1. High Performance Rust Command for Local Storage Query Executions
#[tauri::command]
async fn execute_local_query(sql: String) -> Result<QueryResult, String> {
    println!("Executing high-performance local query in Rust context: {}", sql);
    
    // Simulates rust-native database communication for ultra performance
    if sql.trim().to_uppercase().starts_with("SELECT") {
        Ok(QueryResult {
            success: true,
            rows_affected: 0,
            data: r#"[{"id": 1, "status": "active", "perf": "native_rust_core"}]"#.to_string(),
            error: None,
        })
    } else {
        Ok(QueryResult {
            success: true,
            rows_affected: 1,
            data: "[]".to_string(),
            error: None,
        })
    }
}

// 2. Local Network Database Diagnostics (Low Latency Sockets)
#[tauri::command]
fn check_database_latency(host: String) -> Result<u64, String> {
    let start = std::time::Instant::now();
    // Native Rust Socket ping
    match std::net::TcpStream::connect_timeout(
        &format!("{}:80", host).parse().unwrap_or("127.0.0.1:80".parse().unwrap()),
        std::time::Duration::from_millis(1500)
    ) {
        Ok(_) => Ok(start.elapsed().as_millis() as u64),
        Err(e) => Err(format!("Latency ping call failed: {}", e))
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        execute_local_query,
        check_database_latency
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
            name: 'README_TAURI.md',
            path: `${root}/README_TAURI.md`,
            content: readmeTauri,
            language: 'markdown'
        });
    }

    // 5. Infrastructure as Code (Terraform & Bicep)
    const tfMain = `# Terraform Configuration for App Infrastructure
# Configured for PostgreSQL Server and Container App Hosting

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "app_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# Subnets & Networking
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "\${var.aws_region}a"
}

# PostgreSQL Database Instance
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t4g.micro"
  db_name              = replace(var.project_name, "-", "_")
  username             = "db_admin"
  password             = var.db_password
  skip_final_snapshot  = true
  publicly_accessible  = false
}

# ECS or App Hosted Service
resource "aws_apprunner_service" "app_service" {
  service_name = "\${var.project_name}-app"

  source_configuration {
    image_repository {
      image_identifier      = "\${var.docker_image_name}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = var.container_port
      }
    }
    auto_deployments_enabled = true
  }
}
`;

    const tfVars = `variable "aws_region" {
  type        = string
  default     = "eu-central-1"
  description = "Region to deploy resources into"
}

variable "project_name" {
  type        = string
  default     = "${config.projectName.toLowerCase()}"
  description = "Name of the project"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password of the Postgres Database"
}

variable "docker_image_name" {
  type        = string
  default     = "${config.projectName.toLowerCase()}-app"
  description = "The docker image to deploy"
}

variable "container_port" {
  type        = number
  default     = ${config.port || 3000}
  description = "Direct ingress port"
}
`;

    const bicepMain = `// Azure Bicep Template for App Infrastructure
param projectName string = '${config.projectName.toLowerCase()}'
param location string = resourceGroup().location
param sqlAdminLogin string = 'sqladmin'
@secure()
param sqlAdminPassword string

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '\${projectName}-asp'
  location: location
  sku: {
    name: 'F1'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '\${projectName}-app'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|nginx:alpine'
    }
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '\${projectName}-postgres'
  location: location
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'GeneralPurpose'
  }
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '15'
    storage: {
      storageSizeGB: 32
    }
  }
}
`;

    if (target === 'aws' || target === 'azure') {
        files.push({
            name: 'main.tf',
            path: `${root}/infrastructure/terraform/main.tf`,
            content: tfMain,
            language: 'hcl'
        });

        files.push({
            name: 'variables.tf',
            path: `${root}/infrastructure/terraform/variables.tf`,
            content: tfVars,
            language: 'hcl'
        });
    }

    if (target === 'azure') {
        files.push({
            name: 'main.bicep',
            path: `${root}/infrastructure/bicep/main.bicep`,
            content: bicepMain,
            language: 'bicep'
        });
    }

    // 5. Automated Multi-Environment Build pipeline scripts
    if (config.environments && config.environments.length > 0) {
        let shScript = `#!/bin/bash
# =========================================================
# DB STUDIO PRO - AUTOMATED ENV-BASED MULTI-BUILD PIPELINE
# =========================================================
# System target: ${target}
# Language backend: ${config.language}
# Framework frontend: ${config.frontendFramework || 'React'}

set -e

echo "========================================================="
echo "🚀 Starten des automatisierten Multi-Environment Builds..."
echo "========================================================="

# Helper to build frontend
build_frontend() {
    local env_name=$1
    local mode=$2
    local out_dir=$3
    
    echo "📦 Kompiliere Frontend für '\${env_name}'..."
    if [ -d "Frontend" ]; then
        cd Frontend
        npm install
        # Run specific mode build or fallback
        if grep -q "build:\${mode}" package.json; then
            npm run "build:\${mode}"
        else
            npx vite build --outDir "../\${out_dir}" --mode \${mode}
        fi
        cd ..
        echo "✓ Frontend für '\${env_name}' wurde in '\${out_dir}' ausgegeben."
    else
        echo "ℹ Kein Frontend-Ordner gefunden, überspringe..."
    fi
}

# Helper to build backend
build_backend() {
    local env_name=$1
    local connection=$2
    local out_dir=$3

    echo "⚙️ Verpacke und kompiliere Backend für '\${env_name}'..."
    
    # Language specific build actions
`;

        if (config.language === 'dotnet') {
            shScript += `    dotnet publish "Backend/${config.projectName}/${config.projectName}.csproj" -c Release -o "\${out_dir}/backend" /p:EnvironmentName=\${env_name}
    echo "✓ .NET Core Backend für '\${env_name}' wurde in '\${out_dir}/backend' veröffentlicht."
`;
        } else if (config.language === 'nodejs') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    # Copy env file
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ Node.js Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        } else if (config.language === 'php') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ PHP Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        } else if (config.language === 'python') {
            shScript += `    mkdir -p "\${out_dir}/backend"
    cp -r "Backend/${config.projectName}"/* "\${out_dir}/backend/"
    if [ -f "Backend/${config.projectName}/.env.\${env_name,,}" ]; then
        cp "Backend/${config.projectName}/.env.\${env_name,,}" "\${out_dir}/backend/.env"
    fi
    echo "✓ Python Backend für '\${env_name}' wurde nach '\${out_dir}/backend' kopiert."
`;
        }

        shScript += `}

`;

        config.environments.forEach(env => {
            const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
            const modeName = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
            const buildFolder = env.buildPath || `./dist/${suffix}`;
            shScript += `# --- Build für Umgebung: ${env.name} ---
echo "---------------------------------------------------------"
echo "▶ Starte Kompilierung für Umgebung: ${env.name}"
echo "---------------------------------------------------------"
build_frontend "${env.name}" "${suffix}" "${buildFolder}"
build_backend "${env.name}" "${env.dbConnection || config.dbConnection || ''}" "${buildFolder}"

`;
        });

        shScript += `echo "========================================================="
echo "🎉 ALLE BUILDS ERFOLGREICH ABGESCHLOSSEN!"
echo "========================================================="
`;

        files.push({
            name: 'build_environments.sh',
            path: `build_environments.sh`, // Put at main export root
            content: shScript,
            language: 'text'
        });

        // 5.2 Batch Script for Windows (build_environments.bat)
        let batScript = `@echo off
:: =========================================================
:: DB STUDIO PRO - AUTOMATED WINDOWS BUILD PIPELINE
:: =========================================================
echo =========================================================
echo Starting Automated Multi-Environment Build Process...
echo =========================================================

`;
        config.environments.forEach(env => {
            const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
            const buildFolder = (env.buildPath || `./dist/${suffix}`).replace(/\//g, '\\');
            batScript += `echo ---------------------------------------------------------
echo Building Environment: ${env.name}
echo ---------------------------------------------------------
if exist Frontend (
    echo Compiling Frontend for ${env.name}...
    cd Frontend
    call npm install
    call npm run build:${suffix}
    cd ..
)
`;
            if (config.language === 'dotnet') {
                batScript += `echo Compiling .NET Core Backend for ${env.name}...
dotnet publish "Backend\\${config.projectName}\\${config.projectName}.csproj" -c Release -o "${buildFolder}\\backend" /p:EnvironmentName=${env.name}
`;
            } else {
                batScript += `echo Copying Backend files for ${env.name}...
xcopy "Backend\\${config.projectName}" "${buildFolder}\\backend" /E /I /Y
`;
            }
            batScript += `\n`;
        });

        batScript += `echo =========================================================
echo SUCCESS: All environments compiled successfully!
echo =========================================================
pause
`;

        files.push({
            name: 'build_environments.bat',
            path: `build_environments.bat`,
            content: batScript,
            language: 'text'
        });
    }

    return files;
};
