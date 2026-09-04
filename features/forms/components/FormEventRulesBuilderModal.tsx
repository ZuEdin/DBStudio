import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Check,
  X,
  Play,
  Settings,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Sparkles,
  Link,
  Code,
  FileText,
  Mail,
  Send,
} from 'lucide-react';
import { Form, FormEventHandler, Table, Report } from '../../../types/index';
import { executeFormEventHandlers } from '../utils/formEventEngine';

interface FormEventRulesBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  tables: Table[];
  forms?: Form[];
  reports?: Report[];
  onSaveForm: (updatedForm: Form) => void;
}

export const FormEventRulesBuilderModal: React.FC<FormEventRulesBuilderModalProps> = ({
  isOpen,
  onClose,
  form,
  tables,
  forms = [],
  reports = [],
  onSaveForm,
}) => {
  const [rules, setRules] = useState<FormEventHandler[]>(() => form.eventHandlers || []);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    form.eventHandlers && form.eventHandlers.length > 0 ? form.eventHandlers[0].id : null
  );
  const [testResult, setTestResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === form.sourceId);
  const tableFields = currentTable?.fields || [];
  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const handleAddRule = () => {
    const newRule: FormEventHandler = {
      id: crypto.randomUUID(),
      name: `Neue Regel ${rules.length + 1}`,
      enabled: true,
      event: 'BeforeUpdate',
      actionType: 'set_field_value',
      conditionExpr: '',
      targetFieldId: tableFields[0]?.id || '',
      valueExpr: '',
      toastMessage: 'Aktion erfolgreich ausgeführt.',
      toastType: 'success',
    };
    setRules([...rules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  const handleUpdateSelectedRule = (patch: Partial<FormEventHandler>) => {
    if (!selectedRule) return;
    setRules(rules.map((r) => (r.id === selectedRule.id ? { ...r, ...patch } : r)));
  };

  const handleDeleteRule = (id: string) => {
    const next = rules.filter((r) => r.id !== id);
    setRules(next);
    if (selectedRuleId === id) {
      setSelectedRuleId(next[0]?.id || null);
    }
  };

  const handleMoveRule = (idx: number, direction: 'up' | 'down') => {
    const next = [...rules];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setRules(next);
  };

  const handleTestRunRule = () => {
    if (!selectedRule) return;
    const sampleRecord = currentTable?.data?.[0] || {
      ID: 1,
      Status: 'Offen',
      Betrag: 1500,
      Kunde: 'Musterkunde GmbH',
      Datum: new Date().toISOString().split('T')[0],
    };

    const tempForm: Form = {
      ...form,
      eventHandlers: [selectedRule],
    };

    const res = executeFormEventHandlers({
      event: selectedRule.event,
      form: tempForm,
      currentRecord: sampleRecord,
      sourceTable: currentTable,
      changedFieldId: selectedRule.triggerFieldId,
      allTables: tables,
      allForms: forms,
    });

    setTestResult({
      initialRecord: sampleRecord,
      result: res,
    });
  };

  const handleSave = () => {
    onSaveForm({
      ...form,
      eventHandlers: rules,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                No-Code Formular-Ereignissteuerung &amp; Automatisierung
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Access VBA &amp; Macro Alternative
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Regelbasierte Aktionen beim Laden, Speichern, Validieren oder Ändern von Feldern ohne Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Layout: Left Master List / Right Detail Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Rule List */}
          <div className="w-72 bg-slate-50 dark:bg-slate-950/70 border-r border-slate-200 dark:border-slate-800 flex flex-col p-3 gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Ereignis-Regeln ({rules.length})
              </span>
              <button
                type="button"
                onClick={handleAddRule}
                className="bg-amber-600 hover:bg-amber-700 text-white p-1 rounded-lg text-xs flex items-center gap-1 px-2 font-semibold shadow-2xs cursor-pointer"
              >
                <Plus size={13} /> Neu
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Keine Regeln vorhanden. Klicken Sie auf "+ Neu".
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedRule?.id === rule.id
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rule.enabled !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="truncate text-xs">{rule.name || `Regel #${idx + 1}`}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {rule.event} → {rule.actionType}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveRule(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveRule(idx, 'down');
                        }}
                        disabled={idx === rules.length - 1}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRule(rule.id);
                        }}
                        className="p-0.5 hover:bg-red-100 text-red-500 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Rule Detail Editor */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
            {selectedRule ? (
              <>
                {/* Top Rule Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1 max-w-md">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Regelname:</label>
                    <input
                      type="text"
                      value={selectedRule.name || ''}
                      onChange={(e) => handleUpdateSelectedRule({ name: e.target.value })}
                      placeholder="z.B. Brutto berechnen oder Status setzen"
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedRule.enabled !== false}
                        onChange={(e) => handleUpdateSelectedRule({ enabled: e.target.checked })}
                        className="rounded text-amber-600"
                      />
                      <span>Aktiviert</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleTestRunRule}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Play size={13} /> Regel Live Testen
                    </button>
                  </div>
                </div>

                {/* 1. Auslöser (Trigger) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>Wann soll diese Regel ausgeführt werden? (Ereignis-Auslöser)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Ereignis (Event):
                      </label>
                      <select
                        value={selectedRule.event}
                        onChange={(e) => handleUpdateSelectedRule({ event: e.target.value as any })}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100"
                      >
                        <option value="OnCurrent">Beim Laden / Datensatzwechsel (OnCurrent)</option>
                        <option value="BeforeUpdate">Vor dem Speichern (BeforeUpdate - validieren)</option>
                        <option value="AfterUpdate">Nach dem Speichern (AfterUpdate)</option>
                        <option value="OnChange">Bei Feldänderung (OnChange)</option>
                        <option value="OnClick">Beim Klick auf Button / Makro (OnClick)</option>
                        <option value="OnDelete">Beim Löschen des Datensatzes (OnDelete)</option>
                      </select>
                    </div>

                    {selectedRule.event === 'OnChange' && (
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Bei Änderung des Feldes:
                        </label>
                        <select
                          value={selectedRule.triggerFieldId || ''}
                          onChange={(e) => handleUpdateSelectedRule({ triggerFieldId: e.target.value })}
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100"
                        >
                          <option value="">(Beliebiges Feld)</option>
                          {tableFields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Bedingung (Optional Condition) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span>Bedingung (Optional - nur ausführen wenn erfüllt)</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={selectedRule.conditionExpr || ''}
                      onChange={(e) => handleUpdateSelectedRule({ conditionExpr: e.target.value })}
                      placeholder="z.B. [Status] == 'Freigegeben' oder [Betrag] > 500"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                      <span>Syntax-Beispiele:</span>
                      <code className="text-blue-500 font-mono">[Status] == 'Offen'</code>
                      <code className="text-blue-500 font-mono">[Gesamtbetrag] &gt; 1000</code>
                      <code className="text-blue-500 font-mono">[Kunde] != ''</code>
                    </div>
                  </div>
                </div>

                {/* 3. Aktion (Action) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span>Welche Aktion soll ausgeführt werden?</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 text-xs">
                      Aktionstyp:
                    </label>
                    <select
                      value={selectedRule.actionType}
                      onChange={(e) => handleUpdateSelectedRule({ actionType: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-bold text-xs text-emerald-700 dark:text-emerald-400"
                    >
                      <option value="set_field_value">Wert in Feld schreiben (SetFieldValue / Berechnung)</option>
                      <option value="toast">Benachrichtigung anzeigen (ShowToast)</option>
                      <option value="cancel_save">Speichervorgang abbrechen (Validierungsfehler)</option>
                      <option value="open_form">Anderes Formular öffnen (OpenForm mit Filter)</option>
                      <option value="open_report">Bericht aufrufen / PDF drucken (OpenReport)</option>
                      <option value="webhook">Webhook auslösen (Dispatch Webhook Event)</option>
                      <option value="js_script">Benutzerdefiniertes Skript / Makro (JS)</option>
                    </select>
                  </div>

                  {/* Contextual Action Settings */}
                  {selectedRule.actionType === 'set_field_value' && (
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Zielfeld:
                        </label>
                        <select
                          value={selectedRule.targetFieldId || ''}
                          onChange={(e) => handleUpdateSelectedRule({ targetFieldId: e.target.value })}
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold"
                        >
                          {tableFields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Neuer Wert / Formel:
                        </label>
                        <input
                          type="text"
                          value={selectedRule.valueExpr || ''}
                          onChange={(e) => handleUpdateSelectedRule({ valueExpr: e.target.value })}
                          placeholder="z.B. 'Freigegeben' oder [Nettopreis] * 1.19"
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRule.actionType === 'toast' && (
                    <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                      <div className="col-span-2">
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Meldungstext:
                        </label>
                        <input
                          type="text"
                          value={selectedRule.toastMessage || ''}
                          onChange={(e) => handleUpdateSelectedRule({ toastMessage: e.target.value })}
                          placeholder="Datensatz erfolgreich aktualisiert."
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Typ:</label>
                        <select
                          value={selectedRule.toastType || 'success'}
                          onChange={(e) => handleUpdateSelectedRule({ toastType: e.target.value as any })}
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold"
                        >
                          <option value="success">Erfolg (Grün)</option>
                          <option value="info">Info (Blau)</option>
                          <option value="warning">Warnung (Gelb)</option>
                          <option value="error">Fehler (Rot)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedRule.actionType === 'cancel_save' && (
                    <div className="text-xs pt-2">
                      <label className="block font-medium text-rose-600 mb-1">
                        Abbruch-Begründung / Fehlermeldung:
                      </label>
                      <input
                        type="text"
                        value={selectedRule.cancelReason || ''}
                        onChange={(e) => handleUpdateSelectedRule({ cancelReason: e.target.value })}
                        placeholder="Pflichtfeld fehlt oder Betrag überschreitet Freigabelimit."
                        className="w-full p-2 border border-rose-300 rounded-lg bg-white dark:bg-slate-900 text-rose-700 font-medium"
                      />
                    </div>
                  )}

                  {selectedRule.actionType === 'open_form' && (
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Ziel-Formular:
                        </label>
                        <select
                          value={selectedRule.targetId || ''}
                          onChange={(e) => handleUpdateSelectedRule({ targetId: e.target.value })}
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold"
                        >
                          <option value="">(Formular wählen)</option>
                          {forms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Filter-Ausdruck:
                        </label>
                        <input
                          type="text"
                          value={selectedRule.targetFilterValueExpr || ''}
                          onChange={(e) => handleUpdateSelectedRule({ targetFilterValueExpr: e.target.value })}
                          placeholder="z.B. [KundenID]"
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRule.actionType === 'open_report' && (
                    <div className="text-xs pt-2">
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Ziel-Bericht:
                      </label>
                      <select
                        value={selectedRule.targetId || ''}
                        onChange={(e) => handleUpdateSelectedRule({ targetId: e.target.value })}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold"
                      >
                        <option value="">(Bericht wählen)</option>
                        {reports.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedRule.actionType === 'webhook' && (
                    <div className="text-xs pt-2">
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Webhook-Ziel-URL:
                      </label>
                      <input
                        type="url"
                        value={selectedRule.webhookUrl || ''}
                        onChange={(e) => handleUpdateSelectedRule({ webhookUrl: e.target.value })}
                        placeholder="https://api.beispiel.de/webhooks/form-update"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {selectedRule.actionType === 'js_script' && (
                    <div className="text-xs pt-2">
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        JavaScript-Code:
                      </label>
                      <textarea
                        rows={4}
                        value={selectedRule.jsCode || ''}
                        onChange={(e) => handleUpdateSelectedRule({ jsCode: e.target.value })}
                        placeholder="// record.Status = 'Genehmigt';&#10;// toast('Erfolgreich ausgeführt');"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-slate-950 text-emerald-400"
                      />
                    </div>
                  )}
                </div>

                {/* Live Test Result Box */}
                {testResult && (
                  <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-950 dark:text-emerald-200 animate-in fade-in">
                    <div className="font-bold mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Check size={14} className="text-emerald-600" />
                        <span>Testergebnis der Regel:</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700">
                        Status: {testResult.result.cancelSave ? 'ABGEBROCHEN' : 'ERFOLGREICH'}
                      </span>
                    </div>

                    <div className="space-y-1 mt-2 text-[11px]">
                      {testResult.result.executedHandlers.map((h: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{h.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Wählen Sie links eine Regel aus oder erstellen Sie eine neue.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500">
            {rules.length} aktive Ereignisregeln für {form.name}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Ereignis-Regeln Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
