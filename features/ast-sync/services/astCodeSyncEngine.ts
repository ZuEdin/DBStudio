import { Table, Field, Relationship } from '../../../types';

export type CodeLanguage = 'typescript' | 'prisma' | 'sql' | 'go' | 'python';

export interface AstParsedTable {
  name: string;
  fields: AstParsedField[];
  comment?: string;
}

export interface AstParsedField {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isAutoIncrement?: boolean;
  defaultValue?: string;
  foreignKey?: {
    targetTable: string;
    targetField: string;
  };
}

export interface AstDiffItem {
  id: string;
  type: 'NEW_TABLE' | 'DROPPED_TABLE' | 'NEW_FIELD' | 'DROPPED_FIELD' | 'MODIFIED_TYPE' | 'MODIFIED_NULLABILITY' | 'MODIFIED_PK';
  tableName: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  severity: 'info' | 'warning' | 'breaking';
  description: string;
  selected: boolean;
}

export class AstCodeSyncEngine {
  /**
   * Parse code into standard AST tables based on language
   */
  public static parseCode(code: string, language: CodeLanguage): AstParsedTable[] {
    switch (language) {
      case 'typescript':
        return this.parseTypeScript(code);
      case 'prisma':
        return this.parsePrisma(code);
      case 'sql':
        return this.parseSql(code);
      case 'go':
        return this.parseGo(code);
      case 'python':
        return this.parsePython(code);
      default:
        return [];
    }
  }

  /**
   * 1. TypeScript Interface / Type Parser
   */
  private static parseTypeScript(code: string): AstParsedTable[] {
    const tables: AstParsedTable[] = [];
    const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)(?:\s*=\s*\{|\s*\{)([\s\S]*?)\}/g;
    let match;

    while ((match = interfaceRegex.exec(code)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const fields: AstParsedField[] = [];

      const lines = body.split('\n');
      for (const line of lines) {
        const fieldMatch = /^\s*([A-Za-z0-9_]+)(\?)?:\s*([^;]+);?/.exec(line.trim());
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const isOptional = !!fieldMatch[2];
          let rawType = fieldMatch[3].trim();
          let isNullable = isOptional || rawType.includes('null') || rawType.includes('undefined');

          let mappedType = 'VARCHAR';
          if (rawType.startsWith('number')) mappedType = 'INTEGER';
          else if (rawType.startsWith('boolean')) mappedType = 'BOOLEAN';
          else if (rawType.startsWith('Date')) mappedType = 'DATETIME';
          else if (rawType.includes('[]') || rawType.startsWith('Array')) mappedType = 'JSON';

          fields.push({
            name: fieldName,
            type: mappedType,
            isNullable,
            isPrimaryKey: fieldName.toLowerCase() === 'id' || fieldName.toLowerCase() === `${tableName.toLowerCase()}id`
          });
        }
      }

      if (fields.length > 0) {
        tables.push({ name: tableName, fields });
      }
    }

    return tables;
  }

  /**
   * 2. Prisma Schema Parser
   */
  private static parsePrisma(code: string): AstParsedTable[] {
    const tables: AstParsedTable[] = [];
    const modelRegex = /model\s+([A-Za-z0-9_]+)\s+\{([\s\S]*?)\}/g;
    let match;

    while ((match = modelRegex.exec(code)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const fields: AstParsedField[] = [];

      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0];
          const typeStr = parts[1];
          const isOptional = typeStr.endsWith('?');
          const isPk = trimmed.includes('@id');
          const isAutoInc = trimmed.includes('@default(autoincrement())');

          let mappedType = 'VARCHAR';
          const cleanType = typeStr.replace('?', '').replace('[]', '');

          if (cleanType === 'Int' || cleanType === 'BigInt') mappedType = 'INTEGER';
          else if (cleanType === 'Float' || cleanType === 'Decimal') mappedType = 'DECIMAL';
          else if (cleanType === 'Boolean') mappedType = 'BOOLEAN';
          else if (cleanType === 'DateTime') mappedType = 'DATETIME';
          else if (cleanType === 'Json') mappedType = 'JSON';

          fields.push({
            name: fieldName,
            type: mappedType,
            isNullable: isOptional,
            isPrimaryKey: isPk,
            isAutoIncrement: isAutoInc
          });
        }
      }

      if (fields.length > 0) {
        tables.push({ name: tableName, fields });
      }
    }

    return tables;
  }

  /**
   * 3. SQL DDL Parser
   */
  private static parseSql(code: string): AstParsedTable[] {
    const tables: AstParsedTable[] = [];
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = tableRegex.exec(code)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const fields: AstParsedField[] = [];

      const lines = body.split(',');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.toUpperCase().startsWith('PRIMARY KEY') || trimmed.toUpperCase().startsWith('FOREIGN KEY') || trimmed.toUpperCase().startsWith('CONSTRAINT')) {
          continue;
        }

        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0].replace(/["`]/g, '');
          const typeStr = parts[1].toUpperCase();
          const upperLine = trimmed.toUpperCase();

          let mappedType = 'VARCHAR';
          if (typeStr.includes('INT') || typeStr.includes('SERIAL')) mappedType = 'INTEGER';
          else if (typeStr.includes('DECIMAL') || typeStr.includes('NUMERIC') || typeStr.includes('FLOAT') || typeStr.includes('DOUBLE')) mappedType = 'DECIMAL';
          else if (typeStr.includes('BOOL')) mappedType = 'BOOLEAN';
          else if (typeStr.includes('DATE') || typeStr.includes('TIME')) mappedType = 'DATETIME';
          else if (typeStr.includes('JSON')) mappedType = 'JSON';
          else if (typeStr.includes('TEXT')) mappedType = 'TEXT';

          fields.push({
            name: fieldName,
            type: mappedType,
            isPrimaryKey: upperLine.includes('PRIMARY KEY'),
            isNullable: !upperLine.includes('NOT NULL'),
            isAutoIncrement: upperLine.includes('SERIAL') || upperLine.includes('AUTO_INCREMENT') || upperLine.includes('IDENTITY')
          });
        }
      }

      if (fields.length > 0) {
        tables.push({ name: tableName, fields });
      }
    }

    return tables;
  }

  /**
   * 4. Go GORM Parser
   */
  private static parseGo(code: string): AstParsedTable[] {
    const tables: AstParsedTable[] = [];
    const structRegex = /type\s+([A-Za-z0-9_]+)\s+struct\s+\{([\s\S]*?)\}/g;
    let match;

    while ((match = structRegex.exec(code)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const fields: AstParsedField[] = [];

      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;

        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0];
          const typeStr = parts[1];
          const tag = trimmed.slice(trimmed.indexOf('`'));

          let mappedType = 'VARCHAR';
          if (typeStr.includes('int') || typeStr.includes('uint')) mappedType = 'INTEGER';
          else if (typeStr.includes('float')) mappedType = 'DECIMAL';
          else if (typeStr.includes('bool')) mappedType = 'BOOLEAN';
          else if (typeStr.includes('Time')) mappedType = 'DATETIME';

          const isPk = tag.includes('primaryKey') || fieldName.toLowerCase() === 'id';
          const isNullable = typeStr.startsWith('*');

          fields.push({
            name: fieldName,
            type: mappedType,
            isPrimaryKey: isPk,
            isNullable
          });
        }
      }

      if (fields.length > 0) {
        tables.push({ name: tableName, fields });
      }
    }

    return tables;
  }

  /**
   * 5. Python SQLAlchemy / Pydantic Parser
   */
  private static parsePython(code: string): AstParsedTable[] {
    const tables: AstParsedTable[] = [];
    const classRegex = /class\s+([A-Za-z0-9_]+)\s*(?:\([^)]*\))?:\s*([\s\S]*?)(?=(?:\nclass\s+|\n\S|\$))/g;
    let match;

    while ((match = classRegex.exec(code)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const fields: AstParsedField[] = [];

      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.includes('Column(') || trimmed.includes(':')) {
          const colonIdx = trimmed.indexOf(':');
          const eqIdx = trimmed.indexOf('=');
          let fieldName = '';
          let rawType = '';

          if (colonIdx > 0 && (eqIdx === -1 || colonIdx < eqIdx)) {
            fieldName = trimmed.substring(0, colonIdx).trim();
            rawType = trimmed.substring(colonIdx + 1).split('=')[0].trim();
          } else if (eqIdx > 0) {
            fieldName = trimmed.substring(0, eqIdx).trim();
            rawType = trimmed.substring(eqIdx + 1).trim();
          }

          if (fieldName && fieldName !== '__tablename__') {
            let mappedType = 'VARCHAR';
            if (rawType.includes('int') || rawType.includes('Integer')) mappedType = 'INTEGER';
            else if (rawType.includes('float') || rawType.includes('Float') || rawType.includes('Numeric')) mappedType = 'DECIMAL';
            else if (rawType.includes('bool') || rawType.includes('Boolean')) mappedType = 'BOOLEAN';
            else if (rawType.includes('datetime') || rawType.includes('DateTime')) mappedType = 'DATETIME';

            fields.push({
              name: fieldName,
              type: mappedType,
              isPrimaryKey: trimmed.includes('primary_key=True') || fieldName.toLowerCase() === 'id',
              isNullable: trimmed.includes('Optional[') || trimmed.includes('nullable=True')
            });
          }
        }
      }

      if (fields.length > 0) {
        tables.push({ name: tableName, fields });
      }
    }

    return tables;
  }

  /**
   * Compare parsed AST against DB Studio current tables
   */
  public static calculateAstDiff(currentTables: Table[], parsedTables: AstParsedTable[]): AstDiffItem[] {
    const diffs: AstDiffItem[] = [];

    for (const parsed of parsedTables) {
      const existingTable = currentTables.find(
        t => t.name.toLowerCase() === parsed.name.toLowerCase()
      );

      if (!existingTable) {
        diffs.push({
          id: `diff_new_tbl_${parsed.name}`,
          type: 'NEW_TABLE',
          tableName: parsed.name,
          newValue: `${parsed.fields.length} Spalten`,
          severity: 'info',
          description: `Neue Tabelle "${parsed.name}" im Quellcode gefunden.`,
          selected: true
        });
      } else {
        // Compare fields
        for (const pField of parsed.fields) {
          const existingField = existingTable.fields.find(
            f => f.name.toLowerCase() === pField.name.toLowerCase()
          );

          if (!existingField) {
            diffs.push({
              id: `diff_new_fld_${existingTable.name}_${pField.name}`,
              type: 'NEW_FIELD',
              tableName: existingTable.name,
              fieldName: pField.name,
              newValue: pField.type,
              severity: 'info',
              description: `Neue Spalte "${pField.name}" (${pField.type}) in Tabelle "${existingTable.name}" hinzugefügt.`,
              selected: true
            });
          } else {
            // Check Type Diff
            if (existingField.type !== pField.type) {
              diffs.push({
                id: `diff_type_${existingTable.name}_${pField.name}`,
                type: 'MODIFIED_TYPE',
                tableName: existingTable.name,
                fieldName: pField.name,
                oldValue: existingField.type,
                newValue: pField.type,
                severity: 'warning',
                description: `Datentyp von "${existingTable.name}.${pField.name}" geändert: ${existingField.type} ➔ ${pField.type}.`,
                selected: true
              });
            }

            // Check Nullability Diff
            if (pField.isNullable !== undefined && existingField.allowNull !== pField.isNullable) {
              diffs.push({
                id: `diff_null_${existingTable.name}_${pField.name}`,
                type: 'MODIFIED_NULLABILITY',
                tableName: existingTable.name,
                fieldName: pField.name,
                oldValue: existingField.allowNull ? 'NULL' : 'NOT NULL',
                newValue: pField.isNullable ? 'NULL' : 'NOT NULL',
                severity: 'info',
                description: `Nullability von "${existingTable.name}.${pField.name}" geändert.`,
                selected: true
              });
            }
          }
        }
      }
    }

    return diffs;
  }

  /**
   * Apply selected diffs back into the DB Studio project tables
   */
  public static applyDiffToTables(
    currentTables: Table[],
    parsedTables: AstParsedTable[],
    diffs: AstDiffItem[]
  ): Table[] {
    const activeDiffIds = new Set(diffs.filter(d => d.selected).map(d => d.id));
    const newTables = JSON.parse(JSON.stringify(currentTables)) as Table[];

    for (const parsed of parsedTables) {
      let targetTable = newTables.find(t => t.name.toLowerCase() === parsed.name.toLowerCase());

      if (!targetTable && activeDiffIds.has(`diff_new_tbl_${parsed.name}`)) {
        targetTable = {
          id: `tbl_${parsed.name.toLowerCase()}_${Date.now().toString(36)}`,
          name: parsed.name,
          fields: parsed.fields.map(f => ({
            id: `fld_${f.name.toLowerCase()}`,
            name: f.name,
            type: f.type as any,
            isPrimaryKey: !!f.isPrimaryKey,
            allowNull: f.isNullable !== false,
            isAutoIncrement: !!f.isAutoIncrement
          })),
          data: []
        };
        newTables.push(targetTable);
      } else if (targetTable) {
        for (const pField of parsed.fields) {
          const fieldDiffId = `diff_new_fld_${targetTable.name}_${pField.name}`;
          const typeDiffId = `diff_type_${targetTable.name}_${pField.name}`;
          const nullDiffId = `diff_null_${targetTable.name}_${pField.name}`;

          const existingField = targetTable.fields.find(f => f.name.toLowerCase() === pField.name.toLowerCase());

          if (!existingField && activeDiffIds.has(fieldDiffId)) {
            targetTable.fields.push({
              id: `fld_${pField.name.toLowerCase()}`,
              name: pField.name,
              type: pField.type as any,
              isPrimaryKey: !!pField.isPrimaryKey,
              allowNull: pField.isNullable !== false,
              isAutoIncrement: !!pField.isAutoIncrement
            });
          } else if (existingField) {
            if (activeDiffIds.has(typeDiffId)) {
              existingField.type = pField.type as any;
            }
            if (activeDiffIds.has(nullDiffId)) {
              existingField.allowNull = !!pField.isNullable;
            }
          }
        }
      }
    }

    return newTables;
  }
}
