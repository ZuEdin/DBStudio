import React, { useState } from 'react';
import { Table, Query, Field } from '../../../types/index';
import { X, TableProperties, CheckCircle2, AlertCircle, ArrowRight, Key, Clock, Database, Sparkles, Code } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface MakeTableWizardProps {
  tables: Table[];
  queries: Query[];
  onClose: () => void;
  initialSourceId?: string;
  initialSourceType?: 'table' | 'query';
}

export const MakeTableWizard: React.FC<MakeTableWizardProps> = ({ 
  tables, 
  queries, 
  onClose,
  initialSourceId,
  initialSourceType = 'query'
}) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [isTemporary, setIsTemporary] = useState(false);
  const [tempScope, setTempScope] = useState<'session' | 'transaction' | 'global'>('session');
  
  const defaultName = isTemporary 
    ? '#TempTabelle_' + Math.floor(Math.random() * 1000)
    : 'TabellenExport_' + new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const [newTableName, setNewTableName] = useState(defaultName);
  const [sourceType, setSourceType] = useState<'table' | 'query'>(
    initialSourceType || (queries.length > 0 ? 'query' : 'table')
  );
  const [sourceId, setSourceId] = useState(
    initialSourceId || (sourceType === 'query' ? (queries[0]?.id || '') : (tables[0]?.id || ''))
  );
  
  // Selected field IDs to copy
  const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);
  const [primaryKeyFieldName, setPrimaryKeyFieldName] = useState<string>('');
  const [openAfterCreation, setOpenAfterCreation] = useState(true);

  const selectedSourceTable = sourceType === 'table' ? tables.find(t => t.id === sourceId) : null;
  const selectedSourceQuery = sourceType === 'query' ? queries.find(q => q.id === sourceId) : null;

  // Available fields from source
  const availableFields = React.useMemo(() => {
    if (selectedSourceTable) {
      return selectedSourceTable.fields.map(f => ({ 
        id: f.id, 
        name: f.name, 
        type: f.type,
        fieldName: f.name,
        tableName: selectedSourceTable.name
      }));
    }
    if (selectedSourceQuery && 'columns' in selectedSourceQuery) {
      let sampleResults: Record<string, any>[] = [];
      try {
        sampleResults = store.executeQuery(selectedSourceQuery) || [];
      } catch (err) {
        console.warn("Could not execute query for field schema preview", err);
      }
      const sampleRow = sampleResults.length > 0 ? sampleResults[0] : null;

      const visibleCols = selectedSourceQuery.columns.filter(c => c.show !== false);
      const colsToUse = visibleCols.length > 0 ? visibleCols : selectedSourceQuery.columns;

      const fieldsList = colsToUse.map(c => {
        const displayName = (c.alias && c.alias.trim()) ? c.alias.trim() : (c.fieldName || (c.isCalculated ? 'Berechnet' : 'Spalte'));
        
        let fieldType: any = 'VARCHAR';
        
        // 1. Try source table type
        if (c.tableName && c.fieldName) {
          const srcTbl = tables.find(t => t.name.toLowerCase() === c.tableName?.toLowerCase() || t.id === c.tableId);
          const srcField = srcTbl?.fields.find(f => f.name.toLowerCase() === c.fieldName.toLowerCase() || f.id === c.fieldId);
          if (srcField) {
            fieldType = srcField.type;
          }
        }

        // 2. Try inspecting actual data in sampleRow
        if (sampleRow) {
          const val = sampleRow[displayName] ?? 
            (c.fieldName ? sampleRow[c.fieldName] : undefined) ?? 
            (c.alias ? sampleRow[c.alias] : undefined);
            
          if (val !== undefined && val !== null && val !== '') {
            if (typeof val === 'number') {
              fieldType = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
            } else if (typeof val === 'boolean') {
              fieldType = 'BOOLEAN';
            } else if (typeof val === 'string') {
              if (/^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{2}\.\d{2}\.\d{4}/.test(val)) {
                fieldType = 'DATE';
              } else if (/^-?\d+(\.\d+)?$/.test(val.trim())) {
                fieldType = val.includes('.') ? 'DECIMAL' : 'INTEGER';
              }
            }
          }
        }

        return {
          id: c.id,
          name: displayName,
          type: fieldType,
          fieldName: c.fieldName,
          alias: c.alias,
          tableName: c.tableName,
          isCalculated: c.isCalculated,
          originalCol: c
        };
      });

      // Also if sampleRow has keys that were not in colsToUse (e.g. from dynamic SELECT * or Crosstab), include them
      if (sampleRow) {
        Object.keys(sampleRow).forEach(k => {
          if (!fieldsList.some(f => f.name.toLowerCase() === k.toLowerCase())) {
            const val = sampleRow[k];
            let inferredType: any = 'VARCHAR';
            if (typeof val === 'number') inferredType = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
            else if (typeof val === 'boolean') inferredType = 'BOOLEAN';
            else if (typeof val === 'string' && (/^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{2}\.\d{2}\.\d{4}/.test(val))) inferredType = 'DATE';

            fieldsList.push({
              id: `dyn_${k}`,
              name: k,
              type: inferredType,
              fieldName: k,
              alias: k,
              tableName: '',
              isCalculated: false,
              originalCol: undefined
            });
          }
        });
      }

      return fieldsList;
    }
    return [];
  }, [selectedSourceTable, selectedSourceQuery, tables, store]);

  React.useEffect(() => {
    if (availableFields.length > 0) {
      const names = availableFields.map(f => f.name);
      setSelectedFieldNames(names);
      setPrimaryKeyFieldName(names[0] || '');
    }
  }, [sourceId, sourceType, availableFields]);

  const handleToggleTemp = (temp: boolean) => {
    setIsTemporary(temp);
    if (temp) {
      if (!newTableName.startsWith('#') && !newTableName.startsWith('temp_')) {
        setNewTableName(`temp_${newTableName}`);
      }
    } else {
      if (newTableName.startsWith('#')) {
        setNewTableName(newTableName.replace(/^#+/, ''));
      } else if (newTableName.startsWith('temp_')) {
        setNewTableName(newTableName.replace(/^temp_/, ''));
      }
    }
  };

  const toggleFieldSelection = (fieldName: string) => {
    if (selectedFieldNames.includes(fieldName)) {
      setSelectedFieldNames(selectedFieldNames.filter(n => n !== fieldName));
    } else {
      setSelectedFieldNames([...selectedFieldNames, fieldName]);
    }
  };

  const generatedSql = React.useMemo(() => {
    const srcName = sourceType === 'table' ? (selectedSourceTable?.name || 'Tabelle') : (selectedSourceQuery?.name || 'Abfrage');
    const cols = selectedFieldNames.length > 0 ? selectedFieldNames.join(', ') : '*';
    if (isTemporary) {
      return `-- Temporäre Tabelle (${tempScope.toUpperCase()} Scope)\nCREATE TEMPORARY TABLE "${newTableName}" AS\nSELECT ${cols}\nFROM "${srcName}";`;
    }
    return `-- Permanente Tabellenerstellungsabfrage (SELECT INTO)\nSELECT ${cols}\nINTO "${newTableName}"\nFROM "${srcName}";`;
  }, [newTableName, sourceType, selectedSourceTable, selectedSourceQuery, selectedFieldNames, isTemporary, tempScope]);

  const handleExecute = () => {
    if (!newTableName.trim()) return;

    let sourceRows: Record<string, any>[] = [];
    if (selectedSourceTable) {
      sourceRows = selectedSourceTable.data || [];
    } else if (selectedSourceQuery) {
      try {
        sourceRows = store.executeQuery(selectedSourceQuery) || [];
      } catch (err) {
        console.error("MakeTable execution error:", err);
      }

      // If executeQuery returned 0 rows, check if source table has raw data fallback
      if (sourceRows.length === 0 && 'nodes' in selectedSourceQuery && selectedSourceQuery.nodes.length > 0) {
        const firstTableNode = selectedSourceQuery.nodes[0];
        const tbl = tables.find(t => t.id === firstTableNode.tableId);
        if (tbl && tbl.data) {
          sourceRows = tbl.data;
        }
      }
    }

    // Build new fields list
    const newFields: Field[] = availableFields
      .filter(f => selectedFieldNames.includes(f.name))
      .map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: (f.type || 'VARCHAR') as any,
        isPrimaryKey: f.name === primaryKeyFieldName,
        isAutoIncrement: f.name === primaryKeyFieldName && (f.type === 'INTEGER' || f.name.toLowerCase() === 'id')
      }));

    if (newFields.length === 0) {
      ui.addToast('Bitte wählen Sie mindestens ein Feld aus.', 'error');
      return;
    }

    // Helper to safely extract field values from row across all naming styles, aliases and prefixes
    const extractFieldValue = (row: Record<string, any>, targetName: string, fieldDef: any, idx: number) => {
      // 1. Direct key match
      if (row[targetName] !== undefined && row[targetName] !== null) {
        return row[targetName];
      }

      // 2. Exact case-insensitive match
      const targetLower = targetName.toLowerCase();
      for (const [k, v] of Object.entries(row)) {
        if (k.toLowerCase() === targetLower && v !== undefined && v !== null) {
          return v;
        }
      }

      // 3. Match normalized (without spaces, underscores, dots or hyphens)
      const targetNorm = targetLower.replace(/[\s_\.-]/g, '');
      for (const [k, v] of Object.entries(row)) {
        if (k.toLowerCase().replace(/[\s_\.-]/g, '') === targetNorm && v !== undefined && v !== null) {
          return v;
        }
      }

      // 4. Suffix match (e.g. "Rechnungen.Falligdatum", "Kunden.Zahlungsstatus")
      for (const [k, v] of Object.entries(row)) {
        const kLower = k.toLowerCase();
        if ((kLower.endsWith('.' + targetLower) || kLower.endsWith('_' + targetLower)) && v !== undefined && v !== null) {
          return v;
        }
      }

      // 5. Query column alias or fieldName fallback
      if (fieldDef?.originalCol) {
        const col = fieldDef.originalCol;
        if (col.alias && row[col.alias] !== undefined && row[col.alias] !== null) return row[col.alias];
        if (col.fieldName && row[col.fieldName] !== undefined && row[col.fieldName] !== null) return row[col.fieldName];
        if (col.tableName && col.fieldName && row[`${col.tableName}.${col.fieldName}`] !== undefined) {
          return row[`${col.tableName}.${col.fieldName}`];
        }
      }

      if (fieldDef?.fieldName && row[fieldDef.fieldName] !== undefined && row[fieldDef.fieldName] !== null) {
        return row[fieldDef.fieldName];
      }

      // 6. If primary key and no value, auto-generate sequential ID
      if (fieldDef?.isPrimaryKey || targetName === primaryKeyFieldName) {
        return idx + 1;
      }

      return '';
    };

    // Filter and map source row data to selected fields
    const newTableData = sourceRows.map((row, idx) => {
      const cleanRow: Record<string, any> = {};
      newFields.forEach(field => {
        const fieldMeta = availableFields.find(af => af.name === field.name);
        cleanRow[field.name] = extractFieldValue(row, field.name, fieldMeta, idx);
      });
      return cleanRow;
    });

    const newTable: Table = {
      id: crypto.randomUUID(),
      name: newTableName.trim(),
      description: `${isTemporary ? 'Temporäre Tabelle' : 'Tabelle'} erstellt aus ${sourceType === 'table' ? selectedSourceTable?.name : selectedSourceQuery?.name} am ${new Date().toLocaleDateString('de-DE')}`,
      fields: newFields,
      data: newTableData,
      isTemporary,
      tempScope: isTemporary ? tempScope : undefined
    };

    store.addTable(newTable);
    ui.addToast(
      `${isTemporary ? '⚡ Temporäre Tabelle' : 'Neue Tabelle'} "${newTable.name}" mit ${newTableData.length} Datensätzen und ${newFields.length} Feldern erstellt.`,
      'success'
    );

    if (openAfterCreation) {
      ui.setCurrentView({ type: 'table_data', tableId: newTable.id });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center animate-in fade-in duration-150 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl border border-slate-300 dark:border-slate-800 flex flex-col h-[650px] overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-teal-700 to-teal-600 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TableProperties className="text-teal-200" /> Tabellenerstellungsabfrage (Make-Table Query)
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              Erstellt eine neue permanente oder temporäre Tabelle (TEMP Table / SELECT INTO) aus Daten oder Abfragen.
            </p>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white transition-colors cursor-pointer p-1 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-6 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              
              {/* Type toggle: Permanent vs Temporary */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Tabellen-Persistenz / Lebensdauer
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleTemp(false)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      !isTemporary
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20 font-medium'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Database className={`shrink-0 mt-0.5 ${!isTemporary ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} size={20} />
                    <div>
                      <div className="font-bold text-sm">Permanente Tabelle</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Wird dauerhaft im Schema gespeichert (Standard `SELECT INTO` / `CREATE TABLE`).
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleTemp(true)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isTemporary
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 font-medium'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock className={`shrink-0 mt-0.5 ${isTemporary ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} size={20} />
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        Temporäre Tabelle (TEMP)
                        <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] rounded font-mono font-bold">#TEMP</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Arbeitsspeicher / Session-Scope. Ideal für Zwischenrechnungen & Transformationen.
                      </div>
                    </div>
                  </button>
                </div>

                {isTemporary && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Gültigkeitsbereich (Scope):</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="tempScope" 
                        checked={tempScope === 'session'} 
                        onChange={() => setTempScope('session')}
                        className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>Session (Sitzungsdauer)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="tempScope" 
                        checked={tempScope === 'transaction'} 
                        onChange={() => setTempScope('transaction')}
                        className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>Transaktion (DROP ON COMMIT)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Table Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Name der neuen {isTemporary ? 'temporären' : ''} Tabelle
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                    value={newTableName}
                    onChange={e => setNewTableName(e.target.value)}
                    placeholder={isTemporary ? '#temp_abfrage_ergebnis' : 'Kunden_2026_Archiv'}
                  />
                  {isTemporary && (
                    <span className="absolute right-3 top-2.5 px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-xs font-mono font-bold rounded">
                      TEMP
                    </span>
                  )}
                </div>
              </div>

              {/* Source Type & Source Object */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Datenquelle Typ</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    value={sourceType}
                    onChange={e => { setSourceType(e.target.value as any); setSourceId(''); }}
                  >
                    <option value="query">Abfrage (Query)</option>
                    <option value="table">Tabelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Quellobjekt wählen</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    value={sourceId}
                    onChange={e => setSourceId(e.target.value)}
                  >
                    <option value="">Bitte wählen...</option>
                    {sourceType === 'table' ? (
                      tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Zeilen)</option>)
                    ) : (
                      queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              {/* SQL Statement Preview Box */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1.5">
                  <Code size={12} className="text-teal-400" /> Generiertes SQL Statement (Vorschau):
                </div>
                <pre className="text-teal-300 font-mono whitespace-pre-wrap">{generatedSql}</pre>
              </div>

            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Spaltenauswahl & Primärschlüssel</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Wählen Sie die zu übernehmenden Felder und legen Sie optional einen Primärschlüssel fest.
                  </p>
                </div>
                <span className="text-xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold px-2.5 py-1 rounded-full">
                  {selectedFieldNames.length} von {availableFields.length} Spalten gewählt
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                      <tr>
                        <th className="p-3 text-center w-12 border-r border-slate-200 dark:border-slate-700">Inkl.</th>
                        <th className="p-3 text-left border-r border-slate-200 dark:border-slate-700">Spaltenname</th>
                        <th className="p-3 text-left border-r border-slate-200 dark:border-slate-700">Datentyp</th>
                        <th className="p-3 text-center w-36">Primärschlüssel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {availableFields.map(field => {
                        const isSelected = selectedFieldNames.includes(field.name);
                        const isPK = primaryKeyFieldName === field.name;

                        return (
                          <tr key={field.id} className={isSelected ? 'bg-teal-50/30 dark:bg-teal-950/20' : 'bg-slate-50/50 dark:bg-slate-900/50 opacity-60'}>
                            <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFieldSelection(field.name)}
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                              {field.name}
                            </td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                              <span className="border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 font-mono">
                                {field.type}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setPrimaryKeyFieldName(isPK ? '' : field.name)}
                                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer ${
                                  isPK 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                <Key size={12} className={isPK ? 'text-amber-600 dark:text-amber-300' : ''} /> {isPK ? 'PK gesetzt' : 'Setzen'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="openAfterCreation"
                  checked={openAfterCreation}
                  onChange={e => setOpenAfterCreation(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="openAfterCreation" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  Tabelle nach Erstellung sofort in der Datenblattansicht öffnen
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium border border-slate-300 dark:border-slate-700 cursor-pointer">
              Zurück
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium border border-slate-300 dark:border-slate-700 cursor-pointer">
              Abbrechen
            </button>
          )}

          {step === 1 && (
            <button 
              onClick={() => setStep(2)}
              disabled={!newTableName.trim() || !sourceId}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Weiter <ArrowRight size={18}/>
            </button>
          )}

          {step === 2 && (
            <button 
              onClick={handleExecute}
              disabled={selectedFieldNames.length === 0}
              className={`${
                isTemporary 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              <CheckCircle2 size={18}/> {isTemporary ? 'Temporäre Tabelle Erstellen' : 'Tabelle Erstellen (SELECT INTO)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

