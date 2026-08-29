/**
 * Cascading & Dependent Lookup Engine
 * Manages dependent select dropdowns and hierarchical filtering (e.g. Gewerk -> Leistungsgruppe -> Position).
 */

import { Table, Query, FormElement } from '../../../types/index';

export interface DependentLookupOption {
  value: any;
  label: string;
  disabled?: boolean;
  meta?: Record<string, any>;
}

export function resolveLookupOptions(
  config: any,
  element: FormElement | undefined,
  currentRecord: Record<string, any>,
  allTables: Table[],
  queries?: Query[],
  executeQuery?: (q: Query, context?: any) => Record<string, any>[]
): DependentLookupOption[] {
  if (!config || !config.tableId) {
    return [{ value: '', label: '(Keine Datenquelle konfiguriert)' }];
  }

  let rows: any[] = [];
  let fields: any[] = [];

  const table = allTables.find((t) => t.id === config.tableId);
  if (table) {
    rows = [...(table.data || [])];
    fields = table.fields.map((f) => ({ id: f.id, name: f.name, isPrimaryKey: f.isPrimaryKey }));
  } else if (queries && executeQuery) {
    const query = queries.find((q) => q.id === config.tableId);
    if (query && query.type === 'SELECT') {
      const context: Record<string, any> = {};
      if (currentRecord) {
        for (const key in currentRecord) {
          context[`record.${key.toLowerCase()}`] = currentRecord[key];
        }
      }
      rows = [...executeQuery(query, context)];
      fields = query.columns.map((c) => ({ id: c.id, name: c.alias || c.fieldName, isPrimaryKey: false }));
    }
  }

  if (rows.length === 0) {
    return [{ value: '', label: '(Keine Daten verfügbar)' }];
  }

  // 1. Cascading Dependency Check
  const dep = element?.dependentLookup || config?.dependentLookup;
  if (dep && dep.parentFieldId && dep.parentFilterKey) {
    // Look up parent field value in current record
    let parentVal = currentRecord[dep.parentFieldId];
    if (parentVal === undefined) {
      // Try by matching field names
      const matchKey = Object.keys(currentRecord).find(
        k => k.toLowerCase() === dep.parentFieldId.toLowerCase()
      );
      if (matchKey) {
        parentVal = currentRecord[matchKey];
      }
    }

    if (parentVal === undefined || parentVal === null || parentVal === '') {
      return [
        {
          value: '',
          label: `(Bitte zuerst übergeordnetes Feld wählen)`,
          disabled: true,
        },
      ];
    }

    // Filter rows based on parentFilterKey in lookup table
    rows = rows.filter((r) => {
      let rowVal = r[dep.parentFilterKey];
      if (rowVal === undefined) {
        const rowMatchKey = Object.keys(r).find(
          (k) => k.toLowerCase() === dep.parentFilterKey.toLowerCase()
        );
        if (rowMatchKey) rowVal = r[rowMatchKey];
      }
      return String(rowVal ?? '').toLowerCase() === String(parentVal).toLowerCase();
    });

    if (rows.length === 0) {
      return [{ value: '', label: `(Keine passenden Einträge für Auswahl)` }];
    }
  }

  // 2. Sorting
  if (config.sort && config.sort.fieldId) {
    const sortField = fields.find((f) => f.id === config.sort.fieldId || f.name === config.sort.fieldId);
    if (sortField) {
      const fieldName = sortField.name;
      const direction = config.sort.direction || 'ASC';
      rows.sort((a, b) => {
        const valA = a[fieldName];
        const valB = b[fieldName];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        }
        return direction === 'ASC' ? comparison : -comparison;
      });
    }
  }

  // 3. Formatting
  if (config.displayFormat && config.displayFormat.length > 0) {
    return rows.map((row) => {
      const label = config.displayFormat
        .map((item: any) => {
          const f = fields.find((field) => field.id === item.fieldId || field.name === item.fieldId);
          return `${item.prefix || ''}${f ? row[f.name] : ''}${item.suffix || ''}`;
        })
        .join('');
      const valField = fields.find((f) => f.id === config.valueFieldId || f.name === config.valueFieldId) || fields.find((f) => f.isPrimaryKey);
      return {
        value: valField ? row[valField.name] : (row.id || Object.values(row)[0]),
        label: label.trim() || String(row.id || Object.values(row)[0]),
        meta: row,
      };
    });
  }

  return rows.map((row) => {
    const val = row.id ?? Object.values(row)[0];
    const lbl = Object.values(row).slice(0, 2).filter(Boolean).join(' - ');
    return {
      value: val,
      label: lbl || String(val),
      meta: row,
    };
  });
}
