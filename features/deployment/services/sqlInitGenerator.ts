import { Table, Relationship } from '../../../types';
import { DockerStackConfig, GeneratedDeploymentFile } from '../types';

export class SqlInitGenerator {
  public static generateDatabaseInitScript(
    config: DockerStackConfig,
    tables: Table[],
    relationships: Relationship[]
  ): GeneratedDeploymentFile {
    const isPostgres = config.dbEngine === 'postgres';
    const isMysql = config.dbEngine === 'mysql';
    const isMssql = config.dbEngine === 'mssql';

    let sql = `-- ==========================================================
-- Auto-Generated Database Bootstrap & Seed Script
-- Project: ${config.projectName}
-- Engine: ${config.dbEngine.toUpperCase()}
-- Generated: ${new Date().toISOString()}
-- ==========================================================

`;

    if (isPostgres) {
      sql += `-- Enable UUID and Trigram Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

`;
    }

    // 1. Table DDLs
    for (const table of tables) {
      const sanitizedTableName = table.name.replace(/[^a-zA-Z0-9_]/g, '_');
      sql += `-- Table: ${table.name}\n`;
      sql += `CREATE TABLE IF NOT EXISTS "${sanitizedTableName}" (\n`;

      const columnDefs: string[] = [];
      const pkCols: string[] = [];

      for (const field of table.fields) {
        const colName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
        let colType = 'VARCHAR(255)';

        if (isPostgres) {
          switch (field.type) {
            case 'INTEGER': colType = 'INTEGER'; break;
            case 'DECIMAL': colType = 'NUMERIC(15,2)'; break;
            case 'BOOLEAN': colType = 'BOOLEAN'; break;
            case 'DATE': colType = 'DATE'; break;
            case 'DATETIME': colType = 'TIMESTAMPTZ'; break;
            case 'JSON': colType = 'JSONB'; break;
            default: colType = 'TEXT'; break;
          }
        } else if (isMysql) {
          switch (field.type) {
            case 'INTEGER': colType = 'INT'; break;
            case 'DECIMAL': colType = 'DECIMAL(15,2)'; break;
            case 'BOOLEAN': colType = 'TINYINT(1)'; break;
            case 'DATE': colType = 'DATE'; break;
            case 'DATETIME': colType = 'DATETIME'; break;
            case 'JSON': colType = 'JSON'; break;
            default: colType = 'VARCHAR(255)'; break;
          }
        } else {
          // Default SQL / MSSQL
          switch (field.type) {
            case 'INTEGER': colType = 'INT'; break;
            case 'DECIMAL': colType = 'DECIMAL(18,2)'; break;
            case 'BOOLEAN': colType = 'BIT'; break;
            case 'DATE': colType = 'DATE'; break;
            case 'DATETIME': colType = 'DATETIME2'; break;
            default: colType = 'NVARCHAR(MAX)'; break;
          }
        }

        let def = `  "${colName}" ${colType}`;
        if (field.isPrimaryKey) {
          pkCols.push(`"${colName}"`);
        }
        if (field.isNullable === false) {
          def += ' NOT NULL';
        }
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
          def += ` DEFAULT '${field.defaultValue}'`;
        }

        columnDefs.push(def);
      }

      if (pkCols.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }

      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';

      // Create helpful indexes for search fields
      for (const field of table.fields) {
        if (field.isIndexed || field.isUnique) {
          const colName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
          sql += `CREATE INDEX IF NOT EXISTS "idx_${sanitizedTableName}_${colName}" ON "${sanitizedTableName}" ("${colName}");\n`;
        }
      }
      sql += '\n';
    }

    // 2. Foreign Key Constraints
    if (relationships && relationships.length > 0) {
      sql += `-- Foreign Key Constraints\n`;
      relationships.forEach((rel, idx) => {
        const fromTable = tables.find(t => t.id === rel.fromTableId);
        const toTable = tables.find(t => t.id === rel.toTableId);
        const fromField = fromTable?.fields.find(f => f.id === rel.fromFieldId);
        const toField = toTable?.fields.find(f => f.id === rel.toFieldId);

        if (fromTable && toTable && fromField && toField) {
          const fromTName = fromTable.name.replace(/[^a-zA-Z0-9_]/g, '_');
          const toTName = toTable.name.replace(/[^a-zA-Z0-9_]/g, '_');
          const fromFName = fromField.name.replace(/[^a-zA-Z0-9_]/g, '_');
          const toFName = toField.name.replace(/[^a-zA-Z0-9_]/g, '_');
          
          sql += `ALTER TABLE "${fromTName}" ADD CONSTRAINT "fk_${fromTName}_${fromFName}_${idx}" FOREIGN KEY ("${fromFName}") REFERENCES "${toTName}" ("${toFName}") ON DELETE SET NULL;\n`;
        }
      });
      sql += '\n';
    }

    // 3. Seed Data
    if (config.enableSeedData) {
      sql += `-- Initial Seed Data\n`;
      for (const table of tables) {
        if (table.data && table.data.length > 0) {
          const sanitizedTableName = table.name.replace(/[^a-zA-Z0-9_]/g, '_');
          const sampleRows = table.data.slice(0, 10);
          
          for (const row of sampleRows) {
            const cols: string[] = [];
            const vals: string[] = [];

            for (const field of table.fields) {
              const colName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
              const val = row[field.name] ?? row[field.id];
              
              if (val !== undefined && val !== null) {
                cols.push(`"${colName}"`);
                if (typeof val === 'number') {
                  vals.push(`${val}`);
                } else if (typeof val === 'boolean') {
                  vals.push(val ? 'TRUE' : 'FALSE');
                } else {
                  vals.push(`'${String(val).replace(/'/g, "''")}'`);
                }
              }
            }

            if (cols.length > 0) {
              sql += `INSERT INTO "${sanitizedTableName}" (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            }
          }
          sql += '\n';
        }
      }
    }

    return {
      name: 'init.sql',
      path: 'docker/initdb/01_init.sql',
      language: 'sql',
      content: sql,
      description: `Automatisches Datenbank-Bootstrap-Skript mit DDL & Beispieldaten für ${config.dbEngine.toUpperCase()}`,
      category: 'database'
    };
  }
}
