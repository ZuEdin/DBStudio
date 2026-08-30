import { DockerStackConfig, GeneratedDeploymentFile } from '../types';

export class DockerfileGenerators {
  public static generateBackendDockerfile(config: DockerStackConfig): GeneratedDeploymentFile {
    let content = '';

    switch (config.backendLanguage) {
      case 'nodejs':
        content = `# ==========================================
# Production Dockerfile for Node.js / Express / Fastify
# Multi-stage build for optimal image size & security
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build || true

# 2. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${config.backendPort}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/src ./src

USER appuser
EXPOSE ${config.backendPort}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${config.backendPort}/health || exit 1

CMD ["node", "dist/server.js"]
`;
        break;

      case 'dotnet':
        content = `# ==========================================
# Production Dockerfile for .NET 8 / 9 Web API
# Microsoft High Performance Container
# ==========================================

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["*.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:${config.backendPort}
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
EXPOSE ${config.backendPort}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${config.backendPort}/health || exit 1

ENTRYPOINT ["dotnet", "${config.projectName}.dll"]
`;
        break;

      case 'python':
        content = `# ==========================================
# Production Dockerfile for Python FastAPI / Uvicorn
# ==========================================

FROM python:3.12-slim AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=${config.backendPort}

RUN apt-get update && apt-get install -y --no-install-recommends curl libpq-dev gcc && \\
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as non-privileged user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE ${config.backendPort}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${config.backendPort}/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${config.backendPort}", "--workers", "4"]
`;
        break;

      case 'go':
        content = `# ==========================================
# Production Dockerfile for Go Fiber / Gin
# Scratch / Alpine Scratch Minimal Binary
# ==========================================

FROM golang:1.22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /bin/server .

FROM alpine:3.19 AS runner
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /bin/server /app/server

ENV PORT=${config.backendPort}
EXPOSE ${config.backendPort}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${config.backendPort}/health || exit 1

CMD ["/app/server"]
`;
        break;

      case 'php':
        content = `# ==========================================
# Production Dockerfile for PHP 8.3 Apache / FPM
# ==========================================

FROM php:8.3-apache
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y libpq-dev libzip-dev unzip && \\
    docker-php-ext-install pdo pdo_pgsql pdo_mysql zip opcache && \\
    a2enmod rewrite headers

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
CMD ["apache2-foreground"]
`;
        break;

      case 'rust':
        content = `# ==========================================
# Production Dockerfile for Rust Axum / Actix
# ==========================================

FROM rust:1.77-slim AS builder
WORKDIR /usr/src/app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/app/target/release/server /app/server

ENV PORT=${config.backendPort}
EXPOSE ${config.backendPort}

CMD ["/app/server"]
`;
        break;
    }

    return {
      name: 'Dockerfile.backend',
      path: 'docker/Dockerfile.backend',
      language: 'dockerfile',
      content,
      description: `Optimiertes Multi-Stage Dockerfile für ${config.backendLanguage.toUpperCase()} Backend`,
      category: 'dockerfile'
    };
  }

  public static generateFrontendDockerfile(config: DockerStackConfig): GeneratedDeploymentFile {
    const content = `# ==========================================
# Production Dockerfile for React / Vite Frontend
# High-Performance Alpine Nginx Webserver
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Production Stage with Alpine Nginx
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
`;

    return {
      name: 'Dockerfile.frontend',
      path: 'docker/Dockerfile.frontend',
      language: 'dockerfile',
      content,
      description: 'Nginx-basiertes Dockerfile für das kompilierte Frontend',
      category: 'dockerfile'
    };
  }
}
