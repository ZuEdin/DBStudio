/**
 * Window Functions & Analytic Queries Helper
 * Provides SQL generators & templates for:
 * ROW_NUMBER(), RANK(), DENSE_RANK(), LEAD(), LAG(), SUM() OVER (), NTILE(), FIRST_VALUE()
 */

export interface WindowFunctionConfig {
  functionName: 'ROW_NUMBER' | 'RANK' | 'DENSE_RANK' | 'LEAD' | 'LAG' | 'SUM' | 'AVG' | 'NTILE' | 'FIRST_VALUE';
  targetField?: string;
  leadLagOffset?: number;
  partitionByFields: string[];
  orderByFields: { field: string; direction: 'ASC' | 'DESC' }[];
  frameSpec?: 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW' | 'ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING' | '';
  alias: string;
}

export const buildWindowFunctionSql = (config: WindowFunctionConfig): string => {
  let fnCall = `${config.functionName}()`;

  if (['SUM', 'AVG', 'FIRST_VALUE'].includes(config.functionName)) {
    fnCall = `${config.functionName}(${config.targetField || '*'})`;
  } else if (['LEAD', 'LAG'].includes(config.functionName)) {
    fnCall = `${config.functionName}(${config.targetField || 'ID'}, ${config.leadLagOffset || 1})`;
  } else if (config.functionName === 'NTILE') {
    fnCall = `NTILE(${config.leadLagOffset || 4})`;
  }

  const partitionClause =
    config.partitionByFields.length > 0
      ? `PARTITION BY ${config.partitionByFields.map((f) => `"${f}"`).join(', ')}`
      : '';

  const orderClause =
    config.orderByFields.length > 0
      ? `ORDER BY ${config.orderByFields.map((o) => `"${o.field}" ${o.direction}`).join(', ')}`
      : '';

  const overParts = [partitionClause, orderClause, config.frameSpec].filter(Boolean).join(' ');

  return `${fnCall} OVER (${overParts}) AS "${config.alias || 'WindowCol'}"`;
};
