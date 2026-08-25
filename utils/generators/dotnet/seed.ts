
import { Table, BackendConfig, VirtualFile, DbType, Relationship, Query, SelectQuery } from '../../../types/index';
import { toPascalCase, quoteIdentifier, sortTablesByDependencies } from '../common';
import { generateSqlSelect } from '../../sqlHelper';

const mapPermissionObjectId = (row: any, tables: Table[], queries: Query[], isSql: boolean): any => {
    if (!row || typeof row !== 'object') return row;
    const newRow = { ...row };
    const key = Object.keys(newRow).find(k => k.toLowerCase() === 'objectid');
    if (!key) return row;

    const objectId = newRow[key];
    const objectTypeKey = Object.keys(newRow).find(k => k.toLowerCase() === 'objecttype');
    const objectType = objectTypeKey ? String(newRow[objectTypeKey]).toLowerCase() : '';

    if (objectType === 'table') {
        const matchedTable = tables.find(t => t.id === objectId);
        if (matchedTable) {
            newRow[key] = isSql ? toPascalCase(matchedTable.name) : matchedTable.name;
        }
    } else if (objectType === 'query') {
        const matchedQuery = queries.find(q => q.id === objectId);
        if (matchedQuery) {
            newRow[key] = isSql ? toPascalCase(matchedQuery.name) : matchedQuery.name;
        }
    } else if (objectType === 'field') {
        let matchedFieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === objectId);
            if (f) {
                matchedFieldName = f.name;
                break;
            }
        }
        if (matchedFieldName) {
            newRow[key] = matchedFieldName;
        }
    }
    return newRow;
};

export const generateDbInitializer = (tables: Table[], relationships: Relationship[], config: BackendConfig, root: string, queries: Query[] = []): VirtualFile => {
    let seedLogic = '';
    const dbType = config.dbType;
    const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');

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

    const BATCH_SIZE = 250; // Batch size for fast multi-row inserts compatible with SQLite, MySQL, and SQL Server

    sortedTables.forEach(table => {
        if (!table.data || table.data.length === 0) return;

        const tableName = quoteIdentifier(toPascalCase(table.name), dbType);
        const hasIdentity = table.fields.some(f => f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement);
        const isPermissionsTable = table.name.toLowerCase() === 'sys_permissions';
        const modelName = toPascalCase(table.name);

        const columns = table.fields.map(f => quoteIdentifier(f.name, dbType)).join(', ');

        const rowValuesList: string[] = [];
        table.data.forEach(row => {
            if (!row || typeof row !== 'object') return;
            const mappedRow = isPermissionsTable ? mapPermissionObjectId(row, tables, queries || [], true) : row;
            const rowValues = table.fields.map(f => {
                let val = mappedRow[f.name];
                if (val === undefined) {
                    const matchedKey = Object.keys(mappedRow).find(k => k.toLowerCase() === f.name.toLowerCase());
                    if (matchedKey) {
                        val = mappedRow[matchedKey];
                    }
                }
                if (val === undefined || val === null || val === '') return 'NULL';
                
                if (['INTEGER', 'DECIMAL', 'DOUBLE'].includes(f.type)) {
                    if (typeof val === 'number') return isNaN(val) ? 'NULL' : val;
                    const num = Number(val);
                    return isNaN(num) ? 'NULL' : num;
                }
                if (f.type === 'BOOLEAN') {
                     return (val === true || val === 'true' || val === 1 || val === '1') ? 1 : 0;
                }
                
                // Escape single quotes for SQL
                const strVal = String(val).replace(/'/g, "''");
                return `'${strVal}'`;
            }).join(', ');

            rowValuesList.push(`(${rowValues})`);
        });

        if (rowValuesList.length === 0) return;

        // Split into batches to avoid SQL parser limits & large memory blocks
        const batches: string[][] = [];
        for (let i = 0; i < rowValuesList.length; i += BATCH_SIZE) {
            batches.push(rowValuesList.slice(i, i + BATCH_SIZE));
        }

        let tableBatchStatements = '';
        if (dbType === DbType.SQL && hasIdentity) {
            tableBatchStatements += `                    context.Database.ExecuteSqlRaw(@"SET IDENTITY_INSERT ${tableName} ON;");\n`;
        }

        const insertVerb = dbType === DbType.SQLite ? 'INSERT OR REPLACE INTO' : (dbType === DbType.MySQL ? 'INSERT IGNORE INTO' : 'INSERT INTO');

        batches.forEach(batch => {
            if (batch.length === 0) return;
            const batchSql = `${insertVerb} ${tableName} (${columns}) VALUES \n${batch.join(',\n')};`;
            const escapedSql = batchSql.replace(/"/g, '""');
            tableBatchStatements += `                    context.Database.ExecuteSqlRaw(@"${escapedSql}");\n`;
        });

        if (dbType === DbType.SQL && hasIdentity) {
            tableBatchStatements += `                    context.Database.ExecuteSqlRaw(@"SET IDENTITY_INSERT ${tableName} OFF;");\n`;
        }

        seedLogic += `
                try
                {
                    if (!context.${modelName}s.Any())
                    {
${tableBatchStatements}                    }
                }
                catch (Exception tableEx)
                {
                    Console.WriteLine($"[Seeding Warning] Could not seed table ${modelName}: {tableEx.Message}");
                }
`;
    });

    const content = `using Microsoft.EntityFrameworkCore;
using ${safeNamespace}.Data;

namespace ${safeNamespace}.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Increase command timeout for seeding large datasets
            context.Database.SetCommandTimeout(300);

            // Execute entire seeding inside an explicit transaction for atomic commit and ultra-fast SQLite / SQL I/O
            ${dbType === DbType.SQLite ? 'context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");\n' : ''}
            using var transaction = context.Database.BeginTransaction();
            try
            {
${seedLogic}
                transaction.Commit();
            }
            catch (Exception ex)
            {
                try { transaction.Rollback(); } catch { }
                Console.WriteLine("Seeding Error: " + ex.Message);
                throw;
            }
            finally
            {
${dbType === DbType.SQLite ? '                try { context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;"); } catch { }\n' : ''}
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
