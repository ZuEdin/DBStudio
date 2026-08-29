export type WidgetType = 'KPI_CARD' | 'CHART' | 'GRID' | 'TRAFFIC_LIGHT' | 'GAUGE';

export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  gridSpan: { cols: number; rows: number };
  queryId?: string;
  tableName?: string;
  kpiSettings?: {
    aggregationField: string;
    aggregationType: 'SUM' | 'COUNT' | 'AVG';
    unit?: string;
    trendPercentage?: number;
    format: 'currency' | 'number' | 'percent';
  };
}

export interface DashboardLayoutConfig {
  id: string;
  name: string;
  columns: number;
  widgets: DashboardWidgetConfig[];
}
