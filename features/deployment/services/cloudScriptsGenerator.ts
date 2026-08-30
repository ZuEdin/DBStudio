import { DockerStackConfig, GeneratedDeploymentFile } from '../types';

export class CloudScriptsGenerator {
  public static generateAutomationScripts(config: DockerStackConfig): GeneratedDeploymentFile[] {
    const files: GeneratedDeploymentFile[] = [];

    // 1. deploy.sh (Linux / macOS Shell Script)
    const deploySh = `#!/usr/bin/env bash
# ==========================================================
# 1-Click Deployment Script for ${config.projectName}
# Linux / macOS Automated Runner
# ==========================================================

set -e

echo "🚀 Starting 1-Click Deployment for ${config.projectName}..."

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

echo "📦 1. Pre-Flight Check & Environment Setup..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.example..."
    cp .env.example .env
fi

echo "🔨 2. Building Container Images..."
docker compose build --parallel

echo "⚡ 3. Starting Multi-Container Services..."
docker compose up -d --remove-orphans

echo "⏳ 4. Waiting for Database Healthcheck..."
until [ "\$(docker inspect -f {{.State.Health.Status}} \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-db 2>/dev/null)" = "healthy" ]; do
    echo "   ... waiting for database to be ready (5s)"
    sleep 5
done

echo "✅ 5. Services successfully deployed & running!"
echo "--------------------------------------------------------"
echo "🌐 Gateway URL:     http://localhost:${config.httpPort}"
echo "🔌 Backend API:     http://localhost:${config.backendPort}"
echo "📚 OpenAPI Docs:    http://localhost:${config.backendPort}/swagger"
${config.includeDbAdmin ? `echo "🗄️  Database Admin:  http://localhost:${config.dbAdminPort}"\n` : ''}
echo "--------------------------------------------------------"
echo "📊 Run 'docker compose logs -f' to follow logs in realtime."
`;

    files.push({
      name: 'deploy.sh',
      path: 'deploy.sh',
      language: 'shell',
      content: deploySh,
      description: 'Automatisiertes 1-Klick Start- & Deploy-Skript für Linux & macOS',
      category: 'script'
    });

    // 2. deploy.ps1 (Windows PowerShell Script)
    const deployPs1 = `# ==========================================================
# 1-Click Deployment Script for ${config.projectName}
# Windows PowerShell Automated Runner
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting 1-Click Deployment for ${config.projectName}..." -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker is not installed." -ForegroundColor Red
    Exit 1
}

# Check .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "🔨 Building Container Images..." -ForegroundColor Cyan
docker compose build

Write-Host "⚡ Starting Containers in Background..." -ForegroundColor Cyan
docker compose up -d

Write-Host "✅ Application deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Gateway:  http://localhost:${config.httpPort}" -ForegroundColor Green
Write-Host "🔌 API:      http://localhost:${config.backendPort}" -ForegroundColor Green
`;

    files.push({
      name: 'deploy.ps1',
      path: 'deploy.ps1',
      language: 'powershell',
      content: deployPs1,
      description: '1-Klick Deployment Skript für Windows PowerShell',
      category: 'script'
    });

    // 3. Makefile
    const makefile = `# ==========================================================
# Developer Makefile for ${config.projectName}
# ==========================================================

.PHONY: help up down restart logs build ps clean migrate backup

help:
	@echo "Available commands:"
	@echo "  make up       - Start all containers in background"
	@echo "  make down     - Stop all containers"
	@echo "  make restart  - Restart all containers"
	@echo "  make logs     - View live container logs"
	@echo "  make build    - Rebuild all container images"
	@echo "  make ps       - Check status of all services"
	@echo "  make clean    - Remove all containers & volumes"

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build --no-cache

ps:
	docker compose ps

clean:
	docker compose down -v --remove-orphans
`;

    files.push({
      name: 'Makefile',
      path: 'Makefile',
      language: 'makefile',
      content: makefile,
      description: 'Entwickler-Makefile mit Shortcuts für Container-Management',
      category: 'script'
    });

    // 4. Cloud Target Specific Manifests (e.g. Cloud Run or Kubernetes)
    if (config.cloudTarget === 'cloud_run') {
      const cloudRunYaml = `# Google Cloud Run Service Deployment Specification
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${config.projectName.toLowerCase()}
  annotations:
    run.googleapis.com/launch-stage: BETA
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        run.googleapis.com/cpu-throttling: 'true'
    spec:
      containers:
        - image: gcr.io/YOUR_PROJECT_ID/${config.projectName.toLowerCase()}:latest
          ports:
            - containerPort: ${config.backendPort}
          resources:
            limits:
              cpu: 2000m
              memory: 2048Mi
          env:
            - name: NODE_ENV
              value: production
`;
      files.push({
        name: 'cloudrun-service.yaml',
        path: 'cloud/cloudrun-service.yaml',
        language: 'yaml',
        content: cloudRunYaml,
        description: 'Google Cloud Run Knative Serverless Manifest',
        category: 'cloud'
      });
    }

    return files;
  }
}
