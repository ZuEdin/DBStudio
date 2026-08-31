
import React, { useState } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  LayoutTemplate,
  Shield,
  AlignJustify,
  FileCheck,
  Calculator,
  QrCode,
  FileCode,
  Printer,
  Mail,
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { Report } from '../../../types/index';
import { eventBus } from '../../../services/eventBus';

interface ReportDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const ReportDesignTab: React.FC<ReportDesignTabProps> = ({ onAction }) => {
  const [targetSection, setTargetSection] = useState<'header' | 'groupHeader' | 'columnHeader' | 'detail' | 'footer'>('detail');
  const { t } = useTranslation();
  
  const ui = useUIStore();
  const store = useProjectStore();
  const report = ui.activeObject as Report | null;
  const { tables, queries } = store;

  // Helper to send style updates
  const updateStyle = (styleUpdate: any) => {
      onAction('report_update_style', { section: targetSection, style: styleUpdate });
  };

  const updateReportSettings = (updates: Partial<Report>) => {
      onAction('report_update_settings', updates);
  };

  if (!report || !report.sourceId) {
      return (
          <div className="flex gap-4 h-full items-center text-slate-400 dark:text-slate-500 text-xs">
              Kein aktiver Bericht ausgewählt.
          </div>
      );
  }

  // Resolve sourceFields
  let sourceFields: any[] = [];
  if (report.sourceType === 'table') {
      const table = tables.find(t => t.id === report.sourceId);
      sourceFields = table?.fields || [];
  } else {
      const query = queries.find(q => q.id === report.sourceId);
      if (query && query.type === 'SELECT') {
           const fieldMap = new Map<string, any>();
           query.columns.forEach(col => {
              const table = tables.find(t => t.id === col.tableId);
              const field = table?.fields.find(f => f.id === col.fieldId);
              if (field && !fieldMap.has(field.id)) {
                  fieldMap.set(field.id, field);
              }
          });
          sourceFields = Array.from(fieldMap.values());
      }
  }

  return (
    <div className="flex gap-4 h-full items-center overflow-visible pb-1 max-w-full">
      {/* Target Selection */}
      <div className="flex flex-col px-2 border-r border-slate-300 dark:border-slate-700 pr-4 h-full justify-center w-40 shrink-0">
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase">{t('ribbon.groups.target')}</label>
          <select 
            value={targetSection} 
            onChange={e => setTargetSection(e.target.value as any)}
            className="w-full border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-950/70 font-semibold text-blue-900 dark:text-blue-200 focus:ring-1 focus:ring-blue-500"
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
         <div className="flex flex-col gap-1 justify-center h-full">
             <div className="flex gap-1">
                 <select className="border border-slate-300 dark:border-slate-700 rounded text-[10px] w-20 p-0.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" onChange={e => updateStyle({ fontFamily: e.target.value })}>
                     <option value="Arial">Arial</option>
                     <option value="Times New Roman">Times New Roman</option>
                     <option value="Courier New">Courier New</option>
                     <option value="Helvetica">Helvetica</option>
                 </select>
                 <select className="border border-slate-300 dark:border-slate-700 rounded text-[10px] w-10 p-0.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" onChange={e => updateStyle({ fontSize: parseInt(e.target.value) })}>
                     {[8,9,10,11,12,14,16,18,20,24,32].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
             <div className="flex gap-1 items-center justify-start text-slate-700 dark:text-slate-200">
                 <button onClick={() => updateStyle({ bold: true })} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer" title="Bold"><Bold size={12}/></button>
                 <button onClick={() => updateStyle({ bold: false })} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 cursor-pointer" title="Normal"><Bold size={12} strokeWidth={1}/></button>
                 <div className="w-px bg-slate-300 dark:bg-slate-700 h-3 mx-1"></div>
                 <button onClick={() => updateStyle({ italic: true })} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer" title="Italic"><Italic size={12}/></button>
             </div>
         </div>
      </RibbonGroup>

      {/* Colors */}
      <RibbonGroup label={t('ribbon.groups.colors')}>
          <div className="flex flex-col gap-1 justify-center h-full">
              <div className="flex items-center gap-1.5" title="Text Color">
                  <Type size={12} className="text-slate-600 dark:text-slate-300"/>
                  <input type="color" className="w-5 h-5 border border-slate-300 dark:border-slate-700 p-0 rounded cursor-pointer bg-transparent" onChange={e => updateStyle({ color: e.target.value })} />
              </div>
              <div className="flex items-center gap-1.5" title="Background Color">
                  <Palette size={12} className="text-slate-600 dark:text-slate-300"/>
                  <input type="color" className="w-5 h-5 border border-slate-300 dark:border-slate-700 p-0 rounded cursor-pointer bg-transparent" value="#ffffff" onChange={e => updateStyle({ backgroundColor: e.target.value })} />
              </div>
          </div>
      </RibbonGroup>

      {/* Alignment */}
      <RibbonGroup label={t('ribbon.groups.alignment')}>
          <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded p-0.5 border border-slate-200 dark:border-slate-700 items-center text-slate-700 dark:text-slate-200">
              <button onClick={() => updateStyle({ align: 'left' })} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded hover:shadow-sm cursor-pointer"><AlignLeft size={14}/></button>
              <button onClick={() => updateStyle({ align: 'center' })} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded hover:shadow-sm cursor-pointer"><AlignCenter size={14}/></button>
              <button onClick={() => updateStyle({ align: 'right' })} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded hover:shadow-sm cursor-pointer"><AlignRight size={14}/></button>
          </div>
      </RibbonGroup>
      
      {/* Borders/Layout */}
      <RibbonGroup label={t('ribbon.groups.layout')}>
          <div className="flex flex-col gap-1 justify-center h-full text-slate-700 dark:text-slate-200">
             <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                 <input type="checkbox" onChange={e => updateStyle({ borderBottom: e.target.checked })} className="scale-90" />
                 <span>Border Bottom</span>
              </label>
          </div>
      </RibbonGroup>

      {/* Gruppierung */}
      <RibbonGroup label="Gruppierung">
         <div className="flex flex-col gap-1 justify-center w-36 h-full">
             <select 
                 value={report.groupingFieldId || ''} 
                 onChange={e => updateReportSettings({ groupingFieldId: e.target.value || undefined })} 
                 className="w-full border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
             >
                 <option value="">(Keine Gruppierung)</option>
                 {sourceFields.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
             </select>
             {report.groupingFieldId && (
                 <div className="flex gap-1.5 items-center justify-between">
                     <select 
                         value={report.settings?.groupMethod || 'full'} 
                         onChange={e => updateReportSettings({ settings: { ...(report.settings || {}), groupMethod: e.target.value as any } })} 
                         className="border border-slate-300 dark:border-slate-700 rounded p-0.5 text-[9px] w-18 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                     >
                         <option value="full">Vollständig</option>
                         <option value="firstLetter">1. Buchstabe</option>
                     </select>
                     <label className="flex items-center gap-1 cursor-pointer text-[9px] select-none text-slate-600 dark:text-slate-300 truncate">
                         <input 
                             type="checkbox" 
                             checked={report.settings?.pageBreakAfterGroup || false} 
                             onChange={e => updateReportSettings({ settings: { ...(report.settings || {}), pageBreakAfterGroup: e.target.checked } })} 
                             className="rounded border-slate-300 dark:border-slate-600 text-blue-600 scale-75" 
                         />
                         <span>Umbruch</span>
                     </label>
                 </div>
             )}
         </div>
      </RibbonGroup>

      {/* Layout & Druck */}
      <RibbonGroup label="Layout & Druck">
         <div className="flex flex-col gap-1 justify-center w-28 h-full">
             <select 
                 value={report.settings?.orientation || 'portrait'} 
                 onChange={e => updateReportSettings({ settings: { ...(report.settings || {}), orientation: e.target.value as any } })} 
                 className="w-full border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
             >
                 <option value="portrait">Hochformat (Portrait)</option>
                 <option value="landscape">Querformat (Landscape)</option>
             </select>
         </div>
      </RibbonGroup>

      {/* DIN 5008 & VOB/B Engine */}
      <RibbonGroup label="Baugewerbe & Normen">
         <div className="flex flex-col gap-1 justify-center h-full text-[10px]">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={report.settings?.din5008?.enabled || false}
                  onChange={e => updateReportSettings({
                    settings: {
                      ...(report.settings || {}),
                      din5008: {
                        formType: 'FormA',
                        senderLine: 'Musterbau GmbH • Baustr. 1 • 10115 Berlin',
                        recipientAddress: 'Bauherr GmbH\nMax-Muster-Str. 4\n80331 München',
                        infoblock: { date: new Date().toLocaleDateString('de-DE') },
                        threeColumnFooter: {},
                        ...(report.settings?.din5008 || {}),
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="scale-90 rounded border-slate-300 dark:border-slate-600 text-blue-600"
                />
                <FileCheck size={12} className="text-blue-600 dark:text-blue-400" />
                <span>DIN 5008 Briefbogen</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={report.settings?.commercialVob?.enabled || false}
                  onChange={e => updateReportSettings({
                    settings: {
                      ...(report.settings || {}),
                      commercialVob: {
                        enableCarryOver: true,
                        vatSplitting: { standard19: 0, reduced7: 0, taxFree13b: 0 },
                        deductions: { warrantyRetentionPercent: 5 },
                        ...(report.settings?.commercialVob || {}),
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="scale-90 rounded border-slate-300 dark:border-slate-600 text-amber-600"
                />
                <Calculator size={12} className="text-amber-600 dark:text-amber-400" />
                <span>VOB/B Summenmatrix</span>
            </label>
         </div>
      </RibbonGroup>

      {/* E-Rechnung & QR-Codes */}
      <RibbonGroup label="E-Rechnung & QR">
         <div className="flex flex-col gap-1 justify-center h-full text-[10px]">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={report.settings?.zugferd?.enabled || false}
                  onChange={e => updateReportSettings({
                    settings: {
                      ...(report.settings || {}),
                      zugferd: {
                        profile: 'EN16931',
                        invoiceNumber: 'RE-2026-001',
                        sellerName: 'Musterbau GmbH',
                        sellerVatId: 'DE123456789',
                        buyerName: 'Kunde',
                        currency: 'EUR',
                        pdfCompliance: 'PDF/A-3b',
                        ...(report.settings?.zugferd || {}),
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="scale-90 rounded border-slate-300 dark:border-slate-600 text-emerald-600"
                />
                <FileCode size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>ZUGFeRD / Factur-X</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={report.settings?.swissQrCode?.enabled || false}
                  onChange={e => updateReportSettings({
                    settings: {
                      ...(report.settings || {}),
                      swissQrCode: {
                        iban: 'CH4431999123000889012',
                        currency: 'CHF',
                        referenceType: 'NON',
                        creditor: { name: 'Musterbau AG', street: 'Bahnhofstrasse', postalCode: '8001', city: 'Zürich', country: 'CH' },
                        ...(report.settings?.swissQrCode || {}),
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="scale-90 rounded border-slate-300 dark:border-slate-600 text-red-600"
                />
                <QrCode size={12} className="text-red-600 dark:text-red-400" />
                <span>Swiss QR-Bill</span>
            </label>
         </div>
      </RibbonGroup>

      {/* MFE Event Bus Print / Mail Trigger */}
      <RibbonGroup label="MFE Ausgabe">
        <div className="flex gap-1 items-center h-full">
            <button
              onClick={() => eventBus.publish('PRINT_REPORT', { reportId: report.id, outputFormat: 'print_dialog' })}
              className="flex flex-col items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
              title="Globalen Druckdialog auslösen (EventBus)"
            >
              <Printer size={14} />
              <span className="text-[9px] font-semibold">Drucken</span>
            </button>
            <button
              onClick={() => eventBus.publish('PRINT_REPORT', { reportId: report.id, outputFormat: 'email_direct' })}
              className="flex flex-col items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-400 cursor-pointer"
              title="Bericht per E-Mail versenden (EventBus)"
            >
              <Mail size={14} />
              <span className="text-[9px] font-semibold">E-Mail</span>
            </button>
        </div>
      </RibbonGroup>

      {/* Sicherheit */}
      <RibbonGroup label="Sicherheit" isLast>
         <div className="flex flex-col gap-1 justify-center w-40 h-full">
             <input 
                 type="text"
                 placeholder="Rollen, z.B. Admin, User"
                 value={(report.allowedRoles || []).join(', ')}
                 onChange={e => {
                     const parsed = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                     updateReportSettings({ allowedRoles: parsed });
                 }}
                 className="w-full border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
             />
         </div>
      </RibbonGroup>
    </div>
  );
};
