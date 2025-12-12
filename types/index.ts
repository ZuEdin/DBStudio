export enum DbType {
  SQLite = 'SQLite',
  SQL = 'SQL',
  MySQL = 'MySQL',
  NoSQL = 'NoSQL'
}

export type FieldType = 'INTEGER' | 'VARCHAR' | 'TEXT' | 'DATE' | 'BOOLEAN';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey?: boolean;
}

export interface Table {
  id: string;
  name: string;
  fields: Field[];
  data?: Record<string, any>[];
}

export interface TableNode {
  id: string;
  tableId: string;
  x: number;
  y: number;
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  type: '1:1' | '1:n' | 'n:m';
  referentialIntegrity?: boolean;
}

export interface QueryColumn {
  id: string;
  tableId: string;
  fieldId: string;
  tableName: string;
  fieldName: string;
  sort: '' | 'ASC' | 'DESC';
  show: boolean;
  criteria: string[];
}

// New Query structure using discriminated union
export type QueryType = 'SELECT' | 'APPEND' | 'DELETE';

interface QueryBase {
  id: string;
  name: string;
  type: QueryType;
}

export interface SelectQuery extends QueryBase {
  type: 'SELECT';
  nodes: TableNode[];
  columns: QueryColumn[];
  sql?: string;
}

export interface AppendQuery extends QueryBase {
  type: 'APPEND';
  source: {
    type: 'table' | 'query';
    id: string;
  };
  targetTableId: string;
  fieldMappings: {
    sourceFieldId: string;
    targetFieldId: string;
  }[];
}

export interface DeleteQuery extends QueryBase {
  type: 'DELETE';
  targetTableId: string;
  criteria: QueryColumn[];
}

export type Query = SelectQuery | DeleteQuery | AppendQuery;


export interface ReportSummary {
  fieldId: string;
  fieldName: string;
  calculation: 'SUM' | 'COUNT';
}
export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  groupingFieldId?: string;
  summaries: ReportSummary[];
}

export interface FormField {
  fieldId: string;
  label: string;
}

export interface Subform {
  formId: string;
  masterLinkFieldId: string;
  childLinkFieldId: string;
}

export interface Form {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  fields: FormField[];
  subform?: Subform;
}


export type ViewType = 
  | { type: 'welcome' }
  | { type: 'table_create' }
  | { type: 'table_edit', tableId: string }
  | { type: 'table_data', tableId: string }
  | { type: 'query_designer', queryId?: string }
  | { type: 'query_results', queryId: string }
  | { type: 'relationships' }
  | { type: 'report_view', reportId: string }
  | { type: 'form_view', formId: string }
  | { type: 'form_designer', formId: string };

export const FIELD_HEIGHT = 28;
export const HEADER_HEIGHT = 40;
export const NODE_WIDTH = 192; // w-48