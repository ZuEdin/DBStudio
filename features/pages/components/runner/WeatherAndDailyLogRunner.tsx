import React, { useState } from 'react';
import { Sun, CloudRain, Users, Truck, Plus, Trash2, Calendar, Thermometer, Wind } from 'lucide-react';

export const WeatherAndDailyLogRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const [temperature, setTemperature] = useState<number>(18);
  const [weather, setWeather] = useState<'SUNNY' | 'RAIN' | 'CLOUDY' | 'FROST'>('SUNNY');
  const [wind, setWind] = useState<string>('Leichte Brise (2 Bft)');
  const [workers, setWorkers] = useState<{ id: string; trade: string; count: number; hours: number }[]>([
    { id: 'w1', trade: 'Maurer / Betonbauer', count: 4, hours: 8 },
    { id: 'w2', trade: 'Zimmerer', count: 2, hours: 8 },
    { id: 'w3', trade: 'Kranführer', count: 1, hours: 8 },
  ]);

  const totalHours = workers.reduce((acc, curr) => acc + curr.count * curr.hours, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-3">
      {/* Header */}
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-white">
            <Sun size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold">{props.title || 'Bautagesbericht & Wetter-Widget'}</h3>
            <p className="text-[10px] text-slate-400">Witterung, Kolonnenanwesenheit & Geräteerfassung</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">{totalHours} Mannstunden</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1">
            <Thermometer size={13} className="text-amber-500" /> Witterung & Temperatur
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Temperatur:</span>
            <div className="flex items-center gap-1 font-bold text-sm">
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-12 bg-white dark:bg-slate-900 border rounded px-1.5 py-0.5 text-center text-xs"
              />
              <span>°C</span>
            </div>
          </div>
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={() => setWeather('SUNNY')}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1 border ${
                weather === 'SUNNY' ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-bold' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <Sun size={12} /> Sonnig
            </button>
            <button
              onClick={() => setWeather('RAIN')}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1 border ${
                weather === 'RAIN' ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <CloudRain size={12} /> Regen
            </button>
          </div>
        </div>

        {/* Kolonnen Box */}
        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1"><Users size={13} className="text-indigo-500" /> Anwesende Kolonnen</span>
          </div>
          <div className="space-y-1 text-xs">
            {workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                <span className="font-medium text-slate-800 dark:text-slate-200">{w.trade}</span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-500">{w.count} Facharbeiter</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{w.count * w.hours} h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
