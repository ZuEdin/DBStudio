const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if we already applied it
    if (content.includes('safeTables = tables.map')) {
        return;
    }
    
    const preProcessCode = `
    const toPascalCase = (str) => {
        if (!str) return '';
        const words = str.match(/[a-z]+/gi) || [];
        return words.map(w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()).join('');
    };
    
    // Globally ensure that fields/columns do not have the same name as their table/class!
    // This resolves compile errors in many languages and improves UI component safety.
    const safeTables = tables.map(t => {
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

    const safeQueries = queries.map(q => {
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
    
    tables = safeTables;
    queries = safeQueries;
`;

    content = content.replace(/let files: VirtualFile\[\] = \[\];/m, 'let files: VirtualFile[] = [];\n' + preProcessCode);
    
    fs.writeFileSync(file, content);
}

fixFile('utils/backendGenerators.ts');
