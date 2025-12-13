
import { Table } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateHtmlForLayout = (element: any, tables: Table[]): string => {
    if (element.type === 'container') {
        const children = element.children?.map((c: any) => generateHtmlForLayout(c, tables)).join('\n') || '';
        return `<div class="${element.className || ''}">${children}</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold mb-2'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) { fieldName = f.name; break; }
        }
        if (!fieldName) return '';
        const bindProp = toCamelCase(fieldName);
        
        if (element.widgetType === 'select' && element.lookup) {
             const lookupTable = tables.find(t => t.id === element.lookup.tableId);
             const listVar = lookupTable ? `${toCamelCase(lookupTable.name)}List` : '[]';
             return `<div class="mb-4">
                <label class="block text-sm font-medium mb-1">${element.label}</label>
                <select [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-full border rounded p-2">
                    <option [ngValue]="null">Bitte wählen...</option>
                    <option *ngFor="let item of ${listVar}" [ngValue]="item.id">{{item.id}}</option> 
                </select>
             </div>`;
        }

        return `<div class="mb-4">
            <label class="block text-sm font-medium mb-1">${element.label}</label>
            <input type="text" [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-full border rounded p-2" />
        </div>`;
    }
    return '';
};
