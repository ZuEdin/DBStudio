import React, { useState } from 'react';
import { 
  Key, 
  X, 
  Plus, 
  Server, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Users,
  Clock, 
  Layers, 
  Laptop, 
  Check, 
  Sparkles,
  Database,
  Lock
} from 'lucide-react';

interface AuthMapping {
  groupName: string;
  roleName: string;
}

interface AuthConfig {
  useWindowsAuth: boolean;
  useAdGroups: boolean;
  adGroups?: string;
  adMapping?: AuthMapping[];
  useUserLogin: boolean;
  isMobileReady: boolean;
  devBypass: boolean;
  useActiveDirectoryMgmt?: boolean;
  // Login-Merker & Session Tracking options
  enableSessionMarker?: boolean;
  rememberMeDurationDays?: number;
  autoAuditColumns?: boolean;
  sessionStorageType?: 'indexeddb' | 'localstorage' | 'cookie';
  defaultLoginRole?: string;
}

interface AuthTabProps {
  authConfig: any;
  setAuthConfig: React.Dispatch<React.SetStateAction<any>>;
  roles: any[];
  onGenerateAuthForm?: (formType: 'login' | 'register' | 'user_mgmt') => void;
}

export const AuthTab: React.FC<AuthTabProps> = ({
  authConfig,
  setAuthConfig,
  roles,
  onGenerateAuthForm
}) => {
  const [newMapGroup, setNewMapGroup] = useState('');
  const [newMapRole, setNewMapRole] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addMapping = () => {
    if (newMapGroup && newMapRole) {
      const currentMap = authConfig.adMapping || [];
      setAuthConfig({
        ...authConfig,
        adMapping: [...currentMap, { groupName: newMapGroup, roleName: newMapRole }],
      });
      setNewMapGroup('');
      showFeedback(`AD-Gruppe "${newMapGroup}" zugewiesen.`);
    }
  };

  const addPredefinedAD = (group: string, role: string) => {
    const currentMap = authConfig.adMapping || [];
    if (!currentMap.some((m: any) => m.groupName.toLowerCase() === group.toLowerCase())) {
      setAuthConfig({
        ...authConfig,
        useWindowsAuth: true,
        useAdGroups: true,
        adMapping: [...currentMap, { groupName: group, roleName: role }],
      });
      showFeedback(`AD-Vorlage "${group}" hinzugefügt.`);
    }
  };

  const removeMapping = (idx: number) => {
    const currentMap = authConfig.adMapping || [];
    setAuthConfig({
      ...authConfig,
      adMapping: currentMap.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 m-4 sm:m-6 h-[90%] overflow-y-auto max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Key className="text-emerald-600" size={22} /> 
            <span>Authentifizierung, Active Directory & Login-Merker</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurieren Sie Anmeldeverfahren für Intranet (Windows AD), Webformulare, Session-Tracking und automatische Benutzerstempel.
          </p>
        </div>
        {toastMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in duration-150">
            <Check size={14} className="text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        
        {/* SECTION 1: Active Directory & Windows Authentifizierung */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!authConfig.useWindowsAuth}
                onChange={(e) =>
                  setAuthConfig({ ...authConfig, useWindowsAuth: e.target.checked })
                }
                className="rounded w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Server size={16} className="text-blue-600" />
                  Windows Authentifizierung (Active Directory / Kerberos / NTLM)
                </span>
                <p className="text-xs text-slate-500 font-normal">
                  Ermöglicht nahtloses Single Sign-On (SSO) in Windows-Netzwerken & Unternehmens-Intranets.
                </p>
              </div>
            </label>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full font-bold">
              Intranet & Domain
            </span>
          </div>

          {authConfig.useWindowsAuth && (
            <div className="ml-7 pl-4 border-l-2 border-blue-400 space-y-4 animate-in slide-in-from-top-2 duration-150">
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!authConfig.useAdGroups}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, useAdGroups: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  AD-Gruppen für Windows-Netzwerke zuweisen (Role Mapping)
                </span>
              </label>

              {authConfig.useAdGroups && (
                <div className="space-y-3">
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">Häufige Vorlagen:</span>
                    <button
                      type="button"
                      onClick={() => addPredefinedAD('DOMAIN\\Domänen-Admins', 'Administrator')}
                      className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 px-2 py-0.5 rounded transition-colors"
                    >
                      + Domänen-Admins → Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => addPredefinedAD('DOMAIN\\Abteilungsleiter', 'Manager')}
                      className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 px-2 py-0.5 rounded transition-colors"
                    >
                      + Abteilungsleiter → Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => addPredefinedAD('DOMAIN\\Mitarbeiter', 'User')}
                      className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 px-2 py-0.5 rounded transition-colors"
                    >
                      + Mitarbeiter → User
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Aktive AD-Gruppen zu Rollen Zuweisung</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">
                        {(authConfig.adMapping || []).length} Zuweisung(en)
                      </span>
                    </h4>

                    <table className="w-full text-xs mb-3">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="pb-1.5 font-semibold">Windows Active Directory Gruppe</th>
                          <th className="pb-1.5 font-semibold">DB Studio Rolle</th>
                          <th className="pb-1.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {authConfig.adMapping?.map((map: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 font-mono text-slate-800 font-semibold">{map.groupName}</td>
                            <td className="py-2">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                {map.roleName}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => removeMapping(i)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                title="Zuweisung entfernen"
                              >
                                <X size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!authConfig.adMapping || authConfig.adMapping.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-3 text-center text-slate-400 italic text-xs">
                              Noch keine AD-Gruppen hinterlegt. Fügen Sie unten eine Gruppe hinzu.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="z.B. MEINEDOMAENE\Buchhaltung"
                        value={newMapGroup}
                        onChange={(e) => setNewMapGroup(e.target.value)}
                      />
                      <span className="text-slate-400 text-xs font-bold">→</span>
                      <select
                        className="border border-slate-300 rounded px-2.5 py-1.5 text-xs w-40 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                        value={newMapRole}
                        onChange={(e) => setNewMapRole(e.target.value)}
                      >
                        <option value="">(Rolle wählen)</option>
                        {roles.map((r: any) => (
                          <option key={r.Name || r.name} value={r.Name || r.name}>
                            {r.Name || r.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addMapping}
                        disabled={!newMapGroup || !newMapRole}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Plus size={13} /> Zuweisen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!authConfig.useActiveDirectoryMgmt}
                  onChange={(e) =>
                    setAuthConfig({
                      ...authConfig,
                      useActiveDirectoryMgmt: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Domain Controller API & LDAP Active-Directory Anbindung (.NET / Node)
                </span>
              </label>
              {authConfig.useActiveDirectoryMgmt && (
                <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                  Aktiviert die tiefe Domänen-Integration. Ermöglicht dem generierten Backend die direkte Benutzer- und Gruppenabfrage über LDAP / System.DirectoryServices.
                </p>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Web & Formular-Login mit Login-Merker */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!authConfig.useUserLogin}
                onChange={(e) =>
                  setAuthConfig({ ...authConfig, useUserLogin: e.target.checked })
                }
                className="rounded w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Key size={16} className="text-emerald-600" />
                  Benutzer-Login (Formular / JWT / Passwörter)
                </span>
                <p className="text-xs text-slate-500 font-normal">
                  Klassischer Login mit Benutzername & Passwort. Speichert Benutzer in der Systemtabelle <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[11px]">sys_users</code>.
                </p>
              </div>
            </label>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
              Web & App
            </span>
          </div>

          {authConfig.useUserLogin && (
            <div className="ml-7 pl-4 border-l-2 border-emerald-400 space-y-4 animate-in slide-in-from-top-2 duration-150">
              
              {/* Login-Merker & Session Tracking Settings */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-600" />
                  Login-Merker & Session-Tracking
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={authConfig.enableSessionMarker !== false}
                      onChange={(e) =>
                        setAuthConfig({ ...authConfig, enableSessionMarker: e.target.checked })
                      }
                      className="rounded text-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Login-Merker aktivieren</span>
                      <p className="text-[11px] text-slate-500">
                        Speichert den Login-Status und stellt die Session beim Neuladen der Anwendung automatisch wieder her.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={authConfig.autoAuditColumns !== false}
                      onChange={(e) =>
                        setAuthConfig({ ...authConfig, autoAuditColumns: e.target.checked })
                      }
                      className="rounded text-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Automatische Benutzer-Stempel</span>
                      <p className="text-[11px] text-slate-500">
                        Befüllt in Tabellen automatisch Spalten wie <code>CreatedBy</code>, <code>UpdatedBy</code> mit dem eingeloggten Benutzer.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-semibold">Session-Speicher:</span>
                    <select
                      value={authConfig.sessionStorageType || 'indexeddb'}
                      onChange={(e) => setAuthConfig({ ...authConfig, sessionStorageType: e.target.value })}
                      className="border border-slate-300 rounded px-2 py-1 bg-white font-mono text-[11px] text-slate-800"
                    >
                      <option value="indexeddb">IndexedDB (Sicher & Offline-First)</option>
                      <option value="localstorage">LocalStorage (Web Browser)</option>
                      <option value="cookie">HttpOnly Cookie (Server-gehärtet)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-semibold">Standard-Rolle für Neuregistrierungen:</span>
                    <select
                      value={authConfig.defaultLoginRole || 'User'}
                      onChange={(e) => setAuthConfig({ ...authConfig, defaultLoginRole: e.target.value })}
                      className="border border-slate-300 rounded px-2 py-1 bg-white font-mono text-[11px] text-slate-800"
                    >
                      {roles.map((r: any) => (
                        <option key={r.Name || r.name} value={r.Name || r.name}>
                          {r.Name || r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile App & Token Lifetime */}
              <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={!!authConfig.isMobileReady}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, isMobileReady: e.target.checked })
                  }
                  className="rounded text-emerald-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Mobile App & Offline-Token (Lange Token-Laufzeit mit Refresh-Tokens)
                </span>
              </label>

              {/* Form Generation Quick Actions */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  Vorgefertigte Auth-Formulare erzeugen:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onGenerateAuthForm) onGenerateAuthForm('login');
                      showFeedback("Login-Formularvorlage registriert.");
                    }}
                    className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Key size={13} /> Login-Formular (frm_Login)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onGenerateAuthForm) onGenerateAuthForm('register');
                      showFeedback("Registrierungs-Formularvorlage registriert.");
                    }}
                    className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <UserPlus size={13} /> Registrierungs-Maske (frm_Register)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onGenerateAuthForm) onGenerateAuthForm('user_mgmt');
                      showFeedback("Benutzerverwaltungs-Maske registriert.");
                    }}
                    className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Users size={13} /> Benutzerverwaltung (frm_Users)
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SECTION 3: Developer Bypass Mode */}
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/70 shadow-2xs space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!authConfig.devBypass}
              onChange={(e) =>
                setAuthConfig({ ...authConfig, devBypass: e.target.checked })
              }
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-bold text-slate-800 text-sm">
              Developer Bypass (Entwicklungs-Modus)
            </span>
          </label>
          <p className="text-xs text-slate-600 ml-6 leading-relaxed">
            Wenn aktiv, wird bei lokalen Tests und im Web-Preview automatisch die Administrator-Rolle simuliert, sodass Sie ohne ständigen Login-Dialog sofort an Datenstrukturen und Masken arbeiten können.
          </p>
        </div>

      </div>
    </div>
  );
};

