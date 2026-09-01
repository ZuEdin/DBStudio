import React from 'react';
import { Sparkles, ArrowRight, Play, Eye, Monitor, Tablet, Smartphone, Zap, CheckCircle2 } from 'lucide-react';
import { Table, Query, Report, Form } from '../../../types';

interface PromoHeroSectionProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  device: 'desktop' | 'tablet' | 'mobile';
  setDevice: (d: 'desktop' | 'tablet' | 'mobile') => void;
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const PromoHeroSection: React.FC<PromoHeroSectionProps> = ({
  tables,
  queries,
  reports,
  forms,
  device,
  setDevice,
  onNavigate
}) => {
  return (
    <div className="space-y-12">
      {/* Navigation / Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400">
            <Sparkles className="size-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                DB STUDIO PRO
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                2026 EDITION
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Die #1 Local-First Access-Alternative &amp; Low-Code Engineering Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs text-slate-400">
            <button 
              onClick={() => setDevice('desktop')} 
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${device === 'desktop' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'hover:text-slate-200'}`}
            >
              <Monitor size={12} /> Desktop
            </button>
            <button 
              onClick={() => setDevice('tablet')} 
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${device === 'tablet' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'hover:text-slate-200'}`}
            >
              <Tablet size={12} /> Tablet
            </button>
            <button 
              onClick={() => setDevice('mobile')} 
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${device === 'mobile' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'hover:text-slate-200'}`}
            >
              <Smartphone size={12} /> Mobile
            </button>
          </div>
          <button 
            onClick={() => onNavigate('table_create')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Studio starten <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Main Pitch / Hero Banner */}
      <div className="text-center space-y-6 max-w-4xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-950 via-slate-800 to-indigo-950 border border-indigo-700/60 rounded-full text-xs text-indigo-300 font-semibold shadow-inner">
          <Zap size={13} className="text-amber-400 animate-bounce" />
          <span>Neu: E-Invoicing (ZUGFeRD 2.3 &amp; Swiss QR) + Multi-DB Export &amp; .NET 10 Generation</span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Visuell entwerfen.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            Produktionsbereite Enterprise Apps
          </span> generieren.
        </h2>

        <p className="text-base sm:text-lg text-slate-300 font-normal max-w-3xl mx-auto leading-relaxed">
          Bauen Sie vollwertige Datenbank-Anwendungen mit Formularen, Abfragen, relationalen Schemata und DACH-Standards direkt im Browser – <strong>100% offlinefähig, ohne Cloud-Zwang und mit direktem Code-Export.</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2">
          <button 
            onClick={() => onNavigate('table_create')}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={14} className="fill-white" /> Erste Tabelle erstellen
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('interactive-showroom');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:border-slate-500 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye size={14} /> Interaktiven Showroom testen
          </button>
        </div>

        {/* Live Project Metrics */}
        <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs text-slate-400">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
            <span className="block text-white font-black text-xl">{tables.length || 0}</span>
            Tabellen im Projekt
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
            <span className="block text-indigo-300 font-black text-xl">{forms.length || 0}</span>
            Aktive Eingabemasken
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
            <span className="block text-emerald-300 font-black text-xl">{reports.length || 0}</span>
            Analytische Berichte
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
            <span className="block text-sky-300 font-black text-xl">{queries.length || 0}</span>
            Gespeicherte DB-Sichten
          </div>
        </div>
      </div>
    </div>
  );
};
