
import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { Plus, Layout, User, Search } from 'lucide-react';

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
    else if (element.type === 'button') {
        let onClickContent = '';
        if (element.actions && element.actions.length > 0) {
            const clickActions = element.actions.filter(a => a.trigger === 'OnClick').map(action => {
                if (action.actionType === 'ShowToast') {
                    return `addToast('${action.toastMessage?.replace(/'/g, "\\'")}', '${action.toastType || 'info'}');`;
                }
                if (action.actionType === 'ExecuteAPI' && action.apiEndpoint) {
                    return `await fetch('${action.apiEndpoint}', { method: 'POST', body: JSON.stringify(${dataVar}) });`;
                }
                if (action.actionType === 'Navigate' && action.routeUrl) {
                    return `navigate('${action.routeUrl}');`;
                }
                if (action.actionType === 'SetState' && action.stateVariableId) {
                    return `setGlobalState('${action.stateVariableId}', '${action.stateValue}');`;
                }
                return '';
            }).filter(Boolean).join('\n            ');
            onClickContent = `onClick={async () => {\n            ${clickActions}\n        }}`;
        }
        return `<button type="button" className="${element.className || 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm'}" ${onClickContent}>\n   ${element.label}\n</button>`;
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
        
        // Tailwind Classes Phase 5 logic
        const uxHidden = `\${isFieldHidden('${element.fieldId}') ? 'hidden' : ''}`;
        const uxDisabled = `isFieldDisabled('${element.fieldId}')`;
        const uxRequired = `isFieldRequired('${element.fieldId}')`;

        const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
        const inputClass = `w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 \${${uxDisabled} ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`;
        const wrapperClass = `${element.className || ""} ${uxHidden}`;

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
                 <div className={\`${wrapperClass}\`}>
                    <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={${uxDisabled}} required={${uxRequired}}
                                className={\`${inputClass} appearance-none\`}
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

        // Current User (WhoAmI)
        if (element.widgetType === 'current-user') {
            const modalId = `picker_me_${element.id}`;
            if (!modals.find(m => m.id === modalId)) {
                modals.push({ id: modalId, type: 'user-picker', mode: 'me', targetField: bindProp });
            }
            return `
            <div className={\`${wrapperClass}\`}>
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <User className="absolute left-2 top-2.5 text-emerald-600" size={16} />
                        <input
                            type="text"
                            readOnly
                            disabled={${uxDisabled}} required={${uxRequired}}
                            value={${dataVar}.${bindProp} || ''}
                            className={\`${inputClass} pl-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 font-mono\`}
                            placeholder="(Leer)"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)}
                        disabled={${uxDisabled}}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        title="Mich selbst eintragen"
                    >
                        Ich (Auto)
                    </button>
                </div>
            </div>`;
        }

        // AD Search
        if (element.widgetType === 'ad-search') {
            const modalId = `picker_search_${element.id}`;
            if (!modals.find(m => m.id === modalId)) {
                modals.push({ id: modalId, type: 'user-picker', mode: 'search', targetField: bindProp });
            }
            return `
            <div className={\`${wrapperClass}\`}>
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 text-blue-500" size={16} />
                        <input
                            type="text"
                            disabled={${uxDisabled}} required={${uxRequired}}
                            value={${dataVar}.${bindProp} || ''}
                            onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                            className={\`${inputClass} pl-8\`}
                            placeholder="Benutzer auswählen..."
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)}
                        disabled={${uxDisabled}}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        <Search size={14}/> Suchen
                    </button>
                </div>
            </div>`;
        }

        return `
        <div className={\`${wrapperClass}\`}>
            <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
            <input type="${inputType}" disabled={${uxDisabled}} required={${uxRequired}} className={\`${inputClass}\`} value={${dataVar}.${bindProp} !== undefined ? ${dataVar}.${bindProp} : ''} onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})} />
        </div>`;
    }
    return '';
};
