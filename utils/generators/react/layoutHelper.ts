
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
        // If grid, assume children are cells
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'label') {
        return `<div className="${element.className || 'text-lg font-bold mb-2'}">${element.label}</div>`;
    } 
    else if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                break;
            }
        }

        if (!fieldName) return `{/* Field not found: ${element.label} */}`;
        const bindProp = toCamelCase(fieldName);
        
        // Select / Lookup
        if (element.widgetType === 'select' && element.lookup) {
             const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
             if (lookupTable) {
                 const listVar = `${toCamelCase(lookupTable.name)}List`;
                 const valField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                 const valProp = valField ? toCamelCase(valField.name) : 'id';
                 
                 return `
                 <div className="mb-4 ${element.className || ''}">
                    <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
                    <select 
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={${dataVar}.${bindProp} || ''}
                        onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                    >
                        <option value="">Bitte wählen...</option>
                        {${listVar}.map(i => <option key={i.${valProp}} value={i.${valProp}}>{i.id} {/* Label TODO */}</option>)}
                    </select>
                 </div>`;
             }
        }

        return `
        <div className="mb-4 ${element.className || ''}">
            <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
            <input type="text" className="w-full border p-2 rounded" value={${dataVar}.${bindProp} !== undefined ? ${dataVar}.${bindProp} : ''} onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})} />
        </div>`;
    }
    return '';
};
