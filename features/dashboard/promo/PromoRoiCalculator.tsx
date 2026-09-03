import React, { useState } from 'react';
import { Calculator, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface PromoRoiCalculatorProps {
  onNavigate: (type: 'table_create') => void;
}

export const PromoRoiCalculator: React.FC<PromoRoiCalculatorProps> = ({ onNavigate }) => {
  const [usersCount, setUsersCount] = useState<number>(10);
  const [appsCount, setAppsCount] = useState<number>(3);
  const [developerHourlyRate, setDeveloperHourlyRate] = useState<number>(85);

  // Calculations
  const traditionalSaasCostPerYear = usersCount * 35 * 12 + appsCount * 250 * 12; // Typical Low-Code platform pricing
  const devHoursSavedPerApp = 120; // 120 hrs saved per database app
  const devCostSavings = appsCount * devHoursSavedPerApp * developerHourlyRate;
  const totalSavingsYear1 = traditionalSaasCostPerYear + devCostSavings;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-5xl mx-auto space-y-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Calculator size={12} /> Wirtschaftlichkeits-Rechner (ROI 2026)
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Wie viel sparen Sie mit DB Studio Pro?
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Vergleichen Sie die Kosten von teuren SaaS-Low-Code-Plattformen (z. B. PowerApps, Mendix, Airtable Enterprise) mit DB Studio Pro.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-center shrink-0 min-w-[200px]">
          <div className="text-[11px] text-emerald-300 font-semibold uppercase">Ihre Ersparnis im 1. Jahr</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
            {totalSavingsYear1.toLocaleString('de-DE')} €
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            0 € Lizenzgebühren • 100% Eigenes Eigentum
          </div>
        </div>
      </div>

      {/* Sliders & Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="md:col-span-2 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Anzahl Benutzer im Unternehmen:</span>
              <span className="text-indigo-400 font-mono text-sm">{usersCount} Benutzer</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="250" 
              value={usersCount}
              onChange={e => setUsersCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Geplante Datenbank-Apps / Masken:</span>
              <span className="text-indigo-400 font-mono text-sm">{appsCount} Anwendungen</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={appsCount}
              onChange={e => setAppsCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Entwickler-/Berater-Stundensatz (€):</span>
              <span className="text-indigo-400 font-mono text-sm">{developerHourlyRate} € / Std.</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="200" 
              step="5"
              value={developerHourlyRate}
              onChange={e => setDeveloperHourlyRate(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Benefits Breakdown */}
        <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Clock size={16} className="text-indigo-400" />
              <span>{appsCount * devHoursSavedPerApp} Stunden Zeitersparnis</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Durch visuelle DDL-Erstellung, automatische Formularbindung und Instant-Code-Export sparen Sie im Schnitt 120 Stunden pro Datenbank-Modul.
            </p>

            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Keine monatlichen User-Abos</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Echter Quellcode gehört Ihnen</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Direkte Access-Migration</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('table_create')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Jetzt Projekt starten <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
