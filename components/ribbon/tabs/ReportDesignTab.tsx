
import React, { useState, useEffect } from 'react';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type, Palette, LayoutTemplate } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ReportDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const ReportDesignTab: React.FC<ReportDesignTabProps> = ({ onAction }) => {
  const [targetSection, setTargetSection] = useState<'header' | 'groupHeader' | 'columnHeader' | 'detail' | 'footer'>('detail');
  const { t } = useTranslation();
  
  // Helper to send style updates
  const updateStyle = (styleUpdate: any) => {
      onAction('report_update_style', { section: targetSection, style: styleUpdate });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Target Selection */}
      <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full justify-center w-48">
          <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">{t('ribbon.groups.target')}</label>
          <select 
            value={targetSection} 
            onChange={e => setTargetSection(e.target.value as any)}
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-blue-50 font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500"
          >
              <option value="header">Header</option>
              <option value="groupHeader">Group Header</option>
              <option value="columnHeader">Column Header</option>
              <option value="detail">Details</option>
              <option value="footer">Footer</option>
          </select>
      </div>

      {/* Font Settings */}
      <RibbonGroup label={t('ribbon.groups.font')}>
         <div className="flex flex-col gap-1">
             <div className="flex gap-1">
                 <select className="border rounded text-xs w-24 p-0.5" onChange={e => updateStyle({ fontFamily: e.target.value })}>
                     <option value="Arial">Arial</option>
                     <option value="Times New Roman">Times New Roman</option>
                     <option value="Courier New">Courier New</option>
                     <option value="Helvetica">Helvetica</option>
                 </select>
                 <select className="border rounded text-xs w-12 p-0.5" onChange={e => updateStyle({ fontSize: parseInt(e.target.value) })}>
                     {[8,9,10,11,12,14,16,18,20,24,32].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
             <div className="flex gap-1">
                 <button onClick={() => updateStyle({ bold: true })} className="p-1 hover:bg-slate-200 rounded" title="Bold"><Bold size={14}/></button>
                 <button onClick={() => updateStyle({ bold: false })} className="p-1 hover:bg-slate-200 rounded text-slate-400" title="Normal"><Bold size={14} strokeWidth={1}/></button>
                 <div className="w-px bg-slate-300 h-4 mx-1"></div>
                 <button onClick={() => updateStyle({ italic: true })} className="p-1 hover:bg-slate-200 rounded" title="Italic"><Italic size={14}/></button>
             </div>
         </div>
      </RibbonGroup>

      {/* Colors */}
      <RibbonGroup label={t('ribbon.groups.colors')}>
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2" title="Text Color">
                  <Type size={14} className="text-slate-600"/>
                  <input type="color" className="w-6 h-6 border-0 p-0 rounded cursor-pointer" onChange={e => updateStyle({ color: e.target.value })} />
              </div>
              <div className="flex items-center gap-2" title="Background Color">
                  <Palette size={14} className="text-slate-600"/>
                  <input type="color" className="w-6 h-6 border-0 p-0 rounded cursor-pointer" value="#ffffff" onChange={e => updateStyle({ backgroundColor: e.target.value })} />
              </div>
          </div>
      </RibbonGroup>

      {/* Alignment */}
      <RibbonGroup label={t('ribbon.groups.alignment')}>
          <div className="flex gap-1 bg-slate-100 rounded p-1 border border-slate-200">
              <button onClick={() => updateStyle({ align: 'left' })} className="p-1 hover:bg-white rounded hover:shadow-sm"><AlignLeft size={16}/></button>
              <button onClick={() => updateStyle({ align: 'center' })} className="p-1 hover:bg-white rounded hover:shadow-sm"><AlignCenter size={16}/></button>
              <button onClick={() => updateStyle({ align: 'right' })} className="p-1 hover:bg-white rounded hover:shadow-sm"><AlignRight size={16}/></button>
          </div>
      </RibbonGroup>
      
      {/* Borders/Layout */}
      <RibbonGroup label={t('ribbon.groups.layout')} isLast>
          <div className="flex flex-col gap-1">
             <label className="flex items-center gap-2 text-xs cursor-pointer">
                 <input type="checkbox" onChange={e => updateStyle({ borderBottom: e.target.checked })} />
                 <span>Border Bottom</span>
             </label>
          </div>
      </RibbonGroup>
    </div>
  );
};
