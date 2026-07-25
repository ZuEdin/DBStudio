export type MacroActionType =
  | 'EXPORT_REPORT'        // Export report/table/query to PDF, XLSX, XML, JSON, CSV
  | 'SMART_IMPORT'          // Launch File Upload & Import Wizard
  | 'EXECUTE_QUERY'         // Execute a query or update
  | 'OPEN_FORM'             // Open form with parameters
  | 'CLOSE_FORM'            // Close active form
  | 'OPEN_REPORT'           // Open report
  | 'PRINT_REPORT'          // Print/Export report
  | 'EXECUTE_ACTION'        // Execute action query (UPDATE/INSERT/DELETE)
  | 'SET_FILTER'            // Apply filter to view
  | 'REQUERY'               // Refresh data sources
  | 'MESSAGE_BOX'           // Show alert dialog
  | 'CONFIRM_DIALOG'        // Show confirmation dialog
  | 'EXECUTE_JS_SCRIPT'     // JS/TS Scripting Engine (VBA replacement)
  | 'CALCULATE_FORMULA'     // Run formula on fields
  | 'NAVIGATE'              // Navigate to page
  | 'SHOW_TOAST'            // Notification
  | 'OPEN_MODAL';           // Open custom modal

export type ExportFormat = 'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV' | 'HTML_PRINT';

export interface ReportExportConfig {
  sourceType: 'report' | 'table' | 'query';
  sourceId: string;
  format: ExportFormat;
  filterParams?: Record<string, any>;
  title?: string;
  autoDownload?: boolean;
}

export interface ImportFieldMapping {
  fileColumn: string;
  targetFieldId: string;
  targetFieldName: string;
}

export interface SmartImportConfig {
  targetTableId: string;
  importStrategy: 'append' | 'update_by_pk' | 'upsert';
  primaryKeyFieldId?: string;
  fieldMappings: ImportFieldMapping[];
  saveAsMacroProfile?: boolean;
  macroProfileName?: string;
}

export interface MacroStep {
  id: string;
  name: string;
  type: MacroActionType;
  exportConfig?: ReportExportConfig;
  importConfig?: SmartImportConfig;
  queryId?: string;
  formId?: string;
  reportId?: string;
  pageId?: string;
  filterExpression?: string;
  messageText?: string;
  confirmPrompt?: string;
  jsCode?: string; // JavaScript/TypeScript Sandbox Code
  toastMessage?: string;
  toastType?: 'success' | 'info' | 'warning' | 'error';
  params?: Record<string, any>;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  category?: 'REPORT_EXPORT' | 'DATA_IMPORT' | 'WORKFLOW' | 'CUSTOM';
  steps: MacroStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedFieldConfig {
  formula: string; // e.g. "[UnitPrice] * [Quantity] * (1 - [Discount] / 100)" or "[Vorname] + ' ' + [Nachname]"
  targetFieldId: string;
  label?: string;
  format?: 'number' | 'currency' | 'text' | 'percentage';
}
