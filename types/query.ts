export type AggregateFunction = 'GROUP_BY' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'FIRST' | 'LAST' | 'EXPRESSION';

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
  isCalculated?: boolean;
  expression?: string;
}

export interface SelectQuery {
  id: string;
  type: 'SELECT';
  name: string;
  nodes: any[]; // Using any[] here to avoid circular imports of TableNode
  columns: QueryColumn[];
}

export interface ActionQuery {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  name: string;
}

export type Query = SelectQuery | ActionQuery;
