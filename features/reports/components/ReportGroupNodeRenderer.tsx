import React from 'react';
import { GroupTreeNode } from '../utils/groupTreeProcessor';
import { Report, Field, Table, Query, Relationship, ColumnRenderType } from '../../../types';
import { ReportCellRenderer } from './ReportCellRenderer';
import { SubReportRenderer } from './SubReportRenderer';
import { Calculator, ExternalLink, FolderTree, Layers } from 'lucide-react';
import { getRecordFieldValue } from '../utils/groupTreeProcessor';

interface DisplayColumn {
  id: string;
  label: string;
  fieldName: string;
  renderType?: ColumnRenderType;
  isFK?: boolean;
  targetTableId?: string;
}

interface ReportGroupNodeRendererProps {
  node: GroupTreeNode;
  groupLevelsCount: number;
  displayColumns: DisplayColumn[];
  report: Report;
  sourceFields: Field[];
  relationships: Relationship[];
  allReports: Report[];
  allTables: Table[];
  allQueries: Query[];
  onShowDetail: (targetTableId: string, recordId: any) => void;
  getCellStyle: (value: any, column: any) => React.CSSProperties;
  getCssFromStyle: (styleObj: any) => React.CSSProperties;
}

export const ReportGroupNodeRenderer: React.FC<ReportGroupNodeRendererProps> = ({
  node,
  groupLevelsCount,
  displayColumns,
  report,
  sourceFields,
  relationships,
  allReports,
  allTables,
  allQueries,
  onShowDetail,
  getCellStyle,
  getCssFromStyle,
}) => {
  const isLeaf = !node.subGroups || node.subGroups.length === 0;
  const showHeader = groupLevelsCount > 0 && (node.config?.showHeader ?? true);
  const showFooter = groupLevelsCount > 0 && (node.config?.showFooter ?? true) && node.summaries.length > 0;
  const keepTogether = node.config?.keepTogether ?? report.settings?.bandSections?.detailBand?.keepTogether ?? true;

  // Visual indentation & styling according to nesting level
  const level = node.level;
  const indentClass = level === 0 ? '' : level === 1 ? 'ml-4 sm:ml-6 pl-2 border-l-2 border-indigo-400' : 'ml-8 pl-2 border-l-2 border-amber-400';

  const headerBgClass =
    level === 0
      ? 'bg-slate-100 border-b border-slate-300 text-slate-900'
      : level === 1
      ? 'bg-indigo-50/90 border-b border-indigo-200 text-indigo-950'
      : 'bg-amber-50/90 border-b border-amber-200 text-amber-950';

  const badgeBgClass =
    level === 0
      ? 'bg-slate-800 text-white'
      : level === 1
      ? 'bg-indigo-700 text-white'
      : 'bg-amber-700 text-white';

  const footerBgClass =
    level === 0
      ? 'bg-slate-100/90 border-t border-slate-300 text-slate-800'
      : level === 1
      ? 'bg-indigo-50/70 border-t border-indigo-200 text-indigo-900'
      : 'bg-amber-50/70 border-t border-amber-200 text-amber-900';

  return (
    <div
      className={`report-group-container my-3 ${indentClass} ${
        keepTogether ? 'break-inside-avoid page-break-inside-avoid' : ''
      }`}
      style={{
        pageBreakBefore: node.config?.pageBreakBefore ? 'always' : 'auto',
        pageBreakAfter: node.config?.pageBreakAfter ? 'always' : 'auto',
      }}
    >
      {/* 1. GRUPPENKOPF (Group Header) */}
      {showHeader && (
        <div
          className={`report-group-header-band report-section flex items-center justify-between px-3 py-2 rounded-t ${headerBgClass}`}
          style={getCssFromStyle(report.styles?.groupHeader)}
        >
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${badgeBgClass}`}>
              Ebene {level + 1}
            </span>
            <span className="text-xs font-semibold opacity-75">{node.fieldLabel}:</span>
            <span className="text-sm font-bold">{node.groupValue}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-normal bg-white/80 px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
              {node.totalCount} {node.totalCount === 1 ? 'Datensatz' : 'Datensätze'}
            </span>
          </div>
        </div>
      )}

      {/* 2. RECURSIVE SUBGROUPS OR LEAF DETAIL TABLE */}
      {!isLeaf ? (
        <div className="space-y-3 py-1 bg-white/40">
          {node.subGroups!.map((childNode) => (
            <ReportGroupNodeRenderer
              key={childNode.id}
              node={childNode}
              groupLevelsCount={groupLevelsCount}
              displayColumns={displayColumns}
              report={report}
              sourceFields={sourceFields}
              relationships={relationships}
              allReports={allReports}
              allTables={allTables}
              allQueries={allQueries}
              onShowDetail={onShowDetail}
              getCellStyle={getCellStyle}
              getCssFromStyle={getCssFromStyle}
            />
          ))}
        </div>
      ) : (
        /* DETAIL TABLE AT LEAF LEVEL */
        <div className="overflow-x-auto bg-white border-x border-b border-slate-200 rounded-b shadow-2xs">
          <table
            className={`report-detail-band w-full text-left text-xs border-collapse ${
              report.settings?.showGridlines ? 'border border-slate-300 divide-y divide-slate-300' : ''
            }`}
          >
            <thead>
              <tr
                className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]"
                style={getCssFromStyle(report.styles?.columnHeader)}
              >
                {displayColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`p-2.5 font-bold ${
                      report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {node.items.map((item, itemIndex) => {
                const isZebra = report.settings?.zebraStriping && itemIndex % 2 === 1;
                const parentKeyValue = report.subReport
                  ? item[sourceFields.find((f) => f.id === report.subReport?.parentKeyFieldId)?.name || 'id']
                  : null;

                return (
                  <React.Fragment key={itemIndex}>
                    <tr
                      className={`transition-colors ${
                        isZebra ? 'bg-slate-50/80' : 'bg-white'
                      } hover:bg-blue-50/40`}
                    >
                      {displayColumns.map((col) => {
                        const val = getRecordFieldValue(item, col.fieldName, col.label, col.id);
                        return (
                          <td
                            key={col.id}
                            className={`p-2.5 whitespace-nowrap ${
                              report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''
                            }`}
                            style={getCellStyle(val, { ...col } as any)}
                          >
                            <div className="flex items-center gap-2">
                              <ReportCellRenderer value={val} renderType={col.renderType || 'text'} />
                              {col.isFK && col.targetTableId && val && (
                                <button
                                  onClick={() => onShowDetail(col.targetTableId!, val)}
                                  className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Details anzeigen"
                                >
                                  <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Nested Sub-Report if configured */}
                    {report.subReport && report.subReport.reportId && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={displayColumns.length} className="p-2 pl-6">
                          <SubReportRenderer
                            subReportId={report.subReport.reportId}
                            foreignKeyFieldId={report.subReport.foreignKeyFieldId}
                            parentKeyValue={parentKeyValue}
                            allReports={allReports}
                            allTables={allTables}
                            allQueries={allQueries}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. GRUPPENFUSS (Group Footer with Isolated Subgroup Calculations) */}
      {showFooter && (
        <div
          className={`report-group-footer-band report-section px-3 py-2 border rounded-b flex flex-wrap items-center gap-4 text-xs mt-1 ${footerBgClass}`}
          style={getCssFromStyle(report.styles?.footer)}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Calculator size={13} className="shrink-0" />
            <span>
              Zwischensumme [{node.fieldLabel}: {node.groupValue}] ({node.totalCount} Zeilen):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {node.summaries.map((sum, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs text-[11px]"
              >
                <span className="font-bold text-slate-700">{sum.label}:</span>
                <span className="font-mono font-bold text-slate-950">{sum.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
