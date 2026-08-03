import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateDockerFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'docker' || target === 'aws' || target === 'azure') {
        const dockerfileContent = `# Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final Stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

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
      - "${config.port || 3000}:${config.port || 3000}"
    environment:
      - NODE_ENV=production
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
    return files;
};
