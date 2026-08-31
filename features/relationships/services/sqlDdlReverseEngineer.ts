import { Table, Relationship, Field, FieldType } from '../../../types/index';

export class SqlDdlReverseEngineerService {
  /**
   * Reverse-engineers standard SQL CREATE TABLE and CONSTRAINT scripts into ER structures
   */
  public static parseSqlDdl(sqlText: string): {
    tables: Table[];
    relationships: Relationship[];
    errors: string[];
  } {
    const tables: Table[] = [];
    const relationships: Relationship[] = [];
    const errors: string[] = [];

    try {
      // 1. Remove comments
      const cleanSql = sqlText
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//gm, '');

      // 2. Extract CREATE TABLE statements
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\.)?[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s*\(([\s\S]*?)\)(?:;|\s*$)/gi;
      
      let match;
      while ((match = createTableRegex.exec(cleanSql)) !== null) {
        const schema = match[1];
        const tableName = match[2];
        const tableBody = match[3];

        const tableId = crypto.randomUUID();
        const fields: Field[] = [];
        const tableForeignKeys: Array<{
          fromColumn: string;
          targetTable: string;
          targetColumn: string;
          onDelete?: string;
          onUpdate?: string;
        }> = [];

        // Split body by top-level commas (ignoring commas inside parenthesis like DECIMAL(10,2))
        const bodyLines = this.splitSqlDefinitions(tableBody);

        bodyLines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;

          // Check Table-level Primary Key
          if (/^PRIMARY\s+KEY\s*\(/i.test(trimmed)) {
            const pkColsMatch = trimmed.match(/PRIMARY\s+KEY\s*\((.*?)\)/i);
            if (pkColsMatch) {
              const cols = pkColsMatch[1].split(',').map(c => c.replace(/[`"\[\]]/g, '').trim().toLowerCase());
              fields.forEach(f => {
                if (cols.includes(f.name.toLowerCase())) {
                  f.isPrimaryKey = true;
                }
              });
            }
            return;
          }

          // Check Table-level Foreign Key
          if (/(?:CONSTRAINT\s+[`"\[]?[a-zA-Z0-9_]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\((.*?)\)\s*REFERENCES\s+[`"\[]?([a-zA-Z0-9_]+)[`"\]]?(?:\.[`"\[]?([a-zA-Z0-9_]+)[`"\]]?)?\s*\((.*?)\)/i.test(trimmed)) {
            const fkMatch = trimmed.match(/(?:CONSTRAINT\s+[`"\[]?[a-zA-Z0-9_]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\((.*?)\)\s*REFERENCES\s+(?:[`"\[]?[a-zA-Z0-9_]+[`"\]]?\.)?[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s*\((.*?)\)(?:\s+ON\s+DELETE\s+([a-zA-Z\s]+))?(?:\s+ON\s+UPDATE\s+([a-zA-Z\s]+))?/i);
            if (fkMatch) {
              const fromCol = fkMatch[1].replace(/[`"\[\]]/g, '').trim();
              const targetTbl = fkMatch[2].replace(/[`"\[\]]/g, '').trim();
              const targetCol = fkMatch[3].replace(/[`"\[\]]/g, '').trim();
              const onDelete = fkMatch[4]?.trim().toUpperCase();
              const onUpdate = fkMatch[5]?.trim().toUpperCase();

              tableForeignKeys.push({
                fromColumn: fromCol,
                targetTable: targetTbl,
                targetColumn: targetCol,
                onDelete,
                onUpdate
              });
            }
            return;
          }

          // Check Table-level Unique Key
          if (/^UNIQUE\s*(?:KEY|INDEX)?\s*(?:[`"\[]?[a-zA-Z0-9_]+[`"\]]?\s*)?\((.*?)\)/i.test(trimmed)) {
            const uqMatch = trimmed.match(/\((.*?)\)/);
            if (uqMatch) {
              const cols = uqMatch[1].split(',').map(c => c.replace(/[`"\[\]]/g, '').trim().toLowerCase());
              fields.forEach(f => {
                if (cols.includes(f.name.toLowerCase())) {
                  f.isUnique = true;
                }
              });
            }
            return;
          }

          // Standard Column definition: `col_name` TYPE [CONSTRAINTS] [COMMENT '...']
          const colMatch = trimmed.match(/^[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)([\s\S]*)/i);
          if (colMatch) {
            const colName = colMatch[1];
            const rawType = colMatch[2].toUpperCase();
            const colConstraints = colMatch[3] || '';

            const isPk = /PRIMARY\s+KEY/i.test(colConstraints);
            const isAutoInc = /AUTO_INCREMENT|SERIAL|IDENTITY|AUTOINCREMENT/i.test(colConstraints) || /SERIAL/i.test(rawType);
            const isUnique = /UNIQUE/i.test(colConstraints);
            const isNotNull = /NOT\s+NULL/i.test(colConstraints);

            // Inline References: REFERENCES tbl(col)
            const inlineRefMatch = colConstraints.match(/REFERENCES\s+(?:[`"\[]?[a-zA-Z0-9_]+[`"\]]?\.)?[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s*\(([`"\[]?[a-zA-Z0-9_]+[`"\]]?)\)/i);
            if (inlineRefMatch) {
              tableForeignKeys.push({
                fromColumn: colName,
                targetTable: inlineRefMatch[1].replace(/[`"\[\]]/g, ''),
                targetColumn: inlineRefMatch[2].replace(/[`"\[\]]/g, '')
              });
            }

            // Comment
            const commentMatch = colConstraints.match(/COMMENT\s+['"]([^'"]+)['"]/i);
            const comment = commentMatch ? commentMatch[1] : undefined;

            fields.push({
              id: crypto.randomUUID(),
              name: colName,
              type: this.normalizeSqlType(rawType),
              isPrimaryKey: isPk,
              isAutoIncrement: isAutoInc,
              isUnique: isUnique,
              allowNull: !isNotNull,
              isNullable: !isNotNull,
              comment
            });
          }
        });

        tables.push({
          id: tableId,
          name: tableName,
          fields
        });

        // Store FKs temporarily to resolve IDs after all tables are loaded
        (tables as any)._pendingFks = (tables as any)._pendingFks || [];
        tableForeignKeys.forEach(fk => {
          (tables as any)._pendingFks.push({
            fromTableId: tableId,
            fromTableName: tableName,
            fromColumn: fk.fromColumn,
            targetTable: fk.targetTable,
            targetColumn: fk.targetColumn,
            onDelete: fk.onDelete,
            onUpdate: fk.onUpdate
          });
        });
      }

      // Also parse ALTER TABLE ADD CONSTRAINT FOREIGN KEY
      const alterFkRegex = /ALTER\s+TABLE\s+[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s+ADD\s+(?:CONSTRAINT\s+[`"\[]?[a-zA-Z0-9_]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\((.*?)\)\s*REFERENCES\s+[`"\[]?([a-zA-Z0-9_]+)[`"\]]?\s*\((.*?)\)/gi;
      let alterMatch;
      while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
        const fromTName = alterMatch[1];
        const fromCol = alterMatch[2].replace(/[`"\[\]]/g, '').trim();
        const toTName = alterMatch[3];
        const toCol = alterMatch[4].replace(/[`"\[\]]/g, '').trim();

        const fromTbl = tables.find(t => t.name.toLowerCase() === fromTName.toLowerCase());
        if (fromTbl) {
          (tables as any)._pendingFks = (tables as any)._pendingFks || [];
          (tables as any)._pendingFks.push({
            fromTableId: fromTbl.id,
            fromTableName: fromTbl.name,
            fromColumn: fromCol,
            targetTable: toTName,
            targetColumn: toCol
          });
        }
      }

      // 3. Resolve Relationships
      const pendingFks = (tables as any)._pendingFks || [];
      pendingFks.forEach((fk: any) => {
        const parentTbl = tables.find(t => t.name.toLowerCase() === fk.targetTable.toLowerCase());
        const childTbl = tables.find(t => t.id === fk.fromTableId);

        if (parentTbl && childTbl) {
          const parentFld = parentTbl.fields.find(f => f.name.toLowerCase() === fk.targetColumn.toLowerCase()) || parentTbl.fields.find(f => f.isPrimaryKey);
          const childFld = childTbl.fields.find(f => f.name.toLowerCase() === fk.fromColumn.toLowerCase());

          if (parentFld && childFld) {
            relationships.push({
              id: crypto.randomUUID(),
              fromTableId: parentTbl.id,
              fromFieldId: parentFld.id,
              toTableId: childTbl.id,
              toFieldId: childFld.id,
              fromTable: parentTbl.name,
              fromField: parentFld.name,
              toTable: childTbl.name,
              toField: childFld.name,
              type: parentFld.isPrimaryKey && childFld.isPrimaryKey ? '1:1' : '1:n',
              referentialIntegrity: true,
              onDelete: (fk.onDelete as any) || 'CASCADE',
              onUpdate: (fk.onUpdate as any) || 'CASCADE'
            });
          }
        }
      });

      delete (tables as any)._pendingFks;

      if (tables.length === 0) {
        errors.push('Keine gültigen CREATE TABLE Anweisungen im SQL-Text gefunden.');
      }

    } catch (e: any) {
      errors.push(`Fehler beim Verarbeiten des SQL-DDL-Dumps: ${e?.message || String(e)}`);
    }

    return { tables, relationships, errors };
  }

  private static splitSqlDefinitions(body: string): string[] {
    const results: string[] = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < body.length; i++) {
      const char = body[i];

      if ((char === "'" || char === '"' || char === '`') && body[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
      }

      if (!inQuotes) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          results.push(current);
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      results.push(current);
    }

    return results;
  }

  private static normalizeSqlType(rawType: string): FieldType {
    const t = rawType.toUpperCase();
    if (t.includes('INT') || t.includes('SERIAL')) return 'INTEGER';
    if (t.includes('UUID')) return 'UUID';
    if (t.includes('TEXT')) return 'TEXT';
    if (t.includes('VARCHAR') || t.includes('NVARCHAR') || t.includes('STRING')) return 'VARCHAR';
    if (t.includes('CHAR')) return 'CHAR';
    if (t.includes('DATETIME') || t.includes('TIMESTAMP')) return 'DATETIME';
    if (t.includes('DATE')) return 'DATE';
    if (t.includes('TIME')) return 'TIME';
    if (t.includes('BOOL')) return 'BOOLEAN';
    if (t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('MONEY')) return 'DECIMAL';
    if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('REAL')) return 'DOUBLE';
    if (t.includes('JSON') || t.includes('JSONB')) return 'JSON';
    if (t.includes('ENUM')) return 'ENUM';
    return 'VARCHAR';
  }
}
