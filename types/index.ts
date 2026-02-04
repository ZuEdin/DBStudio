
export enum DbType {
  SQLite = 'SQLite',
  SQL = 'SQL',
  MySQL = 'MySQL',
  NoSQL = 'NoSQL'
}

export type FieldType = 'INTEGER' | 'VARCHAR' | 'TEXT' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'DECIMAL' | 'DOUBLE';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  allowNull?: boolean;
  defaultValue?: string;
  length?: number;
  precision?: number;
  scale?: number;
  displayFormat?: string;
}

export interface ValidationRule {
  id: string;
  fieldId: string;
  operator: ValidationOperator;
  compareType: 'value' | 'field';
  compareValue: string;
  errorMessage?: string;
}

export type ValidationOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'regex';

export interface ApiQueryParam {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'select';
  options?: string[];
  isActive: boolean;
}

export interface ApiConfig {
  url: string;
  method: string;
  headers?: string;
  queryParams?: ApiQueryParam[];
  refreshOnLoad?: boolean;
}

export interface Table {
  id: string;
  name: string;
  fields: Field[];
  data?: any[];
  isApiImport?: boolean;
  apiConfig?: ApiConfig;
  validationRules?: ValidationRule[];
}

export interface TableNode {
  id: string;
  tableId: string;
  x: number;
  y: number;
}

export type ReferentialAction = 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  type: '1:1' | '1:n' | 'n:m';
  referentialIntegrity?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

export type AggregateFunction = 'GROUP_BY' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'EXPRESSION';

export interface QueryColumn {
  id: string;
  tableId: string;
  fieldId: string;
  tableName: string;
  fieldName: string;
  alias?: string;
  sort?: 'ASC' | 'DESC' | '';
  show: boolean;
  criteria: string[];
  aggregate?: AggregateFunction | null;
  isCalculated?: boolean;
  expression?: string;
}

export interface SelectQuery {
  id: string;
  type: 'SELECT';
  name: string;
  nodes: TableNode[];
  columns: QueryColumn[];
}

export interface ActionQuery {
    id: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    name: string;
    // Simplified action query structure if needed
}

export type Query = SelectQuery | ActionQuery;

export interface TextStyle {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    borderBottom?: boolean;
}

export interface FormattingRule {
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: string;
    style: TextStyle;
}

export interface ReportColumn {
    fieldId: string;
    label: string;
    visible: boolean;
    order: number;
    formattingRules?: FormattingRule[];
}

export interface ReportSummary {
    fieldId: string;
    fieldName: string;
    calculation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
}

export interface ReportStyles {
    header?: TextStyle;
    groupHeader?: TextStyle;
    columnHeader?: TextStyle;
    detail?: TextStyle;
    footer?: TextStyle;
}

export interface ReportSettings {
    orientation?: 'portrait' | 'landscape';
    pageBreakAfterGroup?: boolean;
    groupMethod?: 'full' | 'firstLetter';
}

export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  groupingFieldId?: string;
  columns?: ReportColumn[];
  summaries: ReportSummary[];
  styles?: ReportStyles;
  settings?: ReportSettings;
}

export interface LookupConfig {
    tableId: string;
    valueFieldId: string;
    labelFields: string[];
    displayFormat?: { fieldId: string, prefix?: string, suffix?: string }[];
    allowQuickCreate?: boolean;
    quickCreateFormId?: string;
    sort?: { fieldId: string, direction: 'ASC' | 'DESC' };
}

export interface Subform {
    formId: string;
    masterLinkFieldId: string;
    childLinkFieldId: string;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export interface FormElement {
  id: string;
  type: 'container' | 'field' | 'label' | 'subform';
  fieldId?: string;
  label?: string; 
  className?: string;
  children?: FormElement[];
  widgetType?: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select';
  lookup?: LookupConfig;
  subform?: Subform;
}

export interface FormField {
    fieldId: string;
    label: string;
}

export interface FormSettings {
    isFullScreen?: boolean;
    showEditToggle?: boolean;
}

export interface Form {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  mode?: 'edit' | 'readonly';
  layout?: FormElement;
  fields: FormField[];
  subform?: Subform;
  settings?: FormSettings;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface ChartConfig {
    xAxisFieldId: string;
    yAxisFieldIds: string[];
    showGrid?: boolean;
}

export interface Chart {
    id: string;
    name: string;
    type: ChartType;
    sourceType: 'table' | 'query';
    sourceId: string;
    config: ChartConfig;
}

export interface WorkflowNode {
    id: string;
    type: 'trigger' | 'condition' | 'action';
    x: number;
    y: number;
    label: string;
    triggerConfig?: {
        event: 'onCreate' | 'onUpdate' | 'onDelete' | 'schedule';
        tableId?: string;
        cronExpression?: string;
    };
    conditionConfig?: {
        fieldId?: string;
        operator?: string;
        value?: string;
    };
    actionConfig?: {
        actionType: 'sendEmail' | 'updateRecord' | 'createRecord';
        emailTo?: string;
        emailSubject?: string;
    };
}

export interface WorkflowEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
}

export interface Workflow {
    id: string;
    name: string;
    active: boolean;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export type BackendLanguage = 'dotnet' | 'nodejs' | 'php' | 'laravel' | 'electron';
export type FrontendFramework = 'react' | 'angular' | 'blazor' | 'vue' | 'electron' | 'none';

export interface AuthConfig {
    useWindowsAuth: boolean;
    useAdGroups: boolean;
    adGroups?: string;
    useUserLogin: boolean;
    devBypass: boolean;
    isMobileReady: boolean;
}

export interface ElectronSettings {
    includeBackend: boolean;
    bundleFrontend: boolean;
    targetUrl?: string;
}

export type DeploymentTarget = 'docker' | 'ftp' | 'azure' | 'aws';

export interface DeploymentConfig {
    target: DeploymentTarget;
    dockerImageName?: string;
    dockerPort?: number;
    ftpHost?: string;
    ftpUser?: string;
    ftpPath?: string;
}

export interface StorageConfig {
    provider: 'local' | 's3' | 'azure';
    bucketName?: string;
    region?: string;
    accessKeyId?: string;
    connectionString?: string;
}

export interface SsoConfig {
    provider: 'google' | 'microsoft';
    clientId: string;
    clientSecret?: string;
    tenantId?: string;
}

export interface WebhookConfig {
    url: string;
    events: ('create' | 'update' | 'delete')[];
    secret?: string; 
}

export interface IntegrationsConfig {
    storage: StorageConfig;
    sso: SsoConfig[];
    webhooks: WebhookConfig[];
}

export interface EnvironmentConfig {
    name: 'Development' | 'Staging' | 'Production';
    dbConnection: string;
    apiUrl?: string;
    vars?: Record<string, string>;
}

// NEW: Commercialization Types
export interface WhitelabelConfig {
    appName: string;
    companyName: string;
    logoUrl?: string;
    primaryColor: string; // Hex
    secondaryColor: string; // Hex
    faviconUrl?: string;
    removeBranding: boolean;
}

export interface MultiTenancyConfig {
    enabled: boolean;
    strategy: 'discriminator' | 'database'; // Discriminator (Column) or Separate DBs
    tenantField: string; // Default: 'TenantId'
}

export interface LicensingConfig {
    enabled: boolean;
    licenseKey?: string;
    validateOnline: boolean;
}

export interface BackendConfig {
  language: BackendLanguage;
  backendVersion?: string;
  dbType: DbType;
  projectName: string;
  port: number;
  dbConnection: string;
  useSwagger: boolean;
  frontendFramework: FrontendFramework;
  authConfig?: AuthConfig;
  electronSettings?: ElectronSettings;
  deploymentConfig?: DeploymentConfig;
  integrations?: IntegrationsConfig;
  environments?: EnvironmentConfig[];
  // New Commercial Configs
  whitelabel?: WhitelabelConfig;
  multiTenancy?: MultiTenancyConfig;
  licensing?: LicensingConfig;
}

export interface ProjectData {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  charts?: Chart[];
  workflows?: Workflow[];
  relationships: Relationship[];
  backendConfig: BackendConfig;
  lastSnapshot?: Table[];
}

export interface GitConfig {
  repositoryUrl: string;
  branch: string;
  username?: string;
  personalAccessToken?: string; 
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  isCloud?: boolean;
  owner?: string;
  collaborators?: string[];
  gitConfig?: GitConfig;
  data: ProjectData;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  isOnline: boolean;
  currentAction?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  data: ProjectData;
}

export interface VirtualFile {
  name: string;
  content: string;
  language: 'csharp' | 'typescript' | 'javascript' | 'php' | 'json' | 'sql' | 'html' | 'css' | 'xml' | 'text' | 'markdown' | 'razor';
  path: string;
}

export interface MessageModalConfig {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
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
  | { type: 'report_designer', reportId: string } 
  | { type: 'form_view', formId: string }
  | { type: 'form_designer', formId: string }
  | { type: 'chart_view', chartId: string }
  | { type: 'workflow_designer', workflowId: string }
  | { type: 'scheduler' } 
  | { type: 'backend_generator' }
  | { type: 'api_import' }; 

export const FIELD_HEIGHT = 28;
export const HEADER_HEIGHT = 40;
export const NODE_WIDTH = 192;
