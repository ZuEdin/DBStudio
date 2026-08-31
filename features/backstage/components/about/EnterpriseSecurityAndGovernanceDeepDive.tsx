import React from 'react';
import { ShieldCheck, ShieldAlert, Key, Users, History, Lock, Server, CheckCircle2 } from 'lucide-react';

export const EnterpriseSecurityAndGovernanceDeepDive: React.FC = () => {
  return (
    <div className="bg-[#242432] border border-rose-500/30 rounded-2xl p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#38384a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded border border-rose-500/40">
              Enterprise Governance
            </span>
            <span className="text-xs text-neutral-400">RBAC • RLS • Active Directory • Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-rose-400" size={20} />
            Enterprise-Sicherheit &amp; Mandantenfähigkeit
          </h2>
        </div>
      </div>

      <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
        Für den produktiven Einsatz im Unternehmensumfeld bietet DB Studio Pro ein durchdachtes Rechtemodell, das sich sowohl im Browser als auch in den generierten .NET 10 und Node.js Backends nahtlos widerspiegelt.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Users size={15} /> 1. Granulare RBAC-Rechteverwaltung
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Definition von Rollen (Admin, Manager, Sachbearbeiter, Gast) mit detaillierten CRUD-Berechtigungen pro Tabelle und Spalte (Hidden, Read-Only, Editable).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <ShieldAlert size={15} /> 2. Row Level Security (RLS)
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Zeilenbasierte Datenfilterung nach Mandant (`tenant_id`) oder Benutzer (`owner_id`). Generiert PostgreSQL `CREATE POLICY` Statements und EF Core Global Query Filters.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Server size={15} /> 3. Active Directory &amp; LDAP Sync
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Automatische Erkennung von Windows-Domänenbenutzern und Mapping von AD-Sicherheitsgruppen auf die Rollen in DB Studio.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <History size={15} /> 4. Revisionssicheres Audit Logging
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Vollständige Historisierung aller Datenänderungen (`sys_audit_log`) mit Vorher-/Nachher-Diff, Benutzerkennung und Zeitstempel.
          </p>
        </div>
      </div>
    </div>
  );
};
