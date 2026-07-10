import React, { useState, useEffect } from 'react';
import { CustomPage, PageComponent, PageComponentType } from '../../types/index';
import { LayoutTemplate, Trash2, Layers } from 'lucide-react';
import { ComponentToolbox } from './components/ComponentToolbox';
import { RenderNode } from './components/RenderNode';
import { PropertiesPanel } from './components/PropertiesPanel';
import { 
  findNodeAndAdd, 
  findNodeAndUpdateProps, 
  findNodeAndDelete, 
  findNode 
} from './utils/treeUtils';

interface PageDesignerProps {
  page: CustomPage;
  onPageChange: (page: CustomPage) => void;
  onSetView: (v: any) => void;
}

export const PageDesigner: React.FC<PageDesignerProps> = ({ page, onPageChange, onSetView }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDropElement = (e: React.DragEvent, parentId: string) => {
      let type = e.dataTransfer.getData('componentType') as PageComponentType;
      if (!type) {
          type = e.dataTransfer.getData('text/plain') as PageComponentType;
      }
      if (!type) return;

      const templateText = e.dataTransfer.getData('templateText');
      const dataSourceType = e.dataTransfer.getData('dataSourceType');
      const dataSourceId = e.dataTransfer.getData('dataSourceId');
      const columns = e.dataTransfer.getData('columns');

      const newNode: PageComponent = {
          id: 'node_' + crypto.randomUUID(),
          type,
          props: {},
          children: (type === 'container' || type === 'list_repeater' || type === 'row' || type === 'column' || type === 'card') ? [] : undefined
      };

      if (type === 'text') newNode.props.text = templateText || 'New Text Block';
      if (type === 'button') newNode.props.label = 'Button';
      
      if (dataSourceType && dataSourceId) {
          newNode.props.dataSourceType = dataSourceType;
          newNode.props.dataSourceId = dataSourceId;
          if (columns) {
              newNode.props.columns = columns;
          }
      }

      const newLayout = findNodeAndAdd(page.layout, parentId, newNode);
      onPageChange({ ...page, layout: newLayout });
      setSelectedNodeId(newNode.id);
  };

  const selectedNode = selectedNodeId ? findNode(page.layout, selectedNodeId) : null;

  const updateSelectedNodeProps = (newProps: any) => {
      if (!selectedNodeId) return;
      const newLayout = findNodeAndUpdateProps(page.layout, selectedNodeId, newProps);
      onPageChange({ ...page, layout: newLayout });
  };

  const deleteSelectedNode = () => {
      if (!selectedNodeId || selectedNodeId === 'root') return;
      const newLayout = findNodeAndDelete(page.layout, selectedNodeId);
      if (newLayout) {
          onPageChange({ ...page, layout: newLayout });
          setSelectedNodeId(null);
      }
      setShowDeleteConfirm(false);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                  return;
              }
              if (selectedNodeId && selectedNodeId !== 'root') {
                  setShowDeleteConfirm(true);
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans relative">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Trash2 className="text-red-500" size={20} />
                    Element löschen
                </h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Möchten Sie dieses Element wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        Nein, abbrechen
                    </button>
                    <button 
                        onClick={deleteSelectedNode}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
                    >
                        Ja, löschen
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <div className="bg-white border-b border-slate-300 p-2 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <LayoutTemplate size={18} />
            Page Designer
          </div>
          <div className="w-[1px] h-6 bg-slate-300 mx-2"></div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seitenname</label>
            <input 
              type="text" 
              value={page.name} 
              onChange={e => onPageChange({ ...page, name: e.target.value })}
              className="px-2 py-1 border border-slate-300 rounded text-sm w-64 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2 self-end pb-1 ml-4 select-none">
            <input 
              type="checkbox"
              id="isSubpageCheckbox"
              checked={!!page.isSubpage}
              onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
            />
            <label htmlFor="isSubpageCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
              <Layers size={13} className="text-emerald-600"/> Als Unterseite (Sub-Page) markieren
            </label>
            <span className="text-[10px] text-slate-400">
              (In Navigation ausblenden)
            </span>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onSetView({ type: 'page_view', pageId: page.id })} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"><LayoutTemplate size={14}/> Vorschau</button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Components and Data Fields */}
        <ComponentToolbox />

        {/* Center: Canvas */}
        <div className="flex-1 p-8 overflow-auto flex justify-center bg-slate-50 relative" onClick={() => setSelectedNodeId(null)}>
           <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           <div className="w-full max-w-[95%] relative z-10 flex flex-col items-center">
             <RenderNode 
                node={page.layout} 
                selectedNodeId={selectedNodeId} 
                onSelect={(id) => setSelectedNodeId(id)}
                onDrop={handleDropElement}
             />
           </div>
        </div>

        {/* Right Sidebar: Properties and Page Configuration */}
        <PropertiesPanel 
          page={page}
          onPageChange={onPageChange}
          selectedNodeId={selectedNodeId}
          selectedNode={selectedNode}
          updateSelectedNodeProps={updateSelectedNodeProps}
          setShowDeleteConfirm={setShowDeleteConfirm}
        />
      </div>
    </div>
  );
};
