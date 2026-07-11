
import React, { useMemo, useState } from 'react';
import { Report, Field, ReportColumn, TextStyle, Table, Relationship } from '../../types/index';
import { FileText, FileSpreadsheet, ChevronDown, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RecordDetailModal } from '../../components/modals/RecordDetailModal';

interface ReportViewProps {
  report: Report;
  data: Record<string, any>[];
  sourceFields: Field[];
  // Props for Linking
  allTables: Table[];
  relationships: Relationship[];
  widgetMode?: boolean;
}

interface GroupedData {
  groupValue: string;
  items: Record<string, any>[];
  summaries: Record<string, number>;
}

const getCssFromStyle = (style?: TextStyle): React.CSSProperties => {
    if (!style) return {};
    return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        textAlign: style.align,
        borderBottom: style.borderBottom ? '1px solid #e2e8f0' : undefined
    };
};

export const ReportView: React.FC<ReportViewProps> = ({ report, data, sourceFields, allTables, relationships, widgetMode }) => {
  const [detailView, setDetailView] = useState<{ targetTableId: string, recordId: any } | null>(null);
  const groupingField = sourceFields.find(f => f.id === report.groupingFieldId);

  // Determine Columns to Display
  const displayColumns = useMemo((): { id: string, label: string, fieldName: string, isFK?: boolean, targetTableId?: string }[] => {
      let cols = [];
      
      const mapCol = (fieldId: string, label: string, fieldName: string) => {
          // Check for relationship
          // We need to know which table this field belongs to. Report sourceId tells us the main source.
          // If source is a table, simple. If query, we might lose context unless we map it back.
          // Simplified approach: Check relationships where sourceTable matches report source
          let isFK = false;
          let targetTableId = undefined;

          if (report.sourceType === 'table') {
              const rel = relationships.find(r => r.fromTableId === report.sourceId && r.fromFieldId === fieldId);
              if (rel) {
                  isFK = true;
                  targetTableId = rel.toTableId;
              }
          }
          // Query logic would be more complex to trace back field origin, skipped for simple v1
          return { id: fieldId, label, fieldName, isFK, targetTableId };
      };

      if (report.columns && report.columns.length > 0) {
          cols = report.columns
            .filter(c => c.visible)
            .sort((a, b) => a.order - b.order)
            .map(c => mapCol(c.fieldId, c.label, sourceFields.find(f => f.id === c.fieldId)?.name || ''));
      } else {
          cols = sourceFields.map(f => mapCol(f.id, f.name, f.name));
      }

      // Hide grouping field from the detail table
      if (groupingField) {
          return cols.filter(c => c.id !== groupingField.id);
      }
      return cols;
  }, [report.columns, sourceFields, groupingField, relationships, report.sourceId]);

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
      if (report.settings?.groupMethod === 'firstLetter') {
          key = key.charAt(0).toUpperCase();
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    const sortedKeys = Object.keys(grouped).sort();

    return sortedKeys.map((key) => ({
      groupValue: key,
      items: grouped[key],
      summaries: calculateSummaries(grouped[key])
    }));
  }, [data, report, groupingField]);
  
  const handleExportPDF = () => {
      const doc = new jsPDF({ orientation: report.settings?.orientation || 'portrait' });
      
      doc.setFontSize(report.styles?.header?.fontSize || 18);
      if(report.styles?.header?.bold) doc.setFont('helvetica', 'bold');
      if(report.styles?.header?.color) doc.setTextColor(report.styles.header.color);
      doc.text(report.name, 14, 15);
      
      // Reset
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, 14, 22);
      
      let finalY = 30;

      processedData.forEach(group => {
          if (finalY > 250) { doc.addPage(); finalY = 20; }

          // Render Group Header
          if (groupingField) {
              doc.setFontSize(report.styles?.groupHeader?.fontSize || 11);
              doc.setFont('helvetica', report.styles?.groupHeader?.bold ? 'bold' : 'normal');
              
              if(report.styles?.groupHeader?.backgroundColor) {
                  doc.setFillColor(report.styles.groupHeader.backgroundColor);
                  doc.rect(14, finalY, 182, 8, 'F');
              } else {
                  doc.setFillColor(240, 240, 240); // default
                  doc.rect(14, finalY, 182, 8, 'F');
              }
              
              if(report.styles?.groupHeader?.color) doc.setTextColor(report.styles.groupHeader.color);
              else doc.setTextColor(0,0,0);

              doc.text(`${group.groupValue}`, 16, finalY + 5.5);
              finalY += 12;
          }

          const tableHeaders = displayColumns.map(c => c.label);
          const tableBody = group.items.map(item => displayColumns.map(col => String(item[col.fieldName] ?? '')));

          autoTable(doc, {
              startY: finalY,
              head: [tableHeaders],
              body: tableBody,
              theme: 'plain',
              styles: { 
                  fontSize: report.styles?.detail?.fontSize || 9, 
                  cellPadding: 1,
                  textColor: report.styles?.detail?.color ? [0,0,0] : undefined
              },
              headStyles: { 
                  fillColor: report.styles?.columnHeader?.backgroundColor ? [200,200,200] : [255, 255, 255], 
                  textColor: [100, 100, 100], 
                  lineWidth: { bottom: 0.1 }, 
                  lineColor: [200, 200, 200] 
              },
              margin: { left: groupingField ? 20 : 14, right: 14 }
          });

          // @ts-ignore
          finalY = doc.lastAutoTable.finalY + 5;

          // Render Summaries
          if (report.summaries.length > 0) {
              doc.setFontSize(report.styles?.footer?.fontSize || 9);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(0,0,0);
              const summaryText = Object.entries(group.summaries).map(([key, value]) => {
                  const [fieldName, calc] = key.split('_');
                  return `${calc === 'SUM' ? 'Summe' : 'Anzahl'} ${fieldName}: ${value}`;
              }).join('   |   ');
              doc.text(summaryText, groupingField ? 20 : 14, finalY);
              finalY += 10;
          }
          
          if (report.settings?.pageBreakAfterGroup) {
              doc.addPage();
              finalY = 20;
          } else {
              finalY += 5;
          }
      });

      doc.save(`${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const handleExportExcel = () => {
      const exportData = processedData.flatMap(group => {
          return group.items.map(item => {
              const row: any = {};
              if (groupingField) {
                  row[`[Gruppe] ${groupingField.name}`] = group.groupValue;
              }
              displayColumns.forEach(col => {
                  row[col.label] = item[col.fieldName];
              });
              return row;
          });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bericht");
      XLSX.writeFile(wb, `${report.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const getCellStyle = (value: any, column: ReportColumn): React.CSSProperties => {
      let style = { ...getCssFromStyle(report.styles?.detail) };
      if (!column.formattingRules || column.formattingRules.length === 0) return style;
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
              const ruleCss = getCssFromStyle(rule.style);
              style = { ...style, ...ruleCss };
          }
      }
      return style;
  };

  const targetTable = detailView ? allTables.find(t => t.id === detailView.targetTableId) : null;

  return (
    <div className={`${widgetMode ? 'bg-transparent' : 'bg-slate-200'} h-full overflow-hidden flex flex-col`}>
      {/* Sticky Toolbar */}
      {!widgetMode && (
          <div className="bg-white border-b border-slate-300 p-2 flex justify-end gap-2 flex-shrink-0 sticky top-0 z-20 shadow-sm">
              <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm">
                  <FileSpreadsheet size={14}/> Excel
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm">
                  <FileText size={14}/> PDF
              </button>
          </div>
      )}

      <div className={`${widgetMode ? 'p-2 relative' : 'p-8 flex-1 bg-slate-200'} overflow-auto`}>
        <div className={widgetMode ? 'w-full bg-white h-full' : `max-w-[210mm] mx-auto bg-white shadow-xl p-[15mm] min-h-[297mm] ${report.settings?.orientation === 'landscape' ? 'landscape:max-w-[297mm] landscape:min-h-[210mm]' : ''}`}>
            
            {/* Report Header */}
            {!widgetMode && (
                <header className="border-b-4 border-slate-800 pb-4 mb-8" style={getCssFromStyle(report.styles?.header)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'inherit', fontSize: 'inherit' }}>{report.name}</h1>
                            <p className="opacity-60 mt-1 uppercase tracking-wider text-xs font-bold">Bericht</p>
                        </div>
                        <div className="text-right">
                            <p className="opacity-50 text-sm">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </header>
            )}

            {/* Data Loop */}
            <main>
            {processedData.map((group, index) => (
                <div key={index} className={`mb-6 break-inside-avoid`}>
                    
                    {/* Stepped Layout: Group Header */}
                    {groupingField ? (
                        <div 
                            className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200 bg-slate-50 p-1 rounded-t"
                            style={getCssFromStyle(report.styles?.groupHeader)}
                        >
                            <div className="bg-slate-800 text-white p-1 rounded opacity-80 scale-75">
                                <ChevronDown size={14} />
                            </div>
                            <h2 className="text-lg font-bold">
                                {group.groupValue}
                            </h2>
                            <span className="text-[10px] opacity-60 ml-2 uppercase tracking-wide font-medium px-2 py-0.5 rounded border border-current">
                                ({groupingField.name})
                            </span>
                        </div>
                    ) : null}
                    
                    {/* Stepped Layout: Details Container with Left Border/Indent */}
                    <div className={`${groupingField ? "ml-3 pl-4 border-l-2 border-slate-200" : ""}`}>
                        <table className="w-full border-collapse text-sm mb-2">
                            <thead>
                                <tr className="border-b border-slate-300 text-left" style={getCssFromStyle(report.styles?.columnHeader)}>
                                    {displayColumns.map(col => (
                                        <th key={col.id} className="py-2 pr-4 font-semibold opacity-70 text-xs uppercase tracking-wider">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {group.items.map((item, itemIndex) => (
                                    <tr key={itemIndex} className="border-b border-slate-100 hover:bg-slate-50 last:border-0 transition-colors">
                                        {displayColumns.map(col => (
                                            <td key={col.id} className="py-2 pr-4 whitespace-nowrap group" style={getCellStyle(item[col.fieldName], { ...col } as any)}>
                                                <div className="flex items-center gap-2">
                                                    <span>{String(item[col.fieldName] ?? '')}</span>
                                                    {col.isFK && col.targetTableId && item[col.fieldName] && (
                                                        <button 
                                                            onClick={() => setDetailView({ targetTableId: col.targetTableId!, recordId: item[col.fieldName] })}
                                                            className="text-blue-400 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Details"
                                                        >
                                                            <ExternalLink size={12}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Group Summary Footer (Indented with the details) */}
                        {report.summaries.length > 0 && (
                            <div className="bg-slate-50 p-2 rounded-md border border-slate-200 inline-block mt-2 shadow-sm" style={getCssFromStyle(report.styles?.footer)}>
                                {Object.entries(group.summaries).map(([key, value]) => {
                                    const [fieldName, calc] = key.split('_');
                                    return (
                                        <span key={key} className="mr-6 text-sm">
                                            <span className="opacity-70 font-bold text-xs uppercase mr-1">{calc === 'SUM' ? 'Summe' : 'Anzahl'} {fieldName}:</span>
                                            <span className="font-mono font-bold">{value}</span>
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {data.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                    Keine Daten vorhanden.
                </div>
            )}
            </main>
        </div>
      </div>

      {detailView && targetTable && (
          <RecordDetailModal 
            table={targetTable} 
            recordId={detailView.recordId} 
            onClose={() => setDetailView(null)} 
          />
      )}
    </div>
  );
};
