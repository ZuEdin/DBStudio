
import { Table, BackendConfig, VirtualFile, DbType, Relationship, Query, SelectQuery } from '../../../types/index';
import { toPascalCase, quoteIdentifier } from '../common';
import { generateSqlSelect } from '../../sqlHelper';

export const sortTablesByDependencies = (tables: Table[], relationships: Relationship[]): Table[] => {
    const dependencyMap = new Map<string, Set<string>>();
    tables.forEach(t => dependencyMap.set(t.id, new Set<string>()));
    
    relationships.forEach(rel => {
        const parentId = rel.fromTableId;
        const childId = rel.toTableId;
        if (dependencyMap.has(childId) && dependencyMap.has(parentId) && childId !== parentId) {
            dependencyMap.get(childId)!.add(parentId);
        }
    });

    const sorted: Table[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (tableId: string) => {
        if (visited.has(tableId)) return;
        if (visiting.has(tableId)) return; // Break cycle
        
        visiting.add(tableId);
        const deps = dependencyMap.get(tableId);
        if (deps) {
            deps.forEach(depId => visit(depId));
        }
        visiting.delete(tableId);
        visited.add(tableId);

        const table = tables.find(t => t.id === tableId);
        if (table) {
            sorted.push(table);
        }
    };

    tables.forEach(t => {
        if (!visited.has(t.id)) {
            visit(t.id);
        }
    });

    return sorted;
};

export const generateDbInitializer = (tables: Table[], relationships: Relationship[], config: BackendConfig, root: string, queries: Query[] = []): VirtualFile => {
    let seedLogic = '';
    const dbType = config.dbType;

    // Create database views for custom queries if they don't exist
    const selectQueries = queries.filter(q => q.type === 'SELECT');
    if (selectQueries.length > 0) {
        seedLogic += `                // Create database views for custom select queries\n`;
        selectQueries.forEach(q => {
            const selectQ = q as SelectQuery;
            const selectSql = generateSqlSelect(selectQ.nodes, selectQ.columns, tables, relationships, config.dbType, false);
            if (selectSql) {
                const viewName = toPascalCase(q.name);
                let createViewSql = '';
                if (config.dbType === DbType.SQLite) {
                    createViewSql = `CREATE VIEW IF NOT EXISTS [${viewName}] AS ${selectSql};`;
                } else if (config.dbType === DbType.MySQL) {
                    createViewSql = `CREATE OR REPLACE VIEW \`${viewName}\` AS ${selectSql};`;
                } else {
                    // SQL Server
                    createViewSql = `IF NOT EXISTS (SELECT * FROM sys.views WHERE name = '${viewName}') EXEC('CREATE VIEW [${viewName}] AS ${selectSql.replace(/'/g, "''")}');`;
                }
                const escapedViewSql = createViewSql.replace(/"/g, '""');
                seedLogic += `                context.Database.ExecuteSqlRaw(@"${escapedViewSql}");\n`;
            }
        });
        seedLogic += `\n`;
    }

    // Sort tables so dependent tables are seeded after their referenced tables (parent tables)
    const sortedTables = sortTablesByDependencies(tables, relationships || []);

    sortedTables.forEach(table => {
        if (!table.data || table.data.length === 0) return;

        const tableName = quoteIdentifier(toPascalCase(table.name), dbType);
        const hasIdentity = table.fields.some(f => f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement);
        
        let tableSeedSql = '';

        // SQL Server needs explicit permission to insert into Identity columns
        if (dbType === DbType.SQL && hasIdentity) {
            tableSeedSql += `SET IDENTITY_INSERT ${tableName} ON; \n`;
        }

        table.data.forEach(row => {
            const columns = table.fields.map(f => quoteIdentifier(f.name, dbType)).join(', ');
            const values = table.fields.map(f => {
                const val = row[f.name];
                if (val === undefined || val === null || val === '') return 'NULL';
                
                if (['INTEGER', 'DECIMAL', 'DOUBLE'].includes(f.type)) {
                    return val;
                }
                if (f.type === 'BOOLEAN') {
                     // SQLite and SQL use 1/0 for boolean mostly in raw SQL contexts
                     return (val === true || val === 'true') ? 1 : 0;
                }
                
                // Escape single quotes for SQL
                const strVal = String(val).replace(/'/g, "''");
                return `'${strVal}'`;
            }).join(', ');

            tableSeedSql += `INSERT INTO ${tableName} (${columns}) VALUES (${values}); \n`;
        });

        if (dbType === DbType.SQL && hasIdentity) {
            tableSeedSql += `SET IDENTITY_INSERT ${tableName} OFF; \n`;
        }

        // C# Code to execute this block safely
        const modelName = toPascalCase(table.name);
        // We use Verbatim string (@"") for SQL, ensuring double quotes are escaped as ""
        const escapedSql = tableSeedSql.replace(/"/g, '""');
        
        seedLogic += `
            if (!context.${modelName}s.Any())
            {
                context.Database.ExecuteSqlRaw(@"${escapedSql}");
            }
`;
    });

    const content = `using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;

namespace ${config.projectName}.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            try
            {
                ${seedLogic}
            }
            catch (Exception ex)
            {
                Console.WriteLine("Seeding Error: " + ex.Message);
            }
        }
    }
}`;

    return {
        name: 'DbInitializer.cs',
        path: `${root}/Data/DbInitializer.cs`,
        content: content,
        language: 'csharp'
    };
};
