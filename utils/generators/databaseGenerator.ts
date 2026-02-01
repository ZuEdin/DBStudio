
import { Table, Relationship, BackendConfig, VirtualFile, DbType, Query, SelectQuery } from '../../types/index';
import { resolveType, quoteIdentifier, toPascalCase } from './common';
import { generateSqlSelect } from '../sqlHelper';

export const generateDatabaseScripts = (tables: Table[], relationships: Relationship[], config: BackendConfig, queries: Query[] = []): VirtualFile[] => {
    const root = `Backend/${config.projectName}/database`;
    const files: VirtualFile[] = [];

    // Clone tables to avoid mutation of frozen store array
    const processingTables = [...tables];

    // Inject Users table if Auth is requested AND it's missing (Fallback)
    if (config.authConfig?.useUserLogin) {
        if (!processingTables.some(t => t.name.toLowerCase() === 'users' || t.name.toLowerCase() === 'sys_users')) {
            processingTables.push({
                id: 'sys_users',
                name: 'Users',
                fields: [
                    { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                    { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
                    { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
                    { id: 'u4', name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
                    { id: 'u5', name: 'Role', type: 'VARCHAR', length: 20, defaultValue: 'User' }
                ]
            });
        }
    }

    if (config.dbType === DbType.NoSQL) {
        const schema = processingTables.reduce((acc, t) => {
            acc[t.name] = {
                description: `Collection for ${t.name}`,
                fields: t.fields.map(f => ({
                    name: f.name,
                    type: f.type,
                    isPrimaryKey: f.isPrimaryKey,
                    required: !f.allowNull,
                    default: f.defaultValue
                }))
            };
            return acc;
        }, {} as Record<string, any>);

        files.push({ name: 'collections.json', path: `${root}/collections.json`, content: JSON.stringify(schema, null, 2), language: 'json' });
    } else {
        let sql = `-- Database Script for ${config.dbType}\n-- Project: ${config.projectName}\n\n`;
        
        // 1. Tables
        processingTables.forEach(table => {
            const fields = table.fields.map(f => {
                let type = resolveType(f, 'sql');
                if (config.dbType === DbType.SQLite) {
                    // SQLite specific auto increment syntax
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) return `  ${quoteIdentifier(f.name, config.dbType)} INTEGER PRIMARY KEY AUTOINCREMENT`;
                } else if (config.dbType === DbType.MySQL) {
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) type += ' AUTO_INCREMENT';
                } else {
                    // SQL Server
                    if (f.isPrimaryKey && f.type === 'INTEGER' && f.isAutoIncrement) type += ' IDENTITY(1,1)';
                }
                
                let line = `  ${quoteIdentifier(f.name, config.dbType)} ${type}`;
                if (config.dbType !== DbType.SQLite && f.isPrimaryKey) line += ' PRIMARY KEY';
                if (!f.allowNull && !f.isPrimaryKey) line += ' NOT NULL';
                
                // Add DEFAULT Constraint
                if (f.defaultValue !== undefined && f.defaultValue !== '') {
                    let defVal = f.defaultValue;
                    const isKeyword = ['NOW', 'CURRENT_TIMESTAMP'].includes(defVal.toUpperCase());
                    
                    if (['INTEGER', 'BOOLEAN', 'DECIMAL', 'DOUBLE'].includes(f.type) || isKeyword) {
                        if (isKeyword) {
                            defVal = config.dbType === DbType.SQL ? 'GETDATE()' : 'CURRENT_TIMESTAMP';
                        }
                    } else {
                        // String literal
                        defVal = `'${defVal.replace(/'/g, "''")}'`;
                    }
                    line += ` DEFAULT ${defVal}`;
                }

                return line;
            }).join(',\n');
            sql += `CREATE TABLE ${quoteIdentifier(toPascalCase(table.name), config.dbType)} (\n${fields}\n);\n\n`;
        });

        // 2. Foreign Keys
        if (config.dbType !== DbType.SQLite) {
            relationships.forEach(rel => {
                const parent = processingTables.find(t => t.id === rel.fromTableId);
                const child = processingTables.find(t => t.id === rel.toTableId);
                const childField = child?.fields.find(f => f.id === rel.toFieldId);
                const parentField = parent?.fields.find(f => f.id === rel.fromFieldId);
                
                if (parent && child && childField && parentField) {
                    const constraintName = `FK_${child.name.replace(/\s/g, '_')}_${parent.name.replace(/\s/g, '_')}`;
                    let constraintSql = `ALTER TABLE ${quoteIdentifier(toPascalCase(child.name), config.dbType)} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${quoteIdentifier(childField.name, config.dbType)}) REFERENCES ${quoteIdentifier(toPascalCase(parent.name), config.dbType)}(${quoteIdentifier(parentField.name, config.dbType)})`;
                    
                    if (rel.onDelete && rel.onDelete !== 'NO ACTION') {
                        constraintSql += ` ON DELETE ${rel.onDelete}`;
                    }
                    if (rel.onUpdate && rel.onUpdate !== 'NO ACTION') {
                        constraintSql += ` ON UPDATE ${rel.onUpdate}`;
                    }
                    
                    sql += `${constraintSql};\n`;
                }
            });
        }
        
        // 3. Views (for Queries)
        sql += `\n-- Views\n`;
        queries.forEach(q => {
            if (q.type === 'SELECT') {
                const selectSql = generateSqlSelect((q as SelectQuery).nodes, (q as SelectQuery).columns, processingTables, relationships, config.dbType);
                if (selectSql) {
                    sql += `CREATE VIEW ${quoteIdentifier(toPascalCase(q.name), config.dbType)} AS\n${selectSql};\n\n`;
                }
            }
        });

        files.push({ name: 'schema.sql', path: `${root}/schema.sql`, content: sql, language: 'sql' });
    }

    return files;
};
