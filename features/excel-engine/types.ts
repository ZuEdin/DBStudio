import { Table, Query } from '../../types';

export type ExcelExportFormat = 'xlsx' | 'csv' | 'json' | 'html';
export type ExcelTheme = 'corporate_blue' | 'emerald_green' | 'modern_dark' | 'minimalist_gray';

export interface ExcelExportOptions {
  format: ExcelExportFormat;
  theme: ExcelTheme;
  includeTotalsRow: boolean;
  autoFitColumns: boolean;
  freezeHeaderRow: boolean;
  includeLookupRelations: boolean;
  includeSchemaSheet: boolean;
  selectedTableIds: string[];
  selectedQueryIds: string[];
  fileName?: string;
}

export interface ExcelExportItem {
  id: string;
  name: string;
  type: 'table' | 'query';
  rowCount: number;
  columnCount: number;
  selected: boolean;
}
