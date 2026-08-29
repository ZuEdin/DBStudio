import React, { useState } from 'react';
import { FreeformCanvasElement } from '../../../types';
import { 
  Layers, 
  Trash2, 
  Plus, 
  Move, 
  Image as ImageIcon, 
  Type, 
  Box, 
  Minus, 
  QrCode, 
  Barcode, 
  Stamp, 
  RotateCw, 
  CheckCircle2,
  Sparkles,
  Eye
} from 'lucide-react';

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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const sectionElements = elements.filter((el) => el.section === section);

  const handleAddElement = (type: FreeformCanvasElement['type']) => {
    let defaultContent = '';
    let defaultWidth = 50;
    let defaultHeight = 15;

    switch (type) {
      case 'label':
        defaultContent = 'Freitext Label';
        defaultWidth = 60;
        defaultHeight = 10;
        break;
      case 'barcode':
        defaultContent = 'ART-994021';
        defaultWidth = 55;
        defaultHeight = 18;
        break;
      case 'qrcode':
        defaultContent = 'https://meine-baustelle.de/doc/402';
        defaultWidth = 25;
        defaultHeight = 25;
        break;
      case 'stamp':
        defaultContent = 'GEPRÜFT & FREIGEGEBEN';
        defaultWidth = 65;
        defaultHeight = 22;
        break;
      case 'signature':
        defaultContent = 'Bauleiter / Auftragnehmer';
        defaultWidth = 70;
        defaultHeight = 25;
        break;
      case 'box':
        defaultContent = '';
        defaultWidth = 80;
        defaultHeight = 30;
        break;
      case 'line':
        defaultContent = '';
        defaultWidth = 180;
        defaultHeight = 2;
        break;
      case 'formula':
        defaultContent = '=SUM(Gesamtpreis)';
        defaultWidth = 60;
        defaultHeight = 10;
        break;
    }

    const newEl: FreeformCanvasElement = {
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      section,
      x: 10,
      y: 10,
      width: defaultWidth,
      height: defaultHeight,
      content: defaultContent,
      style: { fontSize: type === 'stamp' ? 12 : 10, bold: type === 'stamp', color: type === 'stamp' ? '#dc2626' : '#1e293b' },
      borderColor: type === 'stamp' ? '#dc2626' : '#cbd5e1',
      borderWidth: type === 'box' || type === 'line' || type === 'stamp' ? (type === 'stamp' ? 2 : 1) : 0,
      backgroundColor: type === 'box' ? '#f8fafc' : type === 'stamp' ? '#fef2f2' : 'transparent',
      rotation: 0,
      barcodeFormat: type === 'barcode' ? 'CODE128' : type === 'qrcode' ? 'QR' : undefined,
    };
    
    onChangeElements([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleUpdateElement = (id: string, updates: Partial<FreeformCanvasElement>) => {
    onChangeElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleRemoveElement = (id: string) => {
    onChangeElements(elements.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-slate-100 p-2.5 rounded-lg border border-slate-200 gap-2">
        <div>
          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Move size={14} className="text-indigo-600" /> Freiform-Canvas ({sectionElements.length} Elemente)
          </span>
          <span className="text-[10px] text-slate-500 block">Sektion: <strong>{section}</strong> (DIN A4 Raster in mm)</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleAddElement('label')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Textfeld hinzufügen"
          >
            <Type size={12} /> +Text
          </button>
          <button
            onClick={() => handleAddElement('barcode')}
            className="p-1.5 bg-white border border-indigo-300 rounded hover:bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Barcode hinzufügen"
          >
            <Barcode size={12} /> +Barcode
          </button>
          <button
            onClick={() => handleAddElement('qrcode')}
            className="p-1.5 bg-white border border-indigo-300 rounded hover:bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="QR-Code hinzufügen"
          >
            <QrCode size={12} /> +QR-Code
          </button>
          <button
            onClick={() => handleAddElement('stamp')}
            className="p-1.5 bg-white border border-rose-300 rounded hover:bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Prüfstempel hinzufügen"
          >
            <Stamp size={12} /> +Stempel
          </button>
          <button
            onClick={() => handleAddElement('signature')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Unterschriftsfeld hinzufügen"
          >
            <Layers size={12} /> +Signatur
          </button>
          <button
            onClick={() => handleAddElement('box')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Rahmen/Box hinzufügen"
          >
            <Box size={12} /> +Box
          </button>
          <button
            onClick={() => handleAddElement('line')}
            className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            title="Trennlinie hinzufügen"
          >
            <Minus size={12} /> +Linie
          </button>
        </div>
      </div>

      {/* Visual Canvas Sandbox (Mini DIN A4 Preview) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
          <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Eye size={13} /> Visuelle Vorschau ({section})
          </span>
          <span className="text-[10px] text-slate-400">1 mm ≈ 1.8 px • Klick auf Element zum Bearbeiten</span>
        </div>

        <div className="relative w-full h-44 bg-white rounded-lg border-2 border-slate-400 overflow-hidden shadow-inner select-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {sectionElements.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <Move size={20} className="text-slate-300" />
              <span>Keine Freiform-Elemente in {section}.</span>
              <span className="text-[10px] text-slate-400">Klicken Sie oben auf +Barcode, +QR-Code, +Stempel oder +Text.</span>
            </div>
          ) : (
            sectionElements.map((el) => {
              const isSelected = selectedElementId === el.id;
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  style={{
                    left: `${Math.min(el.x * 1.8, 480)}px`,
                    top: `${Math.min(el.y * 1.8, 120)}px`,
                    width: `${Math.max(el.width * 1.8, 20)}px`,
                    height: `${Math.max(el.height * 1.8, 14)}px`,
                    borderColor: isSelected ? '#4f46e5' : el.borderColor || '#cbd5e1',
                    borderWidth: isSelected ? '2px' : `${el.borderWidth ?? 1}px`,
                    backgroundColor: el.backgroundColor || 'transparent',
                    color: el.style?.color || '#1e293b',
                    fontSize: `${Math.max((el.style?.fontSize || 10) * 0.9, 9)}px`,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  }}
                  className={`absolute rounded flex items-center justify-center p-1 cursor-pointer transition-all border shadow-2xs overflow-hidden ${
                    isSelected ? 'ring-2 ring-indigo-400 ring-offset-1 z-20 font-bold' : 'z-10'
                  }`}
                >
                  {el.type === 'barcode' && (
                    <div className="flex flex-col items-center justify-center w-full h-full text-[9px] font-mono leading-none">
                      <div className="w-full h-2.5 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]" />
                      <span className="truncate mt-0.5 text-[8px]">{el.content}</span>
                    </div>
                  )}
                  {el.type === 'qrcode' && (
                    <div className="flex flex-col items-center justify-center w-full h-full text-[8px] bg-slate-100 border border-slate-300">
                      <QrCode size={16} className="text-slate-800" />
                      <span className="text-[7px] text-slate-500 truncate max-w-full">QR</span>
                    </div>
                  )}
                  {el.type === 'stamp' && (
                    <div className="border-2 border-dashed border-red-600 text-red-600 font-black text-[9px] uppercase px-1 py-0.5 rounded tracking-wider text-center">
                      {el.content || 'GEPRÜFT'}
                    </div>
                  )}
                  {el.type === 'signature' && (
                    <div className="w-full text-center border-t border-slate-500 pt-0.5 text-[8px] text-slate-600">
                      ✍️ {el.content}
                    </div>
                  )}
                  {el.type === 'label' && (
                    <span className="truncate w-full text-center">{el.content}</span>
                  )}
                  {el.type === 'formula' && (
                    <span className="truncate w-full font-mono text-[9px] text-emerald-700">{el.content}</span>
                  )}
                  {el.type === 'box' && (
                    <span className="text-[8px] text-slate-400">Box</span>
                  )}
                  {el.type === 'line' && (
                    <div className="w-full h-0.5 bg-slate-700" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Property Inspector List */}
      {sectionElements.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sectionElements.map((el) => {
            const isSelected = selectedElementId === el.id;
            return (
              <div
                key={el.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected 
                    ? 'bg-indigo-50/70 border-indigo-400 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {el.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                      {el.content || `(${el.type})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Rotation Toggle */}
                    <button
                      onClick={() => handleUpdateElement(el.id, { rotation: ((el.rotation || 0) + 90) % 360 })}
                      className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-slate-100"
                      title="Um 90 Grad drehen"
                    >
                      <RotateCw size={13} />
                    </button>
                    <button
                      onClick={() => handleRemoveElement(el.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                      title="Element löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Coordinates & Dimensions */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-slate-600">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">X (mm)</label>
                    <input
                      type="number"
                      value={el.x}
                      onChange={(e) => handleUpdateElement(el.id, { x: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Y (mm)</label>
                    <input
                      type="number"
                      value={el.y}
                      onChange={(e) => handleUpdateElement(el.id, { y: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Breite (mm)</label>
                    <input
                      type="number"
                      value={el.width}
                      onChange={(e) => handleUpdateElement(el.id, { width: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Höhe (mm)</label>
                    <input
                      type="number"
                      value={el.height}
                      onChange={(e) => handleUpdateElement(el.id, { height: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Content Input & Format Selection */}
                <div className="pt-2 flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                      {el.type === 'barcode' || el.type === 'qrcode' ? 'Code-Inhalt / URL / ID' : 'Text / Inhalt'}
                    </label>
                    <input
                      type="text"
                      value={el.content}
                      onChange={(e) => handleUpdateElement(el.id, { content: e.target.value })}
                      placeholder="Inhalt..."
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-medium bg-white"
                    />
                  </div>

                  {el.type === 'barcode' && (
                    <div className="w-28 shrink-0">
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Barcode-Typ</label>
                      <select
                        value={el.barcodeFormat || 'CODE128'}
                        onChange={(e) => handleUpdateElement(el.id, { barcodeFormat: e.target.value as any })}
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs bg-white"
                      >
                        <option value="CODE128">Code 128</option>
                        <option value="EAN13">EAN-13</option>
                        <option value="DATAMATRIX">DataMatrix</option>
                      </select>
                    </div>
                  )}

                  {el.type === 'stamp' && (
                    <div className="w-36 shrink-0">
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Stempel-Farbe</label>
                      <div className="flex gap-1">
                        {['#dc2626', '#16a34a', '#2563eb', '#d97706'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateElement(el.id, { 
                              borderColor: color, 
                              style: { ...el.style, color, bold: true },
                              backgroundColor: color === '#dc2626' ? '#fef2f2' : color === '#16a34a' ? '#f0fdf4' : '#eff6ff'
                            })}
                            style={{ backgroundColor: color }}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
