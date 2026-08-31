export type NotationStyle = 'crows_foot' | 'uml' | 'chen' | 'standard';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface LayoutOptions {
  direction: LayoutDirection;
  nodeSep: number;
  rankSep: number;
  routing: 'orthogonal' | 'smoothstep' | 'bezier' | 'straight';
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface LinterIssue {
  id: string;
  code: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  tableId?: string;
  tableName?: string;
  fieldId?: string;
  fieldName?: string;
  recommendation?: string;
  quickFixType?: 'add_index' | 'align_types' | 'add_pk' | 'add_audit_fields' | 'fix_naming';
}

export interface LinterReport {
  score: number;
  issues: LinterIssue[];
  checkedAt: string;
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface NormalizationSuggestion {
  id: string;
  level: '1NF' | '2NF' | '3NF';
  tableId: string;
  tableName: string;
  fieldNames: string[];
  reason: string;
  proposal: string;
  suggestedNewTable?: {
    name: string;
    fields: Array<{ name: string; type: string; isPrimaryKey?: boolean }>;
  };
}

export type DiffChangeType = 
  | 'table_added' 
  | 'table_removed' 
  | 'table_modified' 
  | 'field_added' 
  | 'field_removed' 
  | 'field_modified' 
  | 'rel_added' 
  | 'rel_removed' 
  | 'rel_modified';

export interface SchemaDiffItem {
  id: string;
  type: DiffChangeType;
  target: string;
  tableName?: string;
  details: string;
  upSql: {
    sqlite: string;
    postgres: string;
    mysql: string;
  };
  downSql: {
    sqlite: string;
    postgres: string;
    mysql: string;
  };
}

export interface MockDataConfig {
  rowCounts: Record<string, number>;
  locale: 'de' | 'en' | 'fr';
  preserveReferentialIntegrity: boolean;
  clearExisting: boolean;
  nullProbability: number;
  seed?: number;
}

export interface EnumDefinition {
  id: string;
  name: string;
  values: string[];
  comment?: string;
}

export interface CustomTypeDefinition {
  id: string;
  name: string;
  baseType: string;
  checkExpression?: string;
  comment?: string;
}

export type IndexType = 'BTREE' | 'HASH' | 'GIN' | 'GiST' | 'SP-GiST' | 'BRIN' | 'UNIQUE';

export interface TableIndex {
  id: string;
  name: string;
  tableId: string;
  columnNames: string[];
  type: IndexType;
  isUnique: boolean;
  isPartial?: boolean;
  whereClause?: string;
  isFunctional?: boolean;
  expression?: string;
}

export interface TableCheckConstraint {
  id: string;
  name: string;
  tableId: string;
  expression: string;
  comment?: string;
}

export interface CompositePrimaryKey {
  id: string;
  tableId: string;
  fieldIds: string[];
}

export interface CompositeForeignKey {
  id: string;
  name?: string;
  fromTableId: string;
  fromFieldIds: string[];
  toTableId: string;
  toFieldIds: string[];
  onDelete?: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';
}
