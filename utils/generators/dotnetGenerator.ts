
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { generateCsproj } from './dotnet/csproj';
import { generateProgram } from './dotnet/program';
import { generateDbContext, generateModels } from './dotnet/models';
import { generateControllers } from './dotnet/controllers';

export const generateDotNet = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  
  // Config & Setup Files
  const connectionString = config.dbConnection || (config.dbType === DbType.SQLite 
        ? "Data Source=app.db" 
        : "Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;");
  
  files.push({ name: 'appsettings.json', path: `${root}/appsettings.json`, content: JSON.stringify({
    "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
    "AllowedHosts": "*",
    "ConnectionStrings": { "DefaultConnection": connectionString }
  }, null, 2), language: 'json' });

  files.push(generateCsproj(config, root));
  files.push(generateProgram(config, root));
  
  // Data Layer
  files.push(generateDbContext(tables, queries, config, root));
  files.push(...generateModels(tables, relationships, queries, config, root));
  
  // API Layer
  files.push(...generateControllers(tables, relationships, queries, config, root));

  // Docs
  const readmeContent = `# ${config.projectName} (.NET Web API)

## Voraussetzungen
1. Installieren Sie das **.NET SDK** (Version ${config.backendVersion || '8.0'} oder höher).
   Download: https://dotnet.microsoft.com/download
2. Stellen Sie sicher, dass Ihre Datenbank (${config.dbType}) läuft.

## Einrichtung
1. Öffnen Sie die Datei \`appsettings.json\`.
2. Überprüfen Sie den \`ConnectionStrings:DefaultConnection\`. Passen Sie diesen ggf. an Ihre lokale Datenbank an.

## Starten
Öffnen Sie ein Terminal in diesem Ordner und führen Sie folgende Befehle aus:

\`\`\`bash
# Wiederherstellen der Abhängigkeiten
dotnet restore

# Starten der Anwendung
dotnet run
\`\`\`

Die API ist anschließend meist unter \`http://localhost:${config.port}\` erreichbar.
Die Swagger-Dokumentation finden Sie unter \`http://localhost:${config.port}/swagger\`.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
