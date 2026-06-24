
export enum DbType {
  SQLite = 'SQLite',
  SQL = 'SQL',
  MySQL = 'MySQL',
  NoSQL = 'NoSQL'
}

export type FieldType = 'INTEGER' | 'VARCHAR' | 'TEXT' | 'DATE' | 'TIME' | 'DATETIME' | 'BOOLEAN' | 'DECIMAL' | 'DOUBLE' | 'TINYINT' | 'TIMESTAMP' | 'ENUM';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  comment?: string;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  allowNull?: boolean;
  defaultValue?: string;
  length?: number;
  precision?: number;
  scale?: number;
  displayFormat?: string;
  enumValues?: string[];
  // Grid/UI Rendering Phase 5
  rendererType?: 'text' | 'progress' | 'status_pill' | 'avatar' | 'currency' | 'date';
  inlineEditable?: boolean;
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
  description?: string;
  fields: Field[];
  data?: any[];
  isApiImport?: boolean;
  apiConfig?: ApiConfig;
  validationRules?: ValidationRule[];
  // Grid features Phase 5
  enableInlineEditing?: boolean;
  enableMassUpdates?: boolean;
  conditionalFormatting?: {
    id: string;
    fieldId: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
    value: string;
    style: {
      backgroundColor?: string;
      color?: string;
      fontWeight?: string;
    };
  }[];
}

export interface TableNode {
  id: string;
  tableId: string;
  x: number;
  y: number;
  groupId?: string;
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

export type AggregateFunction = 'GROUP_BY' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'FIRST' | 'LAST' | 'EXPRESSION';

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

export interface DashboardWidget {
    id: string;
    sourceId: string;
    sourceType: 'report' | 'chart' | 'query';
    x: number;
    y: number;
    w: number;
    h: number;
    title?: string;
}

export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query' | 'dashboard';
  sourceId: string;
  groupingFieldId?: string;
  columns?: ReportColumn[];
  summaries: ReportSummary[];
  styles?: ReportStyles;
  settings?: ReportSettings;
  dashboardWidgets?: DashboardWidget[];
  allowedRoles?: string[];
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

export interface ActionFlow {
  id: string;
  trigger: 'OnClick' | 'OnChange' | 'OnPageLoad';
  actionType: 'ShowToast' | 'OpenModal' | 'Navigate' | 'ExecuteAPI' | 'SetState';
  toastMessage?: string;
  toastType?: 'success' | 'error' | 'info';
  modalId?: string; 
  routeUrl?: string; 
  apiEndpoint?: string; 
  stateVariableId?: string; 
  stateValue?: string; 
}

export interface FormElement {
  id: string;
  type: 'container' | 'field' | 'label' | 'subform' | 'button';
  fieldId?: string;
  label?: string; 
  className?: string;
  children?: FormElement[];
  widgetType?: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select' | 'ad-search' | 'current-user';
  lookup?: LookupConfig;
  subform?: Subform;
  actions?: ActionFlow[];
  allowedRoles?: string[];
  visibilityCondition?: { fieldId: string, operator: 'eq' | 'neq', value: string };
}

export interface FormField {
    fieldId: string;
    label: string;
}

export interface FormSettings {
    isFullScreen?: boolean;
    showEditToggle?: boolean;
}

export interface CrossFieldValidation {
  id: string;
  triggerFieldId: string;
  condition: 'equals' | 'not_equals' | 'not_empty' | 'is_true';
  triggerValue?: string;
  targetFieldId: string;
  action: 'require' | 'hide' | 'disable' | 'validate_after';
  errorMessage?: string;
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
  // Phase 5 validation
  crossFieldValidations?: CrossFieldValidation[];
  allowedRoles?: string[];
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
    type: 'trigger' | 'condition' | 'action' | 'api' | 'upload' | 'group';
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
    apiConfig?: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        url: string;
        headers?: string;
        body?: string;
    };
    fileUploadConfig?: {
        tableId?: string;
        fileTypes?: string;
        maxSizeBytes?: number;
    };
    parentId?: string;
    extent?: 'parent';
    style?: React.CSSProperties;
    width?: number;
    height?: number;
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
export type StylingFramework = 'tailwind' | 'bootstrap' | 'none';

export interface AuthConfig {
    useWindowsAuth: boolean;
    useAdGroups: boolean;
    useActiveDirectoryMgmt?: boolean;
    adGroups?: string; // Legacy string format
    adMapping?: { groupName: string; roleName: string }[]; // New Mapping
    useUserLogin: boolean;
    devBypass: boolean;
    isMobileReady: boolean;
}

export interface ElectronSettings {
    includeBackend: boolean;
    bundleFrontend: boolean;
    targetUrl?: string;
}

export type DeploymentTarget = 'docker' | 'ftp' | 'azure' | 'aws' | 'github' | 'electron' | 'tauri';

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
    provider: 'google' | 'microsoft' | 'apple' | 'github';
    clientId: string;
    clientSecret?: string;
    tenantId?: string;
}

export interface WebhookConfig {
    url: string;
    events: ('create' | 'update' | 'delete')[];
    secret?: string; 
}

export interface AiIntegrationConfig {
    provider: 'gemini' | 'openai' | 'ollama' | 'azure_openai';
    apiKey?: string;
    modelName?: string;
    endpointUrl?: string; // For Ollama or Azure
}

export interface CollaborationConfig {
    provider: 'signalr' | 'socketio' | 'pusher' | 'none';
    serverUrl?: string;
    apiKey?: string; // For Pusher
    hubPath?: string; // For SignalR
}

export interface SharePointConfig {
    siteUrl: string;
    authMethod: 'user' | 'app';
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
}

export interface IntegrationsConfig {
    storage: StorageConfig;
    sso: SsoConfig[];
    webhooks: WebhookConfig[];
    ai?: AiIntegrationConfig;
    collaboration?: CollaborationConfig;
    sharePoint?: SharePointConfig; // NEW
}

export interface EnvironmentConfig {
    name: 'Development' | 'Staging' | 'Production';
    dbConnection: string;
    apiUrl?: string;
    buildPath?: string;
    vars?: Record<string, string>;
}

// NEW: Commercialization Types
export interface WhitelabelConfig {
    appName: string;
    companyName: string;
    logoUrl?: string;
    primaryColor: string; // Hex
    secondaryColor: string; // Hex
    accentColor?: string;
    successColor?: string;
    warningColor?: string;
    errorColor?: string;
    fontFamily?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    elevation?: 'none' | 'sm' | 'md' | 'lg';
    darkModeColors?: {
        primary?: string;
        secondary?: string;
        background?: string;
    };
    emailTemplates?: {
        id: string;
        name: string;
        subject: string;
        bodyHtml: string;
    }[];
    pwaConfiguration?: {
        enabled: boolean;
        themeColor?: string;
        backgroundColor?: string;
    };
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

export interface NavigationItem {
  id: string;
  type: 'page' | 'folder';
  title: string;
  icon: string;
  route: string;
  requiredRoles: string[];
  targetId?: string;
  targetType?: 'table' | 'query' | 'form' | 'report' | 'custom';
  children?: NavigationItem[];
  badgeCountQuery?: string;
  translations?: { de?: string; en?: string; fr?: string };
}

export interface GlobalStateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  defaultValue: any;
}

export interface ProductTourStep {
  targetSelector: string;
  title: string;
  content: string;
}

export interface ProductTour {
  id: string;
  name: string;
  activeOnRoute?: string;
  steps: ProductTourStep[];
}

export interface BackendConfig {
  language: BackendLanguage;
  backendVersion?: string;
  dbType: DbType;
  projectName: string;
  port: number; // Backend API Port
  frontendPort?: number; // Frontend Dev Port
  dbConnection: string;
  useSwagger: boolean;
  frontendFramework: FrontendFramework;
  stylingFramework?: StylingFramework;
  authConfig?: AuthConfig;
  electronSettings?: ElectronSettings;
  deploymentConfig?: DeploymentConfig;
  integrations?: IntegrationsConfig;
  environments?: EnvironmentConfig[];
  apiBaseUrl?: string; // NEW: Global Base URL for API Import
  // New Commercial Configs
  whitelabel?: WhitelabelConfig;
  multiTenancy?: MultiTenancyConfig;
  licensing?: LicensingConfig;
  navigationConfig?: NavigationItem[];
  navigationPreset?: 'sidebar' | 'top_nav' | 'double_rail';
  // Phase 6 Features
  globalStates?: GlobalStateVariable[];
  productTours?: ProductTour[];
}

export interface TableGroup {
  id: string;
  name: string;
  color?: string;
  comment?: string;
}

export type PageComponentType = 'container' | 'text' | 'button' | 'table_view' | 'form_view' | 'image' | 'divider' | 'dropdown' | 'chart_view' | 'html' | 'list_repeater' | 'subpage_container';

export interface PageComponent {
  id: string;
  type: PageComponentType;
  props: Record<string, any>;
  children?: PageComponent[];
}

export interface CustomPage {
  id: string;
  name: string;
  description?: string;
  layout: PageComponent;
  isSubpage?: boolean;
  parentPageId?: string;
  expectedParams?: string[];
}

export interface ProjectData {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  charts?: Chart[];
  workflows?: Workflow[];
  pages?: CustomPage[];
  relationships: Relationship[];
  layout: TableNode[]; // Stores the visual position of tables in relationship view
  tableGroups: TableGroup[];
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

// NEW: Locking
export interface LockInfo {
    objectId: string;
    userId: string;
    userName: string;
    lockedAt: number;
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

// CHAT Types
export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export interface Chat {
    id: string;
    type: 'private' | 'group';
    name: string;
    participants: string[];
    messages: ChatMessage[];
    unreadCount?: number;
    isOnline?: boolean;
}

export type ViewType = 
  | { type: 'welcome' }
  | { type: 'app_info' }
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
  | { type: 'page_designer', pageId?: string }
  | { type: 'page_view', pageId: string }
  | { type: 'workflow_designer', workflowId: string }
  | { type: 'scheduler' } 
  | { type: 'backend_generator' }
  | { type: 'navigation_designer' }
  | { type: 'api_import' }
  | { type: 'theme_designer' }
  | { type: 'logic_designer' }; 

export const FIELD_HEIGHT = 28;
export const HEADER_HEIGHT = 40;
export const NODE_WIDTH = 192;
