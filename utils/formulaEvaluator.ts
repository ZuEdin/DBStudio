/**
 * Client-Side Formula Evaluator for Calculated Fields in Forms & Tables
 * Safely evaluates MS Access / Excel-style field formulas without backend roundtrips.
 * Examples:
 * - "[Preis] * [Menge]"
 * - "AGE([Geburtsdatum])" or "ALTER([Geburtsdatum])"
 * - "[Gesamtbetrag] * (1 - [Rabatt] / 100)"
 * - "[Vorname] + ' ' + [Nachname]"
 * - "ROUND([Netto] * 1.19, 2)"
 */

export function calculateDetailedAge(birthdateInput: string | Date): string {
  if (!birthdateInput) return '';
  let birthDate: Date;
  
  if (birthdateInput instanceof Date) {
    birthDate = birthdateInput;
  } else {
    const str = String(birthdateInput).trim().replace(/^["']|["']$/g, '');
    if (!str || str === '0') return '';
    
    // Support German date format DD.MM.YYYY
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
      const [d, m, y] = str.split('.').map(Number);
      birthDate = new Date(y, m - 1, d);
    } else {
      birthDate = new Date(str);
    }
  }

  if (isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return 'Datum in der Zukunft';

  const parts = [];
  if (years === 1) parts.push('1 Jahr');
  else if (years > 1) parts.push(`${years} Jahre`);

  if (months === 1) parts.push('1 Monat');
  else if (months > 1) parts.push(`${months} Monate`);

  if (days === 1) parts.push('1 Tag');
  else parts.push(`${days} Tage`);

  return parts.length > 0 ? parts.join(', ') : '0 Tage';
}

export function evaluateFormFormula(
  formula: string,
  record: Record<string, any>,
  fieldMap?: Record<string, string> // maps field ID to field Name if needed
): any {
  if (!formula || typeof formula !== 'string' || formula.trim() === '') {
    return '';
  }

  try {
    let expr = formula.trim();

    // Direct check for AGE / ALTER function or field
    const ageMatch = expr.match(/^(?:AGE|ALTER|ALTER_JMD|DATEDIFF)\s*\(\s*\[([^\]]+)\]\s*\)$/i);
    if (ageMatch) {
      const fieldKey = ageMatch[1];
      const actualFieldName = fieldMap && fieldMap[fieldKey] ? fieldMap[fieldKey] : fieldKey;
      let val = record[actualFieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === actualFieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }
      return calculateDetailedAge(val);
    }

    // 1. Replace [FieldName] or [field_id] placeholders with record values
    expr = expr.replace(/\[([^\]]+)\]/g, (_, nameOrId) => {
      const fieldName = fieldMap && fieldMap[nameOrId] ? fieldMap[nameOrId] : nameOrId;
      let val = record[fieldName];

      // Case-insensitive fallback lookup
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === fieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }

      if (val === undefined || val === null || val === '') {
        return '0';
      }

      // If value is a string enclosed in quotes or string concatenation, handle string vs number
      if (typeof val === 'number') {
        return String(val);
      } else if (typeof val === 'boolean') {
        return val ? '1' : '0';
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        return String(Number(val));
      } else {
        // Wrap string value in JSON quotes for string expressions
        return JSON.stringify(String(val));
      }
    });

    // Handle AGE(...) or ALTER(...) function with string literal argument after replacement
    expr = expr.replace(/(?:AGE|ALTER|ALTER_JMD)\s*\(([^)]+)\)/gi, (_, innerVal) => {
      const calculatedAge = calculateDetailedAge(innerVal);
      return JSON.stringify(calculatedAge);
    });

    // 2. Handle simple string concatenation like "Max" + ' ' + "Mustermann"
    if (expr.includes('+') && (expr.includes('"') || expr.includes("'"))) {
      // Clean string expression evaluation
      const parts = expr.split('+').map(p => {
        const trimmed = p.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
      return parts.join('');
    }

    // 3. Supported Math functions: ROUND, ABS, MIN, MAX
    expr = expr.replace(/ROUND\(([^,]+),\s*(\d+)\)/gi, (_, innerExpr, decimals) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Number(num || 0).toFixed(parseInt(decimals)));
    });

    expr = expr.replace(/ABS\(([^)]+)\)/gi, (_, innerExpr) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Math.abs(Number(num || 0)));
    });

    // 4. Safe math evaluation
    const safeExpr = expr.replace(/[^0-9.\-/*+()% ]/g, '');
    if (!safeExpr) return '';

    // Standard Math Function evaluation
    const fn = new Function(`"use strict"; return (${safeExpr});`);
    const result = fn();

    if (typeof result === 'number' && !isNaN(result)) {
      return Number.isInteger(result) ? result : Number(result.toFixed(2));
    }
    return result ?? '';
  } catch (err) {
    // Return empty on parse error
    return '';
  }
}

