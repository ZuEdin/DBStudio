
import React, { useState } from 'react';
import { Table, Field, FieldType, ValidationRule, ValidationOperator, LockInfo, Relationship } from '../../types/index';
import { Plus, Trash2, Key, Wand2, Hash, Clock, CheckSquare, ShieldAlert, Lock, Unlock, UserCheck, GripVertical } from 'lucide-react';
import { generateTableSchema } from '../../services/geminiService';
import { DATA_TYPES } from '../../config/dataTypes';
import { MockDataGeneratorModal } from './MockDataGeneratorModal';

interface TableDesignerProps {
  table: Table;
  onTableChange: (table: Table) => void;
  lockedBy?: LockInfo | null;
  currentUserId?: string;
  relationships?: Relationship[];
  showConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ table, onTableChange, lockedBy, currentUserId, relationships = [], showConfirmation }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'validation' | 'grid'>('fields');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [showMockData, setShowMockData] = useState(false);
  
  const { name: tableName, description: tableDescription, fields, validationRules = [] } = table;
  
  const isLockedByMe = lockedBy?.userId === currentUserId;
  const isLockedByOther = lockedBy && !isLockedByMe;
  const isReadOnly = isLockedByOther;

  const setTableName = (name: string) => {
    if(isReadOnly) return;
    onTableChange({ ...table, name });
  }

  const setTableDescription = (description: string) => {
    if(isReadOnly) return;
    onTableChange({ ...table, description });
  }

  const setFields = (fields: Field[]) => {
    if(isReadOnly) return;
    onTableChange({ ...table, fields });
  }

  const addField = () => {
    if(isReadOnly) return;
    setFields([...fields, { 
        id: crypto.randomUUID(), 
        name: `Feld${fields.length + 1}`, 
        type: 'VARCHAR',
        length: 255,
        allowNull: true
    }]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    if(isReadOnly) return;
    setFields(fields.map(f => {
        if (f.id !== id) return f;
        if (updates.type && updates.type !== f.type) {
            const config = DATA_TYPES[updates.type];
            return { 
                ...f, 
                ...updates,
                length: config.hasLength ? (config.defaultLength || 255) : undefined,
                precision: config.hasPrecision ? config.defaultPrecision : undefined,
                scale: config.hasPrecision ? config.defaultScale : undefined,
                defaultValue: undefined 
            };
        }
        return { ...f, ...updates };
    }));
  };

  const removeField = (id: string) => {
    if(isReadOnly) return;
    const fieldObj = fields.find(f => f.id === id);
    const fieldName = fieldObj?.name || 'Unbekanntes Feld';

    const isUsedInRelationship = relationships.some(rel => 
      (rel.fromTableId === table.id && rel.fromFieldId === id) ||
      (rel.toTableId === table.id && rel.toFieldId === id)
    );

    const performDelete = () => setFields(fields.filter(f => f.id !== id));

    if (isUsedInRelationship) {
        if (showConfirmation) {
            showConfirmation(
                'Feld löschen?',
                `Das Feld "${fieldName}" wird in einer oder mehreren Beziehungen (Tabellenverknüpfungen) verwendet. Wenn Sie es löschen, werden diese Beziehungen möglicherweise ungültig oder beschädigt. Möchten Sie das Feld wirklich löschen?`,
                performDelete
            );
        } else if (window.confirm(`Das Feld "${fieldName}" wird in einer Beziehung verwendet. Wirklich löschen?`)) {
            performDelete();
        }
    } else {
        if (showConfirmation) {
            showConfirmation(
                'Feld löschen?',
                `Möchten Sie das Feld "${fieldName}" wirklich löschen?`,
                performDelete
            );
        } else if (window.confirm(`Möchten Sie das Feld "${fieldName}" wirklich löschen?`)) {
            performDelete();
        }
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox to allow dragging
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isReadOnly) return;
    e.preventDefault();
    
    if (draggedFieldIndex === null || draggedFieldIndex === dropIndex) return;

    const newFields = [...fields];
    const [movedField] = newFields.splice(draggedFieldIndex, 1);
    newFields.splice(dropIndex, 0, movedField);

    setFields(newFields);
    setDraggedFieldIndex(null);
  };

  const addValidationRule = () => {
      if(isReadOnly) return;
      const newRule: ValidationRule = {
          id: crypto.randomUUID(),
          fieldId: fields[0]?.id || '',
          operator: 'gt',
          compareType: 'value',
          compareValue: '0',
          errorMessage: 'Ungültiger Wert'
      };
      onTableChange({ ...table, validationRules: [...validationRules, newRule] });
  };

  const updateValidationRule = (id: string, updates: Partial<ValidationRule>) => {
      if(isReadOnly) return;
      const newRules = validationRules.map(r => r.id === id ? { ...r, ...updates } : r);
      onTableChange({ ...table, validationRules: newRules });
  };

  const removeValidationRule = (id: string) => {
      if(isReadOnly) return;
      const performDelete = () => onTableChange({ ...table, validationRules: validationRules.filter(r => r.id !== id) });
      if (showConfirmation) {
          showConfirmation('Regel löschen?', 'Möchten Sie diese Validierungsregel wirklich löschen?', performDelete);
      } else if (window.confirm('Möchten Sie diese Validierungsregel wirklich löschen?')) {
          performDelete();
      }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || isReadOnly) return;
    setIsAiLoading(true);
    const schema = await generateTableSchema(aiPrompt);
    if (schema) {
      const newTable = { ...table };
      newTable.name = schema.tableName || tableName;
      if (schema.fields && Array.isArray(schema.fields)) {
        const newFields: Field[] = schema.fields.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: (DATA_TYPES[f.type] ? f.type : 'VARCHAR') as FieldType,
          isPrimaryKey: f.name.toLowerCase() === 'id',
          allowNull: f.name.toLowerCase() !== 'id',
          isAutoIncrement: f.name.toLowerCase() === 'id' && f.type === 'INTEGER',
          length: f.type === 'VARCHAR' ? 255 : undefined
        }));
        newTable.fields = newFields;
      }
      onTableChange(newTable);
    }
    setIsAiLoading(false);
    setShowAi(false);
  };

  const renderDefaultValueInput = (field: Field) => {
      if (field.isAutoIncrement) return <span className="text-slate-400 text-xs italic">-</span>;

      if (field.type === 'BOOLEAN') {
          return (
              <select 
                  value={field.defaultValue || ''} 
                  disabled={isReadOnly}
                  onChange={e => updateField(field.id, { defaultValue: e.target.value })}
                  className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
              >
                  <option value="">(Kein Standard)</option>
                  <option value="true">True (Ja)</option>
                  <option value="false">False (Nein)</option>
              </select>
          );
      }

      if (field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return (
            <div className="relative group">
                <input 
                    type="text" 
                    value={field.defaultValue || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                    placeholder="NULL"
                    className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm placeholder:text-slate-300"
                />
                {!isReadOnly && (
                    <div className="absolute right-1 top-1 hidden group-hover:block">
                        <button 
                            onClick={() => updateField(field.id, { defaultValue: 'NOW' })} 
                            className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1 rounded text-slate-600"
                            title="Aktuelles Datum (NOW)"
                        >
                            NOW
                        </button>
                    </div>
                )}
            </div>
          );
      }

      return (
        <input 
            type="text" 
            value={field.defaultValue || ''}
            disabled={isReadOnly}
            onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
            placeholder="NULL"
            className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm placeholder:text-slate-300"
        />
      );
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className={`max-w-[95%] mx-auto bg-white shadow-lg border rounded-lg overflow-hidden flex flex-col h-full ${isReadOnly ? 'border-amber-300 ring-2 ring-amber-100' : isLockedByMe ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'}`}>
        {/* Header */}
        <div className={`text-white px-6 py-4 flex justify-between items-center shrink-0 ${isReadOnly ? 'bg-amber-600' : isLockedByMe ? 'bg-emerald-700' : 'bg-slate-800'}`}>
          <div className="flex gap-4 items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                  {isReadOnly ? <Lock size={20} className="text-white"/> : isLockedByMe ? <UserCheck size={20} className="text-emerald-100"/> : null} 
                  Tabellenentwurf
              </h2>
              <div className="flex bg-black/20 rounded p-1">
                  <button 
                    onClick={() => setActiveTab('fields')} 
                    className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'fields' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      Felder
                  </button>
                  <button 
                    onClick={() => setActiveTab('grid')} 
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'grid' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      Grid UX
                  </button>
                  <button 
                    onClick={() => setActiveTab('validation')} 
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'validation' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      <ShieldAlert size={14}/> Validierung
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button onClick={() => setShowMockData(true)} className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 rounded text-sm text-white">
                  <Database size={14} /> Mock-Data
              </button>
            )}
            {!isReadOnly && (
              <button onClick={() => setShowAi(!showAi)} className={`flex items-center gap-1 px-3 py-1 rounded text-sm text-white ${isLockedByMe ? 'bg-emerald-800 hover:bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500'}`}>
                  <Wand2 size={14} /> AI-Entwurf
              </button>
            )}
          </div>
        </div>

        {/* Lock Banner */}
        {isReadOnly && lockedBy && (
            <div className="bg-amber-100 text-amber-800 px-6 py-2 text-sm font-semibold flex items-center gap-2 border-b border-amber-200">
                <Lock size={14} />
                Schreibgeschützt: Dieses Objekt wird gerade von <u>{lockedBy.userName}</u> bearbeitet.
            </div>
        )}
        
        {/* Locked by Me Banner */}
        {isLockedByMe && (
            <div className="bg-emerald-50 text-emerald-800 px-6 py-2 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100">
                <UserCheck size={14} />
                Bearbeitungsmodus: Für andere Benutzer gesperrt.
            </div>
        )}

        {/* AI Assistant */}
        {showAi && !isReadOnly && (
          <div className="p-4 bg-purple-50 border-b border-purple-100 animate-in slide-in-from-top-2 shrink-0">
            <label className="block text-sm font-medium text-purple-900 mb-1">Beschreibe deine Tabelle:</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border border-purple-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="z.B. Kunden Tabelle mit Name, Adresse, Email und Geburtsdatum"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isAiLoading ? 'Denkt nach...' : 'Generieren'}
              </button>
            </div>
          </div>
        )}

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tabellenname</label>
              <input 
                type="text" 
                value={tableName} 
                disabled={isReadOnly}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Beschreibung (Optional)</label>
              <input 
                type="text" 
                value={tableDescription || ''} 
                disabled={isReadOnly}
                onChange={(e) => setTableDescription(e.target.value)}
                placeholder="Kommentar zur Tabelle"
                className="w-full border border-slate-300 rounded p-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>

          {activeTab === 'fields' ? (
              <>
                <table className="w-full border-collapse">
                    <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {!isReadOnly && <th className="p-2 w-8"></th>}
                        <th className="p-2 w-10 text-center" title="Primärschlüssel">PK</th>
                        <th className="p-2 w-1/5">Feldname</th>
                        <th className="p-2 w-40">Datentyp</th>
                        <th className="p-2 w-20">Size/Attr</th>
                        <th className="p-2 w-24">Formatierung</th>
                        <th className="p-2 w-16 text-center" title="Erlaubt NULL-Werte">Null</th>
                        <th className="p-2 w-16 text-center" title="Automatisch hochzählen (nur Integer)">Auto</th>
                        <th className="p-2 w-48">Standardwert</th>
                        <th className="p-2 flex-1">Kommentar</th>
                        {!isReadOnly && <th className="p-2 w-10"></th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                    {fields.map((field, idx) => {
                        const typeConfig = DATA_TYPES[field.type];
                        const isDate = field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP';
                        return (
                        <tr 
                            key={field.id} 
                            className={`group ${draggedFieldIndex === idx ? 'bg-blue-50 opacity-50' : 'hover:bg-slate-50'}`}
                            draggable={!isReadOnly}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                        >
                        {!isReadOnly && (
                            <td className="p-2 text-center cursor-move text-slate-300 hover:text-slate-500">
                                <GripVertical size={16} />
                            </td>
                        )}
                        <td className="p-2 text-center">
                            <button 
                            disabled={isReadOnly}
                            onClick={() => updateField(field.id, { isPrimaryKey: !field.isPrimaryKey, allowNull: field.isPrimaryKey })}
                            className={`p-1 rounded ${field.isPrimaryKey ? 'text-yellow-600' : 'text-slate-300'} ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                            >
                            <Key size={16} />
                            </button>
                        </td>
                        <td className="p-2">
                            <input 
                            type="text" 
                            value={field.name}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500"
                            />
                        </td>
                        <td className="p-2">
                            <select 
                            value={field.type}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                            className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500"
                            >
                            {Object.entries(DATA_TYPES).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                            </select>
                        </td>
                        <td className="p-2 flex gap-1">
                            {typeConfig?.hasLength && (
                                <input 
                                    type="number" 
                                    placeholder="Len"
                                    value={field.length || ''} 
                                    disabled={isReadOnly}
                                    onChange={e => updateField(field.id, { length: parseInt(e.target.value) })}
                                    className="w-16 border border-slate-300 rounded px-1 py-0.5 text-xs text-center disabled:bg-slate-100"
                                />
                            )}
                            {typeConfig?.hasPrecision && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Prec"
                                        value={field.precision || ''} 
                                        disabled={isReadOnly}
                                        onChange={e => updateField(field.id, { precision: parseInt(e.target.value) })}
                                        className="w-12 border border-slate-300 rounded px-1 py-0.5 text-xs text-center disabled:bg-slate-100"
                                    />
                                    <span className="text-slate-400">,</span>
                                    <input 
                                        type="number" 
                                        placeholder="Scale"
                                        value={field.scale || ''} 
                                        disabled={isReadOnly}
                                        onChange={e => updateField(field.id, { scale: parseInt(e.target.value) })}
                                        className="w-12 border border-slate-300 rounded px-1 py-0.5 text-xs text-center disabled:bg-slate-100"
                                    />
                                </>
                            )}
                        </td>
                        <td className="p-2">
                            {isDate && (
                                <select 
                                    value={field.displayFormat || ''}
                                    disabled={isReadOnly}
                                    onChange={e => updateField(field.id, { displayFormat: e.target.value })}
                                    className="w-full border border-slate-200 rounded px-1 py-0.5 text-xs disabled:bg-slate-100"
                                >
                                    <option value="">(Standard)</option>
                                    <option value="dd.MM.yyyy">dd.MM.yyyy (31.12.2024)</option>
                                    <option value="dd.MM.yyyy HH:mm">dd.MM.yyyy HH:mm</option>
                                    <option value="MM/dd/yyyy">MM/dd/yyyy (US)</option>
                                    <option value="yyyy-MM-dd">yyyy-MM-dd (ISO)</option>
                                    <option value="HH:mm">HH:mm (Zeit)</option>
                                </select>
                            )}
                        </td>
                        <td className="p-2 text-center">
                            <input 
                                type="checkbox" 
                                checked={field.allowNull !== false}
                                disabled={field.isPrimaryKey || isReadOnly}
                                onChange={(e) => updateField(field.id, { allowNull: e.target.checked })}
                            />
                        </td>
                        <td className="p-2 text-center">
                            {field.type === 'INTEGER' && (
                                <button 
                                disabled={isReadOnly}
                                onClick={() => updateField(field.id, { isAutoIncrement: !field.isAutoIncrement })}
                                className={`p-1 rounded ${field.isAutoIncrement ? 'text-green-600' : 'text-slate-200'} ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                                >
                                <Hash size={16} />
                                </button>
                            )}
                        </td>
                        <td className="p-2">
                            {renderDefaultValueInput(field)}
                        </td>
                        <td className="p-2">
                            <input 
                                type="text" 
                                value={field.comment || ''}
                                disabled={isReadOnly}
                                onChange={(e) => updateField(field.id, { comment: e.target.value })}
                                placeholder="Kommentar (Optional)"
                                className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500"
                            />
                        </td>
                        {!isReadOnly && (
                            <td className="p-2">
                                <button 
                                onClick={() => removeField(field.id)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Feld löschen"
                                >
                                <Trash2 size={16} />
                                </button>
                            </td>
                        )}
                        </tr>
                    )})}
                    </tbody>
                </table>

                {!isReadOnly && (
                    <button 
                        onClick={addField}
                        className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                        <Plus size={16} /> Feld hinzufügen
                    </button>
                )}
              </>
          ) : activeTab === 'grid' ? (
              <div className="max-w-4xl animate-in fade-in space-y-6">
                <div className="bg-slate-100 p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><CheckSquare size={18} /> Excel-Like Data Grid</h3>
                    <p className="text-xs text-slate-600 mb-4">Erweiterte Tabellenfunktionen für den Endanwender in der fertig generierten Application.</p>
                    
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input type="checkbox" checked={table.enableInlineEditing || false} disabled={isReadOnly} onChange={e => onTableChange({...table, enableInlineEditing: e.target.checked})} />
                            Inline Editing erlauben (Doppelklick zum Bearbeiten)
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input type="checkbox" checked={table.enableMassUpdates || false} disabled={isReadOnly} onChange={e => onTableChange({...table, enableMassUpdates: e.target.checked})} />
                            Mass Updates & Checkboxes erlauben
                        </label>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-4">Spalten-Formatierung (Custom Renderer)</h3>
                    <div className="space-y-2">
                        {fields.map(field => (
                             <div key={field.id} className="flex gap-4 items-center bg-slate-50 p-2 rounded">
                                 <div className="w-1/3 flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-slate-700">{field.name}</span>
                                    <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500">{field.type}</span>
                                 </div>
                                 <div className="flex-1">
                                    <select 
                                        value={field.rendererType || 'text'}
                                        disabled={isReadOnly}
                                        onChange={e => updateField(field.id, { rendererType: e.target.value as any })}
                                        className="w-full text-sm border p-1.5 rounded disabled:bg-slate-100 bg-white"
                                    >
                                        <option value="text">Standard-Text</option>
                                        <option value="progress">Progress-Bar (%)</option>
                                        <option value="status_pill">Status-Badge (Pill)</option>
                                        <option value="avatar">Avatar (mit Name/Email)</option>
                                        <option value="currency">Währung / Currency</option>
                                    </select>
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-4">Bedingte Formatierung (Zeilen)</h3>
                    <div className="space-y-2">
                        {(table.conditionalFormatting || []).map((rule, idx) => (
                            <div key={rule.id} className="flex gap-2 items-center bg-white border border-slate-200 rounded p-2 text-sm shadow-sm">
                                <span>Wenn Feld</span>
                                <select 
                                    className="border rounded p-1 bg-slate-50 text-xs"
                                    value={rule.fieldId}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx].fieldId = e.target.value;
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    {(fields || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <select 
                                    className="border rounded p-1 bg-slate-50 text-xs"
                                    value={rule.operator}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx].operator = e.target.value as any;
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    <option value="eq">ist gleich</option>
                                    <option value="neq">ist ungleich</option>
                                    <option value="contains">enthält</option>
                                    <option value="gt">größer als</option>
                                    <option value="lt">kleiner als</option>
                                </select>
                                <input 
                                    type="text" 
                                    className="border rounded p-1 w-20 text-xs" 
                                    placeholder="Wert..."
                                    value={rule.value || ''}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx].value = e.target.value;
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                />
                                <span className="text-slate-400 font-bold">»</span>
                                
                                <span className="text-xs text-slate-600">Zeile einfärben:</span>
                                <input type="color" value={rule.style.backgroundColor || '#ffffff'} onChange={e => {
                                    const updated = [...(table.conditionalFormatting || [])];
                                    updated[idx].style = { ...updated[idx].style, backgroundColor: e.target.value };
                                    onTableChange({...table, conditionalFormatting: updated});
                                }} className="h-6 w-6 rounded border cursor-pointer"/>
                                                                
                                <input type="color" value={rule.style.color || '#000000'} onChange={e => {
                                    const updated = [...(table.conditionalFormatting || [])];
                                    updated[idx].style = { ...updated[idx].style, color: e.target.value };
                                    onTableChange({...table, conditionalFormatting: updated});
                                }} className="h-6 w-6 rounded border cursor-pointer"/>

                                <button 
                                    className="text-red-500 hover:bg-red-50 p-1 rounded ml-auto text-xs font-bold"
                                    onClick={() => {
                                        const updated = (table.conditionalFormatting || []).filter(r => r.id !== rule.id);
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        <button 
                            className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold"
                            onClick={() => {
                                const newRule = {
                                    id: crypto.randomUUID(),
                                    fieldId: fields[0]?.id || '',
                                    operator: 'eq' as const,
                                    value: '',
                                    style: { backgroundColor: '#fee2e2', color: '#991b1b' }
                                };
                                onTableChange({...table, conditionalFormatting: [...(table.conditionalFormatting || []), newRule]});
                            }}
                        >
                            <Plus size={16}/> Neue Regel
                        </button>
                    </div>
                </div>
              </div>
          ) : (
              <div className="max-w-4xl animate-in fade-in slide-in-from-right-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                      <p className="text-sm text-blue-700">
                          Definieren Sie hier Geschäftsregeln, die beim Speichern (Backend) validiert werden.
                      </p>
                  </div>
                  
                  <div className="space-y-3">
                      {validationRules.map((rule) => (
                          <div key={rule.id} className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-2 rounded shadow-sm">
                              <div className="w-1/4">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Feld</label>
                                  <select 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    value={rule.fieldId}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { fieldId: e.target.value })}
                                  >
                                      {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                  </select>
                              </div>
                              <div className="w-24">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Operator</label>
                                  <select 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    value={rule.operator}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { operator: e.target.value as ValidationOperator })}
                                  >
                                      <option value="gt">Größer (&gt;)</option>
                                      <option value="lt">Kleiner (&lt;)</option>
                                      <option value="gte">Min (&gt;=)</option>
                                      <option value="lte">Max (&lt;=)</option>
                                      <option value="eq">Gleich (=)</option>
                                      <option value="neq">Ungleich (!=)</option>
                                      <option value="regex">Regex Pattern</option>
                                  </select>
                              </div>
                              <div className="w-1/3">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Vergleichswert / Feld</label>
                                  <div className="flex gap-1">
                                      <select 
                                        className="border rounded p-1 text-xs w-16 bg-slate-100 disabled:opacity-50"
                                        value={rule.compareType}
                                        disabled={isReadOnly}
                                        onChange={e => updateValidationRule(rule.id, { compareType: e.target.value as any })}
                                      >
                                          <option value="value">Wert</option>
                                          <option value="field">Feld</option>
                                      </select>
                                      {rule.compareType === 'field' ? (
                                          <select 
                                            className="flex-1 border rounded p-1 text-sm disabled:bg-slate-100"
                                            value={rule.compareValue}
                                            disabled={isReadOnly}
                                            onChange={e => updateValidationRule(rule.id, { compareValue: e.target.value })}
                                          >
                                              <option value="">(Wählen)</option>
                                              {fields.filter(f => f.id !== rule.fieldId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                          </select>
                                      ) : (
                                          <input 
                                            type="text" 
                                            className="flex-1 border rounded p-1 text-sm disabled:bg-slate-100"
                                            placeholder={rule.operator === 'regex' ? '^Pattern$' : 'Wert'}
                                            value={rule.compareValue}
                                            disabled={isReadOnly}
                                            onChange={e => updateValidationRule(rule.id, { compareValue: e.target.value })}
                                          />
                                      )}
                                  </div>
                              </div>
                              <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Fehlermeldung</label>
                                  <input 
                                    type="text" 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    placeholder="z.B. Startdatum muss vor Enddatum liegen"
                                    value={rule.errorMessage}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { errorMessage: e.target.value })}
                                  />
                              </div>
                              {!isReadOnly && (
                                <button onClick={() => removeValidationRule(rule.id)} className="mt-4 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                              )}
                          </div>
                      ))}
                      
                      {!isReadOnly && (
                        <button onClick={addValidationRule} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold mt-4">
                            <Plus size={16} /> Regel hinzufügen
                        </button>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>
      {showMockData && (
          <MockDataGeneratorModal table={table} onClose={() => setShowMockData(false)} />
      )}
    </div>
  );
};
