
import { Table, Relationship, BackendConfig, VirtualFile, DbType, Query, SelectQuery } from '../../types/index';
import { resolveType } from './common';
import { generateSqlSelect } from '../sqlHelper';

export const generateDatabaseScripts = (tables: Table[], relationships: Relationship[], config: BackendConfig, queries: Query[] = []): VirtualFile[] => {
    const root = `Backend/${config.projectName}/database`;
    const files: VirtualFile[] = [];

    if (config.dbType === DbType.NoSQL) {
        // ... (NoSQL schema generation remains same)
        const schema = tables.reduce((acc, t) => {
            acc[t.name] = {
                description: `Collection for ${t.name}`,
                fields: t.fields.map(f => ({
                    name: f.name,
                    type: f.type,
                    isPrimaryKey: f.isPrimaryKey,
                    required: !f.allowNull
                }))
            };
            return acc;
        }, {} as Record<string, any>);

        files.push({ name: 'collections.json', path: `${root}/collections.json`, content: JSON.stringify(schema, null, 2), language: 'json' });
    } else {
        let sql = `-- Database Script for ${config.dbType}\n-- Project: ${config.projectName}\n\n`;
        
        // 1. Tables
        tables.forEach(table => {
            const fields = table.fields.map(f => {
                let type = resolveType(f, 'sql');
                if (config.dbType === DbType.SQLite) {
                    if (f.isPrimaryKey && f.type === 'INTEGER') return `  ${f.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
                } else if (config.dbType === DbType.MySQL) {
                    if (f.isPrimaryKey && f.type === 'INTEGER') type += ' AUTO_INCREMENT';
                } else {
                    if (f.isPrimaryKey && f.type === 'INTEGER') type += ' IDENTITY(1,1)';
                }
                let line = `  ${f.name} ${type}`;
                if (config.dbType !== DbType.SQLite && f.isPrimaryKey) line += ' PRIMARY KEY';
                if (!f.allowNull && !f.isPrimaryKey) line += ' NOT NULL';
                return line;
            }).join(',\n');
            sql += `CREATE TABLE ${table.name} (\n${fields}\n);\n\n`;
        });

        // 2. Foreign Keys
        if (config.dbType !== DbType.SQLite) {
            relationships.forEach(rel => {
                const parent = tables.find(t => t.id === rel.fromTableId);
                const child = tables.find(t => t.id === rel.toTableId);
                const childField = child?.fields.find(f => f.id === rel.toFieldId);
                const parentField = parent?.fields.find(f => f.id === rel.fromFieldId);
                if (parent && child && childField && parentField) {
                    sql += `ALTER TABLE ${child.name} ADD CONSTRAINT FK_${child.name}_${parent.name} FOREIGN KEY (${childField.name}) REFERENCES ${parent.name}(${parentField.name});\n`;
                }
            });
        }
        
        // 3. Views (for Queries)
        sql += `\n-- Views\n`;
        queries.forEach(q => {
            if (q.type === 'SELECT') {
                const selectSql = generateSqlSelect((q as SelectQuery).nodes, (q as SelectQuery).columns, tables, relationships);
                if (selectSql) {
                    sql += `CREATE VIEW ${q.name} AS\n${selectSql};\n\n`;
                }
            }
        });

        files.push({ name: 'schema.sql', path: `${root}/schema.sql`, content: sql, language: 'sql' });
    }

    return files;
};
