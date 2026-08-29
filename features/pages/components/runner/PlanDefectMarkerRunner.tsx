import React, { useState } from 'react';
import { MapPin, AlertTriangle, Plus, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface DefectPin {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

const INITIAL_DEFECTS: DefectPin[] = [
  { id: 'def_1', x: 28, y: 35, title: 'Rissbildung Estrich EG Flur', severity: 'HIGH', status: 'OPEN' },
  { id: 'def_2', x: 62, y: 55, title: 'Fehlende Brandschottung T90', severity: 'HIGH', status: 'IN_PROGRESS' },
  { id: 'def_3', x: 45, y: 78, title: 'Kratzer an Fensterrahmen W-04', severity: 'LOW', status: 'OPEN' },
];

export const PlanDefectMarkerRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const [pins, setPins] = useState<DefectPin[]>(INITIAL_DEFECTS);
  const [activePinId, setActivePinId] = useState<string | null>('def_1');

  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPin: DefectPin = {
      id: 'def_' + Date.now(),
      x,
      y,
      title: 'Neuer Mangelpunkt',
      severity: 'MEDIUM',
      status: 'OPEN',
    };
    setPins([...pins, newPin]);
    setActivePinId(newPin.id);
  };

  const selected = pins.find((p) => p.id === activePinId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-3 flex flex-col md:flex-row">
      {/* Plan Canvas (Left) */}
      <div className="flex-1 p-3 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center relative min-h-[300px]">
        <div
          onClick={handlePlanClick}
          className="relative w-full max-w-lg aspect-4/3 bg-slate-200 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center"
        >
          {/* Blueprint grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono z-10">
            Klick auf Plan setzt Mangel-Marker (Pin)
          </div>

          {/* Render Pins */}
          {pins.map((pin, idx) => (
            <div
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                setActivePinId(pin.id);
              }}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md cursor-pointer transition-transform hover:scale-125 z-20 ${
                pin.id === activePinId ? 'ring-2 ring-white scale-125 bg-indigo-600' : pin.severity === 'HIGH' ? 'bg-rose-600' : 'bg-amber-500'
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Details List (Right) */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-3 flex flex-col bg-white dark:bg-slate-900">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span>Erfasste Plan-Mängel ({pins.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-2 space-y-1">
          {pins.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => setActivePinId(p.id)}
              className={`p-2 rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between ${
                p.id === activePinId ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="truncate max-w-[150px]">{p.title}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                p.severity === 'HIGH' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
              }`}>
                {p.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
