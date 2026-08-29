/**
 * Form Calculation Engine
 * Evaluates in-form arithmetic formulas and aggregate expressions across form records and linked subforms.
 * 
 * Syntax examples:
 *  - Arithmetic: "=[Menge] * [Einheitspreis] * (1 - [Rabatt] / 100)"
 *  - Subform Aggregates:
 *      "=SUM(Positionen.Gesamtpreis)"
 *      "=SUM(Positionen.Menge * Positionen.Einheitspreis)"
 *      "=AVG(Positionen.Rabatt)"
 *      "=COUNT(Positionen)"
 *      "=MIN(Positionen.Liefertermin)"
 *      "=MAX(Positionen.Gesamtpreis)"
 *  - Combined: "=[Zwischensumme] + SUM(Zuschlaege.Betrag) * 1.19"
 *  - Conditional: "IF([Menge] > 10, [EP] * 0.9, [EP])"
 *  - Rounding: "ROUND([GesamtNetto] * 1.19, 2)"
 */

export interface CalculationContext {
  subforms?: Record<string, Record<string, any>[]>;
}

export function evaluateFormFormula(
  formula: string,
  record: Record<string, any>,
  context?: CalculationContext
): any {
  if (!formula || typeof formula !== 'string') return '';

  let cleanFormula = formula.trim();
  if (cleanFormula.startsWith('=')) {
    cleanFormula = cleanFormula.substring(1).trim();
  }

  const subforms = context?.subforms || {};

  // 1. Process Subform Aggregates: SUM, AVG, COUNT, MIN, MAX
  // Pattern: FUNCTION(SubformName.FieldName) or FUNCTION(SubformName)
  cleanFormula = cleanFormula.replace(
    /\b(SUM|AVG|COUNT|MIN|MAX)\s*\(\s*\[?([a-zA-Z0-9_\u00C0-\u017F]+)(?:\.([a-zA-Z0-9_\u00C0-\u017F]+))?\]?\s*\)/gi,
    (match, fnName, subformOrField, subfield) => {
      const func = fnName.toUpperCase();
      let targetSubformName = subfield ? subformOrField : '';
      let targetFieldName = subfield ? subfield : subformOrField;

      // Find subform rows in context
      let rows: Record<string, any>[] = [];
      
      if (targetSubformName) {
        // Look up by subform name or key
        const matchKey = Object.keys(subforms).find(
          k => k.toLowerCase() === targetSubformName.toLowerCase()
        );
        if (matchKey && Array.isArray(subforms[matchKey])) {
          rows = subforms[matchKey];
        }
      } else {
        // Check if subformOrField is a subform itself for COUNT(Subform)
        const matchKey = Object.keys(subforms).find(
          k => k.toLowerCase() === subformOrField.toLowerCase()
        );
        if (matchKey && Array.isArray(subforms[matchKey])) {
          rows = subforms[matchKey];
          targetFieldName = '';
        } else {
          // If only 1 subform exists, assume it
          const firstSubKey = Object.keys(subforms)[0];
          if (firstSubKey && Array.isArray(subforms[firstSubKey])) {
            rows = subforms[firstSubKey];
          }
        }
      }

      if (func === 'COUNT') {
        return String(rows.length);
      }

      if (rows.length === 0) {
        return '0';
      }

      // Extract numeric values for the target field
      const values: number[] = [];
      rows.forEach(row => {
        let val = row[targetFieldName];
        if (val === undefined) {
          const matchedFieldKey = Object.keys(row).find(
            k => k.toLowerCase() === targetFieldName.toLowerCase()
          );
          if (matchedFieldKey) val = row[matchedFieldKey];
        }

        if (typeof val === 'number') {
          values.push(val);
        } else if (val !== null && val !== undefined && val !== '') {
          const num = parseFloat(String(val).replace(',', '.'));
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      });

      if (values.length === 0) return '0';

      switch (func) {
        case 'SUM': {
          const total = values.reduce((sum, v) => sum + v, 0);
          return String(Math.round(total * 10000) / 10000);
        }
        case 'AVG': {
          const sum = values.reduce((acc, v) => acc + v, 0);
          const avg = sum / values.length;
          return String(Math.round(avg * 10000) / 10000);
        }
        case 'MIN': {
          return String(Math.min(...values));
        }
        case 'MAX': {
          return String(Math.max(...values));
        }
        default:
          return '0';
      }
    }
  );

  // 2. Replace [Field Name] or [field_id] placeholders with current record values
  const expression = cleanFormula.replace(/\[([^\]]+)\]/g, (match, fieldIdentifier) => {
    const trimmedId = fieldIdentifier.trim();
    let val = record[trimmedId];

    // If not found, search case-insensitively or by name
    if (val === undefined) {
      const matchKey = Object.keys(record).find(k => k.toLowerCase() === trimmedId.toLowerCase());
      if (matchKey) {
        val = record[matchKey];
      }
    }

    if (val === undefined || val === null || val === '') {
      return '0';
    }

    if (typeof val === 'number') {
      return String(val);
    }

    // Try parsing number if numeric string
    const num = parseFloat(String(val).replace(',', '.'));
    if (!isNaN(num)) {
      return String(num);
    }

    // Return escaped string if non-numeric
    return JSON.stringify(val);
  });

  try {
    // 3. Evaluate safely with Math functions available
    // Supported helpers: Math.round, Math.min, Math.max, Math.abs, Math.floor, Math.ceil
    const sanitized = expression
      .replace(/ROUND\(([^,]+),\s*(\d+)\)/gi, 'Number(($1).toFixed($2))')
      .replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, '($1 ? $2 : $3)')
      .replace(/ABS\(([^)]+)\)/gi, 'Math.abs($1)')
      .replace(/FLOOR\(([^)]+)\)/gi, 'Math.floor($1)')
      .replace(/CEIL\(([^)]+)\)/gi, 'Math.ceil($1)');

    // Safe execution sandbox
    const result = new Function(
      'Math',
      `try { return (${sanitized}); } catch (e) { return 0; }`
    )(Math);

    if (typeof result === 'number' && !isNaN(result)) {
      return Math.round(result * 10000) / 10000;
    }
    return result;
  } catch (err) {
    return 0;
  }
}
