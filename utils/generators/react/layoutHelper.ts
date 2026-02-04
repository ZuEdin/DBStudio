
import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { Plus, Layout } from 'lucide-react';

export const collectLookups = (element: FormElement, tables: Table[], accumulated: any[] = []) => {
    if (element.widgetType === 'select' && element.lookup && element.lookup.tableId) {
        const table = tables.find(t => t.id === element.lookup!.tableId);
        if (table) {
            const variableName = `${toCamelCase(table.name)}List`;
            if (!accumulated.find(l => l.variableName === variableName)) {
                accumulated.push({
                    table,
                    variableName,
                    endpoint: toCamelCase(table.name)
                });
            }
        }
    }
    if (element.children) {
        element.children.forEach(child => collectLookups(child, tables, accumulated));
    }
    return accumulated;
};

// Returns JSX string AND potentially side-effect info (used by pages.ts to know which modals to create)
export const generateJsxForLayout = (element: FormElement, tables: Table[], forms: Form[], dataVar: string = 'data', modals: any[] = []): string => {
    if (element.type === 'container') {
        const childrenJsx = element.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals)).join('\n') || '';
        let className = element.className || '';
        if (element.children && element.children.length > 1 && !className.includes('grid') && !className.includes('flex')) {
             className += ' space-y-4';
        }
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'label') {
        return `<div className="${element.className || 'text-lg font-bold mb-3 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2'}">${element.label}</div>`;
    } 
    else if (element.type === 'subform' && element.subform) {
        const subformDef = forms.find(f => f.id === element.subform!.formId);
        const subTable = tables.find(t => t.id === subformDef?.sourceId);
        
        if (subformDef && subTable) {
            const modalId = `sub_${element.id}`;
            // Register Modal Requirement
            if (!modals.find(m => m.id === modalId)) {
                modals.push({ 
                    id: modalId, 
                    type: 'subform', 
                    form: subformDef,
                    table: subTable,
                    masterField: element.subform.masterLinkFieldId,
                    childField: element.subform.childLinkFieldId
                });
            }

            // Generate List Display
            const camelSubTable = toCamelCase(subTable.name);
            const listVar = `${camelSubTable}SubList_${element.id.replace('sub_field_', '')}`; 
            
            // Simplified display: Just list first few fields or use form fields
            const displayFields = subTable.fields.filter(f => !f.isPrimaryKey).slice(0, 3);

            return `
            <div className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden mt-6 shadow-sm">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Layout size={16} className="text-indigo-500"/> ${element.label || subformDef.name}
                    </span>
                    ${element.subform.canAdd ? `
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)} 
                        className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 rounded px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                    >
                        <Plus size={14} strokeWidth={3}/> Neu
                    </button>` : ''}
                </div>
                <div className="p-0 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                ${displayFields.map(f => `<th className="p-2 font-medium">${f.name}</th>`).join('')}
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {${listVar} && ${listVar}.length > 0 ? ${listVar}.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    ${displayFields.map(f => `<td className="p-2">{item.${toCamelCase(f.name)}}</td>`).join('')}
                                    <td className="p-2 text-right">
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={${displayFields.length + 1}} className="p-4 text-center text-slate-400 italic">Keine Einträge vorhanden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }
    }
    else if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let inputType = 'text';
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL') inputType = 'number';
                if (f.type === 'DATE') inputType = 'date';
                break;
            }
        }

        if (!fieldName) return `{/* Field not found: ${element.label} */}`;
        const bindProp = toCamelCase(fieldName);
        
        // Tailwind Classes
        const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
        const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400";
        const wrapperClass = element.className || "";

        // Select / Lookup
        if (element.widgetType === 'select' && element.lookup) {
             const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
             if (lookupTable) {
                 const listVar = `${toCamelCase(lookupTable.name)}List`;
                 const valField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                 const valProp = valField ? toCamelCase(valField.name) : 'id';
                 const modalId = `lookup_${element.id}`;

                 if (element.lookup.allowQuickCreate) {
                     // Check if not already added to avoid dups
                     if (!modals.find(m => m.id === modalId)) {
                        modals.push({
                            id: modalId,
                            type: 'lookup',
                            table: lookupTable
                        });
                     }
                 }
                 
                 return `
                 <div className="${wrapperClass}">
                    <label className="${labelClass}">${element.label}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                className="${inputClass} appearance-none"
                                value={${dataVar}.${bindProp} || ''}
                                onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {${listVar}.map(i => <option key={i.${valProp}} value={i.${valProp}}>{i.${valProp}}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        ${element.lookup.allowQuickCreate ? `
                        <button 
                            type="button"
                            onClick={() => toggleModal('${modalId}', true)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 rounded px-3 flex items-center justify-center transition-colors"
                            title="Neu erstellen"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>` : ''}
                    </div>
                 </div>`;
             }
        }

        return `
        <div className="${wrapperClass}">
            <label className="${labelClass}">${element.label}</label>
            <input type="${inputType}" className="${inputClass}" value={${dataVar}.${bindProp} !== undefined ? ${dataVar}.${bindProp} : ''} onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})} />
        </div>`;
    }
    return '';
};
