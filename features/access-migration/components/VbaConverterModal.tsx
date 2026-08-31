import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Play, 
  FileCode, 
  Zap, 
  Layers, 
  ArrowRight,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { VbaToTypeScriptConverter } from '../services/vbaToTypeScriptConverter';

interface VbaConverterModalProps {
  initialVba?: string;
  formName?: string;
  onClose: () => void;
}

const SAMPLE_VBA = `Private Sub Form_Current()
  ' Rabatt berechnen und Summe aktualisieren
  If Me.Menge > 10 Then
    Me.Rabatt = 5
  Else
    Me.Rabatt = 0
  End If
  Me.Gesamtbetrag = Me.Menge * Me.Einzelpreis * (1 - Me.Rabatt / 100)
End Sub

Private Sub btnSave_Click()
  If IsNull(Me.KundenID) Then
    MsgBox "Bitte wählen Sie einen Kunden aus!", vbExclamation, "Validierung"
    Exit Sub
  End If

  Dim offeneBestellungen As Long
  offeneBestellungen = DCount("*", "Bestellungen", "KundenID = " & Me.KundenID)

  If offeneBestellungen > 5 Then
    MsgBox "Kunde hat bereits mehr als 5 offene Bestellungen!", vbInformation
  End If

  DoCmd.OpenForm "FrmKundenUebersicht", , , "ID = " & Me.KundenID
  MsgBox "Datensatz erfolgreich verarbeitet!", vbInformation, "DB Studio Pro"
End Sub`;

export const VbaConverterModal: React.FC<VbaConverterModalProps> = ({
  initialVba = SAMPLE_VBA,
  formName = 'KundenFormular',
  onClose
}) => {
  const [vbaCode, setVbaCode] = useState(initialVba);
  const [activeTab, setActiveTab] = useState<'handlers' | 'hook' | 'events'>('handlers');
  const [copied, setCopied] = useState(false);

  const conversion = useMemo(() => {
    return VbaToTypeScriptConverter.transpile(vbaCode, formName);
  }, [vbaCode, formName]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Access VBA &rarr; TypeScript Transpiler
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  Formular: {formName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Wandelt Visual Basic for Applications (VBA) Form-Events, DoCmd &amp; DLookup in typsichere React/TypeScript Handler um
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Erkannte Events:</span>
              <strong className="text-amber-400">{conversion.statistics.convertedFunctions}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">DoCmd API-Calls:</span>
              <strong className="text-indigo-400">{conversion.statistics.recognizedDocmdCalls}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">DLookup / DCount:</span>
              <strong className="text-emerald-400">{conversion.statistics.recognizedDomainAggregates}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">MsgBox / Dialoge:</span>
              <strong className="text-cyan-400">{conversion.statistics.recognizedUiAlerts}</strong>
            </div>
          </div>

          <button
            onClick={() => setVbaCode(SAMPLE_VBA)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={12} /> Beispiel-VBA laden
          </button>
        </div>

        {/* Main 2-Column Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden min-h-[420px]">
          {/* Left Column: VBA Input */}
          <div className="p-4 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/30">
            <div className="flex items-center justify-between pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-amber-400">
                <FileCode size={14} /> MS Access VBA Quellcode
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {conversion.statistics.totalVbaLines} Zeilen
              </span>
            </div>
            <textarea
              value={vbaCode}
              onChange={(e) => setVbaCode(e.target.value)}
              placeholder="Fügen Sie hier Ihren Access VBA Formular-Code ein (z. B. Sub btn_Click(), DLookup, DoCmd.OpenForm)..."
              className="w-full flex-1 p-3.5 bg-slate-950 font-mono text-xs text-amber-200/90 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500/50 resize-none leading-relaxed"
            />
          </div>

          {/* Right Column: TypeScript Output */}
          <div className="p-4 flex flex-col bg-slate-900">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setActiveTab('handlers')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${activeTab === 'handlers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  TypeScript Handler
                </button>
                <button
                  onClick={() => setActiveTab('hook')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${activeTab === 'hook' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  React Hook
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${activeTab === 'events' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Event-Matrix ({conversion.detectedEvents.length})
                </button>
              </div>

              <button
                onClick={() => handleCopy(activeTab === 'hook' ? conversion.reactHookCode : conversion.typescriptCode)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
              </button>
            </div>

            {/* Tab Views */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {activeTab === 'handlers' && (
                <pre className="font-mono text-xs text-indigo-200/90 whitespace-pre-wrap leading-relaxed">
                  {conversion.typescriptCode}
                </pre>
              )}

              {activeTab === 'hook' && (
                <pre className="font-mono text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                  {conversion.reactHookCode}
                </pre>
              )}

              {activeTab === 'events' && (
                <div className="space-y-2.5">
                  {conversion.detectedEvents.map((evt, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Zap size={13} className="text-amber-400" />
                          <span>{evt.vbaName}()</span>
                          <ArrowRight size={12} className="text-slate-500" />
                          <span className="text-indigo-400 font-mono">{evt.tsHandlerName}()</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {evt.eventType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {evt.description} {evt.controlName && `• Ziel-Steuerelement: "${evt.controlName}"`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>Automatische Typsicherheit &amp; Berechnungs-Transpilation aktiv</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fertigstellen
          </button>
        </div>
      </div>
    </div>
  );
};
