import { Form, Table, FormElement, FormValidationRule, CrossFieldValidation, FormValidationErrorItem } from '../../../types/index';

export const VALIDATION_PRESETS: Record<string, { label: string; pattern: string; defaultMessage: string }> = {
  email: {
    label: 'E-Mail-Adresse',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    defaultMessage: 'Bitte eine gültige E-Mail-Adresse eingeben (z. B. name@beispiel.de).',
  },
  phone_de: {
    label: 'Telefonnummer (DE/AT/CH)',
    pattern: '^(\\+49|\\+43|\\+41|0)[1-9][0-9 \\-\\.\\/\\(\\)]{5,20}$',
    defaultMessage: 'Ungültiges Telefonnummernformat.',
  },
  iban: {
    label: 'IBAN (SEPA-Bankkonto)',
    pattern: '^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{12,30}$',
    defaultMessage: 'Bitte eine gültige IBAN ohne Leerzeichen eingeben.',
  },
  postal_de: {
    label: 'Postleitzahl (5-stellig DE)',
    pattern: '^[0-9]{5}$',
    defaultMessage: 'Die Postleitzahl muss genau 5 Ziffern haben.',
  },
  tax_id_de: {
    label: 'Steuer-ID / USt-IdNr.',
    pattern: '^(DE)?[0-9]{9,11}$|^[0-9]{2,3}\\/?[0-9]{3,4}\\/?[0-9]{4,5}$',
    defaultMessage: 'Ungültige Steuer-ID oder Steuernummer.',
  },
  url: {
    label: 'Web-Adresse (URL)',
    pattern: '^https?:\\/\\/.+',
    defaultMessage: 'Bitte eine vollständige Web-Adresse mit http:// oder https:// eingeben.',
  },
  positive_number: {
    label: 'Positive Zahl (> 0)',
    pattern: '^[0-9]+([.,][0-9]+)?$',
    defaultMessage: 'Der Wert muss eine positive Zahl sein.',
  },
};

export interface FormValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  errors: FormValidationErrorItem[];
  errorsByField: Record<string, FormValidationErrorItem[]>;
  blockingErrors: FormValidationErrorItem[];
  warnings: FormValidationErrorItem[];
}

/**
 * Validates a form record against field-level rules, schema-level constraints, and cross-field validation rules.
 */
export function validateFormRecord(
  form: Form,
  sourceTable: Table | undefined,
  record: Record<string, any>,
  allTables: Table[] = []
): FormValidationResult {
  const errors: FormValidationErrorItem[] = [];

  const getFieldName = (fieldIdOrName: string): string => {
    if (!sourceTable) return fieldIdOrName;
    const f = sourceTable.fields.find(
      (field) => field.id === fieldIdOrName || field.name === fieldIdOrName || field.name?.toLowerCase() === (fieldIdOrName || '').toLowerCase()
    );
    if (f) return f.name;
    for (const t of allTables) {
      const tf = t.fields.find((field) => field.id === fieldIdOrName || field.name === fieldIdOrName);
      if (tf) return tf.name;
    }
    return fieldIdOrName || '';
  };

  // 1. Table Schema Constraints (Pflichtfelder)
  if (sourceTable) {
    for (const field of sourceTable.fields) {
      if (
        !field.allowNull &&
        !field.isNullable &&
        !field.isAutoIncrement &&
        !field.sequenceConfig?.enabled &&
        field.type !== 'BOOLEAN'
      ) {
        const val = record[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors.push({
            id: `schema_req_${field.id || field.name}`,
            fieldId: field.id || field.name,
            fieldName: field.name,
            message: `Pflichtfeld: '${field.name}' darf nicht leer sein.`,
            ruleType: 'required',
            severity: 'error',
            isCrossField: false,
          });
        }
      }
    }
  }

  // 2. Collect field-level and element-level validation rules
  const allRules: FormValidationRule[] = [...(form.validationRules || [])];
  const collectElementRules = (el?: FormElement) => {
    if (!el) return;
    if (el.validationRules && el.validationRules.length > 0) {
      allRules.push(...el.validationRules);
    }
    if (el.children) {
      el.children.forEach(collectElementRules);
    }
  };
  collectElementRules(form.layout);

  for (const rule of allRules) {
    const fieldName = getFieldName(rule.fieldId);
    const val = record[fieldName];
    const severity = rule.severity || 'error';

    // Required check
    if (rule.type === 'required') {
      if (val === undefined || val === null || String(val).trim() === '' || (typeof val === 'boolean' && !val)) {
        errors.push({
          id: rule.id || `rule_req_${rule.fieldId}`,
          fieldId: rule.fieldId,
          fieldName,
          message: rule.errorMessage || `Feld '${fieldName}' ist erforderlich.`,
          ruleType: 'required',
          severity,
          isCrossField: false,
        });
      }
    }

    // Regex & Presets
    let pattern = rule.regexPattern;
    if (rule.type === 'preset' && rule.preset && VALIDATION_PRESETS[rule.preset]) {
      pattern = VALIDATION_PRESETS[rule.preset].pattern;
    }

    if ((rule.type === 'regex' || rule.type === 'preset') && pattern && val !== undefined && val !== null && String(val).trim() !== '') {
      try {
        const re = new RegExp(pattern);
        if (!re.test(String(val).trim())) {
          errors.push({
            id: rule.id || `rule_regex_${rule.fieldId}`,
            fieldId: rule.fieldId,
            fieldName,
            message: rule.errorMessage || (rule.preset && VALIDATION_PRESETS[rule.preset]?.defaultMessage) || `Feld '${fieldName}' entspricht nicht dem erforderlichen Format.`,
            ruleType: 'regex',
            severity,
            isCrossField: false,
          });
        }
      } catch (e) {
        console.error('[ValidationEngine] Invalid Regex pattern:', pattern, e);
      }
    }

    // Min check
    if (rule.type === 'min' && rule.minValue !== undefined && val !== undefined && val !== null && String(val).trim() !== '') {
      const num = Number(String(val).replace(',', '.'));
      if (!isNaN(num) && num < rule.minValue) {
        errors.push({
          id: rule.id || `rule_min_${rule.fieldId}`,
          fieldId: rule.fieldId,
          fieldName,
          message: rule.errorMessage || `Feld '${fieldName}' muss mindestens ${rule.minValue} betragen.`,
          ruleType: 'min',
          severity,
          isCrossField: false,
        });
      }
    }

    // Max check
    if (rule.type === 'max' && rule.maxValue !== undefined && val !== undefined && val !== null && String(val).trim() !== '') {
      const num = Number(String(val).replace(',', '.'));
      if (!isNaN(num) && num > rule.maxValue) {
        errors.push({
          id: rule.id || `rule_max_${rule.fieldId}`,
          fieldId: rule.fieldId,
          fieldName,
          message: rule.errorMessage || `Feld '${fieldName}' darf höchstens ${rule.maxValue} betragen.`,
          ruleType: 'max',
          severity,
          isCrossField: false,
        });
      }
    }

    // Custom JS
    if (rule.type === 'custom_js' && rule.customJsCode) {
      try {
        const evalFn = new Function('record', 'value', 'fieldName', rule.customJsCode);
        const result = evalFn(record, val, fieldName);
        if (result === false || typeof result === 'string') {
          errors.push({
            id: rule.id || `rule_js_${rule.fieldId}`,
            fieldId: rule.fieldId,
            fieldName,
            message: (typeof result === 'string' ? result : rule.errorMessage) || `Validierung für Feld '${fieldName}' fehlgeschlagen.`,
            ruleType: 'custom_js',
            severity,
            isCrossField: false,
          });
        }
      } catch (err) {
        console.error('[ValidationEngine] Custom JS validation execution failed:', err);
      }
    }
  }

  // 3. Cross-Field Validations
  if (form.crossFieldValidations && form.crossFieldValidations.length > 0) {
    for (const cf of form.crossFieldValidations) {
      const triggerName = getFieldName(cf.triggerFieldId);
      const targetName = getFieldName(cf.targetFieldId);
      const triggerVal = record[triggerName];
      const targetVal = record[targetName];
      const severity = cf.severity || 'error';

      let compareVal: any = cf.triggerValue;
      if (cf.compareMode === 'field' && cf.compareFieldId) {
        const compName = getFieldName(cf.compareFieldId);
        compareVal = record[compName];
      }

      let isTriggerMet = false;
      switch (cf.condition) {
        case 'equals':
          isTriggerMet = String(triggerVal ?? '').trim() === String(compareVal ?? '').trim();
          break;
        case 'not_equals':
          isTriggerMet = String(triggerVal ?? '').trim() !== String(compareVal ?? '').trim();
          break;
        case 'greater_than':
          isTriggerMet = Number(triggerVal) > Number(compareVal);
          break;
        case 'less_than':
          isTriggerMet = Number(triggerVal) < Number(compareVal);
          break;
        case 'greater_equal':
          isTriggerMet = Number(triggerVal) >= Number(compareVal);
          break;
        case 'less_equal':
          isTriggerMet = Number(triggerVal) <= Number(compareVal);
          break;
        case 'date_after':
          if (triggerVal && compareVal) {
            isTriggerMet = new Date(triggerVal).getTime() > new Date(compareVal).getTime();
          }
          break;
        case 'date_before':
          if (triggerVal && compareVal) {
            isTriggerMet = new Date(triggerVal).getTime() < new Date(compareVal).getTime();
          }
          break;
        case 'not_empty':
          isTriggerMet = triggerVal !== undefined && triggerVal !== null && String(triggerVal).trim() !== '';
          break;
        case 'is_empty':
          isTriggerMet = triggerVal === undefined || triggerVal === null || String(triggerVal).trim() === '';
          break;
        case 'is_true':
          isTriggerMet = Boolean(triggerVal);
          break;
        case 'is_false':
          isTriggerMet = !Boolean(triggerVal);
          break;
        case 'matches_field':
          isTriggerMet = String(triggerVal ?? '') === String(compareVal ?? '');
          break;
      }

      if (cf.action === 'require' && isTriggerMet) {
        if (targetVal === undefined || targetVal === null || String(targetVal).trim() === '') {
          errors.push({
            id: cf.id,
            fieldId: cf.targetFieldId,
            fieldName: targetName,
            message: cf.errorMessage || `Wenn '${triggerName}' gesetzt ist, muss '${targetName}' ausgefüllt werden.`,
            ruleType: 'cross_field_require',
            severity,
            isCrossField: true,
          });
        }
      } else if (cf.action === 'error_if' && isTriggerMet) {
        errors.push({
          id: cf.id,
          fieldId: cf.targetFieldId || cf.triggerFieldId,
          fieldName: targetName || triggerName,
          message: cf.errorMessage || `Ungültige Kombination zwischen '${triggerName}' und '${targetName}'.`,
          ruleType: 'cross_field_error',
          severity,
          isCrossField: true,
        });
      } else if (cf.action === 'validate_after' && triggerVal && targetVal) {
        // Date consistency check: target should be after trigger
        if (new Date(targetVal).getTime() < new Date(triggerVal).getTime()) {
          errors.push({
            id: cf.id,
            fieldId: cf.targetFieldId,
            fieldName: targetName,
            message: cf.errorMessage || `'${targetName}' darf zeitlich nicht vor '${triggerName}' liegen.`,
            ruleType: 'date_order',
            severity,
            isCrossField: true,
          });
        }
      }
    }
  }

  const errorsByField: Record<string, FormValidationErrorItem[]> = {};
  for (const err of errors) {
    if (!errorsByField[err.fieldName]) {
      errorsByField[err.fieldName] = [];
    }
    errorsByField[err.fieldName].push(err);
  }

  const blockingErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  return {
    isValid: blockingErrors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    errorsByField,
    blockingErrors,
    warnings,
  };
}
