import React from 'react';
import { Database, Lock, Globe, Layers, ArrowRight } from 'lucide-react';

export const FaqSection: React.FC = () => {
  return (
    <div className="bg-white py-16 px-6 border-b border-slate-200" id="faq-section">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* MS Access Comparison */}
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 flex flex-col justify-between" id="comparison-card">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                  <Database size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Das Beste aus beiden Welten</h3>
              </div>
              
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4">
                Erinnern Sie sich an <strong>Microsoft Access</strong>? Es erlaubte jedem, schnell relationale Datenbanken zusammenzuklicken und sofort zu betreiben. Es war genial einfach, aber leider proprietär, an Windows gebunden, unübersichtlich bei großen Teams und im Web kaum nutzbar.
              </p>
              
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-6">
                <strong>DB Studio Pro</strong> bringt dieses legendäre Gefühl von Produktivität zurück – aber mit modernen Web- und Desktop-Technologien. Kein Vendor-Lock-in, kein proprietäres Dateiformat. Sie erhalten echten, sauberen Quellcode, den Ihr Team sofort erweitern kann.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-800 block">Klassisches Access</span>
                <span>Windows-only, Binär-Dateien, veraltete UI, limitiert im Web.</span>
              </div>
              <div>
                <span className="font-bold text-indigo-600 block">DB Studio Pro</span>
                <span>Web &amp; Desktop (Rust/Tauri), offener Code, moderne UI, Echtzeit-Kollaboration.</span>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-slate-900 text-white p-8 rounded-xl border border-slate-800 flex flex-col justify-between" id="privacy-card">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Lock size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">100% Local-First &amp; Datenschutz</h3>
              </div>
              
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-4">
                Ihre sensiblen Daten gehören Ihnen und sonst niemandem. DB Studio Pro arbeitet nach dem <strong>Local-First-Prinzip</strong>. Ihre Entwürfe, Tabellen und Einstellungen werden verschlüsselt in den lokalen IndexedDB-Datenbanken Ihres eigenen Webbrowsers gesichert.
              </p>

              <ul className="space-y-3 text-xs text-slate-400 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Keine ungefragte Übertragung auf externe Cloud-Server</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Vollständige Funktionalität auch im Offline-Modus</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Perfekt geeignet für DSGVO-konforme Enterprise-Projekte</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Kein Account-Zwang</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px] font-bold">DSGVO Konform</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
