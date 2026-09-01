import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  AlertTriangle, 
  X, 
  FileCode, 
  Scale, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';

export const CodeGenDisclaimerModal: React.FC = () => {
  const { isModalOpen, actionTitle, closeModal, acceptDisclaimer } = useDisclaimerStore();
  
  const [storageMode, setStorageMode] = useState<'persistent' | 'session'>('persistent');
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false);

  if (!isModalOpen) return null;

  const handleConfirm = () => {
    if (!hasAcknowledged) return;
    acceptDisclaimer(storageMode);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale size={22} />
            </div>
            <div>
              <h2 id="disclaimer-title" className="text-base font-bold text-white flex items-center gap-2">
                Haftungsausschluss & Code-Nutzungsbedingungen
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <FileCode size={13} className="text-indigo-400" />
                <span>Aktion: <strong className="text-slate-200">{actionTitle || 'Code-Generierung & Export'}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            title="Abbrechen & Schließen"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Scrollable Legal Notice */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex gap-3 text-amber-200">
            <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block text-amber-300 text-xs font-semibold mb-0.5">
                Wichtiger rechtlicher Hinweis vor dem Export & der Nutzung:
              </strong>
              Bitte bestätigen Sie vor der Generierung und dem Herunterladen von Quellcode, dass Sie die folgenden Bedingungen und den Haftungsausschluss anerkennen.
            </div>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3 font-sans text-slate-300">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100 text-[13px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                1. Vollständiger Haftungsausschluss für Schäden & Datenverlust
              </h4>
              <p className="text-[11.5px] text-slate-400 pl-3">
                Der Softwarehersteller und die Autoren von DB Studio Pro übernehmen <strong>keinerlei Gewährleistung oder Haftung</strong> für direkte, indirekte, zufällige oder Folgeschäden, Datenverluste, Produktionsausfälle, Sicherheitslücken, rechtliche Auseinandersetzungen oder entgangene Gewinne, die durch die Nutzung, Kompilierung oder Ausführung des generierten Quellcodes, der Datenbank-Skripte oder Konfigurationen entstehen.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100 text-[13px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                2. Bereitstellung "AS IS" (Ohne Mängelgewähr)
              </h4>
              <p className="text-[11.5px] text-slate-400 pl-3">
                Jeder exportierte Code (C#, TypeScript, Node.js, Python, PHP, SQL, Docker, Helm etc.) wird <strong>"wie besehen" (AS IS)</strong> zur Verfügung gestellt. Der Generator dient als Prototyping- und Produktivitäts-Beschleuniger, ersetzt jedoch keine manuelle Software-Architekturprüfung.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100 text-[13px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                3. Eigenverantwortliche Prüfpflicht des Anwenders
              </h4>
              <p className="text-[11.5px] text-slate-400 pl-3">
                Der Anwender bzw. der betreibende Entwickler verpflichtet sich, den generierten Code vor jedem Einsatz in Test- oder Produktivumgebungen einer <strong>vollständigen Code-Review, Sicherheitsanalyse und Funktionsprüfung</strong> zu unterziehen.
              </p>
            </div>
          </div>

          {/* Storage Duration Selection (Dauerhaft vs. Kurzfristig / Sitzung) */}
          <div className="space-y-2 pt-1">
            <span className="block font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Speicherdauer Ihrer Bestätigung auswählen:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  storageMode === 'persistent'
                    ? 'bg-indigo-950/50 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="disclaimer_storage"
                  checked={storageMode === 'persistent'}
                  onChange={() => setStorageMode('persistent')}
                  className="mt-0.5 accent-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <HardDrive size={13} className="text-indigo-400" />
                    <span>Dauerhaft speichern</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Entscheidung im Browser speichern. Künftige Code-Generierungen starten direkt. (Jederzeit in Optionen widerrufbar)
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  storageMode === 'session'
                    ? 'bg-indigo-950/50 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="disclaimer_storage"
                  checked={storageMode === 'session'}
                  onChange={() => setStorageMode('session')}
                  className="mt-0.5 accent-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Clock size={13} className="text-amber-400" />
                    <span>Nur für diese Sitzung</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gilt nur bis zum Schließen des Browser-Tabs. Beim nächsten Start wird erneut nachgefragt.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 rounded-sm border-slate-600 bg-slate-800 text-indigo-600 accent-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-200 font-medium">
                Ich habe den Haftungsausschluss verstanden und bestätige, dass der <strong>Softwarehersteller von jeglicher Haftung für Schäden, Datenverluste und den generierten Code freigestellt</strong> ist. Ich prüfe allen Code eigenverantwortlich vor dem Einsatz.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasAcknowledged}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
              hasAcknowledged
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Bedingungen akzeptieren & fortfahren</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
