import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Link, Check, AlertCircle } from 'lucide-react';

export interface LogoUploadFieldProps {
  logoUrl?: string;
  onLogoUrlChange: (url: string) => void;
  logoPosition?: 'left' | 'center' | 'right';
  onLogoPositionChange?: (position: 'left' | 'center' | 'right') => void;
  label?: string;
  helperText?: string;
  showPositionSelector?: boolean;
  compact?: boolean;
}

export const LogoUploadField: React.FC<LogoUploadFieldProps> = ({
  logoUrl = '',
  onLogoUrlChange,
  logoPosition = 'left',
  onLogoPositionChange,
  label = 'Logo (SVG, PNG, JPG)',
  helperText = 'Per Drag & Drop oder Klick hochladen. SVG & PNG werden automatisch eingebettet.',
  showPositionSelector = true,
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setError(null);
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    
    // Check file extension or mime type
    const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';
    const isValidImage = validTypes.includes(file.type) || isSvg;

    if (!isValidImage) {
      setError('Bitte nur SVG-, PNG-, JPG- oder WEBP-Dateien hochladen.');
      return;
    }

    // Size limit check (e.g., max 3MB for base64 in metadata)
    if (file.size > 3 * 1024 * 1024) {
      setError('Die Datei ist zu groß (max. 3 MB empfohlen).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onLogoUrlChange(result);
      }
    };
    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onLogoUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onLogoUrlChange(urlDraft.trim());
      setUrlDraft('');
      setShowUrlInput(false);
    }
  };

  const isDataUrl = logoUrl.startsWith('data:image/');
  const isSvg = logoUrl.includes('image/svg+xml') || logoUrl.toLowerCase().endsWith('.svg');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 cursor-pointer"
        >
          <Link size={12} />
          {showUrlInput ? 'Upload anzeigen' : 'URL eingeben'}
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://example.com/logo.png oder data:..."
            value={urlDraft || logoUrl}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
          >
            Übernehmen
          </button>
        </div>
      ) : (
        <>
          {logoUrl ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-20 flex-shrink-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                    <img
                      src={logoUrl}
                      alt="Logo Vorschau"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={() => setError('Bild konnte nicht geladen werden')}
                    />
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      Logo aktiv
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                      {isSvg ? 'Vektorgrafik (SVG)' : isDataUrl ? 'Eingebettete Grafik (Base64)' : 'Web-URL'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    title="Anderes Bild wählen"
                  >
                    Ändern
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                    title="Logo entfernen"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Logo hier ablegen <span className="font-normal text-slate-500">oder</span> durchsuchen
                </div>
                <p className="text-[11px] text-slate-400">SVG, PNG, JPG oder WEBP</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp,image/gif,.svg,.png,.jpg,.jpeg,.webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Positionsauswahl: Links, Zentriert, Rechts */}
      {showPositionSelector && onLogoPositionChange && (
        <div className="pt-1">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            Logo-Position im Header:
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onLogoPositionChange('left')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                logoPosition === 'left'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlignLeft size={14} />
              <span>Links</span>
            </button>
            <button
              type="button"
              onClick={() => onLogoPositionChange('center')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                logoPosition === 'center'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlignCenter size={14} />
              <span>Zentriert</span>
            </button>
            <button
              type="button"
              onClick={() => onLogoPositionChange('right')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                logoPosition === 'right'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlignRight size={14} />
              <span>Rechts</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
