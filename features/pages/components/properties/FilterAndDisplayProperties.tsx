import React from 'react';
import { 
  Plus, Trash2, Filter, ArrowUpDown, Eye, Search, Sparkles, Tag, Sliders, CheckCircle2 
} from 'lucide-react';
import { 
  PageComponent, 
  Table, 
  Query, 
  CustomPage, 
  PageFilterRule, 
  QuickFilterPreset, 
  ColumnDisplayConfig,
  FilterOperator,
  FilterValueSource
} from '../../../../types';

interface FilterAndDisplayPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  tables: Table[];
  queries: Query[];
  pages: CustomPage[];
}

export const FilterAndDisplayProperties: React.FC<FilterAndDisplayPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  tables,
  queries,
  pages,
}) => {
  const props = selectedNode.props || {};

  // Retrieve available columns from selected dataSource
  let availableCols: { id: string; name: string; label: string; type?: string }[] = [];
  if (props.dataSourceType === 'table' && props.dataSourceId) {
    const targetTable = tables.find(t => t.id === props.dataSourceId);
    if (targetTable) {
      availableCols = targetTable.fields.map(f => ({
        id: f.name,
        name: f.name,
        label: f.name,
        type: f.type
      }));
    }
  } else if (props.dataSourceType === 'query' && props.dataSourceId) {
    const targetQuery = queries.find(q => q.id === props.dataSourceId);
    if (targetQuery && (targetQuery as any).columns) {
      availableCols = (targetQuery as any).columns.map((c: any) => {
        const colName = c.alias || c.fieldName;
        return {
          id: colName,
          name: colName,
          label: colName,
          type: 'text'
        };
      });
    }
  }

  // Filter Rules
  const filterRules: PageFilterRule[] = props.filterRules || (
    // Fallback/migration from legacy filterParamField
    props.filterParamField && props.filterParamName ? [
      {
        id: 'legacy_1',
        field: props.filterParamField,
        operator: 'equals',
        valueSource: 'parameter',
        value: props.filterParamName,
        ignoreIfEmpty: false
      }
    ] : []
  );

  const filterLogic: 'AND' | 'OR' = props.filterLogic || 'AND';
  const quickFilters: QuickFilterPreset[] = props.quickFilters || [];
  const columnsConfig: ColumnDisplayConfig[] = props.columnsConfig || [];
  const defaultSortField: string = props.defaultSortField || '';
  const defaultSortDirection: 'asc' | 'desc' = props.defaultSortDirection || 'asc';
  const enableSearchBar: boolean = props.enableSearchBar !== undefined ? props.enableSearchBar : true;
  const searchPlaceholder: string = props.searchPlaceholder || 'Suche nach Datensätzen...';

  // Helper to update filter rules
  const handleUpdateFilterRules = (nextRules: PageFilterRule[]) => {
    // Keep legacy props in sync for backwards compatibility
    const firstParamRule = nextRules.find(r => r.valueSource === 'parameter' && r.operator === 'equals');
    updateSelectedNodeProps({
      filterRules: nextRules,
      filterParamField: firstParamRule ? firstParamRule.field : '',
      filterParamName: firstParamRule ? firstParamRule.value : ''
    });
  };

  const addFilterRule = () => {
    const defaultField = availableCols[0]?.name || 'id';
    const newRule: PageFilterRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      field: defaultField,
      operator: 'equals',
      valueSource: 'parameter',
      value: 'selectedId',
      ignoreIfEmpty: true
    };
    handleUpdateFilterRules([...filterRules, newRule]);
  };

  const removeFilterRule = (idx: number) => {
    const next = [...filterRules];
    next.splice(idx, 1);
    handleUpdateFilterRules(next);
  };

  const updateFilterRule = (idx: number, patch: Partial<PageFilterRule>) => {
    const next = [...filterRules];
    next[idx] = { ...next[idx], ...patch };
    handleUpdateFilterRules(next);
  };

  // Quick Filters
  const addQuickFilter = () => {
    const defaultField = availableCols[0]?.name || 'status';
    const newPreset: QuickFilterPreset = {
      id: `qf_${Date.now()}`,
      label: 'Neu Filter',
      field: defaultField,
      operator: 'equals',
      value: 'Aktiv',
      color: 'indigo'
    };
    updateSelectedNodeProps({ quickFilters: [...quickFilters, newPreset] });
  };

  const removeQuickFilter = (idx: number) => {
    const next = [...quickFilters];
    next.splice(idx, 1);
    updateSelectedNodeProps({ quickFilters: next });
  };

  const updateQuickFilter = (idx: number, patch: Partial<QuickFilterPreset>) => {
    const next = [...quickFilters];
    next[idx] = { ...next[idx], ...patch };
    updateSelectedNodeProps({ quickFilters: next });
  };

  // Gather all known parameters across pages for easy auto-suggestion
  const commonParamSuggestions = Array.from(new Set([
    'selectedId',
    'id',
    'parentId',
    'parent_id',
    'kundeId',
    'projektId',
    'status',
    'kategorie',
    'userId',
    ...pages.flatMap(p => p.expectedParams || [])
  ])).filter(Boolean);

  return (
    <div className="space-y-5 pt-3">
      {/* SECTION 1: FILTER RULES ENGINE */}
      <div className="p-3 bg-indigo-50/60 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Filter size={14} className="text-indigo-600" />
            <span>Filter-Regeln (Bedingungen)</span>
          </div>
          {filterRules.length > 1 && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded border border-indigo-200 text-[10px]">
              <button
                type="button"
                onClick={() => updateSelectedNodeProps({ filterLogic: 'AND' })}
                className={`px-1.5 py-0.5 rounded font-bold transition ${filterLogic === 'AND' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
              >
                UND (Alle)
              </button>
              <button
                type="button"
                onClick={() => updateSelectedNodeProps({ filterLogic: 'OR' })}
                className={`px-1.5 py-0.5 rounded font-bold transition ${filterLogic === 'OR' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
              >
                ODER (Mind. 1)
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Definiere Bedingungen zur automatischen Filterung der angezeigten Datensätze basierend auf URL-Parametern, übergeordneten Kontexten oder festen Werten.
        </p>

        {filterRules.length === 0 ? (
          <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-dashed border-indigo-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500 mb-2">Keine Filter-Regeln aktiv (Alle Daten werden angezeigt)</p>
            <button
              type="button"
              onClick={addFilterRule}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              <Plus size={13} /> Filter-Regel hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filterRules.map((rule, idx) => (
              <div 
                key={rule.id || idx} 
                className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    Regel #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFilterRule(idx)}
                    className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                    title="Regel entfernen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Field Selector */}
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase">Spalte</label>
                    <select
                      value={rule.field}
                      onChange={(e) => updateFilterRule(idx, { field: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs font-medium"
                    >
                      {availableCols.map(col => (
                        <option key={col.id} value={col.name}>
                          {col.label} {col.type ? `(${col.type})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase">Operator</label>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateFilterRule(idx, { operator: e.target.value as FilterOperator })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs font-medium"
                    >
                      <option value="equals">= Ist gleich</option>
                      <option value="not_equals">!= Ungleich</option>
                      <option value="contains">Enthält</option>
                      <option value="not_contains">Enthält nicht</option>
                      <option value="starts_with">Beginnt mit</option>
                      <option value="ends_with">Endet mit</option>
                      <option value="greater_than">&gt; Größer als</option>
                      <option value="less_than">&lt; Kleiner als</option>
                      <option value="greater_or_equal">&gt;= Größer/Gleich</option>
                      <option value="less_or_equal">&lt;= Kleiner/Gleich</option>
                      <option value="is_not_empty">Ist nicht leer</option>
                      <option value="is_empty">Ist leer / null</option>
                      <option value="in_list">In Liste (Kommasepariert)</option>
                    </select>
                  </div>
                </div>

                {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Value Source */}
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase">Wert-Quelle</label>
                        <select
                          value={rule.valueSource}
                          onChange={(e) => updateFilterRule(idx, { valueSource: e.target.value as FilterValueSource })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="parameter">🌐 Seiten/URL Parameter</option>
                          <option value="parent_context">🔗 Übergeordneter Datensatz (Context)</option>
                          <option value="static">📝 Fester statischer Wert</option>
                          <option value="auth_user">👤 Benutzer-ID / Rolle</option>
                        </select>
                      </div>

                      {/* Value / Param Name */}
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase">
                          {rule.valueSource === 'parameter' ? 'Parameter-Name' : rule.valueSource === 'parent_context' ? 'Eltern-Feld' : 'Vergleichswert'}
                        </label>
                        <input
                          type="text"
                          value={rule.value || ''}
                          onChange={(e) => updateFilterRule(idx, { value: e.target.value })}
                          list={`param_suggestions_${idx}`}
                          placeholder={rule.valueSource === 'parameter' ? 'z.B. selectedId' : 'Wert eingeben...'}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 font-mono"
                        />
                        <datalist id={`param_suggestions_${idx}`}>
                          {commonParamSuggestions.map(p => (
                            <option key={p} value={p} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Ignore If Empty Toggle */}
                    {rule.valueSource === 'parameter' && (
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={rule.ignoreIfEmpty !== false}
                          onChange={(e) => updateFilterRule(idx, { ignoreIfEmpty: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                        />
                        <span>Regel ignorieren, falls Parameter nicht übergeben / leer ist</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addFilterRule}
              className="w-full py-1.5 bg-white dark:bg-slate-900 border border-dashed border-indigo-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition flex items-center justify-center gap-1"
            >
              <Plus size={13} /> Weitere Filter-Regel hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: QUICK FILTERS & SEARCH BAR */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Search size={14} className="text-slate-500" />
          <span>Suche & Schnellfilter-Leiste</span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableSearchBar}
              onChange={(e) => updateSelectedNodeProps({ enableSearchBar: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Globale Live-Suchleiste aktivieren</span>
          </label>

          {enableSearchBar && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Such-Platzhalter Text</label>
              <input
                type="text"
                value={searchPlaceholder}
                onChange={(e) => updateSelectedNodeProps({ searchPlaceholder: e.target.value })}
                placeholder="z.B. Suche nach Name, E-Mail..."
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
              />
            </div>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Tag size={11} /> Schnellfilter-Buttons (Chips)
            </label>
            <button
              type="button"
              onClick={addQuickFilter}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <Plus size={11} /> Chip hinzufügen
            </button>
          </div>

          {quickFilters.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic">Keine Schnellfilter-Buttons konfiguriert</p>
          ) : (
            <div className="space-y-1.5">
              {quickFilters.map((qf, idx) => (
                <div key={qf.id || idx} className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={qf.label}
                    onChange={(e) => updateQuickFilter(idx, { label: e.target.value })}
                    placeholder="Label (z.B. Offen)"
                    className="w-24 px-1.5 py-0.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded"
                  />
                  <select
                    value={qf.field}
                    onChange={(e) => updateQuickFilter(idx, { field: e.target.value })}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-[11px]"
                  >
                    {availableCols.map(col => (
                      <option key={col.id} value={col.name}>{col.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={qf.value}
                    onChange={(e) => updateQuickFilter(idx, { value: e.target.value })}
                    placeholder="Wert (z.B. Offen)"
                    className="w-20 px-1.5 py-0.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuickFilter(idx)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: DEFAULT SORTING */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <ArrowUpDown size={14} className="text-slate-500" />
          <span>Standard-Sortierung</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Sortier-Spalte</label>
            <select
              value={defaultSortField}
              onChange={(e) => updateSelectedNodeProps({ defaultSortField: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Keine Standard-Sortierung --</option>
              {availableCols.map(col => (
                <option key={col.id} value={col.name}>{col.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Richtung</label>
            <select
              value={defaultSortDirection}
              onChange={(e) => updateSelectedNodeProps({ defaultSortDirection: e.target.value as 'asc' | 'desc' })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
            >
              <option value="asc">Aufsteigend (A-Z, 0-9)</option>
              <option value="desc">Absteigend (Z-A, 9-0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: COLUMN FORMATTING & DISPLAY */}
      {availableCols.length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sliders size={14} className="text-slate-500" />
              <span>Spaltenformatierung & Typen</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {availableCols.map(col => {
              const currentCfg = columnsConfig.find(c => c.field === col.name) || {
                field: col.name,
                label: col.label,
                format: (col.type === 'DECIMAL' || col.type === 'DOUBLE' || col.name.toLowerCase().includes('preis')) ? 'currency'
                  : (col.type === 'DATE' || col.type === 'DATETIME' || col.name.toLowerCase().includes('datum')) ? 'date'
                  : col.type === 'BOOLEAN' ? 'boolean'
                  : col.name.toLowerCase().includes('status') ? 'badge'
                  : 'text'
              };

              const updateColConfig = (format: ColumnDisplayConfig['format']) => {
                const nextConfigs = columnsConfig.filter(c => c.field !== col.name);
                nextConfigs.push({ ...currentCfg, format });
                updateSelectedNodeProps({ columnsConfig: nextConfigs });
              };

              return (
                <div key={col.id} className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]" title={col.name}>
                    {col.label}
                  </span>
                  <select
                    value={currentCfg.format || 'text'}
                    onChange={(e) => updateColConfig(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[11px]"
                  >
                    <option value="text">Standard (Text)</option>
                    <option value="currency">Währung (€ / $)</option>
                    <option value="date">Datum (DD.MM.YYYY)</option>
                    <option value="datetime">Datum + Uhrzeit</option>
                    <option value="badge">Status-Badge</option>
                    <option value="boolean">Häkchen / Boolean</option>
                    <option value="number">Zahl formatiert</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
