
import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateHtmlForLayout = (element: FormElement, tables: Table[], forms: Form[]): string => {
    if (!element) return '';

    if (element.type === 'container') {
        const children = element.children?.map(c => generateHtmlForLayout(c, tables, forms)).join('\n') || '';
        return `<div class="${element.className || 'space-y-4'}">\n${children}\n</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold text-lg mb-2 text-slate-800 border-b pb-1'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let inputType = 'text';
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') inputType = 'number';
                if (f.type === 'DATE') inputType = 'date';
                if (f.type === 'BOOLEAN') inputType = 'checkbox';
                break;
            }
        }
        if (!fieldName) return `<!-- Field not found: ${element.label} -->`;
        
        const bindProp = toCamelCase(fieldName);
        const wrapperClass = element.className || 'mb-4';
        const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
        const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all";

        if (element.widgetType === 'select' && element.lookup) {
             const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
             if (lookupTable) {
                 const listVar = `${toCamelCase(lookupTable.name)}List`;
                 const valField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                 const valProp = valField ? toCamelCase(valField.name) : 'id';
                 
                 const quickCreateBtn = element.lookup.allowQuickCreate 
                    ? `<button type="button" (click)="openModal('lookup_${element.id}')" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 border border-emerald-300 rounded ml-2 font-bold flex items-center justify-center transition-colors" title="Neu">+</button>` 
                    : '';

                 // Lookup Modal Definition
                 const lookupModal = element.lookup.allowQuickCreate ? `
                 <div *ngIf="modals['lookup_${element.id}']" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div class="bg-white p-6 rounded-xl w-96 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                        <h3 class="font-bold mb-4 text-lg border-b pb-2 text-slate-800">Neu: ${lookupTable.name}</h3>
                        <div class="space-y-3">
                            ${lookupTable.fields.filter(f=>!f.isPrimaryKey && !f.isAutoIncrement).map(f => {
                                const fName = toCamelCase(f.name);
                                if (f.type === 'BOOLEAN') {
                                    return `
                                    <div class="flex items-center gap-2">
                                        <input type="checkbox" [(ngModel)]="tempData.${fName}" class="w-4 h-4 text-blue-600 rounded"/>
                                        <label class="text-sm font-medium text-slate-700">${f.name}</label>
                                    </div>`;
                                }
                                const fType = f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text';
                                return `
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">${f.name}</label>
                                    <input type="${fType}" [(ngModel)]="tempData.${fName}" class="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>`;
                            }).join('')}
                        </div>
                        <div class="flex justify-end gap-2 mt-6 pt-2 border-t border-slate-100">
                            <button type="button" (click)="closeModal('lookup_${element.id}')" class="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-sm">Abbrechen</button>
                            <button type="button" (click)="saveLookup('${toCamelCase(lookupTable.name)}', 'lookup_${element.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm">Speichern</button>
                        </div>
                    </div>
                 </div>` : '';

                 return `<div class="${wrapperClass}">
                    <label class="${labelClass}">${element.label}</label>
                    <div class="flex gap-2">
                        <select class="${inputClass} bg-white flex-1" [(ngModel)]="data.${bindProp}" name="${bindProp}">
                            <option [ngValue]="null">Bitte wählen...</option>
                            <option *ngFor="let item of ${listVar}" [value]="item.${valProp}">{{item.${valProp}}}</option>
                        </select>
                        ${quickCreateBtn}
                    </div>
                    ${lookupModal}
                </div>`;
             }
        }

        if (inputType === 'checkbox') {
            return `<div class="${wrapperClass} flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                <input type="checkbox" [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <label class="text-sm font-semibold text-slate-700 cursor-pointer select-none">${element.label}</label>
            </div>`;
        }

        return `<div class="${wrapperClass}">
            <label class="${labelClass}">${element.label}</label>
            <input type="${inputType}" [(ngModel)]="data.${bindProp}" name="${bindProp}" class="${inputClass}" />
        </div>`;
    }
    
    // Subform Rendering...
    if (element.type === 'subform' && element.subform) {
        const subFormDef = forms.find(f => f.id === element.subform!.formId);
        const subTable = tables.find(t => t.id === subFormDef?.sourceId);
        const modalId = `sub_${element.id}`;
        const subFormHtml = subFormDef?.layout ? generateHtmlForLayout(subFormDef.layout, tables, forms) : '<p>Leer</p>';
        const subTableCamel = subTable ? toCamelCase(subTable.name) : '';

        const subModal = `
        <div *ngIf="modals['${modalId}']" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                <h3 class="font-bold mb-4 text-lg border-b pb-2 text-slate-800">Eintrag hinzufügen</h3>
                <div class="subform-content space-y-4">
                    <!-- Bind to tempSubData -->
                    ${subFormHtml.replace(/data\./g, 'tempSubData.')}
                </div>
                <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" (click)="closeModal('${modalId}')" class="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-sm">Abbrechen</button>
                    <button type="button" (click)="saveSubform('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm">Speichern</button>
                </div>
            </div>
        </div>`;

        return `
        <div class="${element.className || 'border border-slate-300 rounded-lg overflow-hidden mt-6 shadow-sm'}">
            <div class="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                <h4 class="font-bold text-sm text-slate-700 flex items-center gap-2">📄 ${element.label}</h4>
                ${element.subform.canAdd ? `<button type="button" (click)="openModal('${modalId}')" class="bg-white text-blue-600 px-3 py-1 text-xs font-bold border border-blue-200 rounded shadow-sm hover:bg-blue-50 transition-colors">+ Neu</button>` : ''}
            </div>
            <div class="p-0">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th class="p-3">Daten</th></tr></thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr *ngFor="let item of ${subTableCamel}SubList_${element.id.substring(0,8)}" class="hover:bg-slate-50">
                            <td class="p-3 font-mono text-xs text-slate-600">{{item | json}}</td>
                        </tr>
                        <tr *ngIf="!${subTableCamel}SubList_${element.id.substring(0,8)}?.length"><td class="p-6 text-center text-slate-400 italic">Keine Einträge vorhanden.</td></tr>
                    </tbody>
                </table>
            </div>
            ${subModal}
        </div>`;
    }

    return '';
};
