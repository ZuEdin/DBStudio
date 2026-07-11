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
