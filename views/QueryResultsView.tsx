import React from 'react';
import { Query, SelectQuery } from '../types/index';

interface QueryResultsViewProps {
  query: Query;
  results: Record<string, any>[];
}

export const QueryResultsView: React.FC<QueryResultsViewProps> = ({ query, results }) => {
  if (!query) return null;

  // FIX: Add type guard to ensure query is a SelectQuery before accessing 'columns'.
  if (query.type !== 'SELECT') {
    return <div className="p-6 text-center text-slate-500">Ergebnisse können nur für SELECT-Abfragen angezeigt werden.</div>;
  }

  const headers = query.columns.filter(c => c.show).map(c => c.fieldName);

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-auto">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Abfrageergebnis: {query.name}</h2>
        </div>
        <div className="overflow-x-auto">
          {results.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {headers.map(header => (
                    <th key={header} className="p-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    {headers.map(header => (
                      <td key={`${rowIndex}-${header}`} className="p-3 text-slate-700 whitespace-nowrap">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-slate-500">
              Die Abfrage "{query.name}" hat keine Ergebnisse geliefert.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};