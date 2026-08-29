import { Field, Table, ValidationRule } from '../../../types';

export interface ValidationError {
  rowId?: any;
  fieldName: string;
  fieldLabel?: string;
  message: string;
  ruleId?: string;
  severity: 'error' | 'warning';
}

export function validateFieldValue(
  value: any,
  field: Field,
  record: Record<string, any>,
  rules: ValidationRule[] = []
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required constraint check
  if (field.allowNull === false && !field.isAutoIncrement && !field.isPrimaryKey) {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      errors.push({
        fieldName: field.name,
        message: `Feld "${field.name}" ist ein Pflichtfeld und darf nicht leer sein.`,
        severity: 'error',
      });
    }
  }

  // Domain types basic validation
  if (field.type === 'IBAN' && value) {
    const cleaned = String(value).replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{12,30}$/.test(cleaned)) {
      errors.push({
        fieldName: field.name,
        message: `Ungültiges IBAN-Format (z.B. DE89 3704 0044 0532 0130 00).`,
        severity: 'warning',
      });
    }
  }

  if (field.type === 'BIC' && value) {
    const cleaned = String(value).replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
      errors.push({
        fieldName: field.name,
        message: `Ungültiges BIC / SWIFT Format (8 oder 11 Stellen).`,
        severity: 'warning',
      });
    }
  }

  if (field.type === 'EMAIL' && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors.push({
        fieldName: field.name,
        message: `Ungültige E-Mail-Adresse.`,
        severity: 'warning',
      });
    }
  }

  // Evaluate Custom Validation Rules
  const fieldRules = rules.filter((r) => r.fieldId === field.id || r.fieldId === field.name);
  for (const rule of fieldRules) {
    const compareVal = rule.compareType === 'field' ? record[rule.compareValue] : rule.compareValue;
    const isValid = checkRuleCondition(value, rule.operator, compareVal, field.type);

    if (!isValid) {
      errors.push({
        ruleId: rule.id,
        fieldName: field.name,
        message:
          rule.errorMessage ||
          `Regelverletzung für ${field.name}: Bedingung (${rule.operator} ${rule.compareValue}) nicht erfüllt.`,
        severity: 'error',
      });
    }
  }

  return errors;
}

function checkRuleCondition(val: any, op: string, compareVal: any, type: string): boolean {
  if (val === null || val === undefined || val === '') return true; // Empty values skipped unless required rule

  const isNumeric = ['INTEGER', 'DECIMAL', 'REAL', 'CURRENCY', 'PERCENTAGE'].includes(type);

  if (isNumeric) {
    const numA = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    const numB = typeof compareVal === 'number' ? compareVal : parseFloat(String(compareVal).replace(',', '.'));
    if (isNaN(numA) || isNaN(numB)) return true;

    switch (op) {
      case 'gt': return numA > numB;
      case 'gte': return numA >= numB;
      case 'lt': return numA < numB;
      case 'lte': return numA <= numB;
      case 'eq': return numA === numB;
      case 'neq': return numA !== numB;
      default: return true;
    }
  }

  if (type === 'DATE' || type === 'DATETIME') {
    const dateA = new Date(val).getTime();
    const dateB = new Date(compareVal).getTime();
    if (isNaN(dateA) || isNaN(dateB)) return true;

    switch (op) {
      case 'gt': return dateA > dateB;
      case 'gte': return dateA >= dateB;
      case 'lt': return dateA < dateB;
      case 'lte': return dateA <= dateB;
      case 'eq': return dateA === dateB;
      case 'neq': return dateA !== dateB;
      default: return true;
    }
  }

  // String / Regex
  const strA = String(val);
  const strB = String(compareVal ?? '');

  switch (op) {
    case 'eq': return strA === strB;
    case 'neq': return strA !== strB;
    case 'regex':
      try {
        const re = new RegExp(strB);
        return re.test(strA);
      } catch {
        return true;
      }
    default: return true;
  }
}

export function validateTableRecord(
  record: Record<string, any>,
  table: Table
): ValidationError[] {
  const allErrors: ValidationError[] = [];
  const rules = table.validationRules || [];

  for (const field of table.fields) {
    const val = record[field.name];
    const fieldErrors = validateFieldValue(val, field, record, rules);
    allErrors.push(...fieldErrors);
  }

  return allErrors;
}
