

import { Table, Relationship, Field, DbType } from '../../types/index';
import { DATA_TYPES } from '../../config/dataTypes';

export const toSubformSuffix = (id: string) => {
    if (!id) return '';
    return id.replace(/^sub_field_/, '').replace(/^sub_/, '').replace(/^field_/, '').replace(/[^a-zA-Z0-9_]/g, '_');
};

export const isNullable = (field: Field | undefined | null) => field ? (field.allowNull !== false && !field.isPrimaryKey) : true;

/**
 * Returns the definitive Primary Key field for a table.
 * If no field is explicitly flagged with isPrimaryKey: true, it intelligently infers
 * the PK from auto-increment, ID names, relationships, unique flags, or falls back safely to the first field.
 */
export const getEffectivePrimaryKey = (table: Table, relationships?: Relationship[]): Field => {
    if (!table || !table.fields || table.fields.length === 0) {
        return { id: 'id', name: 'Id', type: 'INTEGER', isPrimaryKey: true };
    }

    // 1. Explicitly marked primary key
    const explicitPk = table.fields.find(f => f.isPrimaryKey);
    if (explicitPk) return explicitPk;

    // 2. Auto-increment field
    const autoInc = table.fields.find(f => f.isAutoIncrement);
    if (autoInc) return autoInc;

    // 3. Exact matches for 'id' / 'Id' / 'ID' / '<TableName>Id' / '<TableName>_Id' / '<TableName>Nr'
    const lowerTableName = (table.name || '').toLowerCase();
    const idField = table.fields.find(f => {
        const lower = (f.name || '').toLowerCase();
        return lower === 'id' || 
               lower === `${lowerTableName}id` || 
               lower === `${lowerTableName}_id` ||
               lower === `${lowerTableName}nr` ||
               lower === `${lowerTableName}_nr` ||
               lower === `${lowerTableName}nummer` ||
               lower === `${lowerTableName}_nummer`;
    });
    if (idField) return idField;

    // 4. Source field in a relationship where this table is the parent/referenced table
    if (relationships && relationships.length > 0) {
        const rel = relationships.find(r => r.fromTableId === table.id || (r as any).sourceTableId === table.id);
        if (rel) {
            const fromFieldId = rel.fromFieldId || (rel as any).sourceFieldId;
            const fromField = table.fields.find(f => f.id === fromFieldId || f.name.toLowerCase() === (fromFieldId || '').toLowerCase());
            if (fromField) return fromField;
        }
    }

    // 5. Field ending with id / nr / nummer / code / key
    const suffixField = table.fields.find(f => {
        const lower = (f.name || '').toLowerCase();
        return lower.endsWith('id') || 
               lower.endsWith('_id') || 
               lower.endsWith('nr') || 
               lower.endsWith('_nr') || 
               lower.endsWith('nummer') || 
               lower.endsWith('_nummer') || 
               lower.endsWith('code') || 
               lower.endsWith('_code') || 
               lower.endsWith('key') ||
               lower.endsWith('_key');
    });
    if (suffixField) return suffixField;

    // 6. Field with exact same name as table (e.g. table "Kategorie", field "Kategorie")
    const sameNameField = table.fields.find(f => (f.name || '').toLowerCase() === lowerTableName);
    if (sameNameField) return sameNameField;

    // 7. Unique or Indexed field
    const uniqueField = table.fields.find(f => f.isUnique || f.isIndexed);
    if (uniqueField) return uniqueField;

    // 8. Fallback to first field
    return table.fields[0];
};

/**
 * Checks if a specific field serves as the Primary Key of a table.
 */
export const isTablePrimaryKey = (table: Table, field: Field, relationships?: Relationship[]): boolean => {
    if (!field) return false;
    if (field.isPrimaryKey) return true;
    if (table.fields.some(f => f.isPrimaryKey)) return false; // Another field is explicitly marked as PK
    const effectivePk = getEffectivePrimaryKey(table, relationships);
    return effectivePk?.id === field.id || effectivePk?.name === field.name;
};

/**
 * Normalizes any database type string (case-insensitive, aliases) to the strict DbType enum.
 */
export const normalizeDbType = (dbType: any): DbType => {
    if (!dbType) return DbType.SQL;
    const str = String(dbType).trim().toUpperCase();
    if (str === 'SQLITE' || str === 'SQLITE3') return DbType.SQLite;
    if (str === 'MYSQL' || str === 'MARIADB') return DbType.MySQL;
    if (str === 'POSTGRESQL' || str === 'POSTGRES' || str === 'PGSQL') return DbType.PostgreSQL;
    if (str === 'NOSQL' || str === 'MONGO' || str === 'MONGODB') return DbType.NoSQL;
    // SQL Server / MSSQL
    return DbType.SQL;
};

export const isSqlServer = (dbType: any): boolean => normalizeDbType(dbType) === DbType.SQL;
export const isSqlite = (dbType: any): boolean => normalizeDbType(dbType) === DbType.SQLite;
export const isMySql = (dbType: any): boolean => normalizeDbType(dbType) === DbType.MySQL;
export const isPostgreSql = (dbType: any): boolean => normalizeDbType(dbType) === DbType.PostgreSQL;

export const resolveType = (field: Field | undefined | null, language: 'csharp' | 'sequelize' | 'typescript' | 'sql', dbType?: DbType | string) => {
    const normalizedDb = normalizeDbType(dbType);
    if (!field || !field.type) {
        if (language === 'csharp') return 'int';
        if (language === 'typescript') return 'number';
        if (language === 'sequelize') return 'DataTypes.INTEGER';
        return 'INT';
    }
    const config = DATA_TYPES[field.type];
    if (!config) {
        if (language === 'csharp') return 'string';
        if (language === 'typescript') return 'string';
        if (language === 'sequelize') return 'DataTypes.STRING';
        return 'VARCHAR(255)';
    }

    const mapping = config.mappings[language];
    if (!mapping) return 'string';
    if (typeof mapping === 'string') return mapping;
    
    const typeGen = (mapping as any).type;
    
    if (typeof typeGen === 'function') {
        return typeGen({ length: field.length, precision: field.precision, scale: field.scale, enumValues: field.enumValues, field, dbType: normalizedDb });
    }
    return typeGen || 'string';
};

// String Helpers

// Helper to replace German umlauts with ASCII equivalents
const normalizeString = (str: any) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/Ä/g, 'Ae')
        .replace(/Ö/g, 'Oe')
        .replace(/Ü/g, 'Ue');
};

export const toPascalCase = (str: any) => {
  if (!str || typeof str !== 'string') return '';
  // 1. Transliterate Umlauts
  let clean = normalizeString(str);
  
  // 2. Treat underscores and dashes as separators (replace with space)
  clean = clean.replace(/[_-]/g, ' ');
  
  // 3. Remove all other non-alphanumeric characters (keeping spaces for splitting)
  clean = clean.replace(/[^a-zA-Z0-9 ]/g, ''); 
  
  // 4. Capitalize each word and join
  return clean.split(' ')
    .filter(word => word && word.length > 0) // Remove empty strings
    .map(word => (word.charAt(0) ? word.charAt(0).toUpperCase() : '') + word.slice(1))
    .join('');
};

export const toCamelCase = (str: any) => {
  const pascal = toPascalCase(str);
  if (!pascal) return '';
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const toKebabCase = (str: any) => {
    if (!str || typeof str !== 'string') return '';
    let clean = normalizeString(str);
    
    // Handle existing CamelCase to kebab (e.g., "MyField" -> "My-Field")
    clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
    
    // Replace spaces and underscores with dashes
    clean = clean.replace(/[\s_]+/g, '-');
    
    // Remove anything that isn't a letter, number, or dash
    clean = clean.replace(/[^a-zA-Z0-9-]/g, '');
    
    return clean.toLowerCase();
};

export const toSnakeCase = (str: any) => {
    if (!str || typeof str !== 'string') return '';
    return toPascalCase(str)
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
};

export const quoteIdentifier = (name: string, dbType?: DbType | string): string => {
    if (!name) return '';
    const normalizedDb = normalizeDbType(dbType);
    switch (normalizedDb) {
        case DbType.SQL:
            return `[${name}]`;
        case DbType.MySQL:
            return `\`${name}\``;
        case DbType.SQLite:
            return `"${name}"`;
        case DbType.PostgreSQL:
            return `"${name}"`;
        default:
            return name;
    }
};

/**
 * Topologically sorts tables based on foreign key relationships.
 * Parent (referenced) tables come before child (dependent) tables.
 */
export const sortTablesByDependencies = (tables: Table[], relationships: Relationship[] = []): Table[] => {
    const tableMap = new Map<string, Table>();
    tables.forEach(t => tableMap.set(t.id, t));

    // Map each table to tables it depends on (parents)
    const dependencyMap = new Map<string, Set<string>>();
    tables.forEach(t => dependencyMap.set(t.id, new Set<string>()));

    relationships.forEach(rel => {
        const parentId = rel.fromTableId;
        const childId = rel.toTableId;

        // If child depends on parent and they are different tables
        if (parentId && childId && parentId !== childId && dependencyMap.has(childId) && tableMap.has(parentId)) {
            dependencyMap.get(childId)!.add(parentId);
        }
    });

    const sorted: Table[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (tableId: string) => {
        if (visited.has(tableId)) return;
        if (visiting.has(tableId)) return; // Break cycle
        
        visiting.add(tableId);
        const deps = dependencyMap.get(tableId);
        if (deps) {
            deps.forEach(depId => visit(depId));
        }
        visiting.delete(tableId);
        visited.add(tableId);

        const table = tableMap.get(tableId);
        if (table) {
            sorted.push(table);
        }
    };

    tables.forEach(t => {
        if (!visited.has(t.id)) {
            visit(t.id);
        }
    });

    return sorted;
};

/**
 * Finds target table referenced by a foreign key field.
 */
export const findTargetTable = (
    field: Field,
    currentTable: Table,
    allTables: Table[],
    relationships: Relationship[] = []
): Table | null => {
    if (field.isPrimaryKey) return null;

    // 1. Check explicit relationships
    for (const rel of relationships) {
        const isFromTable = rel.fromTableId === currentTable.id || rel.fromTable?.toLowerCase() === currentTable.name.toLowerCase();
        const isFromField = rel.fromFieldId === field.id || rel.fromField?.toLowerCase() === field.name.toLowerCase();
        if (isFromTable && isFromField) {
            const target = allTables.find(t => t.id === rel.toTableId || t.name.toLowerCase() === rel.toTable?.toLowerCase());
            if (target && target.id !== currentTable.id) return target;
        }
    }

    // 2. Check naming conventions (e.g., KundeId -> Kunden/Kunde, Artikel_id -> Artikel, etc.)
    const fieldNameLower = field.name.toLowerCase();
    if (fieldNameLower.endsWith('id') || fieldNameLower.endsWith('_id')) {
        const prefix = fieldNameLower.replace(/(_id|id)$/i, '');
        if (!prefix) return null;

        for (const t of allTables) {
            if (t.id === currentTable.id) continue;
            const tNameLower = t.name.toLowerCase();
            if (
                tNameLower === prefix ||
                tNameLower === prefix + 'n' ||
                tNameLower === prefix + 's' ||
                tNameLower === prefix + 'en' ||
                prefix === tNameLower + 'n' ||
                prefix === tNameLower + 's' ||
                (prefix.endsWith('e') && tNameLower === prefix + 'n') ||
                (prefix === 'auftrag' && tNameLower === 'auftraege') ||
                (prefix === 'gutschrift' && tNameLower === 'gutschriften')
            ) {
                return t;
            }
        }
    }

    return null;
};


