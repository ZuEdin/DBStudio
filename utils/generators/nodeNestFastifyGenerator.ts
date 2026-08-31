import { Table, Relationship } from '../../types';

export interface NodeBackendOptions {
  framework: 'NESTJS' | 'FASTIFY' | 'EXPRESS';
  orm: 'DRIZZLE' | 'PRISMA' | 'KYSELY';
  useZod: boolean;
  useSwagger: boolean;
}

export const generateNodeBackendProject = (
  tables: Table[],
  relationships: Relationship[],
  options: NodeBackendOptions
): Record<string, string> => {
  const files: Record<string, string> = {};

  // package.json
  files['package.json'] = JSON.stringify(
    {
      name: 'node-enterprise-api',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        test: 'jest',
      },
      dependencies: {
        express: '^4.19.2',
        fastify: '^4.28.0',
        drizzle_orm: '^0.33.0',
        zod: '^3.23.8',
        jsonwebtoken: '^9.0.2',
        dotenv: '^16.4.5',
      },
      devDependencies: {
        typescript: '^5.5.4',
        '@types/node': '^20.14.10',
        jest: '^29.7.0',
        tsx: '^4.16.2',
      },
    },
    null,
    2
  );

  // Schema definition for Drizzle ORM
  const drizzleTables = tables
    .map((t) => {
      const cols = t.columns
        .map((c) => {
          const tName = c.type === 'number' ? 'integer' : c.type === 'boolean' ? 'boolean' : 'text';
          return `  ${c.name}: ${tName}('${c.name}')${c.isPrimaryKey ? '.primaryKey()' : ''}${c.nullable ? '' : '.notNull()'}`;
        })
        .join(',\n');

      return `export const ${t.name.toLowerCase()}Table = pgTable('${t.name.toLowerCase()}', {\n${cols}\n});`;
    })
    .join('\n\n');

  files['src/db/schema.ts'] = `import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';\n\n${drizzleTables}`;

  // Express / Fastify Entrypoint with Zod Validation
  files['src/index.ts'] = `import express from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

${tables
  .map(
    (t) => `
// CRUD endpoints for ${t.name}
app.get('/api/${t.name.toLowerCase()}s', async (req, res) => {
  res.json({ data: [] });
});

app.post('/api/${t.name.toLowerCase()}s', async (req, res) => {
  const bodySchema = z.object({
    ${t.columns.map((c) => `${c.name}: z.${c.type === 'number' ? 'number()' : c.type === 'boolean' ? 'boolean()' : 'string()'}${c.nullable ? '.optional()' : ''}`).join(',\n    ')}
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() });
  }

  res.status(201).json({ message: '${t.name} created', data: parsed.data });
});
`
  )
  .join('\n')}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

  // Swagger OpenAPI Setup
  files['src/swagger.ts'] = `export const swaggerSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Node Enterprise API',
    version: '1.0.0',
    description: 'Auto-generated TypeScript Enterprise Backend',
  },
  paths: {},
};`;

  return files;
};
