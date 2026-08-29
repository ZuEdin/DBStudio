import React from 'react';
import { FreeformCanvasElement } from '../../../types';
import { QrCode, Barcode, Stamp } from 'lucide-react';

interface FreeformCanvasRendererProps {
  elements?: FreeformCanvasElement[];
  section: 'reportHeader' | 'pageHeader' | 'detail' | 'pageFooter' | 'reportFooter';
}

export const FreeformCanvasRenderer: React.FC<FreeformCanvasRendererProps> = ({
  elements = [],
  section,
}) => {
  const sectionElements = elements.filter((el) => el.section === section);
  if (!sectionElements || sectionElements.length === 0) return null;

  return (
    <div className="relative w-full min-h-[30px] my-2 pointer-events-none select-none print:visible">
      {sectionElements.map((el) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.x}mm`,
            top: `${el.y}mm`,
            width: `${el.width}mm`,
            height: `${el.height}mm`,
            borderColor: el.borderColor || '#cbd5e1',
            borderWidth: `${el.borderWidth ?? 0}px`,
            backgroundColor: el.backgroundColor || 'transparent',
            color: el.style?.color || '#1e293b',
            fontSize: `${el.style?.fontSize || 10}pt`,
            fontWeight: el.style?.bold ? 'bold' : 'normal',
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
          className="flex items-center justify-center overflow-hidden"
        >
          {el.type === 'barcode' && (
            <div className="flex flex-col items-center justify-center w-full h-full text-[9px] font-mono leading-none">
              <div className="w-full h-3/4 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]" />
              <span className="truncate text-[8px] mt-0.5">{el.content}</span>
            </div>
          )}
          {el.type === 'qrcode' && (
            <div className="flex flex-col items-center justify-center w-full h-full bg-white border border-slate-300 p-0.5">
              <QrCode size={el.height * 2.8} className="text-slate-900" />
            </div>
          )}
          {el.type === 'stamp' && (
            <div 
              style={{ borderColor: el.borderColor || '#dc2626', color: el.style?.color || '#dc2626' }}
              className="border-2 border-dashed font-black text-[10pt] uppercase px-2 py-1 rounded tracking-wider text-center"
            >
              {el.content || 'GEPRÜFT'}
            </div>
          )}
          {el.type === 'signature' && (
            <div className="w-full text-center border-t border-slate-700 pt-1 text-[9pt] text-slate-700">
              ✍️ {el.content}
            </div>
          )}
          {el.type === 'label' && (
            <span className="truncate w-full">{el.content}</span>
          )}
          {el.type === 'formula' && (
            <span className="truncate w-full font-mono text-emerald-800">{el.content}</span>
          )}
          {el.type === 'line' && (
            <div className="w-full h-[1px] bg-slate-800" />
          )}
        </div>
      ))}
    </div>
  );
};
