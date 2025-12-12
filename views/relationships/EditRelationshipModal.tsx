import React, { useState, useEffect } from 'react';
// FIX: Corrected import path to point to the index file in the types directory.
import { Relationship, Table, Field } from '../../types/index';
import { X } from 'lucide-react';

interface EditRelationshipModalProps {
  relationship: Relationship;
  tables: Table[];
  onSave: (relationship: Relationship) => void;
  onClose: () => void;
}

export const EditRelationshipModal: React.FC<EditRelationshipModalProps> = ({
  relationship,
  tables,
  onSave,
  onClose,
}) => {
  const [fromTableId, setFromTableId] = useState(relationship.fromTableId);
  const [fromFieldId, setFromFieldId] = useState(relationship.fromFieldId);
  const [toTableId, setToTableId] = useState(relationship.toTableId);
  const [toFieldId, setToFieldId] = useState(relationship.toFieldId);
  const [integrity, setIntegrity] = useState(relationship.referentialIntegrity ?? true);

  const fromTable = tables.find(t => t.id === fromTableId);
  const toTable = tables.find(t => t.id === toTableId);

  const fromField = fromTable?.fields.find(f => f.id === fromFieldId);
  const toField = toTable?.fields.find(f => f.id === toFieldId);
  const relationshipType = fromField?.isPrimaryKey && toField?.isPrimaryKey ? '1:1' : '1:n';

  const handleSave = () => {
    onSave({
      ...relationship,
      fromTableId,
      fromFieldId,
      toTableId,
      toFieldId,
      type: relationshipType,
      referentialIntegrity: integrity,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-300">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Beziehung bearbeiten</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Side */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Linke Tabelle</label>
              <select
                value={fromTableId}
                onChange={e => {
                  setFromTableId(e.target.value);
                  setFromFieldId(tables.find(t => t.id === e.target.value)?.fields[0]?.id || '');
                }}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-700 mt-4 mb-1">Verknüpftes Feld</label>
              <select
                value={fromFieldId}
                onChange={e => setFromFieldId(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {fromTable?.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            
            {/* Right Side */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rechte Tabelle</label>
              <select
                value={toTableId}
                onChange={e => {
                  setToTableId(e.target.value);
                  setToFieldId(tables.find(t => t.id === e.target.value)?.fields[0]?.id || '');
                }}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-700 mt-4 mb-1">Verknüpftes Feld</label>
              <select
                value={toFieldId}
                onChange={e => setToFieldId(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {toTable?.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
             <div className="text-sm text-slate-500 mb-2">
                Beziehungstyp: <span className="font-semibold text-slate-700">{relationshipType}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                      type="checkbox"
                      checked={integrity}
                      onChange={e => setIntegrity(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Referentielle Integrität erzwingen
              </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">
            Abbrechen
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
