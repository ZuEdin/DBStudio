import React from 'react';
import { PageComponentType, SelectQuery } from '../../../types/index';
import { 
  Square, Columns, Rows, CreditCard, LayoutTemplate, Layers, 
  Type, MousePointerClick, List, Table2, Layout, Image as ImageIcon 
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';

export const ComponentToolbox: React.FC = () => {
  const { queries, tables } = useProjectStore();

  const handleDragStart = (e: React.DragEvent, type: PageComponentType) => {
      e.dataTransfer.setData('componentType', type);
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-300 flex flex-col p-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto shrink-0">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Komponenten</h3>
      
      <div className="space-y-2">
         <div draggable onDragStart={(e) => handleDragStart(e, 'container')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Square size={16} className="text-blue-500"/> Container
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'row')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Columns size={16} className="text-blue-500"/> Row Layout
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'column')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Rows size={16} className="text-blue-500"/> Column Layout
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'card')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <CreditCard size={16} className="text-blue-500"/> Card
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'list_repeater')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-indigo-50 text-sm text-indigo-700 font-semibold active:cursor-grabbing border-indigo-100 bg-indigo-50/20">
             <LayoutTemplate size={16} className="text-indigo-600"/> List Repeater (Loop)
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'subpage_container')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-emerald-50 text-sm text-emerald-700 font-semibold active:cursor-grabbing border-emerald-100 bg-emerald-50/20">
             <Layers size={16} className="text-emerald-600"/> Unterseite (Sub-Page)
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'text')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Type size={16} className="text-slate-500"/> Text Block
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'button')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <MousePointerClick size={16} className="text-indigo-500"/> Button
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'dropdown')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <List size={16} className="text-orange-500"/> Dropdown Menu
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'table_view')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Table2 size={16} className="text-emerald-500"/> Daten-Tabelle
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'form_view')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <Layout size={16} className="text-blue-500"/> Formular (Embedded)
         </div>
         <div draggable onDragStart={(e) => handleDragStart(e, 'image')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
             <ImageIcon size={16} className="text-purple-500"/> Bild / Medien
         </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Datenfelder</h3>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Ziehen Sie ein Feld auf die Seite, um es als Textblock mit Datenbindung anzuzeigen.</p>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {/* Tables */}
              {tables.length > 0 && (
                  <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tabellen</div>
                      <div className="space-y-2">
                          {tables.map(t => (
                              <div key={t.id} className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                  <div 
                                       draggable
                                       onDragStart={e => {
                                           e.dataTransfer.setData('componentType', 'table_view');
                                           e.dataTransfer.setData('dataSourceType', 'table');
                                           e.dataTransfer.setData('dataSourceId', t.id);
                                           e.dataTransfer.setData('columns', t.fields.map(f => f.name).join(','));
                                           e.dataTransfer.effectAllowed = 'copy';
                                       }}
                                       className="text-xs font-semibold text-slate-700 mb-1.5 truncate bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded p-1 px-2 cursor-grab flex items-center justify-between transition-all"
                                       title="Ziehen, um eine Daten-Tabelle für diese Tabelle zu erstellen"
                                   >
                                       <span className="truncate">{t.name}</span>
                                       <span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 rounded uppercase">Drag Tab</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1">
                                      {t.fields.map(f => (
                                          <div 
                                              key={f.id}
                                              draggable
                                              onDragStart={e => {
                                                  e.dataTransfer.setData('componentType', 'text');
                                                  e.dataTransfer.setData('templateText', `{{${f.name}}}`);
                                                  e.dataTransfer.effectAllowed = 'copy';
                                              }}
                                              className="bg-white border border-slate-200 rounded p-1 px-2 text-[11px] text-slate-600 cursor-grab hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-between"
                                              title={`Ziehen um {{${f.name}}} einzufügen`}
                                          >
                                              <span className="truncate">{f.name}</span>
                                              <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 px-1 rounded uppercase scale-90">Drag</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Queries */}
              {queries.length > 0 && (
                  <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-2">Abfragen</div>
                      <div className="space-y-2">
                          {queries.map(q => (
                              <div key={q.id} className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                  <div 
                                       draggable
                                       onDragStart={e => {
                                           e.dataTransfer.setData('componentType', 'table_view');
                                           e.dataTransfer.setData('dataSourceType', 'query');
                                           e.dataTransfer.setData('dataSourceId', q.id);
                                           if (q.type === 'SELECT') {
                                               e.dataTransfer.setData('columns', (q as SelectQuery).columns.map(c => c.alias || c.fieldName).join(','));
                                           }
                                           e.dataTransfer.effectAllowed = 'copy';
                                       }}
                                       className="text-xs font-semibold text-slate-700 mb-1.5 truncate bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded p-1 px-2 cursor-grab flex items-center justify-between transition-all"
                                       title="Ziehen, um eine Daten-Tabelle für diese Abfrage zu erstellen"
                                   >
                                       <span className="truncate">{q.name}</span>
                                       <span className="text-[8px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1 rounded uppercase">Drag Abg</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1">
                                      {q.type === 'SELECT' && (q as SelectQuery).columns.map(c => {
                                          const name = c.alias || c.fieldName;
                                          return (
                                              <div 
                                                  key={c.id}
                                                  draggable
                                                  onDragStart={e => {
                                                      e.dataTransfer.setData('componentType', 'text');
                                                      e.dataTransfer.setData('templateText', `{{${name}}}`);
                                                      e.dataTransfer.effectAllowed = 'copy';
                                                  }}
                                                  className="bg-white border border-slate-200 rounded p-1 px-2 text-[11px] text-slate-600 cursor-grab hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-between"
                                                  title={`Ziehen um {{${name}}} einzufügen`}
                                              >
                                                  <span className="truncate">{name}</span>
                                                  <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 px-1 rounded scale-90">Drag</span>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
