import React from 'react';
import { PageFilterRule, QuickFilterPreset, ColumnDisplayConfig } from '../../../types';
import { getNestedValueCaseInsensitive } from './pageViewUtils';
import { formatDate } from './formatUtils';

export function applyFilterRules(
  data: any[],
  filterRules?: PageFilterRule[],
  filterLogic: 'AND' | 'OR' = 'AND',
  params: Record<string, any> = {},
  context?: Record<string, any>,
  legacyField?: string,
  legacyParam?: string,
  options?: { isContainer?: boolean; autoFilterBySelectedId?: boolean }
): any[] {
  if (!data || data.length === 0) return [];

  // 1. If filterRules exist and have entries
  if (filterRules && filterRules.length > 0) {
    return data.filter(row => {
      const results = filterRules.map(rule => {
        let compareValue: any;

        const valKey = rule.value || (rule.valueSource === 'parameter' ? 'selectedId' : 'id');

        if (rule.valueSource === 'parameter') {
          compareValue = params ? getNestedValueCaseInsensitive(params, valKey) : undefined;
          if (compareValue === undefined && context) {
            compareValue = getNestedValueCaseInsensitive(context, valKey);
          }
          if (rule.ignoreIfEmpty && (compareValue === undefined || compareValue === null || compareValue === '')) {
            return true; // Pass filter
          }
        } else if (rule.valueSource === 'parent_context') {
          compareValue = context ? getNestedValueCaseInsensitive(context, valKey) : undefined;
          if (compareValue === undefined && params) {
            compareValue = getNestedValueCaseInsensitive(params, valKey);
          }
          if (rule.ignoreIfEmpty && (compareValue === undefined || compareValue === null || compareValue === '')) {
            return true; // Pass filter
          }
        } else if (rule.valueSource === 'static') {
          compareValue = rule.value;
        } else if (rule.valueSource === 'auth_user') {
          compareValue = params?.userId || params?.currentUserId || '1';
        } else {
          compareValue = rule.value;
        }

        const rowValue = getNestedValueCaseInsensitive(row, rule.field);

        // Evaluate operator
        return evaluateCondition(rowValue, rule.operator, compareValue);
      });

      return filterLogic === 'OR' 
        ? results.some(r => r === true)
        : results.every(r => r === true);
    });
  }

  // 2. Fallback to legacy filterParamField & filterParamName (with smart defaults)
  if (legacyField || legacyParam) {
    const effectiveField = legacyField || 'id';
    const effectiveParam = legacyParam || 'selectedId';
    const filterVal = params ? getNestedValueCaseInsensitive(params, effectiveParam) : undefined;
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      return data.filter(row => evaluateCondition(getNestedValueCaseInsensitive(row, effectiveField), 'equals', filterVal));
    }
  }

  // 3. Auto filter for Containers if selectedId is present and single-record binding is expected
  if (options?.autoFilterBySelectedId || options?.isContainer) {
    const selId = params?.selectedId ?? params?.id ?? params?.selected_id;
    if (selId !== undefined && selId !== null && selId !== '') {
      const match = data.find(row => {
        const rowId = getNestedValueCaseInsensitive(row, 'id') ?? getNestedValueCaseInsensitive(row, 'Id') ?? getNestedValueCaseInsensitive(row, 'ID');
        return evaluateCondition(rowId, 'equals', selId);
      });
      if (match) return [match];
    }
  }

  return data;
}

export function evaluateCondition(rowValue: any, operator: string, compareValue: any): boolean {
  if (operator === 'is_empty') {
    return rowValue === undefined || rowValue === null || rowValue === '' || (Array.isArray(rowValue) && rowValue.length === 0);
  }
  if (operator === 'is_not_empty') {
    return rowValue !== undefined && rowValue !== null && rowValue !== '' && (!Array.isArray(rowValue) || rowValue.length > 0);
  }

  if (rowValue === undefined || rowValue === null) {
    rowValue = '';
  }
  if (compareValue === undefined || compareValue === null) {
    compareValue = '';
  }

  // Check numeric equivalence
  const numRow = Number(rowValue);
  const numComp = Number(compareValue);
  const isBothNumeric = !isNaN(numRow) && !isNaN(numComp) && String(rowValue).trim() !== '' && String(compareValue).trim() !== '';

  const strRow = String(rowValue).trim().toLowerCase();
  const strComp = String(compareValue).trim().toLowerCase();

  switch (operator) {
    case 'equals':
    case '==':
    case 'eq':
      if (isBothNumeric) return numRow === numComp;
      return strRow === strComp;
    case 'not_equals':
    case '!=':
    case 'neq':
      if (isBothNumeric) return numRow !== numComp;
      return strRow !== strComp;
    case 'contains':
      return strRow.includes(strComp);
    case 'not_contains':
      return !strRow.includes(strComp);
    case 'starts_with':
      return strRow.startsWith(strComp);
    case 'ends_with':
      return strRow.endsWith(strComp);
    case 'greater_than':
    case '>':
    case 'gt':
      if (isBothNumeric) return numRow > numComp;
      return parseFloat(strRow) > parseFloat(strComp);
    case 'less_than':
    case '<':
    case 'lt':
      if (isBothNumeric) return numRow < numComp;
      return parseFloat(strRow) < parseFloat(strComp);
    case 'greater_or_equal':
    case '>=':
    case 'gte':
      if (isBothNumeric) return numRow >= numComp;
      return parseFloat(strRow) >= parseFloat(strComp);
    case 'less_or_equal':
    case '<=':
    case 'lte':
      if (isBothNumeric) return numRow <= numComp;
      return parseFloat(strRow) <= parseFloat(strComp);
    case 'in_list': {
      const items = String(compareValue).split(',').map(s => s.trim().toLowerCase());
      return items.includes(strRow);
    }
    default:
      if (isBothNumeric) return numRow === numComp;
      return strRow === strComp;
  }
}

export function formatColumnValue(value: any, config?: ColumnDisplayConfig): { formatted: React.ReactNode; raw: any } {
  if (value === undefined || value === null) {
    return { formatted: <span className="text-slate-300">-</span>, raw: value };
  }

  const isIsoDate = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2})?/.test(value.trim());

  if (!config || !config.format || config.format === 'text') {
    if (isIsoDate) {
      const formattedDate = formatDate(value, 'DD.MM.YYYY');
      if (formattedDate) return { formatted: formattedDate, raw: value };
    }
    return { formatted: String(value), raw: value };
  }

  switch (config.format) {
    case 'currency': {
      const num = Number(value);
      if (isNaN(num)) return { formatted: String(value), raw: value };
      const symbol = config.currencySymbol || '€';
      return { 
        formatted: (
          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
            {num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {symbol}
          </span>
        ), 
        raw: num 
      };
    }
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return { formatted: String(value), raw: value };
      return { 
        formatted: <span className="font-mono">{num.toLocaleString('de-DE')}</span>, 
        raw: num 
      };
    }
    case 'date': {
      const formattedDate = formatDate(value, 'DD.MM.YYYY');
      return { formatted: formattedDate || String(value), raw: value };
    }
    case 'datetime': {
      const formattedDate = formatDate(value, 'DD.MM.YYYY HH:mm');
      return { formatted: formattedDate || String(value), raw: value };
    }
    case 'boolean': {
      const isTrue = value === true || value === 'true' || value === 1 || value === '1';
      return {
        formatted: isTrue ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
            ✓ Ja
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            ✕ Nein
          </span>
        ),
        raw: isTrue
      };
    }
    case 'badge': {
      const str = String(value);
      const isGreen = /aktiv|erledigt|fertig|bezahlt|success|online/i.test(str);
      const isRed = /storniert|inaktiv|fehler|abgebrochen|offline/i.test(str);
      const isYellow = /offen|wartend|in bearbeitung|pending|neu/i.test(str);

      const colorClasses = isGreen
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
        : isRed
        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200'
        : isYellow
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200'
        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200';

      return {
        formatted: (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
            {str}
          </span>
        ),
        raw: value
      };
    }
    default:
      return { formatted: String(value), raw: value };
  }
}
