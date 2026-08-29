import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, Lock, ShieldCheck, Download } from 'lucide-react';

interface SignaturePadWidgetProps {
  id: string;
  label?: string;
  value?: string; // Stored as data URL (PNG) or JSON metadata
  isReadOnly?: boolean;
  signerName?: string;
  onChange: (value: string) => void;
}

export const SignaturePadWidget: React.FC<SignaturePadWidgetProps> = ({
  id,
  label = 'Digitale Unterschrift',
  value,
  isReadOnly = false,
  signerName: initialSignerName = '',
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signer, setSigner] = useState(initialSignerName);
  const [signDate, setSignDate] = useState<string>('');
  const [checksum, setChecksum] = useState<string>('');

  // Generate simulated cryptographic hash
  const generateChecksum = (dataUrl: string) => {
    let hash = 0;
    for (let i = 0; i < Math.min(dataUrl.length, 500); i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return 'SIG-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasDrawn(true);
        };
        img.src = value;
      }
      setChecksum(generateChecksum(value));
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#1e3a8a'; // Deep blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const now = new Date().toLocaleString('de-DE');
      setSignDate(now);
      setChecksum(generateChecksum(dataUrl));
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    if (isReadOnly || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawn(false);
      setSignDate('');
      setChecksum('');
      onChange('');
    }
  };

  const handleDownload = () => {
    if (!value) return;
    const a = document.createElement('a');
    a.href = value;
    a.download = `Unterschrift_${signer || 'Dokument'}_${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
        </div>
        {checksum && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={12} />
            <span>{checksum}</span>
          </div>
        )}
      </div>

      {/* Signature Canvas */}
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-[140px] touch-none ${isReadOnly ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-crosshair'}`}
        />
        {!hasDrawn && !isReadOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
            ✍️ Hier mit Finger, Stift oder Maus unterschreiben...
          </div>
        )}
        {/* Baseline line */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300 dark:border-slate-700 pointer-events-none" />
      </div>

      {/* Meta & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Name des Unterzeichners..."
            disabled={isReadOnly}
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex-1 outline-none focus:ring-1 focus:ring-blue-500"
          />
          {signDate && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {signDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasDrawn}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <RotateCcw size={12} /> Löschen
            </button>
          )}
          {hasDrawn && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded transition-colors"
              title="Unterschrift als PNG exportieren"
            >
              <Download size={12} /> PNG
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
