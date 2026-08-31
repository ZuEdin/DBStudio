import React from 'react';
import { NextcloudAppConfig } from '../../../types/nextcloud';
import { Table, Form, Report, Query } from '../../../types/index';
import { Database, FileText, Layout, Eye, CheckSquare, Square } from 'lucide-react';

interface NcEntitySelectorTabProps {
  config: NextcloudAppConfig;
  onChange: (updates: Partial<NextcloudAppConfig>) => void;
  tables: Table[];
  forms: Form[];
  reports: Report[];
  queries: Query[];
}

export const NcEntitySelectorTab: React.FC<NcEntitySelectorTabProps> = ({
  config,
  onChange,
  tables,
  forms,
  reports,
  queries
}) => {
  const toggleTable = (id: string) => {
    const current = config.includedTableIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ includedTableIds: next });
  };

  const toggleAllTables = () => {
    if ((config.includedTableIds || []).length === tables.length) {
      onChange({ includedTableIds: [] });
    } else {
      onChange({ includedTableIds: tables.map(t => t.id) });
    }
  };

  const toggleForm = (id: string) => {
    const current = config.includedFormIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ includedFormIds: next });
  };

  const toggleReport = (id: string) => {
    const current = config.includedReportIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ includedReportIds: next });
  };

  const toggleQuery = (id: string) => {
    const current = config.includedQueryIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ includedQueryIds: next });
  };

  return (
    <div className="space-y-6">
      {/* Tables Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tabellen & REST-API-Controller ({tables.length})
            </h4>
          </div>
          <button
            onClick={toggleAllTables}
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {(config.includedTableIds || []).length === tables.length ? 'Alle abwählen' : 'Alle auswählen'}
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(table => {
            const isSelected = (config.includedTableIds || []).length === 0 || (config.includedTableIds || []).includes(table.id);
            return (
              <div
                key={table.id}
                onClick={() => toggleTable(table.id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📊</span> {table.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {table.fields?.length || 0} Spalten • {table.data?.length || 0} Datensätze
                  </div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1">
                    /api/v1/{table.name.toLowerCase()}
                  </div>
                </div>
                <div>
                  {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forms Section */}
      {forms.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Layout size={16} className="text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Formulare in Vue.js einbetten ({forms.length})
            </h4>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {forms.map(form => {
              const isSelected = (config.includedFormIds || []).includes(form.id);
              return (
                <div
                  key={form.id}
                  onClick={() => toggleForm(form.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>📝</span> {form.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {form.fields?.length || 0} Felder
                    </div>
                  </div>
                  <div>
                    {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Queries Section */}
      {queries.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Eye size={16} className="text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Gespeicherte Abfragen als REST-Views ({queries.length})
            </h4>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {queries.map(q => {
              const isSelected = (config.includedQueryIds || []).includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuery(q.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🔍</span> {q.name}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      /api/v1/queries/{q.name.toLowerCase().replace(/[^a-z0-9_]+/g, '_')}
                    </div>
                  </div>
                  <div>
                    {isSelected ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} className="text-slate-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
