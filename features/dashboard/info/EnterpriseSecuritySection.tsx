import React from 'react';
import { ShieldCheck, ShieldAlert, Key, Users, History, Lock, Server, CheckCircle2 } from 'lucide-react';

export const EnterpriseSecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Users className="text-blue-400" size={20} />,
      title: "Rollenbasierte Zugriffskontrolle (RBAC)",
      desc: "Granulare Lese-, Schreib- und Löschrechte auf Tabellen- und Spaltenebene für Administrator, Manager, Editor, User und Gast."
    },
    {
      icon: <ShieldAlert className="text-rose-400" size={20} />,
      title: "Row Level Security (RLS)",
      desc: "Automatische Mandantentrennung und zeilenbasierte Filter (TenantId / UserId Isolation) mit DDL-Generierung für PostgreSQL CREATE POLICY."
    },
    {
      icon: <Server className="text-emerald-400" size={20} />,
      title: "Active Directory & Windows Auth",
      desc: "Nahtlose Authentifizierung im Firmennetzwerk mit automatischer Zuordnung von Windows-Domänengruppen zu Anwendungsrollen."
    },
    {
      icon: <History className="text-purple-400" size={20} />,
      title: "Audit Trail & Time-Travel",
      desc: "Revisionssichere Aufzeichnung aller INSERT-, UPDATE- und DELETE-Aktionen mit Zeitstempel und Benutzer-ID inklusive 1-Klick Rollback."
    }
  ];

  return (
    <div className="py-16 px-6 bg-slate-950 text-white border-b border-slate-800" id="enterprise-security-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-3">
            <ShieldCheck size={13} /> Enterprise Security &amp; Compliance
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Sicherheit auf Banken- und Konzern-Niveau
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto mt-3 leading-relaxed">
            Schützen Sie sensible Unternehmensdaten durchgängig vom visuellen Entwurf über die lokale IndexedDB bis hin zur produktiven API-Middleware.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {securityFeatures.map((feat, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 w-fit mb-3.5">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Security Highlights Banner */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Automatisch generierte Sicherheits-Middleware</h4>
              <p className="text-xs text-slate-300">
                DB Studio generiert fertige C# ASP.NET Core AuthorizationHandler und Node.js JWT Guards direkt aus Ihrem Sicherheitsmodell.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> DSGVO &amp; Compliance Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
