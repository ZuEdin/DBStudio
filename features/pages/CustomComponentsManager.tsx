import React from 'react';
import { Box, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export const CustomComponentsManager: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Box className="text-blue-500" size={28} />
              <span>Meine Custom Components (SDUI)</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verwalten Sie Ihre datengetriebenen UI-Komponenten für den Page Builder.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Komponenten suchen..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">CustomerDataGrid</h3>
                <span className="text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">VirtualTable</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Datenraster für die Kundenübersicht mit aktiver Paginierung und Doppelklick-Event zum Öffnen des Detail-Modals.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 flex justify-between items-center">
              <div className="text-xs text-slate-400 font-mono">14 config keys</div>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                  <Edit2 size={14} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">RevenueChart</h3>
                <span className="text-[10px] uppercase font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">ChartWidget</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Balkendiagramm zur Darstellung des monatlichen Umsatzes basierend auf der Invoices-API.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 flex justify-between items-center">
              <div className="text-xs text-slate-400 font-mono">8 config keys</div>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                  <Edit2 size={14} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
