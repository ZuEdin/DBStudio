import React, { useState } from 'react';
import { Table } from '../../types/index';
import { X, Link } from 'lucide-react';

interface LinkSubformModalProps {
  mainFormTable: Table;
  subFormTable: Table;
  onLink: (masterLinkFieldId: string, childLinkFieldId: string) => void;
  onClose: () => void;
}

export const LinkSubformModal: React.FC<LinkSubformModalProps> = ({ mainFormTable, subFormTable, onLink, onClose }) => {
  const [masterField, setMasterField] = useState(mainFormTable.fields[0]?.id || '');
  const [childField, setChildField] = useState(subFormTable.fields[0]?.id || '');

  const handleLink = () => {
    if (masterField && childField) {
      onLink(masterField, childField);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-300 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Link className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Unterformular verknüpfen</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">Wählen Sie die Felder aus, die das Hauptformular und das Unterformular miteinander verbinden.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Master-Feld von "{mainFormTable.name}"</label>
              <select value={masterField} onChange={e => setMasterField(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
                {mainFormTable.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Child-Feld von "{subFormTable.name}"</label>
              <select value={childField} onChange={e => setChildField(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
                {subFormTable.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleLink} disabled={!masterField || !childField} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Verknüpfen</button>
        </div>
      </div>
    </div>
  );
};
