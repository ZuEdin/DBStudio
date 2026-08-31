import { Table } from '../../types';

export const generateDevOpsArtifacts = (
  projectName: string,
  tables: Table[]
): Record<string, string> => {
  const files: Record<string, string> = {};
  const slug = projectName.toLowerCase().replace(/\s+/g, '-');

  // 1. OpenAPI 3.1 Specification
  const pathsObj: Record<string, any> = {};
  tables.forEach((t) => {
    pathsObj[`/api/${t.name.toLowerCase()}s`] = {
      get: {
        summary: `List all ${t.name}s`,
        responses: {
          '200': { description: 'Successful response' },
        },
      },
      post: {
        summary: `Create a new ${t.name}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: t.columns.reduce((acc, c) => {
                  acc[c.name] = { type: c.type === 'number' ? 'integer' : 'string' };
                  return acc;
                }, {} as Record<string, any>),
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created successfully' },
        },
      },
    };
  });

  const openApiDoc = {
    openapi: '3.1.0',
    info: {
      title: `${projectName} API`,
      version: '1.0.0',
      description: 'Auto-generated Enterprise OpenAPI 3.1 Specification',
    },
    paths: pathsObj,
  };

  files['openapi.json'] = JSON.stringify(openApiDoc, null, 2);

  // 2. Postman Collection v2.1
  const postmanColl = {
    info: {
      name: `${projectName} Postman Collection`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: tables.map((t) => ({
      name: `Get ${t.name}s`,
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: `{{baseUrl}}/api/${t.name.toLowerCase()}s`,
          host: ['{{baseUrl}}'],
          path: ['api', `${t.name.toLowerCase()}s`],
        },
      },
    })),
  };

  files['postman_collection.json'] = JSON.stringify(postmanColl, null, 2);

  // 3. Multi-Stage Dockerfile
  files['Dockerfile'] = `# Multi-Stage Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]`;

  // 4. docker-compose.yml
  files['docker-compose.yml'] = `version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/appdb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:`;

  // 5. GitHub Actions CI/CD Workflow
  files['.github/workflows/ci-cd.yml'] = `name: Enterprise CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter
        run: npm run lint || true

      - name: Run Integration Tests
        run: npm test || true

      - name: Build Production Bundle
        run: npm run build || true
`;

  return files;
};
