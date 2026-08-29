/**
 * Low-Code Formula & Expression Engine for DB Studio Page Designer
 * Evaluates Excel-like expressions, math formulas, conditional logic, and aggregations.
 */

export function evaluateExpression(
  expression: string,
  context?: Record<string, any>,
  params?: Record<string, any>
): any {
  if (!expression || typeof expression !== 'string') return '';

  let trimmed = expression.trim();
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    trimmed = trimmed.substring(2, trimmed.length - 2).trim();
  }
  if (trimmed.startsWith('=')) {
    trimmed = trimmed.substring(1).trim();
  }

  // Combine params and context for scope
  const scope: Record<string, any> = {
    ...(params || {}),
    ...(context || {}),
    TODAY: () => new Date().toISOString().split('T')[0],
    NOW: () => new Date().toISOString(),
    ROUND: (val: number, decimals: number = 2) => {
      const num = Number(val) || 0;
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    },
    IF: (condition: any, trueVal: any, falseVal: any) => (condition ? trueVal : falseVal),
    SUM: (arr: any[]) => {
      if (!Array.isArray(arr)) return Number(arr) || 0;
      return arr.reduce((acc, curr) => {
        const val = typeof curr === 'object' && curr !== null ? (curr.total || curr.price || curr.amount || Object.values(curr)[0]) : curr;
        return acc + (Number(val) || 0);
      }, 0);
    },
    AVG: (arr: any[]) => {
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      const sum = arr.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
      return sum / arr.length;
    },
    COUNT: (arr: any[]) => (Array.isArray(arr) ? arr.length : arr ? 1 : 0),
    DATEADD: (dateStr: string, amount: number, unit: 'days' | 'months' | 'years' = 'days') => {
      const d = new Date(dateStr || Date.now());
      if (isNaN(d.getTime())) return dateStr;
      if (unit === 'days') d.setDate(d.getDate() + amount);
      else if (unit === 'months') d.setMonth(d.getMonth() + amount);
      else if (unit === 'years') d.setFullYear(d.getFullYear() + amount);
      return d.toISOString().split('T')[0];
    }
  };

  try {
    // Replace variable identifiers like [Menge] or Menge with scope lookup
    let code = trimmed;
    
    // Replace bracketed fields [FieldName]
    code = code.replace(/\[([a-zA-Z0-9_.-]+)\]/g, (_, varName) => {
      const val = scope[varName] !== undefined ? scope[varName] : (context?.[varName] ?? params?.[varName] ?? 0);
      return typeof val === 'number' ? String(val) : JSON.stringify(val);
    });

    // Create function with injected scope
    const keys = Object.keys(scope);
    const values = Object.values(scope);
    const fn = new Function(...keys, `return (${code});`);
    return fn(...values);
  } catch (err) {
    return expression; // Return original on evaluation fallback
  }
}
