import React, { useState } from 'react';
import { Image as ImageIcon, MapPin, Plus, Trash2, AlertTriangle, CheckCircle2, Upload, Eye } from 'lucide-react';

export interface PlanMarker {
  id: string;
  x: number; // in percent (0-100)
  y: number; // in percent (0-100)
  note: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
}

export interface BlueprintPhotoData {
  imageUrl: string;
  markers: PlanMarker[];
}

interface BlueprintPhotoMarkerWidgetProps {
  id: string;
  label?: string;
  value?: string | BlueprintPhotoData;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
}

export const BlueprintPhotoMarkerWidget: React.FC<BlueprintPhotoMarkerWidgetProps> = ({
  id,
  label = 'Bauplan & Fotomarker',
  value,
  isReadOnly = false,
  onChange,
}) => {
  const parsedData: BlueprintPhotoData = typeof value === 'string' && value.startsWith('{')
    ? (() => {
        try {
          return JSON.parse(value);
        } catch {
          return { imageUrl: '', markers: [] };
        }
      })()
    : typeof value === 'object' && value !== null
    ? (value as BlueprintPhotoData)
    : {
        imageUrl: typeof value === 'string' ? value : '',
        markers: [],
      };

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newCategory, setNewCategory] = useState('Mangel');

  const defaultSampleBlueprint = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80';
  const currentImage = parsedData.imageUrl || defaultSampleBlueprint;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: PlanMarker = {
      id: 'm_' + Date.now(),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      note: newNote || `Mangel/Notiz an Position (${Math.round(x)}%, ${Math.round(y)}%)`,
      severity: newSeverity,
      category: newCategory,
      createdAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = {
      ...parsedData,
      imageUrl: currentImage,
      markers: [...parsedData.markers, newMarker],
    };
    setActiveMarkerId(newMarker.id);
    setNewNote('');
    onChange(JSON.stringify(updated));
  };

  const handleDeleteMarker = (markerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const updated = {
      ...parsedData,
      markers: parsedData.markers.filter((m) => m.id !== markerId),
    };
    if (activeMarkerId === markerId) setActiveMarkerId(null);
    onChange(JSON.stringify(updated));
  };

  const getSeverityBadge = (sev: PlanMarker['severity']) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">
            {parsedData.markers.length} Pins
          </span>
        </div>
      </div>

      {/* Editor Controls */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs">
          <input
            type="text"
            placeholder="Neuer Marker-Text..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 min-w-[150px] px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="Mangel">⚠️ Mangel</option>
            <option value="Restarbeit">🔨 Restarbeit</option>
            <option value="Prüfpunkt">📋 Prüfpunkt</option>
            <option value="Freigabe">✅ Freigabe</option>
          </select>
          <select
            value={newSeverity}
            onChange={(e) => setNewSeverity(e.target.value as any)}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
          <span className="text-[11px] text-slate-500 italic">👉 Klicke in den Plan zum Setzen</span>
        </div>
      )}

      {/* Interactive Blueprint Canvas */}
      <div
        onClick={handleImageClick}
        className="relative w-full h-[240px] rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 cursor-crosshair group select-none"
      >
        <img
          src={currentImage}
          alt="Bauplan"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />

        {/* Render Markers */}
        {parsedData.markers.map((marker, index) => (
          <div
            key={marker.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMarkerId(marker.id);
            }}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 hover:scale-125 z-10`}
          >
            <div className={`flex items-center justify-center w-6 h-6 rounded-full shadow-lg border-2 border-white font-bold text-[10px] ${getSeverityBadge(marker.severity)}`}>
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Marker List & Details */}
      {parsedData.markers.length > 0 && (
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {parsedData.markers.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => setActiveMarkerId(m.id)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                activeMarkerId === m.id
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getSeverityBadge(m.severity)}`}>
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  [{m.category}] {m.note}
                </span>
                <span className="text-[10px] text-slate-400">({m.x}%, {m.y}%)</span>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteMarker(m.id, e)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
