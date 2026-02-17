
import { Table, BackendConfig, VirtualFile, DbType } from '../../../types/index';
import { toPascalCase, quoteIdentifier } from '../common';

export const generateDbInitializer = (tables: Table[], config: BackendConfig, root: string): VirtualFile => {
    let seedLogic = '';
    const dbType = config.dbType;

    tables.forEach(table => {
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
