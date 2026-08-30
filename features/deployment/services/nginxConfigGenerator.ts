import { DockerStackConfig, GeneratedDeploymentFile } from '../types';

export class NginxConfigGenerator {
  public static generateNginxConf(config: DockerStackConfig): GeneratedDeploymentFile[] {
    const files: GeneratedDeploymentFile[] = [];

    // Main Reverse Proxy Nginx configuration
    const mainNginx = `# ==========================================
# Production Nginx Gateway & Reverse Proxy Configuration
# Enterprise Security & High-Performance Routing
# ==========================================

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Upstream Backends
    upstream backend_api {
        server backend:${config.backendPort};
        keepalive 32;
    }

    ${config.includeFrontend ? `upstream frontend_app {
        server frontend:80;
        keepalive 16;
    }` : ''}

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen 80;
        server_name ${config.domainName || 'localhost'};

        # Client Body Limits
        client_max_body_size 50M;

        # Healthcheck endpoint
        location /nginx-health {
            access_log off;
            return 200 "healthy\\n";
        }

        # API Routes Proxy
        location /api/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Swagger / OpenAPI Docs
        location /swagger/ {
            proxy_pass http://backend_api/swagger/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        ${config.includeFrontend ? `
        # Frontend Single Page App Routing
        location / {
            proxy_pass http://frontend_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        ` : `
        location / {
            proxy_pass http://backend_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        `}
    }
}
`;

    files.push({
      name: 'nginx.conf',
      path: 'docker/nginx.conf',
      language: 'text',
      content: mainNginx,
      description: 'Zentrale Nginx Reverse Proxy & Load Balancer Konfiguration',
      category: 'config'
    });

    // Frontend Container Internal Nginx Config
    const frontendNginx = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|wasm)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }
}
`;

    files.push({
      name: 'nginx-frontend.conf',
      path: 'docker/nginx-frontend.conf',
      language: 'text',
      content: frontendNginx,
      description: 'Interne SPA-Routing Konfiguration für den Frontend-Container',
      category: 'config'
    });

    return files;
  }
}
