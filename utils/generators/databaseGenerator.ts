
import { Table, Relationship, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType } from './common';

export const generateDatabaseScripts = (tables: Table[], relationships: Relationship[], config: BackendConfig): VirtualFile[] => {
    // Generate into a dedicated 'database' folder in the backend project
    const root = `Backend/${config.projectName}/database`;
    const files: VirtualFile[] = [];

    if (config.dbType === DbType.NoSQL) {
        // Generate JSON Schema representation for NoSQL
        // This visualizes the document structure
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

        files.push({
            name: 'collections.json',
            path: `${root}/collections.json`,
            content: JSON.stringify(schema, null, 2),
            language: 'json'
        });
    } else {
        // Generate SQL Script
        let sql = `-- Database Script for ${config.dbType}\n-- Project: ${config.projectName}\n\n`;
        
        tables.forEach(table => {
            const fields = table.fields.map(f => {
                let type = resolveType(f, 'sql');
                
                // Handle Dialect Specifics for Primary Keys / Auto Increment
                if (config.dbType === DbType.SQLite) {
                    if (f.isPrimaryKey && f.type === 'INTEGER') {
                        return `  ${f.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
                    }
                } else if (config.dbType === DbType.MySQL) {
                    if (f.isPrimaryKey && f.type === 'INTEGER') {
                        type += ' AUTO_INCREMENT';
                    }
                } else {
                    // SQL Server
                    if (f.isPrimaryKey && f.type === 'INTEGER') {
                        type += ' IDENTITY(1,1)';
                    }
                }

                let line = `  ${f.name} ${type}`;
                
                // Constraints
                if (config.dbType !== DbType.SQLite) {
                    if (f.isPrimaryKey) line += ' PRIMARY KEY';
                } else if (!f.isPrimaryKey) {
                    // SQLite handles PK inline above
                }

                if (!f.allowNull && !f.isPrimaryKey) line += ' NOT NULL';
                return line;
            }).join(',\n');

            sql += `CREATE TABLE ${table.name} (\n${fields}\n);\n\n`;
        });

        // Add Foreign Keys
        // Note: SQLite supports FKs in Create Table, but for standard visualization we append them or keep simple.
        // For MySQL/SQL Server, we add ALTER TABLE statements.
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

        files.push({
            name: 'schema.sql',
            path: `${root}/schema.sql`,
            content: sql,
            language: 'sql'
        });
    }

    return files;
};
