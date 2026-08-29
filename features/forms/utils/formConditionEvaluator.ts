import { FormElement } from '../../../types/form';

/**
 * Form Dynamic Condition & Security Evaluator
 * Evaluates visibility rules, dynamic editability locks (ReadOnlyIf), and Field-Level RBAC.
 */

export function isElementVisible(
  element: FormElement,
  record: Record<string, any>,
  userRoles: string[] = ['admin', 'kalkulator', 'bauleiter']
): boolean {
  // 1. Role-based check (allowedRoles & fieldRbac.readRoles)
  if (element.allowedRoles && element.allowedRoles.length > 0) {
    const hasRole = element.allowedRoles.some(r => userRoles.includes(r));
    if (!hasRole) return false;
  }

  if (element.fieldRbac?.readRoles && element.fieldRbac.readRoles.length > 0) {
    const hasReadRole = element.fieldRbac.readRoles.some(r => userRoles.includes(r));
    if (!hasReadRole) return false;
  }

  // 2. Structured visibilityCondition
  if (element.visibilityCondition && element.visibilityCondition.fieldId) {
    const { fieldId, operator, value } = element.visibilityCondition;
    const currentVal = record[fieldId];

    switch (operator) {
      case 'eq':
        if (String(currentVal) !== String(value)) return false;
        break;
      case 'neq':
        if (String(currentVal) === String(value)) return false;
        break;
      case 'gt':
        if (Number(currentVal || 0) <= Number(value)) return false;
        break;
      case 'gte':
        if (Number(currentVal || 0) < Number(value)) return false;
        break;
      case 'lt':
        if (Number(currentVal || 0) >= Number(value)) return false;
        break;
      case 'lte':
        if (Number(currentVal || 0) > Number(value)) return false;
        break;
      case 'contains':
        if (!String(currentVal || '').toLowerCase().includes(String(value).toLowerCase())) return false;
        break;
      case 'empty':
        if (currentVal !== undefined && currentVal !== null && currentVal !== '') return false;
        break;
      case 'not_empty':
        if (currentVal === undefined || currentVal === null || currentVal === '') return false;
        break;
    }
  }

  // 3. Dynamic visibleIf expression (e.g. "[Sicherheitseinbehalt] > 0" or "[Status] != 'Abgeschlossen'")
  if (element.visibleIf && typeof element.visibleIf === 'string') {
    try {
      const expr = element.visibleIf.replace(/\[([^\]]+)\]/g, (match, fieldName) => {
        const val = record[fieldName.trim()];
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return String(val);
        return JSON.stringify(val ?? '');
      });

      const fn = new Function(`try { return Boolean(${expr}); } catch (e) { return true; }`);
      const result = fn();
      if (!result) return false;
    } catch {
      // If error in expression, stay visible by default
    }
  }

  return true;
}

export function isElementReadOnly(
  element: FormElement,
  record: Record<string, any>,
  userRoles: string[] = ['admin', 'kalkulator', 'bauleiter'],
  formReadOnly: boolean = false
): boolean {
  if (formReadOnly) return true;

  // 1. Role-based write check
  if (element.fieldRbac?.writeRoles && element.fieldRbac.writeRoles.length > 0) {
    const hasWriteRole = element.fieldRbac.writeRoles.some(r => userRoles.includes(r));
    if (!hasWriteRole) return true;
  }

  // 2. Dynamic readOnlyIf expression (e.g. "[Status] == 'Freigegeben'")
  if (element.readOnlyIf && typeof element.readOnlyIf === 'string') {
    try {
      const expr = element.readOnlyIf.replace(/\[([^\]]+)\]/g, (match, fieldName) => {
        const val = record[fieldName.trim()];
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return String(val);
        return JSON.stringify(val ?? '');
      });

      const fn = new Function(`try { return Boolean(${expr}); } catch (e) { return false; }`);
      const result = fn();
      if (result) return true;
    } catch {
      // If error, do not force read only
    }
  }

  return false;
}
