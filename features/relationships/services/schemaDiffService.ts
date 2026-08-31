import { Table, Relationship, Field } from '../../../types/index';
import { SchemaDiffItem } from '../types/erDesignerTypes';

export class SchemaDiffService {
  /**
   * Compares an original snapshot (Old State) with the Current tables and relationships (New State)
   */
  public static compareSchemas(
    oldTables: Table[],
    oldRelationships: Relationship[],
    newTables: Table[],
    newRelationships: Relationship[]
  ): SchemaDiffItem[] {
    const diffs: SchemaDiffItem[] = [];

    // 1. Check for Added Tables
    newTables.forEach(newT => {
      const oldT = oldTables.find(t => t.id === newT.id || t.name.toLowerCase() === newT.name.toLowerCase());
      if (!oldT) {
        diffs.push({
          id: `tbl-add-${newT.id}`,
          type: 'table_added',
          target: newT.name,
          tableName: newT.name,
          details: `Neue Tabelle "${newT.name}" mit ${newT.fields.length} Spalten hinzugefügt.`,
          upSql: {
            sqlite: this.generateCreateTableSql(newT, 'sqlite'),
            postgres: this.generateCreateTableSql(newT, 'postgres'),
            mysql: this.generateCreateTableSql(newT, 'mysql')
          },
          downSql: {
            sqlite: `DROP TABLE IF EXISTS "${newT.name}";`,
            postgres: `DROP TABLE IF EXISTS "${newT.name}" CASCADE;`,
            mysql: `DROP TABLE IF EXISTS \`${newT.name}\`;`
          }
        });
      }
    });

    // 2. Check for Removed Tables
    oldTables.forEach(oldT => {
      const newT = newTables.find(t => t.id === oldT.id || t.name.toLowerCase() === oldT.name.toLowerCase());
      if (!newT) {
        diffs.push({
          id: `tbl-rem-${oldT.id}`,
          type: 'table_removed',
          target: oldT.name,
          tableName: oldT.name,
          details: `Tabelle "${oldT.name}" wurde entfernt.`,
          upSql: {
            sqlite: `DROP TABLE IF EXISTS "${oldT.name}";`,
            postgres: `DROP TABLE IF EXISTS "${oldT.name}" CASCADE;`,
            mysql: `DROP TABLE IF EXISTS \`${oldT.name}\`;`
          },
          downSql: {
            sqlite: this.generateCreateTableSql(oldT, 'sqlite'),
            postgres: this.generateCreateTableSql(oldT, 'postgres'),
            mysql: this.generateCreateTableSql(oldT, 'mysql')
          }
        });
      }
    });

    // 3. Check for Field Changes within existing tables
    newTables.forEach(newT => {
      const oldT = oldTables.find(t => t.id === newT.id || t.name.toLowerCase() === newT.name.toLowerCase());
      if (!oldT) return;

      // Added Fields
      newT.fields.forEach(newF => {
        const oldF = oldT.fields.find(f => f.id === newF.id || f.name.toLowerCase() === newF.name.toLowerCase());
        if (!oldF) {
          diffs.push({
            id: `fld-add-${newT.id}-${newF.id}`,
            type: 'field_added',
            target: `${newT.name}.${newF.name}`,
            tableName: newT.name,
            details: `Neue Spalte "${newF.name}" (${newF.type}) zu "${newT.name}" hinzugefügt.`,
            upSql: {
              sqlite: `ALTER TABLE "${newT.name}" ADD COLUMN "${newF.name}" ${this.mapType(newF.type, 'sqlite')};`,
              postgres: `ALTER TABLE "${newT.name}" ADD COLUMN "${newF.name}" ${this.mapType(newF.type, 'postgres')};`,
              mysql: `ALTER TABLE \`${newT.name}\` ADD COLUMN \`${newF.name}\` ${this.mapType(newF.type, 'mysql')};`
            },
            downSql: {
              sqlite: `-- SQLite does not support DROP COLUMN in older versions. Recreate table if necessary.\nALTER TABLE "${newT.name}" DROP COLUMN "${newF.name}";`,
              postgres: `ALTER TABLE "${newT.name}" DROP COLUMN IF EXISTS "${newF.name}";`,
              mysql: `ALTER TABLE \`${newT.name}\` DROP COLUMN \`${newF.name}\`;`
            }
          });
        } else if (oldF.type !== newF.type || oldF.isNullable !== newF.isNullable) {
          // Modified Field
          diffs.push({
            id: `fld-mod-${newT.id}-${newF.id}`,
            type: 'field_modified',
            target: `${newT.name}.${newF.name}`,
            tableName: newT.name,
            details: `Spaltentyp geändert von ${oldF.type} zu ${newF.type}.`,
            upSql: {
              sqlite: `-- SQLite type change requires table recreation\n-- ALTER TABLE "${newT.name}" ...`,
              postgres: `ALTER TABLE "${newT.name}" ALTER COLUMN "${newF.name}" TYPE ${this.mapType(newF.type, 'postgres')};`,
              mysql: `ALTER TABLE \`${newT.name}\` MODIFY COLUMN \`${newF.name}\` ${this.mapType(newF.type, 'mysql')};`
            },
            downSql: {
              sqlite: `-- Reverse SQLite column change`,
              postgres: `ALTER TABLE "${newT.name}" ALTER COLUMN "${newF.name}" TYPE ${this.mapType(oldF.type, 'postgres')};`,
              mysql: `ALTER TABLE \`${newT.name}\` MODIFY COLUMN \`${newF.name}\` ${this.mapType(oldF.type, 'mysql')};`
            }
          });
        }
      });

      // Removed Fields
      oldT.fields.forEach(oldF => {
        const newF = newT.fields.find(f => f.id === oldF.id || f.name.toLowerCase() === oldF.name.toLowerCase());
        if (!newF) {
          diffs.push({
            id: `fld-rem-${oldT.id}-${oldF.id}`,
            type: 'field_removed',
            target: `${oldT.name}.${oldF.name}`,
            tableName: oldT.name,
            details: `Spalte "${oldF.name}" aus "${oldT.name}" gelöscht.`,
            upSql: {
              sqlite: `ALTER TABLE "${oldT.name}" DROP COLUMN "${oldF.name}";`,
              postgres: `ALTER TABLE "${oldT.name}" DROP COLUMN IF EXISTS "${oldF.name}";`,
              mysql: `ALTER TABLE \`${oldT.name}\` DROP COLUMN \`${oldF.name}\`;`
            },
            downSql: {
              sqlite: `ALTER TABLE "${oldT.name}" ADD COLUMN "${oldF.name}" ${this.mapType(oldF.type, 'sqlite')};`,
              postgres: `ALTER TABLE "${oldT.name}" ADD COLUMN "${oldF.name}" ${this.mapType(oldF.type, 'postgres')};`,
              mysql: `ALTER TABLE \`${oldT.name}\` ADD COLUMN \`${oldF.name}\` ${this.mapType(oldF.type, 'mysql')};`
            }
          });
        }
      });
    });

    return diffs;
  }

  /**
   * Generates a complete UP and DOWN migration script
   */
  public static generateMigrationScript(diffs: SchemaDiffItem[], dialect: 'sqlite' | 'postgres' | 'mysql'): {
    upScript: string;
    downScript: string;
  } {
    const upLines: string[] = [
      `-- ==========================================================`,
      `-- MIGRATION UP SCRIPT (${dialect.toUpperCase()})`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- ==========================================================\n`
    ];

    const downLines: string[] = [
      `-- ==========================================================`,
      `-- MIGRATION DOWN (ROLLBACK) SCRIPT (${dialect.toUpperCase()})`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- ==========================================================\n`
    ];

    diffs.forEach(diff => {
      upLines.push(`-- [${diff.type}] ${diff.details}`);
      upLines.push(diff.upSql[dialect] + '\n');

      downLines.push(`-- [Rollback ${diff.type}] ${diff.details}`);
      downLines.push(diff.downSql[dialect] + '\n');
    });

    return {
      upScript: upLines.join('\n'),
      downScript: downLines.join('\n')
    };
  }

  private static generateCreateTableSql(table: Table, dialect: 'sqlite' | 'postgres' | 'mysql'): string {
    const lines: string[] = [];
    const pkFields = table.fields.filter(f => f.isPrimaryKey).map(f => f.name);

    table.fields.forEach(f => {
      let colDef = dialect === 'mysql' ? `  \`${f.name}\` ` : `  "${f.name}" `;
      colDef += this.mapType(f.type, dialect);
      if (f.isPrimaryKey && pkFields.length === 1) {
        if (dialect === 'postgres' && (f.type === 'INTEGER' || f.type === 'INT' || f.type === 'BIGINT')) {
          colDef = `  "${f.name}" BIGSERIAL PRIMARY KEY`;
        } else if (dialect === 'sqlite' && (f.type === 'INTEGER' || f.type === 'INT')) {
          colDef += ' PRIMARY KEY AUTOINCREMENT';
        } else if (dialect === 'mysql') {
          colDef += ' PRIMARY KEY' + (f.isAutoIncrement ? ' AUTO_INCREMENT' : '');
        } else {
          colDef += ' PRIMARY KEY';
        }
      }
      if (f.isNullable === false || f.allowNull === false) {
        colDef += ' NOT NULL';
      }
      lines.push(colDef);
    });

    if (pkFields.length > 1) {
      const formattedPks = pkFields.map(p => dialect === 'mysql' ? `\`${p}\`` : `"${p}"`).join(', ');
      lines.push(`  PRIMARY KEY (${formattedPks})`);
    }

    const quote = dialect === 'mysql' ? '`' : '"';
    return `CREATE TABLE IF NOT EXISTS ${quote}${table.name}${quote} (\n${lines.join(',\n')}\n);`;
  }

  private static mapType(type: string, dialect: 'sqlite' | 'postgres' | 'mysql'): string {
    const t = (type || 'VARCHAR').toUpperCase();
    if (t === 'UUID') return dialect === 'postgres' ? 'UUID' : 'VARCHAR(36)';
    if (t === 'INTEGER' || t === 'INT' || t === 'ID') return 'INTEGER';
    if (t === 'BIGINT') return 'BIGINT';
    if (t === 'TEXT') return 'TEXT';
    if (t === 'BOOLEAN') return dialect === 'sqlite' ? 'INTEGER' : (dialect === 'mysql' ? 'TINYINT(1)' : 'BOOLEAN');
    if (t === 'DATE') return 'DATE';
    if (t === 'DATETIME' || t === 'TIMESTAMP') return dialect === 'postgres' ? 'TIMESTAMP WITH TIME ZONE' : 'DATETIME';
    if (t === 'DECIMAL' || t === 'CURRENCY') return 'DECIMAL(14, 2)';
    if (t === 'DOUBLE' || t === 'FLOAT' || t === 'REAL') return 'DOUBLE PRECISION';
    if (t === 'JSON') return dialect === 'postgres' ? 'JSONB' : (dialect === 'mysql' ? 'JSON' : 'TEXT');
    return 'VARCHAR(255)';
  }
}
