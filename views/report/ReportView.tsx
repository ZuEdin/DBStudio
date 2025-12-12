import React, { useMemo } from 'react';
import { Report, Table, Query, Field } from '../../types/index';

interface ReportViewProps {
  report: Report;
  data: Record<string, any>[];
  sourceFields: Field[];
}

interface GroupedData {
  groupValue: string;
  items: Record<string, any>[];
  summaries: Record<string, number>;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, data, sourceFields }) => {
  const groupingField = sourceFields.find(f => f.id === report.groupingFieldId);

  const processedData = useMemo((): GroupedData[] => {
    const calculateSummaries = (items: Record<string, any>[]): Record<string, number> => {
      const results: Record<string, number> = {};
      report.summaries.forEach(summary => {
        const key = `${summary.fieldName}_${summary.calculation}`;
        if (summary.calculation === 'COUNT') {
          results[key] = items.length;
        } else if (summary.calculation === 'SUM') {
          results[key] = items.reduce((acc, item) => acc + (Number(item[summary.fieldName]) || 0), 0);
        }
      });
      return results;
    };

    if (!groupingField) {
      return [{
        groupValue: 'Gesamt',
        items: data,
        summaries: calculateSummaries(data)
      }];
    }

    const grouped: Record<string, Record<string, any>[]> = {};
    data.forEach(row => {
      const key = String(row[groupingField.name] ?? 'Unbekannt');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    return Object.entries(grouped).map(([key, items]) => ({
      groupValue: key,
      items,
      summaries: calculateSummaries(items)
    }));
  }, [data, report, groupingField]);
  
  const headers = sourceFields.map(f => f.name);

  return (
    <div className="p-4 sm:p-8 bg-slate-200 h-full overflow-auto">
      <div className="max-w-4xl mx-auto bg-white shadow-lg p-10 border border-slate-300 print:shadow-none print:border-none">
        {/* Report Header */}
        <header className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-800">{report.name}</h1>
          <p className="text-slate-500">Erstellt am: {new Date().toLocaleDateString()}</p>
        </header>

        {/* Data */}
        <main>
          {processedData.map((group, index) => (
            <div key={index} className="mb-8 break-inside-avoid">
              {/* Group Header */}
              {groupingField && (
                <div className="bg-slate-100 p-2 border border-slate-200 rounded-t-md">
                  <h2 className="text-lg font-bold text-slate-700">{groupingField.name}: <span className="font-normal">{group.groupValue}</span></h2>
                </div>
              )}
              
              {/* Table */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-400 text-left">
                    {headers.map(h => <th key={h} className="p-2 font-bold uppercase text-slate-600 text-xs">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, itemIndex) => (
                    <tr key={itemIndex} className="border-b border-slate-200">
                      {headers.map(h => <td key={h} className="p-2 whitespace-nowrap">{String(item[h] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Group Footer */}
              {report.summaries.length > 0 && (
                <div className="bg-slate-50 p-2 mt-2 border-t-2 border-slate-300 rounded-b-md text-right text-sm">
                  {Object.entries(group.summaries).map(([key, value]) => {
                    const [fieldName, calc] = key.split('_');
                    return (
                      <div key={key}>
                        <span className="font-semibold">{calc === 'SUM' ? 'Summe' : 'Anzahl'} ({fieldName}): </span>
                        <span>{value}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {data.length === 0 && (
             <div className="p-6 text-center text-slate-500">
              Der Bericht enthält keine Daten.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};