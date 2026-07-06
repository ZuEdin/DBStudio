import { Table, BackendConfig } from '../../types/index';

export const generateMarkdownApiDocs = (tables: Table[], config: BackendConfig): string => {
  let md = `# API Documentation\n\n`;
  md += `Base URL: \`http://localhost:${config.port}/api\`\n\n`;
  
  md += `This document provides an overview of the automatically generated RESTful APIs for the application.\n\n`;
  
  if (config.authConfig?.useUserLogin || config.authConfig?.useWindowsAuth) {
    md += `## Authentication\n`;
    if (config.authConfig.useUserLogin) {
        md += `- **Method:** User Login / Bearer Token\n`;
        md += `- **Header:** \`Authorization: Bearer <token>\`\n`;
        md += `- **Login Endpoint:** \`POST /api/auth/login\`\n`;
        md += `- **Register Endpoint:** \`POST /api/auth/register\`\n`;
    }
    if (config.authConfig.useWindowsAuth) {
        md += `- **Method:** Windows Authentication (Active Directory)\n`;
        if (config.language === 'nodejs') {
            md += `- **SSO Endpoint:** \`POST /api/auth/login-sso\`\n`;
        }
    }
    md += `\n`;
  }
  
  tables.forEach(table => {
      const resource = table.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      md += `## ${table.name} API\n\n`;
      md += `**Endpoint:** \`/api/${resource}\`\n\n`;
      
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const pkType = pkField?.type === 'INTEGER' ? 'integer' : 'string';
      const pkName = pkField?.name || 'id';
      
      md += `### GET /api/${resource}\n`;
      md += `Retrieve a list of ${table.name} records.\n\n`;
      
      md += `### GET /api/${resource}/:${pkName}\n`;
      md += `Retrieve a single ${table.name} record by its ${pkName}.\n\n`;
      
      md += `### POST /api/${resource}\n`;
      md += `Create a new ${table.name} record.\n\n`;
      md += `**Payload Example:**\n\`\`\`json\n{\n`;
      table.fields.filter(f => !f.isAutoIncrement).forEach(f => {
          let exampleVal = '"string"';
          if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') exampleVal = '0';
          if (f.type === 'BOOLEAN') exampleVal = 'true';
          if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') exampleVal = '"2024-01-01T00:00:00Z"';
          md += `  "${f.name}": ${exampleVal},\n`;
      });
      md += `}\n\`\`\`\n\n`;
      
      md += `### PUT /api/${resource}/:${pkName}\n`;
      md += `Update an existing ${table.name} record.\n\n`;
      
      md += `### DELETE /api/${resource}/:${pkName}\n`;
      md += `Delete a ${table.name} record.\n\n`;
      
      md += `---\n\n`;
  });
  
  return md;
};
