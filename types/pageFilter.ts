export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_or_equal' 
  | 'less_or_equal' 
  | 'is_empty' 
  | 'is_not_empty'
  | 'in_list';

export type FilterValueSource = 'parameter' | 'static' | 'parent_context' | 'auth_user' | 'current_date';

export interface PageFilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  valueSource: FilterValueSource;
  value: string;
  ignoreIfEmpty?: boolean; // If true and source param is empty/undefined, do not exclude all rows
}

export interface QuickFilterPreset {
  id: string;
  label: string;
  field: string;
  operator?: FilterOperator;
  value: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
}

export interface ColumnDisplayConfig {
  field: string;
  label?: string;
  visible?: boolean;
  format?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'badge' | 'boolean' | 'image' | 'link';
  currencySymbol?: string;
  badgeMap?: Record<string, string>; // e.g. { "Aktiv": "emerald", "Inaktiv": "rose" }
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataDisplayConfig {
  filterRules?: PageFilterRule[];
  filterLogic?: 'AND' | 'OR';
  quickFilters?: QuickFilterPreset[];
  enableSearchBar?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSize?: number;
  displayDensity?: 'compact' | 'normal' | 'spacious';
  columnsConfig?: ColumnDisplayConfig[];
}
