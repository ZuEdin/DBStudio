import React, { useState, useEffect } from 'react';
import { CustomPage, PageComponent } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { executeSelectQuery } from '../queries/utils/queryExecution';
import { Loader2 } from 'lucide-react';

interface PageViewProps {
  page: CustomPage;
  onSetView: (v: any) => void;
}

const LiveNode: React.FC<{ node: PageComponent }> = ({ node }) => {
    const { queries, tables } = useProjectStore();
    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (node.type === 'dropdown' && node.props.queryId) {
            setLoading(true);
            const query = queries.find(q => q.id === node.props.queryId);
            if (query) {
                const data = executeSelectQuery(query, tables, queries);
                setFetchedData(data);
            }
            setLoading(false);
        } else if (node.type === 'table_view' && node.props.dataSourceType) {
            setLoading(true);
            try {
                if (node.props.dataSourceType === 'table' && node.props.dataSourceId) {
                    const table = tables.find(t => t.id === node.props.dataSourceId);
                    if (table) setFetchedData(table.data || []);
                } else if (node.props.dataSourceType === 'query' && node.props.dataSourceId) {
                    const query = queries.find(q => q.id === node.props.dataSourceId);
                    if (query) {
                        const data = executeSelectQuery(query, tables, queries);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                 console.error(err);
            }
            setLoading(false);
        }
    }, [node.type, node.props.queryId, node.props.dataSourceType, node.props.dataSourceId, queries, tables]);

    let content = null;

    switch (node.type) {
        case 'container':
             content = (
                 <div className={`w-full ${node.props.className || ''}`} style={node.props.style}>
                    {node.children?.map(c => <LiveNode key={c.id} node={c} />)}
                 </div>
             );
             break;
        case 'text':
             content = <div className={`w-full break-words ${node.props.className || ''}`} style={node.props.style}>{node.props.text}</div>;
             break;
        case 'button':
             content = <button className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 m-2 ${node.props.className || ''}`} style={node.props.style}>{node.props.label || 'Button'}</button>;
             break;
        case 'dropdown':
             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                      <select className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs" style={node.props.style}>
                          <option value="">{node.props.placeholder || 'Bitte wählen...'}</option>
                          {loading && <option disabled>Lade Daten...</option>}
                          {!loading && fetchedData.map((row, idx) => {
                              const val = node.props.valueField ? row[node.props.valueField] : (row.id || idx);
                              const label = node.props.labelField ? row[node.props.labelField] : Object.values(row)[0];
                              return <option key={idx} value={val}>{String(label)}</option>
                          })}
                      </select>
                  </div>
             );
             break;
        case 'table_view': {
             const columns = node.props.columns ? node.props.columns.split(',').map((c: string) => c.trim()) : [];
             const displayData = columns.length > 0 ? fetchedData.map(row => {
                 const newRow: any = {};
                 columns.forEach((c: string) => newRow[c] = row[c]);
                 return newRow;
             }) : fetchedData;

             content = (
                  <div className={`p-4 w-full overflow-x-auto ${node.props.className || ''}`} style={node.props.style}>
                       {loading ? (
                           <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                       ) : (
                           <table className="min-w-full divide-y divide-slate-200">
                               <thead className="bg-slate-50">
                                   <tr>
                                       {displayData.length > 0 ? Object.keys(displayData[0]).map(k => (
                                           <th key={k} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{k}</th>
                                       )) : <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Daten</th>}
                                   </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-slate-200">
                                   {displayData.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-slate-50">
                                           {Object.values(row).map((val: any, vIdx) => (
                                               <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-slate-600">{String(val)}</td>
                                           ))}
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       )}
                  </div>
             );
             break;
        }
        case 'form_view':
        case 'chart_view':
        case 'image':
        case 'html':
        case 'divider':
             content = <div className={`p-4 m-2 bg-slate-100 rounded border flex items-center justify-center border-slate-200 text-center text-sm text-slate-500 ${node.props.className || ''}`}>{node.type} Not Fully Implemented Live</div>;
             break;
    }

    return content;
};

export const PageView: React.FC<PageViewProps> = ({ page, onSetView }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-auto p-8 relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
         <button onClick={() => onSetView({ type: 'page_designer', pageId: page.id })} className="px-3 py-1 bg-white border border-slate-300 shadow-sm rounded text-xs font-semibold hover:bg-slate-50">Zurück zum Designer</button>
      </div>
      <div className="max-w-7xl mx-auto w-full bg-white shadow-sm border border-slate-200 rounded min-h-[800px] p-6 relative">
          <LiveNode node={page.layout} />
      </div>
    </div>
  );
};
