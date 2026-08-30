import { Table, Field } from '../../../types/index';

export interface ValidationIssue {
  field: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  mappedRecord: Record<string, any>;
  unmappedFields: string[];
}

export function validatePayloadAgainstTable(
  payload: Record<string, any>,
  table: Table
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const mappedRecord: Record<string, any> = {};
  const payloadKeys = Object.keys(payload || {});
  const matchedKeys = new Set<string>();

  // Verify each table field
  for (const field of table.fields) {
    // Look for matching key (case-insensitive or exact)
    const matchedKey = payloadKeys.find(
      k => k.toLowerCase() === field.name.toLowerCase() ||
           k.toLowerCase().replace(/[^a-z0-9]/g, '') === field.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    if (matchedKey) {
      matchedKeys.add(matchedKey);
      const rawVal = payload[matchedKey];

      // Check nullability
      if (rawVal === null || rawVal === undefined || rawVal === '') {
        if (field.isNullable === false && !field.isPrimaryKey) {
          issues.push({
            field: field.name,
            type: 'error',
            message: `Pflichtfeld '${field.name}' darf nicht NULL oder leer sein.`
          });
        }
        mappedRecord[field.name] = null;
        continue;
      }

      // Type checking & coercion
      const fieldType = (field.type || 'VARCHAR').toUpperCase();
      if (['INT', 'INTEGER', 'BIGINT', 'TINYINT', 'DECIMAL', 'DOUBLE', 'FLOAT', 'REAL'].includes(fieldType)) {
        const num = Number(rawVal);
        if (isNaN(num)) {
          issues.push({
            field: field.name,
            type: 'error',
            message: `Wert '${rawVal}' ist keine gültige Zahl für Spalte '${field.name}' (${field.type}).`
          });
        } else {
          mappedRecord[field.name] = num;
        }
      } else if (fieldType === 'BOOLEAN') {
        if (typeof rawVal === 'boolean') {
          mappedRecord[field.name] = rawVal;
        } else if (['true', '1', 'yes', 'ja'].includes(String(rawVal).toLowerCase())) {
          mappedRecord[field.name] = true;
          issues.push({
            field: field.name,
            type: 'info',
            message: `String '${rawVal}' wurde automatisch zu boolean true konvertiert.`
          });
        } else {
          mappedRecord[field.name] = false;
        }
      } else if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(fieldType)) {
        const parsedDate = new Date(rawVal);
        if (isNaN(parsedDate.getTime())) {
          issues.push({
            field: field.name,
            type: 'warning',
            message: `Ungültiges Datumsformat '${rawVal}' in Spalte '${field.name}'.`
          });
          mappedRecord[field.name] = String(rawVal);
        } else {
          mappedRecord[field.name] = fieldType === 'DATE' 
            ? parsedDate.toISOString().split('T')[0] 
            : parsedDate.toISOString();
        }
      } else if (fieldType === 'JSON') {
        if (typeof rawVal === 'object') {
          mappedRecord[field.name] = rawVal;
        } else {
          try {
            mappedRecord[field.name] = JSON.parse(rawVal);
          } catch {
            issues.push({
              field: field.name,
              type: 'error',
              message: `Wert in '${field.name}' ist kein valides JSON-Objekt.`
            });
          }
        }
      } else {
        mappedRecord[field.name] = String(rawVal);
      }
    } else {
      // Key missing in payload
      if (field.isNullable === false && !field.isPrimaryKey && !field.defaultValue) {
        issues.push({
          field: field.name,
          type: 'error',
          message: `Erforderliches Pflichtfeld '${field.name}' fehlt in der eingehenden Webhook-Payload.`
        });
      }
    }
  }

  // Identify unmapped extra fields
  const unmappedFields = payloadKeys.filter(k => !matchedKeys.has(k));
  if (unmappedFields.length > 0) {
    issues.push({
      field: unmappedFields.join(', '),
      type: 'warning',
      message: `Folgende ${unmappedFields.length} Payload-Felder existieren nicht in Tabelle '${table.name}': ${unmappedFields.join(', ')}`
    });
  }

  const hasErrors = issues.some(i => i.type === 'error');

  return {
    isValid: !hasErrors,
    issues,
    mappedRecord,
    unmappedFields
  };
}
