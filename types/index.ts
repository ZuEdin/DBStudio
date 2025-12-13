
export enum DbType {
  SQLite = 'SQLite',
  SQL = 'SQL',
  MySQL = 'MySQL',
  NoSQL = 'NoSQL'
}

// We keep FieldType as a string union for now, but in the future, it could just be string to fully rely on the JSON config
export type FieldType = 'INTEGER' | 'VARCHAR' | 'TEXT' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'DECIMAL' | 'DOUBLE';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  // Extended Attributes
  length?: number;
  precision?: number;
  scale?: number;
  
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  allowNull?: boolean; 
  defaultValue?: string; 
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

export type AggregateFunction = 'GROUP_BY' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'EXPRESSION';

export interface QueryColumn {
  id: string;
  tableId: string; // Can be empty if calculated
  fieldId: string; // Can be 'calculated'
  tableName: string;
  fieldName: string;
  alias?: string; // Für "Ausgabe eigener Spaltennamen"
  sort: '' | 'ASC' | 'DESC';
  show: boolean;
  criteria: string[];
  aggregate?: AggregateFunction | null; // Für Gruppierung
  isCalculated?: boolean; // Für kombinierte Spalten
  expression?: string; // z.B. "{{Kunden.Vorname}} & ' ' & {{Kunden.Nachname}}"
}

// Query structure using discriminated union
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

export interface FormattingRule {
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string;
  style: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: 'normal' | 'bold';
  };
}

export interface ReportColumn {
  fieldId: string;
  label: string; // Header text
  width?: number; // percentage or pixels, defaults to auto
  visible: boolean;
  order: number;
  formattingRules?: FormattingRule[];
}

export interface ReportSettings {
  pageBreakAfterGroup?: boolean;
  groupMethod?: 'full' | 'firstLetter'; // "full" = ganzer Wert, "firstLetter" = A, B, C...
  paperSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  groupingFieldId?: string;
  summaries: ReportSummary[];
  columns?: ReportColumn[]; // New Layout Config
  settings?: ReportSettings; // New Settings
}

export interface Subform {
  formId: string;
  masterLinkFieldId: string;
  childLinkFieldId: string;
  // Permissions
  canAdd?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
}

// --- Neue Formular Struktur ---

export type FormElementType = 'container' | 'field' | 'label' | 'subform';
export type FormWidgetType = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'textarea';

export interface FormElement {
  id: string;
  type: FormElementType;
  // Für Layout
  className?: string; // Tailwind Klassen z.B. "grid grid-cols-2 gap-4" oder "p-4 bg-gray-100"
  children?: FormElement[];
  
  // Für Fields
  fieldId?: string;
  label?: string; // Überschreibt Feldname oder ist Text für Label-Type
  widgetType?: FormWidgetType; // NEU: Steuert die Anzeige (Select, Checkbox etc.)
  
  // Konfiguration für Dropdowns (Select)
  lookup?: {
      tableId: string;      // Aus welcher Tabelle kommen die Daten?
      valueFieldId: string; // Welches Feld wird gespeichert (z.B. ID)?
      labelFields: string[]; // Deprecated/Simple: NEU: Array von Feld-IDs für die Anzeige
      displayFormat?: {      // Advanced Configuration
          fieldId: string;
          prefix?: string;   // z.B. "("
          suffix?: string;   // z.B. ") " oder ", "
      }[];
      // Quick Create Configuration
      allowQuickCreate?: boolean; // Zeige (+) Button
      quickCreateFormId?: string; // Welches Formular soll im Modal geladen werden?
  };

  // Für Subforms (in Container eingebettet oder als eigenes Element)
  subform?: Subform;
}

export interface FormField {
  fieldId: string;
  label: string;
}

export interface FormSettings {
  isFullScreen?: boolean;
}

export interface Form {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  // Root Element für Layout (meistens ein Container)
  layout?: FormElement;
  mode?: 'edit' | 'readonly';
  settings?: FormSettings;
  
  // Legacy Support (wird migriert oder ignoriert, wenn layout existiert)
  fields?: FormField[]; 
  subform?: Subform; // Legacy root subform
}

// --- Backend Configuration ---

export type BackendLanguage = 'dotnet' | 'nodejs' | 'php';
export type FrontendFramework = 'none' | 'angular' | 'react';

export interface BackendConfig {
  language: BackendLanguage;
  dbType: DbType; // New: Pass the DB Type to the generator
  projectName: string;
  port: number;
  dbConnection: string;
  useSwagger: boolean;
  frontendFramework: FrontendFramework;
}

export interface ProjectData {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  relationships: Relationship[];
  backendConfig: BackendConfig;
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  data: ProjectData;
}

export interface VirtualFile {
  name: string;
  content: string;
  language: 'csharp' | 'typescript' | 'javascript' | 'php' | 'json' | 'sql' | 'html' | 'css' | 'xml' | 'text' | 'markdown';
  path: string;
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
  | { type: 'report_designer', reportId: string } // New View
  | { type: 'form_view', formId: string }
  | { type: 'form_designer', formId: string }
  | { type: 'backend_generator' }; // New Backend View

export const FIELD_HEIGHT = 28;
export const HEADER_HEIGHT = 40;
export const NODE_WIDTH = 192; // w-48
