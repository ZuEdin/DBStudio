const fs = require('fs');

function fixFile(file, functionName) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove the previous preprocessing block
    content = content.replace(/const isDotNet = config\.language === 'dotnet';\s*const processedTables = isDotNet \? tables\.map\([\s\S]*?const root = `Frontend`;/m, 'const root = `Frontend`;');
    
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

    const funcStartRegex = new RegExp(`export const ${functionName} = \\([\\s\\S]*?\\): VirtualFile\\[\\] => \\{`);
    content = content.replace(funcStartRegex, match => match + '\n' + preProcessCode);
    
    fs.writeFileSync(file, content);
}

fixFile('utils/generators/reactGenerator.ts', 'generateReact');
fixFile('utils/generators/angularGenerator.ts', 'generateAngular');
