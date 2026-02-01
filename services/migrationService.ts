
import { Table, DbType, Field } from '../types/index';
import { resolveType, quoteIdentifier, toPascalCase } from '../utils/generators/common';

export interface MigrationScript {
    up: string;
    down: string;
    description: string;
}

const mapTypeToSql = (field: Field, dbType: DbType): string => {
    let type = resolveType(field, 'sql');
    // Simplified mapping call reuse or inline logic
    return type;
};

export const calculateMigration = (currentTables: Table[], snapshotTables: Table[] = [], dbType: DbType): MigrationScript => {
    let upSql = '';
    let downSql = '';
    const changes: string[] = [];

    // 1. Check for New Tables
    currentTables.forEach(curr => {
        const prev = snapshotTables.find(t => t.id === curr.id);
        if (!prev) {
            // New Table
            changes.push(`Create table ${curr.name}`);
            const fieldsDef = curr.fields.map(f => {
                let def = `${quoteIdentifier(f.name, dbType)} ${mapTypeToSql(f, dbType)}`;
                if (!f.allowNull && !f.isPrimaryKey) def += ' NOT NULL';
                if (f.isPrimaryKey) def += ' PRIMARY KEY';
                return def;
            }).join(', ');
            
            upSql += `CREATE TABLE ${quoteIdentifier(toPascalCase(curr.name), dbType)} (${fieldsDef});\n`;
            downSql += `DROP TABLE ${quoteIdentifier(toPascalCase(curr.name), dbType)};\n`;
        } else {
            // Check for Modified/New Fields
            curr.fields.forEach(currField => {
                const prevField = prev.fields.find(f => f.id === currField.id);
                const tableName = quoteIdentifier(toPascalCase(curr.name), dbType);
                const fieldName = quoteIdentifier(currField.name, dbType);
                const fieldType = mapTypeToSql(currField, dbType);

                if (!prevField) {
                    // New Column
                    changes.push(`Add column ${curr.name}.${currField.name}`);
                    upSql += `ALTER TABLE ${tableName} ADD ${fieldName} ${fieldType};\n`;
                    // SQLite doesn't support DROP COLUMN in older versions easily, but standard SQL does
                    if (dbType !== DbType.SQLite) {
                        downSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
                    }
                } else {
                    // Modified Column? (Name change or Type change)
                    // Detecting rename is hard by ID if names differ.
                    if (currField.name !== prevField.name) {
                        changes.push(`Rename column ${prevField.name} to ${currField.name} in ${curr.name}`);
                        // SQL Server: sp_rename, MySQL: CHANGE, SQLite: Not supported easily
                        if (dbType === DbType.SQL) {
                            upSql += `EXEC sp_rename '${toPascalCase(curr.name)}.${prevField.name}', '${currField.name}', 'COLUMN';\n`;
                            downSql += `EXEC sp_rename '${toPascalCase(curr.name)}.${currField.name}', '${prevField.name}', 'COLUMN';\n`;
                        } else if (dbType === DbType.MySQL) {
                            upSql += `ALTER TABLE ${tableName} CHANGE ${quoteIdentifier(prevField.name, dbType)} ${fieldName} ${fieldType};\n`;
                            downSql += `ALTER TABLE ${tableName} CHANGE ${fieldName} ${quoteIdentifier(prevField.name, dbType)} ${mapTypeToSql(prevField, dbType)};\n`;
                        }
                    }
                    // Type change?
                    if (currField.type !== prevField.type) {
                         changes.push(`Change type of ${curr.name}.${currField.name} to ${currField.type}`);
                         if (dbType === DbType.SQL) {
                             upSql += `ALTER TABLE ${tableName} ALTER COLUMN ${fieldName} ${fieldType};\n`;
                         } else if (dbType === DbType.MySQL) {
                             upSql += `ALTER TABLE ${tableName} MODIFY ${fieldName} ${fieldType};\n`;
                         }
                    }
                }
            });

            // Check for Dropped Fields
            prev.fields.forEach(prevField => {
                if (!curr.fields.find(f => f.id === prevField.id)) {
                    changes.push(`Drop column ${prevField.name} from ${curr.name}`);
                    const tableName = quoteIdentifier(toPascalCase(curr.name), dbType);
                    const fieldName = quoteIdentifier(prevField.name, dbType);
                    if (dbType !== DbType.SQLite) {
                        upSql += `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};\n`;
                        downSql += `ALTER TABLE ${tableName} ADD ${fieldName} ${mapTypeToSql(prevField, dbType)};\n`;
                    }
                }
            });
        }
    });

    // 2. Check for Dropped Tables
    snapshotTables.forEach(prev => {
        if (!currentTables.find(t => t.id === prev.id)) {
            changes.push(`Drop table ${prev.name}`);
            upSql += `DROP TABLE ${quoteIdentifier(toPascalCase(prev.name), dbType)};\n`;
            // Down SQL to recreate is complex (needs fields), skipping deep restoration logic for this demo
            downSql += `-- Re-create table ${prev.name} (Schema lost in snapshot)`; 
        }
    });

    return {
        up: upSql || '-- No changes detected',
        down: downSql || '-- No changes detected',
        description: changes.length > 0 ? changes.join('\n') : 'No changes'
    };
};
