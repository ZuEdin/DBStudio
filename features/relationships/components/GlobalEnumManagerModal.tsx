import React, { useState, useEffect } from 'react';
import { EnumDefinition, CustomTypeDefinition } from '../types/erDesignerTypes';
import { 
  ListOrdered, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Layers,
  Edit2
} from 'lucide-react';

interface GlobalEnumManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enums: EnumDefinition[];
  customTypes: CustomTypeDefinition[];
  onSave: (enums: EnumDefinition[], customTypes: CustomTypeDefinition[]) => void;
}

export const GlobalEnumManagerModal: React.FC<GlobalEnumManagerModalProps> = ({
  isOpen,
  onClose,
  enums: initialEnums,
  customTypes: initialCustomTypes,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'enums' | 'types'>('enums');
  const [enumsList, setEnumsList] = useState<EnumDefinition[]>([]);
  const [customTypesList, setCustomTypesList] = useState<CustomTypeDefinition[]>([]);
  const [selectedEnumId, setSelectedEnumId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const defaultEnums: EnumDefinition[] = initialEnums.length > 0 ? initialEnums : [
        {
          id: 'enum_order_status',
          name: 'OrderStatus',
          values: ['DRAFT', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
          comment: 'Standard Bestellstatus'
        },
        {
          id: 'enum_user_role',
          name: 'UserRole',
          values: ['ADMIN', 'MANAGER', 'CLERK', 'GUEST'],
          comment: 'RBAC Rollenverteilung'
        }
      ];
      setEnumsList(defaultEnums);
      setCustomTypesList(initialCustomTypes || []);
      if (defaultEnums.length > 0) {
        setSelectedEnumId(defaultEnums[0].id);
      }
    }
  }, [isOpen, initialEnums, initialCustomTypes]);

  if (!isOpen) return null;

  const handleAddEnum = () => {
    const newEnum: EnumDefinition = {
      id: crypto.randomUUID(),
      name: `CustomEnum${enumsList.length + 1}`,
      values: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
      comment: 'Benutzerdefinierter ENUM-Typ'
    };
    setEnumsList(prev => [...prev, newEnum]);
    setSelectedEnumId(newEnum.id);
  };

  const handleRemoveEnum = (id: string) => {
    setEnumsList(prev => prev.filter(e => e.id !== id));
    if (selectedEnumId === id) {
      setSelectedEnumId(enumsList[0]?.id || '');
    }
  };

  const selectedEnum = enumsList.find(e => e.id === selectedEnumId);

  const handleSaveAll = () => {
    onSave(enumsList, customTypesList);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <ListOrdered size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Globaler ENUM & Datentyp Manager</h2>
              <p className="text-xs text-neutral-500">Zentrale Typdefinitionen für sauberes Datenbankschema und Dropdown-Validierung</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex divide-x divide-neutral-200 dark:divide-neutral-800">
          {/* Left Column: List of Enums */}
          <div className="w-1/3 p-3 flex flex-col bg-neutral-50/50 dark:bg-neutral-950">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">ENUM Typen ({enumsList.length})</span>
              <button
                onClick={handleAddEnum}
                className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                title="Neuen ENUM erstellen"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {enumsList.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEnumId(e.id)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                    selectedEnumId === e.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="font-mono">{e.name}</span>
                  <span className="text-[10px] opacity-75">{e.values.length} Werte</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Enum Details */}
          <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-neutral-900 space-y-4">
            {selectedEnum ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Typ-Name:</label>
                    <input
                      type="text"
                      value={selectedEnum.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEnumsList(prev => prev.map(item => item.id === selectedEnum.id ? { ...item, name: val } : item));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Beschreibung:</label>
                    <input
                      type="text"
                      value={selectedEnum.comment || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEnumsList(prev => prev.map(item => item.id === selectedEnum.id ? { ...item, comment: val } : item));
                      }}
                      placeholder="z.B. Gültige Auftragsstatus"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">ENUM-Werte (Ausprägungen):</label>
                    <button
                      onClick={() => {
                        const val = `VALUE_${selectedEnum.values.length + 1}`;
                        setEnumsList(prev => prev.map(item => item.id === selectedEnum.id ? { ...item, values: [...item.values, val] } : item));
                      }}
                      className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Wert hinzufügen
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto p-1">
                    {selectedEnum.values.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-neutral-400 w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          value={v}
                          onChange={(e) => {
                            const newVals = [...selectedEnum.values];
                            newVals[idx] = e.target.value;
                            setEnumsList(prev => prev.map(item => item.id === selectedEnum.id ? { ...item, values: newVals } : item));
                          }}
                          className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                        <button
                          onClick={() => {
                            const newVals = selectedEnum.values.filter((_, i) => i !== idx);
                            setEnumsList(prev => prev.map(item => item.id === selectedEnum.id ? { ...item, values: newVals } : item));
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <button
                    onClick={() => handleRemoveEnum(selectedEnum.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={13} />
                    Diesen ENUM löschen
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-neutral-400 text-xs">
                Wählen Sie einen ENUM aus der linken Liste oder erstellen Sie einen neuen.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Check size={14} />
            <span>Speichern & Schließen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
