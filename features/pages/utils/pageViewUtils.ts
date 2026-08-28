import { createContext } from 'react';
import { applyPipeChain, formatFieldValue, formatDate, formatCurrency, formatNumber, FieldFormatOptions } from './formatUtils';

export * from './formatUtils';

// Context for managing page parameters (e.g. selectedId, activeTab)
export const PageParamsContext = createContext<{
    params: Record<string, any>;
    setParam: (key: string, value: any) => void;
}>({
    params: {},
    setParam: () => {}
});

// Context for managing page interactions (modals, confirmation overlays, page-navigation, macros)
export const PageViewContext = createContext<{
    openFormModal: (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void, defaultValues?: Record<string, any>) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    openMacroModal?: () => void;
    openSmartImportModal?: (targetTableId?: string) => void;
    activeRole?: string;
}>({
    openFormModal: () => {},
    showConfirm: () => {},
    navigate: () => {},
    openMacroModal: () => {},
    openSmartImportModal: () => {},
    activeRole: 'Admin'
});

// Helper to strip standard accessor prefixes (e.g. context.xyz, params.xyz, row.xyz, item['xyz'])
export const stripAccessorPrefix = (path: string): string => {
    let clean = path.trim();
    // Strip leading double curly braces if passed accidentally
    if (clean.startsWith('{{') && clean.endsWith('}}')) {
        clean = clean.substring(2, clean.length - 2).trim();
    }
    // Prefix regex for context., params., param., row., item., record., data.
    const prefixRegex = /^(?:context|params|param|row|item|record|data)\./i;
    if (prefixRegex.test(clean)) {
        clean = clean.replace(prefixRegex, '');
    } else {
        const bracketRegex = /^(?:context|params|param|row|item|record|data)\[['"]([^'"]+)['"]\]/i;
        const match = clean.match(bracketRegex);
        if (match) {
            clean = match[1] + clean.substring(match[0].length);
        }
    }
    return clean.trim();
};

// Helper to get nested properties case-insensitively, supporting row.xyz, context.xyz, item.xyz notation
export const getNestedValueCaseInsensitive = (obj: any, path: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (!path) return undefined;
    
    let cleanPath = stripAccessorPrefix(path);
    if (!cleanPath) return undefined;

    // Try exact lookup first
    if (obj[cleanPath] !== undefined) return obj[cleanPath];

    // Support dot-notation nested lookup like 'address.city'
    if (cleanPath.includes('.')) {
        const parts = cleanPath.split('.');
        let curr = obj;
        for (const part of parts) {
            if (curr === undefined || curr === null || typeof curr !== 'object') return undefined;
            const cleanPart = stripAccessorPrefix(part);
            if (curr[cleanPart] !== undefined) {
                curr = curr[cleanPart];
            } else {
                const lowerPart = cleanPart.toLowerCase();
                const foundPart = Object.keys(curr).find(k => k.toLowerCase() === lowerPart);
                if (foundPart) {
                    curr = curr[foundPart];
                } else {
                    return undefined;
                }
            }
        }
        return curr;
    }

    // Case-insensitive lookup of cleanPath in obj
    const lowerKey = cleanPath.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    if (foundKey) return obj[foundKey];

    // Fallback: search in deep children if obj has nested container properties like row, item, record, data
    for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === 'object' && ['row', 'item', 'record', 'data', '_raw'].includes(key)) {
            const nestedVal = getNestedValueCaseInsensitive(obj[key], cleanPath);
            if (nestedVal !== undefined) return nestedVal;
        }
    }

    return undefined;
};

// Helper to safely replace placeholders like {{name}}, {{context.name}}, or {{params.selectedId | date:'DD.MM.YYYY'}}
export const resolvePlaceholders = (text: string, context?: Record<string, any>, params?: Record<string, any>): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
        const fullExpr = expression.trim();
        
        // Check for pipes (e.g. key | date:'DD.MM.YYYY' | currency)
        let mainKey = fullExpr;
        let pipeChain: string[] = [];

        if (fullExpr.includes('|')) {
            const parts = fullExpr.split('|');
            mainKey = parts[0].trim();
            pipeChain = parts.slice(1).map(p => p.trim()).filter(Boolean);
        }

        const cleanKey = stripAccessorPrefix(mainKey);
        const isParamExplicit = /^(?:params|param)\./i.test(mainKey);
        const isContextExplicit = /^(?:context|row|item|record|data)\./i.test(mainKey);

        let resolvedVal: any = undefined;

        if (isParamExplicit) {
            if (params) {
                const pVal = getNestedValueCaseInsensitive(params, cleanKey);
                if (pVal !== undefined && pVal !== null) resolvedVal = pVal;
            }
            if (resolvedVal === undefined && context) {
                const cVal = getNestedValueCaseInsensitive(context, cleanKey);
                if (cVal !== undefined && cVal !== null) resolvedVal = cVal;
            }
        } else if (isContextExplicit) {
            if (context) {
                const cVal = getNestedValueCaseInsensitive(context, cleanKey);
                if (cVal !== undefined && cVal !== null) resolvedVal = cVal;
            }
            if (resolvedVal === undefined && params) {
                const pVal = getNestedValueCaseInsensitive(params, cleanKey);
                if (pVal !== undefined && pVal !== null) resolvedVal = pVal;
            }
        } else {
            // Generic placeholder: 1. Check context first
            if (context) {
                const cVal = getNestedValueCaseInsensitive(context, cleanKey);
                if (cVal !== undefined && cVal !== null) {
                    resolvedVal = cVal;
                }
            }
            // 2. Check page-level parameters
            if (resolvedVal === undefined && params) {
                const pVal = getNestedValueCaseInsensitive(params, cleanKey);
                if (pVal !== undefined && pVal !== null) {
                    resolvedVal = pVal;
                }
            }
        }

        // If pipes are defined, apply them to resolvedVal
        if (pipeChain.length > 0) {
            return applyPipeChain(resolvedVal, pipeChain);
        }

        if (resolvedVal !== undefined && resolvedVal !== null && resolvedVal !== '') {
            const isDateKey = /datum|date|faellig|created|updated/i.test(cleanKey);
            const isIsoString = typeof resolvedVal === 'string' && /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2})?/.test(resolvedVal.trim());
            if (isDateKey || isIsoString) {
                const formattedDate = formatDate(resolvedVal, 'DD.MM.YYYY');
                if (formattedDate) return formattedDate;
            }
            return String(resolvedVal);
        }

        return '';
    });
};

// Helper to determine the label and value of lookup rows
export const getRowLabelAndValue = (row: any, props: any, idx: number) => {
    if (!row || typeof row !== 'object') {
        return { val: idx, label: String(row ?? '') };
    }

    const keys = Object.keys(row);
    if (keys.length === 0) {
        return { val: idx, label: `Eintrag ${idx + 1}` };
    }

    let val: any = idx;
    const valueFieldVal = props.valueField ? getNestedValueCaseInsensitive(row, props.valueField) : undefined;
    if (valueFieldVal !== undefined && valueFieldVal !== null) {
        val = valueFieldVal;
    } else {
        const idKey = keys.find(k => k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id') || k.toLowerCase() === 'uuid');
        if (idKey && row[idKey] !== undefined && row[idKey] !== null) {
            val = row[idKey];
        } else if (row.id !== undefined && row.id !== null) {
            val = row.id;
        } else {
            const firstVal = Object.values(row)[0];
            val = (firstVal !== undefined && firstVal !== null) ? firstVal : idx;
        }
    }

    let label = '';
    const labelFieldVal = props.labelField ? getNestedValueCaseInsensitive(row, props.labelField) : undefined;
    if (labelFieldVal !== undefined && labelFieldVal !== null) {
        label = String(labelFieldVal);
    } else {
        const labelKeywords = ['name', 'label', 'title', 'titel', 'text', 'bezeichnung', 'username', 'email', 'description'];
        const matchedKey = keys.find(k => {
            const kl = k.toLowerCase();
            return labelKeywords.some(kw => kl.includes(kw));
        });

        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            label = String(row[matchedKey]);
        } else {
            const nonIdKey = keys.find(k => {
                const kl = k.toLowerCase();
                return kl !== 'id' && !kl.endsWith('_id') && kl !== 'uuid' && row[k] !== null && row[k] !== undefined;
            });
            if (nonIdKey) {
                label = String(nonIdKey);
            } else {
                const firstVal = Object.values(row)[0];
                label = (firstVal !== undefined && firstVal !== null) ? String(firstVal) : `Eintrag ${idx + 1}`;
            }
        }
    }

    return { val, label };
};
