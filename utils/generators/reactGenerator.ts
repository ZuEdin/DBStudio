
import { Table, Query, VirtualFile, Relationship, BackendConfig, Form, Report } from '../../types/index';
import { generateReactConfigs } from './react/config';
import { generateReactApi } from './react/api';
import { generateReactPages } from './react/pages';
import { generateReactStructure } from './react/structure';

export const generateReact = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[] = [], reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  
  const configFiles = generateReactConfigs(config, root);
  const apiFiles = generateReactApi(tables, queries, config, root);
  // Pass Queries to Structure generator for Routes/Sidebar
  const structureFiles = generateReactStructure(tables, forms, reports, config, root, queries);
  const pageFiles = generateReactPages(tables, forms, reports, root, queries);

  // Docs
  const readmeContent = `# ${config.projectName} (React Client)

## Voraussetzungen
- Node.js (LTS Version)

## Installation
Öffnen Sie ein Terminal im Ordner \`Frontend\` und führen Sie aus:

\`\`\`bash
npm install
\`\`\`

## Starten
\`\`\`bash
npm run dev
\`\`\`

Die Anwendung läuft standardmäßig unter \`http://localhost:3000\`.
Stellen Sie sicher, dass das Backend ebenfalls läuft (siehe Backend README).
`;

  const readme: VirtualFile = { name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' };

  return [
      ...configFiles,
      ...apiFiles,
      ...structureFiles,
      ...pageFiles,
      readme
  ];
};
