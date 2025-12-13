import React, { useMemo } from 'react';
import { Report, Table, Query, Field, ReportColumn } from '../../types/index';
import { Printer } from 'lucide-react';

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

  // Initialize columns if not present (migration for old reports)
  const columns = useMemo((): ReportColumn[] => {
      if (report.columns && report.columns.length > 0) {
          return report.columns.filter(c => c.visible).sort((a, b) => a.order - b.order);
      }
      return sourceFields.map((f, i) => ({
          fieldId: f.id,
          label: f.name,
          visible: true,
          order: i
      })) as ReportColumn[];
  }, [report.columns, sourceFields]);

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
      let rawVal = row[groupingField.name];
      if (rawVal === undefined || rawVal === null) rawVal = 'Unbekannt';
      
      let key = String(rawVal);
      
      // Handle First Letter Grouping
      if (report.settings?.groupMethod === 'firstLetter') {
          key = key.charAt(0).toUpperCase();
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    // Sort Groups Alphabetically
    const sortedKeys = Object.keys(grouped).sort();

    return sortedKeys.map((key) => ({
      groupValue: key,
      items: grouped[key],
      summaries: calculateSummaries(grouped[key])
    }));
  }, [data, report, groupingField]);
  
  const handlePrint = () => {
      window.print();
  };

  const getCellStyle = (value: any, column: ReportColumn): React.CSSProperties => {
      if (!column.formattingRules || column.formattingRules.length === 0) return {};
      
      let style: React.CSSProperties = {};
      const numValue = Number(value);
      const isNum = !isNaN(numValue) && value !== '';

      for (const rule of column.formattingRules) {
          let match = false;
          const ruleVal = Number(rule.value);
          
          switch(rule.operator) {
              case 'eq': match = String(value) === rule.value; break;
              case 'neq': match = String(value) !== rule.value; break;
              case 'contains': match = String(value).toLowerCase().includes(rule.value.toLowerCase()); break;
              case 'gt': match = isNum && numValue > ruleVal; break;
              case 'lt': match = isNum && numValue < ruleVal; break;
              case 'gte': match = isNum && numValue >= ruleVal; break;
              case 'lte': match = isNum && numValue <= ruleVal; break;
          }

          if (match) {
              style = { ...style, ...rule.style };
          }
      }
      return style;
  };

  return (
    <div className="bg-slate-200 h-full overflow-auto flex flex-col print:overflow-visible print:bg-white print:h-auto print:block">
      {/* Toolbar - hidden on print */}
      <div className="bg-white border-b border-slate-300 p-2 flex justify-end print:hidden flex-shrink-0">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 font-semibold text-sm"
          >
              <Printer size={16}/> Drucken / PDF
          </button>
      </div>

      <div className="p-8 print:p-0 flex-1 overflow-auto print:overflow-visible print:block">
        <div className={`max-w-[210mm] mx-auto bg-white shadow-lg p-[15mm] border border-slate-300 min-h-[297mm] ${report.settings?.orientation === 'landscape' ? 'landscape:max-w-[297mm] landscape:min-h-[210mm]' : ''} print:shadow-none print:border-none print:w-full print:max-w-none print:mx-0 print:h-auto print:p-0`}>
            
            {/* Report Header */}
            <header className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-800">{report.name}</h1>
            <div className="flex justify-between items-end mt-2">
                <p className="text-slate-500 text-sm">Erstellt am: {new Date().toLocaleDateString()}</p>
                <p className="text-slate-500 text-sm">DB Studio Pro Reporting</p>
            </div>
            </header>

            {/* Data */}
            <main>
            {processedData.map((group, index) => (
                <div key={index} className={`mb-8 break-inside-avoid ${report.settings?.pageBreakAfterGroup ? 'break-after-page' : ''}`}>
                {/* Group Header */}
                {groupingField && (
                    <div className="bg-slate-100 p-2 border-l-4 border-slate-500 mb-2 mt-4 print:bg-slate-100 print:print-color-adjust-exact">
                        <h2 className="text-lg font-bold text-slate-700">
                            {report.settings?.groupMethod === 'firstLetter' ? 'Buchstabe' : groupingField.name}: <span className="font-normal text-black">{group.groupValue}</span>
                        </h2>
                    </div>
                )}
                
                {/* Table */}
                <table className="w-full border-collapse text-sm mb-4">
                    <thead>
                    <tr className="border-b-2 border-slate-400 text-left">
                        {columns.map(col => (
                            <th key={col.fieldId} className="p-2 font-bold uppercase text-slate-600 text-xs" style={{ width: col.width ? `${col.width}%` : 'auto' }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {group.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent">
                        {columns.map(col => {
                            const fieldName = sourceFields.find(f => f.id === col.fieldId)?.name;
                            const cellValue = fieldName ? item[fieldName] : '';
                            return (
                                <td 
                                    key={col.fieldId} 
                                    className="p-2 whitespace-nowrap"
                                    style={getCellStyle(cellValue, col)}
                                >
                                    {String(cellValue ?? '')}
                                </td>
                            );
                        })}
                        </tr>
                    ))}
                    </tbody>
                </table>
                
                {/* Group Footer */}
                {report.summaries.length > 0 && (
                    <div className="bg-slate-50 p-2 border-t border-slate-300 rounded-b-md text-right text-sm print:bg-slate-50 print:print-color-adjust-exact">
                    {Object.entries(group.summaries).map(([key, value]) => {
                        const [fieldName, calc] = key.split('_');
                        return (
                        <div key={key}>
                            <span className="font-semibold text-slate-600">{calc === 'SUM' ? 'Summe' : 'Anzahl'} ({fieldName}): </span>
                            <span className="font-bold">{value}</span>
                        </div>
                        )
                    })}
                    </div>
                )}
                </div>
            ))}
            {data.length === 0 && (
                <div className="p-6 text-center text-slate-500 italic">
                Der Bericht enthält keine Daten.
                </div>
            )}
            </main>

            {/* Page Footer (Visible on print mostly) */}
            <footer className="hidden print:block fixed bottom-0 left-0 w-full text-center text-[10px] text-slate-400 p-2">
                Seite generiert mit DB Studio Pro
            </footer>
        </div>
      </div>
      
      <style>{`
        @media print {
            /* Reset container styles */
            html, body {
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }
            /* Explicitly show report content */
            .print\\:block {
                display: block !important;
            }
            /* Ensure backgrounds are printed */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .break-after-page {
                page-break-after: always;
            }
            .break-inside-avoid {
                page-break-inside: avoid;
            }
        }
      `}</style>
    </div>
  );
};
