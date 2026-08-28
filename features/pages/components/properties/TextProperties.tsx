import React, { useState } from 'react';
import { PageComponent, Table, Query } from '../../../../types';
import { Calendar, DollarSign, Hash, Type, CheckSquare, Sparkles, Copy, Check, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import { formatFieldValue, formatDate } from '../../utils/formatUtils';

interface TextPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  tables?: Table[];
  queries?: Query[];
}

export const TextProperties: React.FC<TextPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  tables = [],
  queries = [],
}) => {
  const props = selectedNode.props || {};
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedFieldPipe, setSelectedFieldPipe] = useState<string>('none');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPipeHelp, setShowPipeHelp] = useState<boolean>(false);

  // Determine available fields from chosen table/query
  const selectedTable = tables.find(t => t.id === selectedSourceId);
  const selectedQuery = queries.find(q => q.id === selectedSourceId);
  
  const availableFields: string[] = [];
  if (selectedTable && selectedTable.fields) {
    selectedTable.fields.forEach(f => availableFields.push(f.name));
  } else if (selectedQuery) {
    // If query has selected fields or sample data
    availableFields.push('id', 'name', 'created_at', 'updated_at', 'status', 'total', 'date');
  }

  // Insert generated placeholder into text
  const handleInsertPlaceholder = () => {
    if (!selectedField) return;
    let placeholder = `{{${selectedField}}}`;
    if (selectedFieldPipe === 'date') {
      placeholder = `{{${selectedField} | date:'DD.MM.YYYY'}}`;
    } else if (selectedFieldPipe === 'datetime') {
      placeholder = `{{${selectedField} | date:'DD.MM.YYYY HH:mm'}}`;
    } else if (selectedFieldPipe === 'relative') {
      placeholder = `{{${selectedField} | date:'relative'}}`;
    } else if (selectedFieldPipe === 'currency') {
      placeholder = `{{${selectedField} | currency:'EUR'}}`;
    } else if (selectedFieldPipe === 'number') {
      placeholder = `{{${selectedField} | number:2}}`;
    } else if (selectedFieldPipe === 'uppercase') {
      placeholder = `{{${selectedField} | uppercase}}`;
    }

    const currentText = props.text || '';
    const newText = currentText ? `${currentText} ${placeholder}` : placeholder;
    updateSelectedNodeProps({ text: newText });
  };

  // Compute live preview of format configuration
  const previewSampleValue = (() => {
    if (props.formatType === 'date' || props.formatType === 'datetime' || props.formatType === 'time' || props.formatType === 'relative_date') {
      return new Date().toISOString();
    }
    if (props.formatType === 'currency') {
      return 1450.75;
    }
    if (props.formatType === 'number') {
      return 12345.678;
    }
    if (props.formatType === 'boolean') {
      return true;
    }
    return props.text || 'Beispieltext';
  })();

  const formattedPreview = formatFieldValue(previewSampleValue, {
    formatType: props.formatType,
    dateFormat: props.dateFormat,
    customDateFormat: props.customDateFormat,
    currencyCode: props.currencyCode,
    currencyDecimals: props.currencyDecimals !== undefined ? Number(props.currencyDecimals) : 2,
    currencyPosition: props.currencyPosition || 'after',
    numberDecimals: props.numberDecimals !== undefined ? Number(props.numberDecimals) : 2,
    numberThousandsSeparator: props.numberThousandsSeparator !== false,
    numberIsPercent: !!props.numberIsPercent,
    textTransform: props.textTransform,
    truncateLength: props.truncateLength ? Number(props.truncateLength) : 50,
    booleanTrueText: props.booleanTrueText || 'Ja',
    booleanFalseText: props.booleanFalseText || 'Nein',
    prefix: props.prefix || '',
    suffix: props.suffix || '',
    emptyFallback: props.emptyFallback || '-',
  });

  const datePresets = [
    { value: 'DD.MM.YYYY', label: 'TT.MM.JJJJ (28.08.2026)' },
    { value: 'DD.MM.YYYY HH:mm', label: 'TT.MM.JJJJ HH:mm (28.08.2026 14:30)' },
    { value: 'DD.MM.YYYY HH:mm:ss', label: 'TT.MM.JJJJ HH:mm:ss (28.08.2026 14:30:45)' },
    { value: 'YYYY-MM-DD', label: 'JJJJ-MM-TT (2026-08-28)' },
    { value: 'YYYY-MM-DD HH:mm', label: 'JJJJ-MM-TT HH:mm (2026-08-28 14:30)' },
    { value: 'DD. MMMM YYYY', label: 'TT. MMMM JJJJ (28. August 2026)' },
    { value: 'dddd, DD.MM.YYYY', label: 'Wochentag, Datum (Freitag, 28.08.2026)' },
    { value: 'relative', label: 'Relativ (vor 2 Tagen / heute)' },
    { value: 'HH:mm', label: 'Nur Uhrzeit (14:30)' },
    { value: 'HH:mm:ss', label: 'Uhrzeit mit Sekunden (14:30:45)' },
    { value: 'custom', label: 'Benutzerdefiniertes Muster...' },
  ];

  const pipeCheatSheet = [
    { syntax: "{{datum | date:'DD.MM.YYYY'}}", desc: 'Datum deutsch', example: '28.08.2026' },
    { syntax: "{{datum | date:'DD.MM.YYYY HH:mm'}}", desc: 'Datum & Uhrzeit', example: '28.08.2026 14:30' },
    { syntax: "{{datum | date:'relative'}}", desc: 'Relative Zeit', example: 'vor 2 Tagen' },
    { syntax: "{{preis | currency:'EUR'}}", desc: 'Währung EUR', example: '1.250,00 €' },
    { syntax: "{{preis | currency:'USD'}}", desc: 'Währung USD', example: '$ 1,250.00' },
    { syntax: "{{menge | number:2}}", desc: 'Zahl (2 Nachkomma)', example: '1.234,50' },
    { syntax: "{{text | uppercase}}", desc: 'Großbuchstaben', example: 'TEXT' },
    { syntax: "{{text | truncate:30}}", desc: 'Auf 30 Zeichen kürzen', example: 'Langer Text...' },
    { syntax: "{{wert | default:'-'}}", desc: 'Fallback bei leer', example: '-' },
  ];

  const handleCopyPipe = (syntax: string, index: number) => {
    navigator.clipboard.writeText(syntax);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      {/* Text Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Text Inhalt</label>
          <span className="text-[10px] text-slate-400 font-mono">Unterstützt {'{{feld}}'}</span>
        </div>
        <textarea
          value={props.text || ''}
          onChange={(e) => updateSelectedNodeProps({ text: e.target.value })}
          placeholder="Geben Sie hier Text oder Platzhalter wie {{created_at}} ein..."
          className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded min-h-[75px] focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
        />
      </div>

      {/* Field & Format Quick Inserter */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
          <span className="flex items-center gap-1"><Sparkles size={13} /> Feld & Format einfügen</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Datenquelle</label>
            <select
              value={selectedSourceId}
              onChange={(e) => {
                setSelectedSourceId(e.target.value);
                setSelectedField('');
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px]"
            >
              <option value="">-- Quelle wählen --</option>
              <optgroup label="Tabellen">
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
              <optgroup label="Abfragen">
                {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Feld</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              disabled={!selectedSourceId}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] disabled:opacity-50"
            >
              <option value="">-- Feld wählen --</option>
              {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div>
            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Format-Filter (Pipe)</label>
            <select
              value={selectedFieldPipe}
              onChange={(e) => setSelectedFieldPipe(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px]"
            >
              <option value="none">Kein (Rohwert)</option>
              <option value="date">Datum (TT.MM.JJJJ)</option>
              <option value="datetime">Datum & Zeit (TT.MM.JJJJ HH:mm)</option>
              <option value="relative">Relativ (vor X Tagen)</option>
              <option value="currency">Währung (€ EUR)</option>
              <option value="number">Zahl (2 Dezimalen)</option>
              <option value="uppercase">GROSSBUCHSTABEN</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleInsertPlaceholder}
              disabled={!selectedField}
              className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Sparkles size={12} /> Einfügen
            </button>
          </div>
        </div>
      </div>

      {/* Field Formatting Section */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar size={14} className="text-indigo-500" />
            Feld-Formatierung
          </h4>
          {props.formatType && props.formatType !== 'none' && (
            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded uppercase">
              Aktiv: {props.formatType}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          Formatiert den gesamten Komponentenwert automatisch als Datum, Währung, Zahl oder Text.
        </p>

        {/* Format Type Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Format-Typ</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: 'Standard', icon: Type },
              { id: 'date', label: 'Datum', icon: Calendar },
              { id: 'currency', label: 'Währung', icon: DollarSign },
              { id: 'number', label: 'Zahl', icon: Hash },
              { id: 'text', label: 'Text-Transform', icon: Type },
              { id: 'boolean', label: 'Ja / Nein', icon: CheckSquare },
            ].map(item => {
              const IconComp = item.icon;
              const isSelected = (props.formatType || 'none') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSelectedNodeProps({ formatType: item.id })}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <IconComp size={15} />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Formatting Options */}
        {(props.formatType === 'date' || props.formatType === 'datetime' || props.formatType === 'time' || props.formatType === 'relative_date') && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar size={13} className="text-indigo-600" /> Datums- &amp; Zeitmuster
            </h5>
            
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Muster / Preset</label>
              <select
                value={props.dateFormat || 'DD.MM.YYYY'}
                onChange={(e) => updateSelectedNodeProps({ dateFormat: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {datePresets.map(preset => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            {props.dateFormat === 'custom' && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Eigenes Datums-Muster</label>
                <input
                  type="text"
                  value={props.customDateFormat || ''}
                  onChange={(e) => updateSelectedNodeProps({ customDateFormat: e.target.value })}
                  placeholder="z.B. YYYY/MM/DD oder dddd, DD.MM.YYYY"
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
                <p className="text-[9px] text-slate-400 mt-1">Tokens: YYYY (Jahr), MM (Monat), DD (Tag), dddd (Wochentag), HH (Stunde), mm (Minute), ss (Sekunde)</p>
              </div>
            )}
          </div>
        )}

        {/* Currency Options */}
        {props.formatType === 'currency' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" /> Währungs-Einstellungen
            </h5>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Währung</label>
                <select
                  value={props.currencyCode || 'EUR'}
                  onChange={(e) => updateSelectedNodeProps({ currencyCode: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                >
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="USD">USD ($ Dollar)</option>
                  <option value="CHF">CHF (Franken)</option>
                  <option value="GBP">GBP (£ Pfund)</option>
                  <option value="JPY">JPY (¥ Yen)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nachkommastellen</label>
                <select
                  value={props.currencyDecimals !== undefined ? String(props.currencyDecimals) : '2'}
                  onChange={(e) => updateSelectedNodeProps({ currencyDecimals: parseInt(e.target.value, 10) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                >
                  <option value="0">0 (Keine)</option>
                  <option value="2">2 (Standard 0,00)</option>
                  <option value="3">3 (0,000)</option>
                  <option value="4">4 (0,0000)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Symbol-Position</label>
              <select
                value={props.currencyPosition || 'after'}
                onChange={(e) => updateSelectedNodeProps({ currencyPosition: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
              >
                <option value="after">Nachgestellt (1.250,00 €)</option>
                <option value="before">Vorangestellt (€ 1.250,00)</option>
              </select>
            </div>
          </div>
        )}

        {/* Number Options */}
        {props.formatType === 'number' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Hash size={13} className="text-indigo-600" /> Zahlen-Einstellungen
            </h5>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nachkommastellen</label>
                <select
                  value={props.numberDecimals !== undefined ? String(props.numberDecimals) : '2'}
                  onChange={(e) => updateSelectedNodeProps({ numberDecimals: parseInt(e.target.value, 10) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                >
                  <option value="0">0 (Ganzzahl)</option>
                  <option value="1">1 (0,0)</option>
                  <option value="2">2 (0,00)</option>
                  <option value="3">3 (0,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Prozent-Modus</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1.5">
                  <input
                    type="checkbox"
                    checked={!!props.numberIsPercent}
                    onChange={(e) => updateSelectedNodeProps({ numberIsPercent: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>% anhängen</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Text Transform Options */}
        {props.formatType === 'text' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Type size={13} className="text-indigo-600" /> Text-Transformation
            </h5>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Transformation</label>
              <select
                value={props.textTransform || 'none'}
                onChange={(e) => updateSelectedNodeProps({ textTransform: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
              >
                <option value="none">Unverändert</option>
                <option value="uppercase">GROSSBUCHSTABEN (UPPERCASE)</option>
                <option value="lowercase">kleinbuchstaben (lowercase)</option>
                <option value="capitalize">Wortanfänge Groß (Capitalize)</option>
                <option value="truncate">Auf Zeichenlänge kürzen (Truncate)</option>
              </select>
            </div>

            {props.textTransform === 'truncate' && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Maximale Zeichenlänge</label>
                <input
                  type="number"
                  value={props.truncateLength || 50}
                  onChange={(e) => updateSelectedNodeProps({ truncateLength: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Boolean Options */}
        {props.formatType === 'boolean' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <CheckSquare size={13} className="text-indigo-600" /> Ja/Nein Bezeichnungen
            </h5>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Label bei Wahr (True)</label>
                <input
                  type="text"
                  value={props.booleanTrueText || 'Ja'}
                  onChange={(e) => updateSelectedNodeProps({ booleanTrueText: e.target.value })}
                  placeholder="z.B. Ja oder Aktiv"
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Label bei Falsch (False)</label>
                <input
                  type="text"
                  value={props.booleanFalseText || 'Nein'}
                  onChange={(e) => updateSelectedNodeProps({ booleanFalseText: e.target.value })}
                  placeholder="z.B. Nein oder Inaktiv"
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Common Format Modifiers: Prefix, Suffix, Fallback */}
        {props.formatType && props.formatType !== 'none' && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Präfix (Vorne)</label>
                <input
                  type="text"
                  value={props.prefix || ''}
                  onChange={(e) => updateSelectedNodeProps({ prefix: e.target.value })}
                  placeholder="z.B. Datum: "
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Suffix (Hinten)</label>
                <input
                  type="text"
                  value={props.suffix || ''}
                  onChange={(e) => updateSelectedNodeProps({ suffix: e.target.value })}
                  placeholder="z.B. Uhr"
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Fallback bei leerem Wert</label>
              <input
                type="text"
                value={props.emptyFallback || ''}
                onChange={(e) => updateSelectedNodeProps({ emptyFallback: e.target.value })}
                placeholder="z.B. - oder Keine Angabe"
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
              />
            </div>
          </div>
        )}

        {/* Live Preview Box */}
        {props.formatType && props.formatType !== 'none' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-lg p-2.5 space-y-1">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <Check size={12} /> Live-Vorschau der Formatierung
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-950 dark:text-emerald-200 break-words bg-white dark:bg-slate-900 px-2 py-1.5 rounded border border-emerald-100 dark:border-emerald-900">
              {formattedPreview || <span className="text-slate-400 italic">Keine Ausgabe</span>}
            </div>
          </div>
        )}
      </div>

      {/* Inline Pipes Cheat Sheet Accordion */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowPipeHelp(!showPipeHelp)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition py-1"
        >
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-indigo-500" />
            Inline Pipe-Formatierung ({'{{feld | pipe}}'})
          </span>
          {showPipeHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showPipeHelp && (
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[10px]">
            <p className="text-slate-500 mb-1">Klicken zum Kopieren und direkt in Text einfügen:</p>
            {pipeCheatSheet.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleCopyPipe(item.syntax, idx)}
                className="flex items-center justify-between p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer group"
              >
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{item.syntax}</div>
                  <div className="text-slate-500 text-[9px]">{item.desc} ➔ <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.example}</span></div>
                </div>
                <div className="text-slate-400 group-hover:text-indigo-600 px-1">
                  {copiedIndex === idx ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
