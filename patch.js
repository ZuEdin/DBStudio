const fs = require('fs');
function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add import if not exists
    if (!content.includes('import { toPascalCase')) {
        content = "import { toPascalCase } from './common';\n" + content;
    } else {
        // already has it, maybe missing toPascalCase?
        if (!content.includes('toPascalCase')) {
            content = content.replace(/import \{ /, 'import { toPascalCase, ');
        }
    }
    
    const preProcessCode = `
  const processedTables = tables.map(t => {
      const safeName = toPascalCase(t.name);
      return {
          ...t,
          fields: t.fields.map(f => {
              const propName = toPascalCase(f.name);
              if (propName === safeName) {
                  return {
                      ...f,
                      name: f.name + 'Value',
                      title: f.title || f.name
                  };
              }
              return f;
          })
      };
  });

  const processedQueries = queries.map(q => {
      const safeName = toPascalCase(q.name);
      return {
          ...q,
          columns: (q.columns || []).map(c => {
              const propName = toPascalCase(c.alias || c.fieldName);
              if (propName === safeName) {
                  return {
                      ...c,
                      alias: (c.alias || c.fieldName) + 'Value'
                  };
              }
              return c;
          })
      };
  });
`;

    // Replace usages of tables and queries with processedTables and processedQueries
    content = content.replace(/const configFiles = /g, preProcessCode + '\n  const configFiles = ');
    content = content.replace(/tables, /g, 'processedTables, ');
    content = content.replace(/queries, /g, 'processedQueries, ');
    content = content.replace(/generateAngularComponents\(processedTables/g, 'generateAngularComponents(processedTables');
    content = content.replace(/generateReactApi\(processedTables/g, 'generateReactApi(processedTables');
    
    fs.writeFileSync(file, content);
}

patchFile('utils/generators/reactGenerator.ts');
patchFile('utils/generators/angularGenerator.ts');
