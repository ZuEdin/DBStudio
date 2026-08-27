

import { Table, Relationship, Field, DbType } from '../../types/index';
import { DATA_TYPES } from '../../config/dataTypes';

export const toSubformSuffix = (id: string) => {
    if (!id) return '';
    return id.replace(/^sub_field_/, '').replace(/^sub_/, '').replace(/^field_/, '').replace(/[^a-zA-Z0-9_]/g, '_');
};

export const isNullable = (field: Field | undefined | null) => field ? (field.allowNull !== false && !field.isPrimaryKey) : true;

export const resolveType = (field: Field | undefined | null, language: 'csharp' | 'sequelize' | 'typescript' | 'sql', dbType?: DbType) => {
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
        return typeGen({ length: field.length, precision: field.precision, scale: field.scale, enumValues: field.enumValues, field, dbType });
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

export const quoteIdentifier = (name: string, dbType: DbType): string => {
    if (!name) return '';
    switch (dbType) {
        case DbType.SQL:
            return `[${name}]`;
        case DbType.MySQL:
            return `\`${name}\``;
        case DbType.SQLite:
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


