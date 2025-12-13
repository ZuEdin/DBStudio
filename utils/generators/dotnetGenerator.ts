
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
  files.push(generateDbContext(tables, config, root));
  files.push(...generateModels(tables, relationships, config, root));
  
  // API Layer
  files.push(...generateControllers(tables, relationships, config, root));

  // Docs
  files.push({ name: 'README.md', path: `${root}/README.md`, content: `# ${config.projectName}\nRun with: dotnet run`, language: 'text' });

  return files;
};
