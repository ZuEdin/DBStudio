
import React, { useState, useEffect } from 'react';
import { Table, Form, Report, BackendConfig, Field } from '../../types/index';
import { X, Shield, Lock, Unlock, Eye, Edit2, Trash2, Check, AlertTriangle, ChevronRight, ChevronDown, Table as TableIcon, Hash, Type, Users, Key, Plus, UserCog, Wand2, RefreshCw } from 'lucide-react';

interface SecurityManagerModalProps {
  tables: Table[];
  forms: Form[];
  reports: Report[];
  onUpdateTable: (table: Table) => void;
  onCreateTable: (table: Table) => void;
  onClose: () => void;
  backendConfig?: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void;
}

export const SecurityManagerModal: React.FC<SecurityManagerModalProps> = ({ tables, forms, reports, onUpdateTable, onCreateTable, onClose, backendConfig, onUpdateBackendConfig }) => {
  // Find system tables
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const permTable = tables.find(t => t.name === 'sys_permissions');

  const [activeTab, setActiveTab] = useState<'matrix' | 'roles' | 'auth'>('matrix');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Local state for Auth settings
  const [authConfig, setAuthConfig] = useState(backendConfig?.authConfig || { 
      useWindowsAuth: false, 
      useAdGroups: false, 
      adGroups: '', 
      adMapping: [],
      useUserLogin: false, 
      isMobileReady: false, 
      devBypass: true 
  });

  // New mapping state
  const [newMapGroup, setNewMapGroup] = useState('');
  const [newMapRole, setNewMapRole] = useState('');

  // Role Management State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const saveAuthChanges = () => {
      if (backendConfig && onUpdateBackendConfig) {
          onUpdateBackendConfig({ ...backendConfig, authConfig });
      }
  };

  const handleInitialize = () => {
      // 1. Create sys_roles with Standard Roles
      const rolesPk = crypto.randomUUID();
      const rolesFields: Field[] = [
          { id: rolesPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
          { id: crypto.randomUUID(), name: 'Name', type: 'VARCHAR', length: 50 },
          { id: crypto.randomUUID(), name: 'Description', type: 'VARCHAR', length: 255 }
      ];
      
      const rolesData = [
          { Id: 1, Name: 'Administrator', Description: 'Vollzugriff auf alle Bereiche (System)' },
          { Id: 2, Name: 'Manager', Description: 'Darf Inhalte verwalten und bearbeiten' },
          { Id: 3, Name: 'Editor', Description: 'Darf Daten bearbeiten, aber nicht löschen' },
          { Id: 4, Name: 'User', Description: 'Nur Lesezugriff' },
          { Id: 5, Name: 'Guest', Description: 'Eingeschränkter Zugriff' }
      ];

      onCreateTable({
          id: 'sys_roles',
          name: 'sys_roles',
          fields: rolesFields,
          data: rolesData
      });

      // 2. Create sys_permissions AND pre-fill for existing tables
      const permPk = crypto.randomUUID();
      const permFields: Field[] = [
          { id: permPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
          { id: crypto.randomUUID(), name: 'RoleId', type: 'INTEGER' },
          { id: crypto.randomUUID(), name: 'ObjectType', type: 'VARCHAR', length: 50 }, // Table, Field
          { id: crypto.randomUUID(), name: 'ObjectId', type: 'VARCHAR', length: 50 },
          { id: crypto.randomUUID(), name: 'CanRead', type: 'BOOLEAN' },
          { id: crypto.randomUUID(), name: 'CanWrite', type: 'BOOLEAN' },
          { id: crypto.randomUUID(), name: 'CanDelete', type: 'BOOLEAN' }
      ];

      const initialPerms: any[] = [];
      let permCounter = 1;

      // Generate Defaults for ALL existing non-system tables
      const contentTables = tables.filter(t => !t.name.startsWith('sys_'));
      
      contentTables.forEach(table => {
          // Admin (1): Full Access
          initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
          
          // Manager (2): Full Access
          initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });

          // Editor (3): No Delete
          initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: false });

          // User (4): Read Only
          initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: false, CanDelete: false });

          // Guest (5): No Access (Explicit Deny - entry ensures UI shows it as intentionally set)
          initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: table.id, CanRead: false, CanWrite: false, CanDelete: false });
      });

      onCreateTable({
          id: 'sys_permissions',
          name: 'sys_permissions',
          fields: permFields,
          data: initialPerms
      });

      if(backendConfig) {
          setAuthConfig({...authConfig, useUserLogin: true});
      }
  };

  const handleResetDefaults = () => {
      if(!confirm("Möchten Sie wirklich alle Rollen und Rechte auf den Standard zurücksetzen? Ihre Anpassungen gehen verloren.")) return;
      
      // Delete existing system tables first (handled by create overwriting or we'd need delete logic)
      // Since onCreateTable usually appends or updates, for a full reset in this prototype context:
      // We will re-run the logic which will push new tables. 
      // Ideally we should clear data first.
      
      // Simplified: Just re-run logic, assumes onCreateTable handles ID collision or we manually update data.
      // Better: Manually update the data of existing sys tables.
      
      if (rolesTable && permTable) {
          // Reset Roles
           const rolesData = [
              { Id: 1, Name: 'Administrator', Description: 'Vollzugriff auf alle Bereiche (System)' },
              { Id: 2, Name: 'Manager', Description: 'Darf Inhalte verwalten und bearbeiten' },
              { Id: 3, Name: 'Editor', Description: 'Darf Daten bearbeiten, aber nicht löschen' },
              { Id: 4, Name: 'User', Description: 'Nur Lesezugriff' },
              { Id: 5, Name: 'Guest', Description: 'Eingeschränkter Zugriff' }
          ];
          onUpdateTable({ ...rolesTable, data: rolesData });

          // Reset Permissions
          const initialPerms: any[] = [];
          let permCounter = 1;
          const contentTables = tables.filter(t => !t.name.startsWith('sys_'));
          
          contentTables.forEach(table => {
              initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
              initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
              initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: table.id, CanRead: false, CanWrite: false, CanDelete: false });
          });
          onUpdateTable({ ...permTable, data: initialPerms });
      } else {
          handleInitialize();
      }
  };

  // If system tables don't exist, show initialization screen
  if (!rolesTable || !permTable) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25">
              <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl border border-slate-200">
                  <div className="flex justify-center mb-6 text-blue-600">
                      <div className="bg-blue-100 p-4 rounded-full">
                        <Shield size={48}/>
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-slate-800">Sicherheits-System einrichten</h2>
                  <p className="text-slate-600 mb-6 text-sm">
                      Die notwendigen Systemtabellen für das Rollenmanagement (RBAC) fehlen noch. 
                      Das System wird diese erstellen und für Ihre <strong>{tables.length} existierenden Tabellen</strong> Standardrechte vergeben.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 text-left text-xs text-slate-500 mb-6 space-y-2">
                      <p className="font-bold text-slate-700">Wird erstellt:</p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>Tabelle <code>sys_roles</code> (Admin, Manager, Editor, User, Guest)</li>
                          <li>Tabelle <code>sys_permissions</code> (Matrix)</li>
                          <li>Automatische <strong>Lese/Schreib-Regeln</strong> für alle aktuellen Tabellen.</li>
                      </ul>
                  </div>

                  <div className="flex gap-3 justify-center">
                      <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Abbrechen</button>
                      <button 
                        onClick={handleInitialize} 
                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30"
                      >
                          <Wand2 size={18}/> Initialisieren
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const roles = rolesTable?.data || [];
  const permissions = permTable?.data || [];

  // --- Permission Logic ---
  const togglePermission = (roleId: any, objectType: string, objectId: string, permType: 'CanRead' | 'CanWrite' | 'CanDelete') => {
      if (!permTable) return;
      // Find existing permission row
      const existingIdx = permissions.findIndex(p => 
          String(p.RoleId) === String(roleId) && 
          p.ObjectType === objectType && 
          p.ObjectId === objectId
      );

      const newPermissions = [...permissions];

      if (existingIdx > -1) {
          // Update
          const row = { ...newPermissions[existingIdx] };
          row[permType] = !row[permType];
          
          // Auto-Enforce Logic: Write/Delete implies Read
          if ((permType === 'CanWrite' || permType === 'CanDelete') && row[permType]) {
              row.CanRead = true;
          }
          // Turning off Read implies turning off Write/Delete
          if (permType === 'CanRead' && !row.CanRead) {
              row.CanWrite = false;
              row.CanDelete = false;
          }

          newPermissions[existingIdx] = row;
      } else {
          // Insert new rule
          const newRow: any = {
              Id: (permissions.length > 0 ? Math.max(...permissions.map(p => Number(p.Id))) : 0) + 1,
              RoleId: roleId,
              ObjectType: objectType,
              ObjectId: objectId,
              CanRead: true, // Default read true if creating entry via toggle
              CanWrite: false,
              CanDelete: false
          };
          if (permType !== 'CanRead') newRow[permType] = true;
          else newRow.CanRead = true; 

          newPermissions.push(newRow);
      }

      onUpdateTable({ ...permTable, data: newPermissions });
  };

  const getPerm = (roleId: any, objectType: string, objectId: string) => {
      // DEFAULT LOGIC IF NO RECORD EXISTS:
      // Admin (1) -> Allow All
      // Others -> Deny All (Secure by default, unless initialized)
      const entry = permissions.find(p => String(p.RoleId) === String(roleId) && p.ObjectType === objectType && p.ObjectId === objectId);
      if (entry) return entry;

      if (String(roleId) === '1') return { CanRead: true, CanWrite: true, CanDelete: true };
      return { CanRead: false, CanWrite: false, CanDelete: false };
  };

  const toggleTableExpand = (tableId: string) => {
      setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  // --- Auth Mapping Handlers ---
  const addMapping = () => {
      if(newMapGroup && newMapRole) {
          const currentMap = authConfig.adMapping || [];
          setAuthConfig({
              ...authConfig,
              adMapping: [...currentMap, { groupName: newMapGroup, roleName: newMapRole }]
          });
          setNewMapGroup('');
      }
  };

  const removeMapping = (idx: number) => {
      const currentMap = authConfig.adMapping || [];
      setAuthConfig({
          ...authConfig,
          adMapping: currentMap.filter((_, i) => i !== idx)
      });
  };

  // --- Role Management Handlers ---
  const handleAddRole = () => {
      if (!rolesTable || !newRoleName) return;
      const currentRoles = rolesTable.data || [];
      const nextId = currentRoles.length > 0 ? Math.max(...currentRoles.map((r: any) => parseInt(r.Id || 0))) + 1 : 1;

      const newRole = {
          Id: nextId,
          Name: newRoleName,
          Description: newRoleDesc
      };

      onUpdateTable({ ...rolesTable, data: [...currentRoles, newRole] });
      setNewRoleName('');
      setNewRoleDesc('');
  };

  const handleDeleteRole = (roleId: any) => {
      if (!rolesTable) return;
      if (String(roleId) === '1') {
          alert("Die Admin-Rolle (ID 1) kann nicht gelöscht werden.");
          return;
      }
      if (confirm("Rolle wirklich löschen? Dies entfernt auch alle zugehörigen Berechtigungen.")) {
          const newRoles = (rolesTable.data || []).filter((r: any) => String(r.Id) !== String(roleId));
          onUpdateTable({ ...rolesTable, data: newRoles });
          
          if (permTable) {
              const newPerms = (permTable.data || []).filter((p: any) => String(p.RoleId) !== String(roleId));
              onUpdateTable({ ...permTable, data: newPerms });
          }
      }
  };

  const businessTables = tables.filter(t => !t.name.startsWith('sys_'));

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90vw] h-[90vh] flex flex-col border border-slate-300 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-slate-800 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Shield className="text-emerald-400"/> Sicherheits-Manager (RBAC)
            </h2>
            <p className="text-slate-300 text-sm mt-1">Granulare Rechteverwaltung für Tabellen und Felder.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-4 pt-4 gap-4 shrink-0">
            <button 
                onClick={() => setActiveTab('matrix')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Berechtigungs-Matrix
            </button>
            <button 
                onClick={() => setActiveTab('roles')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'roles' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Rollen definieren
            </button>
            <button 
                onClick={() => setActiveTab('auth')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'auth' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Authentifizierung (AD/Login)
            </button>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 p-0">
            {activeTab === 'matrix' ? (
                <div className="bg-white h-full flex flex-col overflow-hidden">
                    {/* Matrix View */}
                    <div className="overflow-auto flex-1 pb-20">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="p-3 text-left font-bold text-slate-700 border-b w-80 bg-slate-100 z-30 sticky left-0 border-r">Objekt / Feld</th>
                                    {roles.map((role: any) => (
                                        <th key={role.Id} className="p-3 text-center border-b border-r border-slate-200 min-w-[140px]">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-800">{role.Name}</span>
                                                <span className="text-[10px] text-slate-500 font-normal">{role.Description}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {businessTables.map((table) => {
                                    const isExpanded = expandedTables[table.id];
                                    return (
                                        <React.Fragment key={table.id}>
                                            <tr className="hover:bg-slate-50 border-b border-slate-200 bg-slate-50/30">
                                                <td className="p-2 pl-3 border-r border-slate-200 bg-white sticky left-0 font-bold text-slate-800 flex items-center gap-2 z-10">
                                                    <button onClick={() => toggleTableExpand(table.id)} className="text-slate-400 hover:text-slate-700">
                                                        {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        <TableIcon size={14} className="text-orange-600"/>
                                                        {table.name}
                                                    </div>
                                                </td>
                                                {roles.map((role: any) => {
                                                    const p = getPerm(role.Id, 'Table', table.id);
                                                    return (
                                                        <PermissionCell 
                                                            key={role.Id} 
                                                            roleId={role.Id} 
                                                            objectType="Table" 
                                                            objectId={table.id} 
                                                            perm={p} 
                                                            onToggle={togglePermission} 
                                                        />
                                                    );
                                                })}
                                            </tr>
                                            {isExpanded && table.fields.map(field => (
                                                <tr key={field.id} className="hover:bg-slate-50 border-b border-slate-100">
                                                    <td className="p-2 pl-12 border-r border-slate-200 bg-slate-50/50 sticky left-0 text-slate-600 flex items-center gap-2 text-xs z-10">
                                                        {field.type === 'INTEGER' ? <Hash size={12} className="text-slate-400"/> : <Type size={12} className="text-slate-400"/>}
                                                        {field.name}
                                                    </td>
                                                    {roles.map((role: any) => {
                                                        const p = getPerm(role.Id, 'Field', field.id);
                                                        return (
                                                            <PermissionCell 
                                                                key={role.Id} 
                                                                roleId={role.Id} 
                                                                objectType="Field" 
                                                                objectId={field.id} 
                                                                perm={p} 
                                                                onToggle={togglePermission}
                                                                isField={true}
                                                            />
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center shrink-0 h-12">
                        <span>Rechte werden in <code>sys_permissions</code> gespeichert.</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Eye size={12}/> Lesen</span>
                            <span className="flex items-center gap-1"><Edit2 size={12}/> Schreiben</span>
                            <span className="flex items-center gap-1"><Trash2 size={12}/> Löschen</span>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'roles' ? (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 m-6 h-[90%] overflow-y-auto max-w-3xl mx-auto flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><UserCog size={20} className="text-slate-600"/> Rollenverwaltung</h3>
                        <button onClick={handleResetDefaults} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <RefreshCw size={12}/> Defaults wiederherstellen
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto border border-slate-200 rounded-lg mb-6">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                    <th className="p-3 border-b font-semibold text-slate-600 w-16">ID</th>
                                    <th className="p-3 border-b font-semibold text-slate-600">Rollenname</th>
                                    <th className="p-3 border-b font-semibold text-slate-600">Beschreibung</th>
                                    <th className="p-3 border-b w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map((r: any) => (
                                    <tr key={r.Id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-slate-500">{r.Id}</td>
                                        <td className="p-3 font-bold text-slate-800">
                                            {r.Name}
                                            {String(r.Id) === '1' && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">System</span>}
                                        </td>
                                        <td className="p-3 text-slate-600">{r.Description || '-'}</td>
                                        <td className="p-3 text-right">
                                            {String(r.Id) !== '1' && (
                                                <button onClick={() => handleDeleteRole(r.Id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
                                                    <Trash2 size={16}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Neue Rolle erstellen</h4>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Bezeichnung</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm"
                                    placeholder="z.B. Lektor"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Beschreibung</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm"
                                    placeholder="z.B. Darf Berichte lesen"
                                    value={newRoleDesc}
                                    onChange={e => setNewRoleDesc(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleAddRole} 
                                disabled={!newRoleName}
                                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 h-[38px]"
                            >
                                <Plus size={16}/> Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 m-6 h-[90%] overflow-y-auto max-w-3xl mx-auto">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Key size={20}/> Authentifizierungs-Methoden</h3>
                    
                    <div className="space-y-6">
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input 
                                    type="checkbox" 
                                    checked={authConfig.useWindowsAuth}
                                    onChange={e => setAuthConfig({...authConfig, useWindowsAuth: e.target.checked})}
                                    className="rounded w-5 h-5 text-emerald-600"
                                />
                                <span className="font-bold text-slate-800">Windows Authentifizierung (Active Directory)</span>
                            </label>
                            <p className="text-sm text-slate-600 ml-7 mb-4">
                                Nutzt die Windows-Identität des Benutzers (Intranet/Enterprise). Erfordert IIS oder entsprechenden Proxy.
                            </p>

                            {authConfig.useWindowsAuth && (
                                <div className="ml-7 pl-4 border-l-2 border-slate-300 space-y-4 animate-in slide-in-from-top-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={authConfig.useAdGroups}
                                            onChange={e => setAuthConfig({...authConfig, useAdGroups: e.target.checked})}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-semibold">Zugriff auf AD-Gruppen beschränken (Role Mapping)</span>
                                    </label>
                                    
                                    {authConfig.useAdGroups && (
                                        <div className="space-y-3">
                                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Gruppen-zu-Rollen Zuweisung</h4>
                                                <table className="w-full text-sm mb-3">
                                                    <thead>
                                                        <tr className="text-left text-slate-500 border-b">
                                                            <th className="pb-1 font-normal">AD Gruppe</th>
                                                            <th className="pb-1 font-normal">Interne Rolle</th>
                                                            <th className="pb-1 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {authConfig.adMapping?.map((map, i) => (
                                                            <tr key={i} className="border-b last:border-0">
                                                                <td className="py-2 font-mono text-xs">{map.groupName}</td>
                                                                <td className="py-2"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{map.roleName}</span></td>
                                                                <td className="py-2 text-right">
                                                                    <button onClick={() => removeMapping(i)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!authConfig.adMapping || authConfig.adMapping.length === 0) && (
                                                            <tr><td colSpan={3} className="py-4 text-center text-slate-400 italic text-xs">Keine Zuweisungen.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                                
                                                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 border rounded px-2 py-1 text-xs" 
                                                        placeholder="DOMAIN\GroupName"
                                                        value={newMapGroup}
                                                        onChange={e => setNewMapGroup(e.target.value)}
                                                    />
                                                    <span className="text-slate-400 text-xs">→</span>
                                                    <select 
                                                        className="border rounded px-2 py-1 text-xs w-32"
                                                        value={newMapRole}
                                                        onChange={e => setNewMapRole(e.target.value)}
                                                    >
                                                        <option value="">(Rolle)</option>
                                                        {roles.map((r: any) => <option key={r.Name} value={r.Name}>{r.Name}</option>)}
                                                    </select>
                                                    <button 
                                                        onClick={addMapping}
                                                        disabled={!newMapGroup || !newMapRole}
                                                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <Plus size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input 
                                    type="checkbox" 
                                    checked={authConfig.useUserLogin}
                                    onChange={e => setAuthConfig({...authConfig, useUserLogin: e.target.checked})}
                                    className="rounded w-5 h-5 text-emerald-600"
                                />
                                <span className="font-bold text-slate-800">Benutzer-Login (Formular)</span>
                            </label>
                            <p className="text-sm text-slate-600 ml-7 mb-2">
                                Klassisches Login mit Username/Passwort (JWT Tokens). Speichert Benutzer in der Tabelle <code>sys_users</code>.
                            </p>
                            {authConfig.useUserLogin && (
                                <div className="ml-7 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={authConfig.isMobileReady}
                                            onChange={e => setAuthConfig({...authConfig, isMobileReady: e.target.checked})}
                                            className="rounded"
                                        />
                                        Mobile App kompatibel (Lange Token-Laufzeit)
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 bg-yellow-50">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={authConfig.devBypass}
                                    onChange={e => setAuthConfig({...authConfig, devBypass: e.target.checked})}
                                    className="rounded"
                                />
                                <span className="font-bold text-slate-800">Developer Bypass (Dev Mode)</span>
                            </label>
                            <p className="text-sm text-slate-600 ml-6 mt-1">
                                Wenn aktiv, wird im Entwicklungsmodus (Localhost) automatisch ein Admin-Benutzer simuliert.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
            <button onClick={() => { saveAuthChanges(); onClose(); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-semibold shadow-sm flex items-center gap-2">
                <Check size={18}/> Fertig
            </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual permission cells
const PermissionCell: React.FC<{
    roleId: any, 
    objectType: string, 
    objectId: string, 
    perm: any, 
    onToggle: any,
    isField?: boolean
}> = ({ roleId, objectType, objectId, perm, onToggle, isField }) => {
    const isRead = !!perm.CanRead;
    const isWrite = !!perm.CanWrite;
    const isDelete = !!perm.CanDelete;

    return (
        <td className="p-2 border-r border-slate-200 text-center bg-white hover:bg-slate-50 transition-colors">
            <div className="flex justify-center gap-1.5">
                <button 
                    onClick={() => onToggle(roleId, objectType, objectId, 'CanRead')}
                    className={`p-1 rounded transition-all border ${isRead ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                    title="Lesen"
                >
                    <Eye size={14} />
                </button>
                <button 
                    onClick={() => onToggle(roleId, objectType, objectId, 'CanWrite')}
                    className={`p-1 rounded transition-all border ${isWrite ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                    title="Schreiben"
                >
                    <Edit2 size={14} />
                </button>
                {!isField && (
                    <button 
                        onClick={() => onToggle(roleId, objectType, objectId, 'CanDelete')}
                        className={`p-1 rounded transition-all border ${isDelete ? 'bg-red-100 border-red-300 text-red-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                        title="Löschen"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </td>
    );
};
