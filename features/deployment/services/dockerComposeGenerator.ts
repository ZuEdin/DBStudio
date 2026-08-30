import { DockerStackConfig, GeneratedDeploymentFile } from '../types';

export class DockerComposeGenerator {
  public static generateComposeFiles(config: DockerStackConfig): GeneratedDeploymentFile[] {
    const files: GeneratedDeploymentFile[] = [];

    // 1. docker-compose.yml (Development & Standard)
    let compose = `version: '3.8'

# ==========================================================
# 1-Klick Docker Compose Multi-Container Stack
# Project: ${config.projectName}
# Stack: ${config.backendLanguage.toUpperCase()} + ${config.dbEngine.toUpperCase()} + ${config.reverseProxy.toUpperCase()}
# ==========================================================

networks:
  app-network:
    driver: bridge

volumes:
  db_data:
    driver: local
  ${config.includeRedis ? 'redis_data:\n    driver: local' : ''}

services:
`;

    // Database Service
    if (config.dbEngine === 'postgres') {
      compose += `  db:
    image: postgres:${config.dbVersion || '16-alpine'}
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-db
    restart: ${config.restartPolicy}
    environment:
      POSTGRES_DB: \${DB_NAME:-${config.dbName}}
      POSTGRES_USER: \${DB_USER:-${config.dbUser}}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-${config.dbPassword}}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./docker/initdb:/docker-entrypoint-initdb.d:ro
    ports:
      - "\${DB_PORT:-${config.dbPort}}:${config.dbPort}"
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-${config.dbUser}} -d \${DB_NAME:-${config.dbName}}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

`;
    } else if (config.dbEngine === 'mysql') {
      compose += `  db:
    image: mysql:${config.dbVersion || '8.4'}
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-db
    restart: ${config.restartPolicy}
    command: --default-authentication-plugin=caching_sha2_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_DATABASE: \${DB_NAME:-${config.dbName}}
      MYSQL_USER: \${DB_USER:-${config.dbUser}}
      MYSQL_PASSWORD: \${DB_PASSWORD:-${config.dbPassword}}
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD:-${config.dbPassword}}
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/initdb:/docker-entrypoint-initdb.d:ro
    ports:
      - "\${DB_PORT:-${config.dbPort}}:${config.dbPort}"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

`;
    } else if (config.dbEngine === 'mssql') {
      compose += `  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-db
    restart: ${config.restartPolicy}
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "\${DB_PASSWORD:-${config.dbPassword}}"
      MSSQL_PID: "Developer"
    volumes:
      - db_data:/var/opt/mssql
    ports:
      - "\${DB_PORT:-${config.dbPort}}:1433"
    networks:
      - app-network

`;
    }

    // Backend API Service
    compose += `  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-api
    restart: ${config.restartPolicy}
    environment:
      NODE_ENV: production
      PORT: "${config.backendPort}"
      DATABASE_URL: \${DATABASE_URL}
      DB_HOST: db
      DB_PORT: "${config.dbPort}"
      DB_NAME: \${DB_NAME:-${config.dbName}}
      DB_USER: \${DB_USER:-${config.dbUser}}
      DB_PASSWORD: \${DB_PASSWORD:-${config.dbPassword}}
      ${config.includeRedis ? 'REDIS_URL: redis://redis:6379' : ''}
    ports:
      - "${config.backendPort}:${config.backendPort}"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

`;

    // Frontend Service (if enabled)
    if (config.includeFrontend) {
      compose += `  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-web
    restart: ${config.restartPolicy}
    depends_on:
      - backend
    ports:
      - "${config.frontendPort}:80"
    networks:
      - app-network

`;
    }

    // Reverse Proxy Service
    if (config.reverseProxy === 'nginx') {
      compose += `  gateway:
    image: nginx:1.27-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-gateway
    restart: ${config.restartPolicy}
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "${config.httpPort}:80"
      ${config.enableSsl ? `- "${config.httpsPort}:443"` : ''}
    depends_on:
      - backend
      ${config.includeFrontend ? '- frontend' : ''}
    networks:
      - app-network

`;
    }

    // Optional Redis Cache
    if (config.includeRedis) {
      compose += `  redis:
    image: redis:7-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-redis
    restart: ${config.restartPolicy}
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "${config.redisPort}:6379"
    networks:
      - app-network

`;
    }

    // Optional DB Admin (pgAdmin / Adminer)
    if (config.includeDbAdmin) {
      if (config.dbEngine === 'postgres') {
        compose += `  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-pgadmin
    restart: ${config.restartPolicy}
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@dbstudiopro.local
      PGADMIN_DEFAULT_PASSWORD: \${DB_PASSWORD:-${config.dbPassword}}
    ports:
      - "${config.dbAdminPort}:80"
    depends_on:
      - db
    networks:
      - app-network

`;
      } else {
        compose += `  adminer:
    image: adminer:latest
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName.toLowerCase()}}-adminer
    restart: ${config.restartPolicy}
    ports:
      - "${config.dbAdminPort}:8080"
    depends_on:
      - db
    networks:
      - app-network

`;
      }
    }

    files.push({
      name: 'docker-compose.yml',
      path: 'docker-compose.yml',
      language: 'yaml',
      content: compose,
      description: 'Schlüsselfertiger Multi-Container Docker Compose Stack',
      category: 'compose'
    });

    // 2. .env Configuration File
    const dbUrl = config.dbEngine === 'postgres' 
      ? `postgresql://${config.dbUser}:${config.dbPassword}@db:${config.dbPort}/${config.dbName}?sslmode=disable`
      : `mysql://${config.dbUser}:${config.dbPassword}@db:${config.dbPort}/${config.dbName}`;

    const envContent = `# Environment Configuration for ${config.projectName}
COMPOSE_PROJECT_NAME=${config.projectName.toLowerCase()}
NODE_ENV=production

# Database Credentials
DB_HOST=db
DB_PORT=${config.dbPort}
DB_NAME=${config.dbName}
DB_USER=${config.dbUser}
DB_PASSWORD=${config.dbPassword}
DATABASE_URL=${dbUrl}

# Service Ports
PORT=${config.backendPort}
FRONTEND_PORT=${config.frontendPort}
HTTP_PORT=${config.httpPort}

# Security & Secrets
JWT_SECRET=super_secret_enterprise_key_${Math.random().toString(36).substring(2, 15)}
CORS_ORIGIN=*
`;

    files.push({
      name: '.env',
      path: '.env',
      language: 'text',
      content: envContent,
      description: 'Vorkonfigurierte Umgebungsvariablen für Container & Services',
      category: 'config'
    });

    files.push({
      name: '.env.example',
      path: '.env.example',
      language: 'text',
      content: envContent.replace(config.dbPassword, 'your_secure_password_here'),
      description: 'Muster-Umgebungsvariablen für CI/CD und Version Control',
      category: 'config'
    });

    return files;
  }
}
