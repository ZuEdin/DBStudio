
import { Table, FormElement } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateHtmlForLayout = (element: FormElement, tables: Table[]): string => {
    if (element.type === 'container') {
        const children = element.children?.map(c => generateHtmlForLayout(c, tables)).join('\n') || '';
        return `<div class="${element.className || ''}">\n${children}\n</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold text-lg mb-2'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) { fieldName = f.name; break; }
        }
        if (!fieldName) return `<!-- Field not found: ${element.label} -->`;
        
        const bindProp = toCamelCase(fieldName);
        
        // TODO: Handle Lookups/Selects properly by checking widgetType
        return `<div class="mb-4 ${element.className || ''}">
            <label class="block text-sm font-medium mb-1 text-slate-700">${element.label}</label>
            <input type="text" [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-full border rounded p-2" />
        </div>`;
    }
    return '';
};
