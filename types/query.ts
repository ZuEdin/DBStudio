export type AggregateFunction = 'GROUP_BY' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'FIRST' | 'LAST' | 'EXPRESSION';

export type CrosstabRole = 'ROW_HEADING' | 'COLUMN_HEADING' | 'VALUE' | 'NONE';

export type QueryParameterType = 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ARRAY';

export interface QueryParameter {
  id: string;
  name: string;
  type: QueryParameterType;
  defaultValue?: any;
  description?: string;
  required?: boolean;
}

export interface QueryJoinOverride {
  fromNodeId: string;
  toNodeId: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  customCondition?: string;
}

export interface QueryColumn {
  id: string;
  tableId: string;
  nodeId?: string;
  fieldId: string;
  tableName: string;
  fieldName: string;
  alias?: string;
  sort?: 'ASC' | 'DESC' | '';
  show: boolean;
  criteria: string[];
  aggregate?: AggregateFunction | null;
  crosstab?: CrosstabRole | null;
  isCalculated?: boolean;
  expression?: string;
}

export interface SelectQuery {
  id: string;
  type: 'SELECT' | 'CROSSTAB';
  name: string;
  nodes: any[]; // Using any[] here to avoid circular imports of TableNode
  columns: QueryColumn[];
  parameters?: QueryParameter[];
  joinOverrides?: QueryJoinOverride[];
  distinct?: boolean;
  crosstabConfig?: {
    rowHeaders: string[];
    columnHeader: string;
    valueField: string;
    aggregate: AggregateFunction;
    showRowTotals?: boolean;
    showColTotals?: boolean;
  };
}

export interface CrosstabQuery extends Omit<SelectQuery, 'type'> {
  type: 'CROSSTAB';
}

export interface Criterion {
    id: string;
    fieldId: string;
    operator: string;
    value: string;
}

export interface InsertQuery {
  id: string;
  type: 'INSERT';
  name: string;
  sourceTableId: string;
  targetTableId: string;
  fieldMapping: Record<string, string>;
}

export interface UpdateQuery {
  id: string;
  type: 'UPDATE';
  name: string;
  targetTableId: string;
  updateMap: Record<string, string>;
  criteria: Criterion[];
}

export interface DeleteQuery {
  id: string;
  type: 'DELETE';
  name: string;
  targetTableId: string;
  criteria: Criterion[];
}

export type ActionQuery = InsertQuery | UpdateQuery | DeleteQuery;

export type Query = SelectQuery | CrosstabQuery | ActionQuery;

