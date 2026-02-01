
import { Table, FormElement } from '../../../types/index';
import { toCamelCase } from '../common';

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

export const generateJsxForLayout = (element: FormElement, tables: Table[], dataVar: string = 'data'): string => {
    if (element.type === 'container') {
        const childrenJsx = element.children?.map(c => generateJsxForLayout(c, tables, dataVar)).join('\n') || '';
        let className = element.className || '';
        // Enhance default container logic if grid is used but not styled
        if (element.children && element.children.length > 1 && !className.includes('grid') && !className.includes('flex')) {
             className += ' space-y-4';
        }
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'label') {
        return `<div className="${element.className || 'text-lg font-bold mb-3 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2'}">${element.label}</div>`;
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
                 
                 return `
                 <div className="${wrapperClass}">
                    <label className="${labelClass}">${element.label}</label>
                    <div className="relative">
                        <select 
                            className="${inputClass} appearance-none"
                            value={${dataVar}.${bindProp} || ''}
                            onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                        >
                            <option value="">Bitte wählen...</option>
                            {${listVar}.map(i => <option key={i.${valProp}} value={i.${valProp}}>{i.${valProp}} {/* Label TODO */}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
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
