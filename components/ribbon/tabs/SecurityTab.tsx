import React from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Users, 
  UserCheck, 
  Lock, 
  History, 
  FileCode, 
  Database, 
  Sliders, 
  UserCog, 
  Server, 
  FolderLock, 
  RotateCcw,
  Sparkles,
  Layers,
  Fingerprint
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdownButton } from '../RibbonDropdownButton';

interface SecurityTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ onAction }) => {
  return (
    <div id="security_tab_container" className="flex gap-3 items-center h-full relative">
      
      {/* 1. Identität, Login & Active Directory */}
      <RibbonGroup label="Identität & Login">
        <RibbonDropdownButton
          icon={<Key className="text-emerald-600" />}
          label="Login & Auth"
          sublabel="AD & Session"
          menuHeader="Authentifizierung & Identitätsverwaltung"
          onMainClick={() => onAction('open_security_auth')}
          size="large"
          items={[
            {
              id: 'auth_settings',
              label: 'Authentifizierungs-Methoden',
              description: 'Formular-Login (JWT, sys_users) und Passwortverwaltung konfigurieren',
              icon: <Key size={14} className="text-emerald-600" />,
              onClick: () => onAction('open_security_auth'),
              badge: 'Auth',
              badgeColor: 'emerald'
            },
            {
              id: 'ad_windows_auth',
              label: 'Windows Authentifizierung & AD',
              description: 'Active Directory Gruppen für Windows-Netzwerke & Domänen-Rollen-Mapping',
              icon: <Server size={14} className="text-blue-600" />,
              onClick: () => onAction('open_security_ad'),
              badge: 'AD/LDAP',
              badgeColor: 'blue'
            },
            {
              id: 'session_marker',
              label: 'Login-Merker & Session Tracking',
              description: 'Automatische Speicherung des eingeloggten Benutzers & Audit-Stempel (CreatedBy, LastLogin)',
              icon: <UserCheck size={14} className="text-indigo-600" />,
              onClick: () => onAction('open_security_auth'),
              badge: 'Session',
              badgeColor: 'indigo'
            },
            {
              id: 'auth_forms_quickgen',
              label: 'Login- & Registrierungs-Masken',
              description: 'Vorgefertigte Login- und Benutzerverwaltungs-Formulare erzeugen',
              icon: <UserCog size={14} className="text-amber-600" />,
              onClick: () => onAction('open_security_auth'),
              badge: 'UI',
              badgeColor: 'amber'
            }
          ]}
        />
      </RibbonGroup>

      {/* 2. Rollen & RBAC Matrix */}
      <RibbonGroup label="Rollen & RBAC">
        <RibbonDropdownButton
          icon={<ShieldCheck className="text-blue-600" />}
          label="Berechtigungen"
          sublabel="CRUD & Rollen"
          menuHeader="Rollenbasierte Zugriffskontrolle (RBAC)"
          onMainClick={() => onAction('open_security_matrix')}
          size="large"
          items={[
            {
              id: 'matrix_view',
              label: 'CRUD Berechtigungs-Matrix',
              description: 'Granulare Lese-, Schreib- & Löschrechte für alle Tabellen, Felder und Abfragen',
              icon: <ShieldCheck size={14} className="text-emerald-600" />,
              onClick: () => onAction('open_security_matrix'),
              badge: 'Matrix',
              badgeColor: 'emerald'
            },
            {
              id: 'roles_manager',
              label: 'Rollen definieren (sys_roles)',
              description: 'Administrator, Manager, Editor, User, Gast und benutzerdefinierte Rollen verwalten',
              icon: <Users size={14} className="text-blue-600" />,
              onClick: () => onAction('open_security_roles'),
              badge: 'sys_roles',
              badgeColor: 'blue'
            },
            {
              id: 'group_permissions',
              label: 'Gruppen-Rechteverwaltung',
              description: 'Kollektive Berechtigungen für Tabellen-Gruppen und Schemata mit einem Klick',
              icon: <FolderLock size={14} className="text-indigo-600" />,
              onClick: () => onAction('open_security_matrix'),
              badge: 'Gruppen',
              badgeColor: 'indigo'
            },
            {
              id: 'reset_rbac',
              label: 'System-Rechte initialisieren / Reset',
              description: 'Standard-Rollen und Tabellenrechte auf sichere Werkseinstellungen zurücksetzen',
              icon: <RotateCcw size={14} className="text-rose-600" />,
              onClick: () => onAction('open_security_roles'),
              badge: 'Reset',
              badgeColor: 'rose'
            }
          ]}
        />
      </RibbonGroup>

      {/* 3. Row Level Security (RLS) & Mandanten */}
      <RibbonGroup label="Row Level Security">
        <RibbonDropdownButton
          icon={<ShieldAlert className="text-rose-600" />}
          label="RLS & Mandanten"
          sublabel="Zeilenfilter"
          menuHeader="Row Level Security & Mandantentrennung"
          onMainClick={() => onAction('open_security_rls')}
          size="large"
          items={[
            {
              id: 'rls_designer',
              label: 'RLS & Mandanten-Trennung',
              description: 'Zeilenebene-Sicherheitsregeln (TenantId / UserId Isolation) für alle Tabellen',
              icon: <ShieldAlert size={14} className="text-rose-600" />,
              onClick: () => onAction('open_security_rls'),
              badge: 'RLS',
              badgeColor: 'rose'
            },
            {
              id: 'rls_sql_policies',
              label: 'Native SQL & PostgreSQL Policies',
              description: 'Automatisch generierte CREATE POLICY DDL Skripte für Datenbank-Engines',
              icon: <Database size={14} className="text-indigo-600" />,
              onClick: () => onAction('open_security_rls'),
              badge: 'SQL DDL',
              badgeColor: 'indigo'
            },
            {
              id: 'rls_middleware_guards',
              label: 'API & Middleware Policy Guards',
              description: 'ASP.NET Core & Express Middleware Handler für Token-basierte Zeilenfilterung',
              icon: <FileCode size={14} className="text-teal-600" />,
              onClick: () => onAction('open_security_rls'),
              badge: 'Guards',
              badgeColor: 'teal'
            }
          ]}
        />
      </RibbonGroup>

      {/* 4. Audit Trail & Governance */}
      <RibbonGroup label="Audit & Historie">
        <RibbonDropdownButton
          icon={<History className="text-purple-600" />}
          label="Audit Trail"
          sublabel="Time-Travel"
          menuHeader="Audit Trail & Data Governance"
          onMainClick={() => onAction('open_audit_trail')}
          size="large"
          items={[
            {
              id: 'audit_timeline',
              label: 'Revisionssichere Änderungshistorie',
              description: 'Vollständiges Protokoll aller Datensatz-Änderungen (INSERT, UPDATE, DELETE) mit Benutzer-Stempel',
              icon: <History size={14} className="text-purple-600" />,
              onClick: () => onAction('open_audit_trail'),
              badge: 'Audit',
              badgeColor: 'purple'
            },
            {
              id: 'audit_timetravel',
              label: 'Time-Travel & Wiederherstellung',
              description: 'Point-in-Time Diff und Ein-Klick-Wiederherstellung früherer Tabellenstände',
              icon: <RotateCcw size={14} className="text-blue-600" />,
              onClick: () => onAction('open_audit_trail'),
              badge: 'Time-Travel',
              badgeColor: 'blue'
            },
            {
              id: 'audit_export',
              label: 'Audit-Logs Exportieren (CSV / JSON)',
              description: 'Revisionssicherer Export für Compliance- und Sicherheits-Audits',
              icon: <FileCode size={14} className="text-emerald-600" />,
              onClick: () => onAction('open_audit_trail'),
              badge: 'Export',
              badgeColor: 'emerald'
            }
          ]}
        />
      </RibbonGroup>

      {/* 5. Sicherheits-Cockpit & Export */}
      <RibbonGroup label="Sicherheits-Cockpit" isLast>
        <RibbonButton
          icon={<Shield className="text-indigo-600" />}
          label="Sicherheits-Cockpit"
          onClick={() => onAction('security_manager')}
          size="large"
        />
        <RibbonDropdownButton
          icon={<FileCode className="text-slate-700 dark:text-slate-300" />}
          label="Sicherheits-Skripte"
          sublabel="DDL & Code"
          menuHeader="Generierte Sicherheits- & Auth-Skripte"
          onMainClick={() => onAction('open_security_scripts')}
          size="large"
          items={[
            {
              id: 'scripts_sql',
              label: 'RBAC SQL DDL & Migrationsskripte',
              description: 'DDL-Skripte für sys_roles, sys_permissions und sys_users generieren',
              icon: <Database size={14} className="text-blue-600" />,
              onClick: () => onAction('open_security_scripts'),
              badge: 'DDL',
              badgeColor: 'blue'
            },
            {
              id: 'scripts_middleware',
              label: 'Auth- & RBAC-Middleware (C# / TS)',
              description: 'ASP.NET Core AuthorizationHandler & Express JWT Middleware kopieren',
              icon: <FileCode size={14} className="text-indigo-600" />,
              onClick: () => onAction('open_security_scripts'),
              badge: 'Backend',
              badgeColor: 'indigo'
            }
          ]}
        />
      </RibbonGroup>

    </div>
  );
};
