import React, { useState } from 'react';
import { ShieldCheck, Check, X, Lock, EyeOff } from 'lucide-react';
import { Form, Table } from '../../../types/index';

interface FieldRbacModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  sourceTable?: Table;
  onSaveForm: (updatedForm: Form) => void;
}

const AVAILABLE_ROLES = ['admin', 'manager', 'kalkulator', 'bauleiter', 'mitarbeiter', 'gast'];

export const FieldRbacModal: React.FC<FieldRbacModalProps> = ({
  isOpen,
  onClose,
  form,
  sourceTable,
  onSaveForm,
}) => {
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, { readRoles: string[]; writeRoles: string[]; maskData?: boolean }>>(
    () => (form as any).fieldRbacMap || {}
  );

  if (!isOpen) return null;

  const handleRoleToggle = (fieldId: string, role: string, type: 'read' | 'write') => {
    setFieldPermissions((prev) => {
      const current = prev[fieldId] || { readRoles: [...AVAILABLE_ROLES], writeRoles: [...AVAILABLE_ROLES], maskData: false };
      const roleList = type === 'read' ? [...current.readRoles] : [...current.writeRoles];

      const idx = roleList.indexOf(role);
      if (idx > -1) roleList.splice(idx, 1);
      else roleList.push(role);

      return {
        ...prev,
        [fieldId]: {
          ...current,
          [type === 'read' ? 'readRoles' : 'writeRoles']: roleList,
        },
      };
    });
  };

  const handleMaskToggle = (fieldId: string) => {
    setFieldPermissions((prev) => {
      const current = prev[fieldId] || { readRoles: [...AVAILABLE_ROLES], writeRoles: [...AVAILABLE_ROLES], maskData: false };
      return {
        ...prev,
        [fieldId]: {
          ...current,
          maskData: !current.maskData,
        },
      };
    });
  };

  const handleSave = () => {
    onSaveForm({
      ...form,
      fieldRbacMap: fieldPermissions,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Feld-Level RBAC & Datenmaskierung</h3>
              <p className="text-xs text-slate-400">Sichtbarkeit & Schreibrechte nach Benutzerrolle einschränken</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {sourceTable?.fields.map((f) => {
              const perm = fieldPermissions[f.id] || {
                readRoles: [...AVAILABLE_ROLES],
                writeRoles: [...AVAILABLE_ROLES],
                maskData: false,
              };

              return (
                <div key={f.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-slate-400" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{f.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({f.type})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMaskToggle(f.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                        perm.maskData
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <EyeOff size={12} /> {perm.maskData ? 'Daten maskiert (••••)' : 'Keine Maskierung'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="font-semibold text-slate-500 block mb-1">Leserechte (Lesen):</span>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_ROLES.map((role) => {
                          const active = perm.readRoles.includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => handleRoleToggle(f.id, role, 'read')}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500 block mb-1">Schreibrechte (Bearbeiten):</span>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_ROLES.map((role) => {
                          const active = perm.writeRoles.includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => handleRoleToggle(f.id, role, 'write')}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                active
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
            <Check size={14} /> Rechte Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
