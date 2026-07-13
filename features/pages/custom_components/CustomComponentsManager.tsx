import React, { useState } from 'react';
import { Box, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

export const CustomComponentsManager: React.FC = () => {
  const { customComponents = [], setCustomComponents, saveProject } = useProjectStore();
  const ui = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Möchten Sie diese Custom Component wirklich löschen?')) {
      const nextComps = customComponents.filter(c => c.id !== id);
      setCustomComponents(nextComps);
      ui.addToast('Komponente erfolgreich gelöscht.', 'success');
      await saveProject();
    }
  };

  const handleEdit = (id: string) => {
    ui.setCurrentView({ type: 'custom_component_designer', componentId: id });
  };

  const handleCreateNew = () => {
    ui.setCurrentView({ type: 'custom_component_designer' });
  };

  const filteredComponents = customComponents.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden p-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Box className="text-blue-500" size={28} />
              <span>Meine Custom Components (SDUI)</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verwalten Sie Ihre datengetriebenen UI-Komponenten für den Page Builder.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Komponenten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white w-full sm:w-64"
              />
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus size={16} />
              <span>Erstellen</span>
            </button>
          </div>
        </div>

        {/* Components Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center">
              <Box size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Keine Custom Components gefunden</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                {searchTerm ? 'Es gibt keine Komponenten, die Ihrer Suche entsprechen.' : 'Erstellen Sie Ihre erste Server-Driven UI-Komponente, um sie in Ihren Webseiten einzubetten.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  <Plus size={16} />
                  <span>Jetzt erstellen</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComponents.map((comp) => {
                const keysCount = Object.keys(comp.configuration || {}).length;
                return (
                  <div 
                    key={comp.id} 
                    onClick={() => handleEdit(comp.id)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {comp.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">
                          {comp.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                        {comp.description || 'Keine Beschreibung hinterlegt.'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3 flex justify-between items-center shrink-0">
                      <div className="text-xs text-slate-400 font-mono">
                        {keysCount} Parameter
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(comp.id); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Bearbeiten"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(comp.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
