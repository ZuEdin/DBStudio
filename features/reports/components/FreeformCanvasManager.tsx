import React from 'react';
import { FreeformCanvasElement } from '../../../types';
import { Layers, Trash2, Plus, Move, Image as ImageIcon, Type, Box, Minus } from 'lucide-react';

interface FreeformCanvasProps {
  elements: FreeformCanvasElement[];
  onChangeElements: (elements: FreeformCanvasElement[]) => void;
  section: 'reportHeader' | 'pageHeader' | 'detail' | 'pageFooter' | 'reportFooter';
}

export const FreeformCanvasManager: React.FC<FreeformCanvasProps> = ({
  elements,
  onChangeElements,
  section,
}) => {
  const sectionElements = elements.filter((el) => el.section === section);

  const handleAddElement = (type: FreeformCanvasElement['type']) => {
    const newEl: FreeformCanvasElement = {
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      section,
      x: 10,
      y: 10,
      width: type === 'line' ? 180 : 60,
      height: type === 'line' ? 2 : 15,
      content:
        type === 'label'
          ? 'Freitext Label'
          : type === 'formula'
          ? '=SUM(Gesamtpreis)'
          : type === 'signature'
          ? 'Unterschrift Bauleiter'
          : '',
      style: { fontSize: 10, bold: false, color: '#1e293b' },
      borderColor: '#cbd5e1',
      borderWidth: type === 'box' || type === 'line' ? 1 : 0,
      backgroundColor: type === 'box' ? '#f8fafc' : 'transparent',
    };
    onChangeElements([...elements, newEl]);
  };

  const handleUpdateElement = (id: string, updates: Partial<FreeformCanvasElement>) => {
    onChangeElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleRemoveElement = (id: string) => {
    onChangeElements(elements.filter((el) => el.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded border border-slate-200">
        <div>
          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Move size={14} className="text-blue-600" /> Visuelle Freiform-Elemente ({sectionElements.length})
          </span>
          <span className="text-[10px] text-slate-500 block">Sektion: {section} (mm Koordinaten)</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleAddElement('label')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1"
            title="Textfeld hinzufügen"
          >
            <Type size={12} /> +Text
          </button>
          <button
            onClick={() => handleAddElement('box')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1"
            title="Rahmen/Box hinzufügen"
          >
            <Box size={12} /> +Box
          </button>
          <button
            onClick={() => handleAddElement('line')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1"
            title="Trennlinie hinzufügen"
          >
            <Minus size={12} /> +Linie
          </button>
          <button
            onClick={() => handleAddElement('signature')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1"
            title="Unterschriftsfeld hinzufügen"
          >
            <Layers size={12} /> +Signatur
          </button>
        </div>
      </div>

      {sectionElements.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded">
          Keine visuellen Freiform-Elemente in dieser Sektion. Klicken Sie oben auf +Text, +Box oder +Signatur.
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {sectionElements.map((el) => (
            <div
              key={el.id}
              className="p-2.5 bg-white border border-slate-200 rounded flex flex-col gap-2 text-xs shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {el.type}
                </span>
                <button
                  onClick={() => handleRemoveElement(el.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Element löschen"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Position and Size (mm) */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] text-slate-600">
                <div>
                  <label className="block text-[9px] text-slate-400">X (mm)</label>
                  <input
                    type="number"
                    value={el.x}
                    onChange={(e) => handleUpdateElement(el.id, { x: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400">Y (mm)</label>
                  <input
                    type="number"
                    value={el.y}
                    onChange={(e) => handleUpdateElement(el.id, { y: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400">B (mm)</label>
                  <input
                    type="number"
                    value={el.width}
                    onChange={(e) => handleUpdateElement(el.id, { width: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400">H (mm)</label>
                  <input
                    type="number"
                    value={el.height}
                    onChange={(e) => handleUpdateElement(el.id, { height: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5"
                  />
                </div>
              </div>

              {/* Content / Label */}
              <div>
                <input
                  type="text"
                  value={el.content}
                  onChange={(e) => handleUpdateElement(el.id, { content: e.target.value })}
                  placeholder="Inhalt oder Formel..."
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
