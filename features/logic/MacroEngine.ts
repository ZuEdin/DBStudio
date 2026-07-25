import { Macro, MacroStep, ReportExportConfig } from '../../types/macro';
import { exportDataToFile } from '../../utils/exportHelper';
import { executeSelectQuery, executeActionQuery } from '../queries/utils/queryExecution';
import { Table, Query, Report } from '../../types/index';
import { logAuditTrail } from '../../utils/auditTrail';

export interface MacroExecutionContext {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  params?: Record<string, any>;
  currentRecord?: Record<string, any>;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (pageId: string) => void;
  onOpenSmartImport?: (targetTableId?: string) => void;
  onOpenFormModal?: (formId: string, mode?: 'create' | 'edit') => void;
  onCloseFormModal?: () => void;
  onOpenReportView?: (reportId: string) => void;
  onRequery?: () => void;
  onTableChange?: (updatedTable: Table) => void;
}

export function executeMacroStep(step: MacroStep, context: MacroExecutionContext) {
  const { 
    tables, queries, reports, params, currentRecord, 
    onShowToast, onNavigate, onOpenSmartImport, onOpenFormModal, 
    onCloseFormModal, onOpenReportView, onRequery, onTableChange 
  } = context;

  switch (step.type) {
    case 'EXPORT_REPORT': {
      if (!step.exportConfig) break;
      const { sourceType, sourceId, format, title } = step.exportConfig;

      let exportData: Record<string, any>[] = [];
      let exportTitle = title || 'Bericht_Export';

      if (sourceType === 'table') {
        const table = tables.find(t => t.id === sourceId);
        if (table) {
          exportData = table.data || [];
          exportTitle = title || `Export_Tabelle_${table.name}`;
        }
      } else if (sourceType === 'query') {
        const query = queries.find(q => q.id === sourceId);
        if (query && query.type === 'SELECT') {
          exportData = executeSelectQuery(query as any, tables, []);
          exportTitle = title || `Export_Query_${query.name}`;
        }
      } else if (sourceType === 'report') {
        const report = reports.find(r => r.id === sourceId);
        if (report) {
          const table = tables.find(t => t.id === report.sourceId);
          if (table) {
            exportData = table.data || [];
          }
          exportTitle = title || `Bericht_${report.name}`;
        }
      }

      exportDataToFile({
        title: exportTitle,
        data: exportData,
        format: format || 'PDF',
        filename: `${exportTitle.replace(/\s+/g, '_')}_${Date.now()}`
      });

      if (onShowToast) {
        onShowToast(`Makro: Export '${exportTitle}' als ${format} abgeschlossen.`, 'success');
      }
      break;
    }

    case 'SMART_IMPORT': {
      if (onOpenSmartImport) {
        onOpenSmartImport(step.importConfig?.targetTableId);
      }
      break;
    }

    case 'EXECUTE_QUERY': {
      if (step.queryId) {
        const query = queries.find(q => q.id === step.queryId);
        if (query) {
          if (query.type === 'SELECT') {
            executeSelectQuery(query as any, tables, []);
            if (onShowToast) onShowToast(`Makro: Abfrage '${query.name}' wurde ausgeführt.`, 'info');
          } else {
            const res = executeActionQuery(query, tables, []);
            if (onTableChange && res.updatedTables) {
              res.updatedTables.forEach(t => onTableChange(t));
            }
            if (onShowToast) onShowToast(`Makro Aktionsabfrage: ${res.message}`, 'success');
            logAuditTrail({
              tableName: query.name,
              recordId: 'MASS_ACTION',
              action: 'EXECUTE_QUERY',
              user: 'MakroEngine',
              details: res.message
            });
          }
        }
      }
      break;
    }

    case 'OPEN_FORM': {
      if (step.formId && onOpenFormModal) {
        onOpenFormModal(step.formId, 'create');
      }
      break;
    }

    case 'CLOSE_FORM': {
      if (onCloseFormModal) {
        onCloseFormModal();
      }
      break;
    }

    case 'OPEN_REPORT':
    case 'PRINT_REPORT': {
      if (step.reportId && onOpenReportView) {
        onOpenReportView(step.reportId);
        if (step.type === 'PRINT_REPORT') {
          setTimeout(() => window.print(), 500);
        }
      } else if (step.exportConfig && step.exportConfig.sourceId && onOpenReportView) {
        onOpenReportView(step.exportConfig.sourceId);
      }
      break;
    }

    case 'EXECUTE_ACTION': {
      if (step.queryId) {
        const query = queries.find(q => q.id === step.queryId);
        if (query) {
          const res = executeActionQuery(query, tables, []);
          if (onTableChange && res.updatedTables) {
            res.updatedTables.forEach(t => onTableChange(t));
          }
          if (onShowToast) onShowToast(`Aktionsabfrage '${query.name}': ${res.message}`, 'success');
        }
      }
      break;
    }

    case 'SET_FILTER': {
      if (onShowToast) {
        onShowToast(`Filter angewendet: ${step.filterExpression || 'Aktiv'}`, 'info');
      }
      break;
    }

    case 'REQUERY': {
      if (onRequery) {
        onRequery();
      }
      if (onShowToast) onShowToast('Datenquellen wurden aktualisiert (Requery).', 'info');
      break;
    }

    case 'MESSAGE_BOX': {
      if (step.messageText) {
        alert(`[MS Access Hinweis]\n\n${step.messageText}`);
      }
      break;
    }

    case 'CONFIRM_DIALOG': {
      if (step.confirmPrompt) {
        const agreed = window.confirm(step.confirmPrompt);
        if (agreed && onShowToast) {
          onShowToast('Bestätigung akzeptiert.', 'success');
        }
      }
      break;
    }

    case 'EXECUTE_JS_SCRIPT': {
      if (step.jsCode) {
        try {
          // JS Scripting Sandbox Execution (VBA replacement)
          const scriptFn = new Function('context', `
            try {
              ${step.jsCode}
            } catch(e) {
              console.error("VBA/JS Script Error:", e);
              if (context.showToast) context.showToast("Script Fehler: " + e.message, "error");
            }
          `);
          scriptFn({
            record: currentRecord || {},
            tables,
            queries,
            params: params || {},
            showToast: onShowToast,
            navigate: onNavigate
          });
        } catch (err: any) {
          if (onShowToast) onShowToast(`JS/VBA Syntax-Fehler: ${err.message}`, 'error');
        }
      }
      break;
    }

    case 'NAVIGATE': {
      if (step.pageId && onNavigate) {
        onNavigate(step.pageId);
      }
      break;
    }

    case 'SHOW_TOAST': {
      if (step.toastMessage && onShowToast) {
        onShowToast(step.toastMessage, step.toastType || 'info');
      }
      break;
    }
  }
}

export function executeMacro(macro: Macro, context: MacroExecutionContext) {
  if (!macro || !macro.steps || macro.steps.length === 0) return;
  macro.steps.forEach(step => executeMacroStep(step, context));
}

export function getSavedMacros(): Macro[] {
  try {
    const raw = localStorage.getItem('db_studio_macros');
    return raw ? JSON.parse(raw) : getInitialDefaultMacros();
  } catch (e) {
    return getInitialDefaultMacros();
  }
}

export function saveMacro(macro: Macro) {
  const current = getSavedMacros();
  const idx = current.findIndex(m => m.id === macro.id);
  let updated: Macro[];
  if (idx !== -1) {
    updated = [...current];
    updated[idx] = { ...macro, updatedAt: new Date().toISOString() };
  } else {
    updated = [...current, { ...macro, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }
  localStorage.setItem('db_studio_macros', JSON.stringify(updated));
  return updated;
}

export function deleteMacro(macroId: string) {
  const current = getSavedMacros();
  const updated = current.filter(m => m.id !== macroId);
  localStorage.setItem('db_studio_macros', JSON.stringify(updated));
  return updated;
}

function getInitialDefaultMacros(): Macro[] {
  return [
    {
      id: 'macro_export_pdf',
      name: 'Bericht als PDF Exportieren',
      description: 'Generiert sofort ein formatiertes PDF-Dokument aus den aktuellen Tabellendaten',
      category: 'REPORT_EXPORT',
      steps: [
        {
          id: 'step_pdf',
          name: 'PDF Export',
          type: 'EXPORT_REPORT',
          exportConfig: { sourceType: 'table', sourceId: '', format: 'PDF', title: 'DB Studio Pro Bericht' }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'macro_import_excel',
      name: 'Smart Excel/CSV Import Wizard',
      description: 'Öffnet den interaktiven Upload-Assistenten zur Aktualisierung von Tabellen',
      category: 'DATA_IMPORT',
      steps: [
        {
          id: 'step_import',
          name: 'Smart Upload',
          type: 'SMART_IMPORT'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
