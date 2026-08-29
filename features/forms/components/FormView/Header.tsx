import React from 'react';
import { Plus, X, Printer } from 'lucide-react';

interface HeaderProps {
  hideHeader?: boolean;
  formName: string;
  isCreating: boolean;
  currentIndex: number;
  dataLength: number;
  onClose?: () => void;
  onOpenPrintModal?: () => void;
  headerColorClass: string;
}

export const Header: React.FC<HeaderProps> = ({
  hideHeader,
  formName,
  isCreating,
  currentIndex,
  dataLength,
  onClose,
  onOpenPrintModal,
  headerColorClass,
}) => {
  if (hideHeader) return null;

  return (
    <div className={`${headerColorClass} p-3 font-bold flex justify-between items-center shrink-0 transition-colors duration-300`} id="form-view-header">
      <div className="flex items-center gap-2">
        <span>{formName}</span>
        {isCreating && (
          <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Plus size={12} strokeWidth={3} /> Neuer Datensatz
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isCreating && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
            {dataLength > 0 ? `${currentIndex + 1} / ${dataLength}` : '0 / 0'}
          </span>
        )}
        {onOpenPrintModal && !isCreating && (
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-2.5 py-1 rounded transition-colors shadow-2xs"
            title="Drucken / PDF-Export"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Drucken</span>
          </button>
        )}
        {!!onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded transition-colors"
            title="Schließen"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
