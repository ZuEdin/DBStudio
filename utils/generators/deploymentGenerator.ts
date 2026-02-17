
import { BackendConfig, VirtualFile } from '../../types/index';

export const generateDeploymentScripts = (config: BackendConfig, root: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const target = config.deploymentConfig?.target || 'docker';

    // 1. Docker Generation (Containerization)
    if (target === 'docker' || target === 'aws' || target === 'azure') {
        let dockerfileContent = '';
        
        if (config.language === 'dotnet') {
            const version = config.backendVersion || '9.0';
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

    return files;
};
