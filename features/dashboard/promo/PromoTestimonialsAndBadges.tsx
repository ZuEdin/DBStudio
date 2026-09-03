import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Zap, 
  HeartHandshake, 
  Sparkles, 
  Compass, 
  MessageSquarePlus, 
  Check, 
  ArrowRight,
  Code2,
  Lock,
  GitPullRequest,
  Users
} from 'lucide-react';

export const PromoTestimonialsAndBadges: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feature' | 'access' | 'bug'>('feature');

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* 1. Core Technical Guarantee Badges (Flat Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="text-indigo-400 font-bold text-base sm:text-lg flex items-center justify-center gap-1.5">
            <Award size={18} /> 100% DSGVO
          </div>
          <div className="text-[11px] text-slate-400">
            Local-First: Keine Übertragung in US-Clouds
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="text-emerald-400 font-bold text-base sm:text-lg flex items-center justify-center gap-1.5">
            <ShieldCheck size={18} /> EN 16931
          </div>
          <div className="text-[11px] text-slate-400">
            ZUGFeRD 2.3, XRechnung &amp; Swiss QR
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="text-amber-400 font-bold text-base sm:text-lg flex items-center justify-center gap-1.5">
            <Zap size={18} /> .NET 10 &amp; Node
          </div>
          <div className="text-[11px] text-slate-400">
            Vollständiger C#, TypeScript &amp; Python Export
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="text-sky-400 font-bold text-base sm:text-lg flex items-center justify-center gap-1.5">
            <HeartHandshake size={18} /> 0 € Lizenz
          </div>
          <div className="text-[11px] text-slate-400">
            Keine Pro-User Abos oder versteckte Kosten
          </div>
        </div>
      </div>

      {/* 2. Honest "Geheimtipp in aktiver Entwicklung" Statement Box */}
      <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> Noch ein echter Geheimtipp
              </span>
              <span className="text-xs text-slate-400 font-mono">Pre-1.0 Developer Preview</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Auf keinen Fall Fake-Firmen oder gekaufte Schein-Referenzen
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shrink-0 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Compass size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Aktueller Entwicklungsstand</div>
              <div className="text-xs font-black text-amber-300">Öffentliche Preview &amp; Aktiver Feinschliff</div>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          Wir glauben an <strong>ehrliches Handwerk statt aufgeblasenes Marketing</strong>: DB Studio befindet sich in aktiver, intensiver Entwicklung. Noch wissen nur sehr wenige Entwickler und IT-Verantwortliche überhaupt von der Existenz dieses Werkzeugs. Deshalb verzichten wir konsequent darauf, erfundene Logos namhafter Konzerne als angebliche Kunden zu platzieren. Stattdessen lassen wir den Quellcode, die lokale Ausführbarkeit und die reale Funktionalität für sich sprechen.
        </p>

        {/* 4 Concrete Advantages of Being an Early Adopter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-indigo-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 font-mono">1</span>
              Direkte Einflussnahme auf die Roadmap
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sie vermissen eine bestimmte Spaltenart, einen speziellen SQL-Dialekt oder eine spezifische Subform-Validierung? Als Early Adopter sprechen Sie direkt mit der Entwicklung.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] text-emerald-300 font-mono">2</span>
              Vorsprung vor dem offiziellen Launch
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bauen Sie vor Ihren Kunden klickbare Prototypen in 15 Minuten. Während andere noch Spezifikationen wälzen, präsentieren Sie bereits fertige relationale Masken.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[10px] text-amber-300 font-mono">3</span>
              MS Access-Rettung ohne fremde Server
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alte <code className="text-amber-300 font-mono">.mdb</code> und <code className="text-amber-300 font-mono">.accdb</code> Dateien werden rein clientseitig in Ihrem Browser analysiert. Keine Betriebsdaten verlassen Ihre Kontrolle.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-sky-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-700 flex items-center justify-center text-[10px] text-sky-300 font-mono">4</span>
              100% Quellcode-Eigentum &amp; 0 € Lizenz
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kein Monopol und keine Vendor-Lock-ins. Jeder Export generiert sauberen, kompilierbaren Quellcode (.NET 10, Express, Python FastAPI, React, Angular).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Real Status Breakdown: Was ist fertig vs. Was entsteht gerade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} /> Bereits produktiv nutzbar (v0.8.5)
            </div>
            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              Aktiv
            </span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Visueller Schema- &amp; Relationen-Editor:</strong> Primär- &amp; Fremdschlüssel, Constraints und Auto-Indexierung.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>In-Browser Access Binary Parser:</strong> MDB/ACCDB Tabellen, Spaltentypen und Datensätze ohne Server-Upload.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>FormDesigner mit Subforms:</strong> 1- bis 4-spaltige Eingabemasken, Validierungen &amp; Rollenrechte (RBAC).</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>DACH E-Invoicing:</strong> ZUGFeRD 2.3 XML, XRechnung 3.0 und Schweizer QR-Rechnung mit Validierung.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Multi-DB DDL-Export:</strong> SQL-Skripte für PostgreSQL, SQLite, MySQL, MSSQL und Oracle.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <GitPullRequest size={16} /> In aktiver Entwicklung &amp; Erprobung
            </div>
            <span className="text-[10px] font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              Work in Progress
            </span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[9px] text-indigo-300 font-bold shrink-0 mt-0.5">●</span>
              <span><strong>Local Bridge OLEDB Jet 4.0:</strong> Direkte OLEDB-64-Bit-Inspektion unter Windows für alte VBA-Macros.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[9px] text-indigo-300 font-bold shrink-0 mt-0.5">●</span>
              <span><strong>Tauri &amp; Electron Desktop-Installer:</strong> Kompilierung als native Offline-Desktop-App (.msi / setup.exe).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[9px] text-indigo-300 font-bold shrink-0 mt-0.5">●</span>
              <span><strong>Automatischer Schema-Diff:</strong> 2-Wege-Synchronisation zwischen lokalem Stand und Live-PostgreSQL-Instanzen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[9px] text-indigo-300 font-bold shrink-0 mt-0.5">●</span>
              <span><strong>Community Template Registry:</strong> Vorlagen von Entwicklern direkt über GitHub einbinden und teilen.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Early Adopter Feedback & Pilot Participation Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Werde Pilot-Tester oder reiche dein Feedback ein
              </h4>
              <p className="text-xs text-slate-400">
                Hast du eine knifflige Access-MDB, einen speziellen Datenbank-Dialekt oder einen Feature-Wunsch?
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full w-fit">
            100% Kostenfrei &amp; Direkt
          </span>
        </div>

        {feedbackSent ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-center space-y-1.5 animate-in fade-in">
            <div className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Vielen Dank für deine Anregung!
            </div>
            <p className="text-xs text-slate-300">
              Dein Input hilft direkt dabei, DB Studio Pro für Entwickler und Anwender noch leistungsfähiger zu machen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendFeedback} className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType('feature')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  feedbackType === 'feature'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                💡 Feature-Wunsch
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('access')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  feedbackType === 'access'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                📂 Access MDB/ACCDB Fall
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('bug')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  feedbackType === 'bug'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🐞 Bug / Verbesserung
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder={
                  feedbackType === 'feature'
                    ? 'z. B. Unterstützung für PostgreSQL Composite Types oder GraphQL Export...'
                    : feedbackType === 'access'
                    ? 'z. B. Frage zum Import einer Access 2003 .mdb mit verknüpften Tabellen...'
                    : 'z. B. Spaltendefinition bei Boolean-Feldern im Formular korrigieren...'
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!feedbackText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm shadow-indigo-600/30"
              >
                Feedback senden <ArrowRight size={13} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 5. Clear Bottom Trust Statement */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-2 max-w-2xl mx-auto">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>
            <strong>100% Transparenz-Garantie:</strong> Keine bezahlten Rezensionen, keine Fake-Logos. Echte Softwareentwicklung für Entwickler, die den Wert von Quellcode-Eigentum und lokaler Datenhoheit schätzen.
          </span>
        </p>
      </div>
    </div>
  );
};

