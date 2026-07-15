import { GeneratorContext } from './types';
import { toCamelCase } from '../../../common';

export const generateDropdownNode = (node: any, ctx: GeneratorContext): string => {
  const classNameStr = node.props?.className || '';
  const styleStr = JSON.stringify(node.props?.style || {});
  
  const stateName = `dropdownData_${node.id.replace(/-/g, '_')}`;
  const loadingState = `dropdownLoading_${node.id.replace(/-/g, '_')}`;
  
  ctx.states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
  ctx.states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
  
  let fetchUrl = '';
  if (node.props?.queryId) {
      const qObj = ctx.queries.find(q => q.id === node.props.queryId);
      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
  } else if (node.props?.dataSourceId) {
      const tObj = ctx.tables.find(t => t.id === node.props.dataSourceId);
      if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
  }
  
  if (fetchUrl) {
      ctx.imports.add('get');
      ctx.effects.push(`
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: 10000 });
        set_${stateName}(res.data || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchDropdownData();
  }, []);`);
  }
  
  const valueField = node.props?.valueField || 'id';
  const labelField = node.props?.labelField || 'name';
  
  return `
              <div className="p-2 ${classNameStr}" style={${styleStr}}>
                  <select className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs">
                      <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                      {${loadingState} && <option disabled>Lade Daten...</option>}
                      {!${loadingState} && ${stateName}.map((row, idx) => {
                          const val = row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx;
                          const label = row['${toCamelCase(labelField)}'] || row['${labelField}'] || Object.values(row)[0] || '';
                          return <option key={val || idx} value={val}>{String(label)}</option>;
                      })}
                  </select>
              </div>`;
};
