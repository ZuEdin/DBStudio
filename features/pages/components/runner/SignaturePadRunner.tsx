import React, { useRef, useState } from 'react';
import { PenTool, RotateCcw, Check, Download, FileSignature } from 'lucide-react';

export const SignaturePadRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-3">
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white">
            <FileSignature size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold">{props.title || 'Digitale Bauherren- & Abnahme-Unterschrift'}</h3>
            <p className="text-[10px] text-slate-400">Rechtsverbindliche Signaturerfassung vor Ort</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
          >
            <RotateCcw size={12} /> Zurücksetzen
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl shadow-xs cursor-crosshair touch-none"
        />
        <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-2">
          <span>Datum: {new Date().toLocaleDateString('de-DE')}</span>
          <span>•</span>
          <span className={hasSignature ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
            {hasSignature ? '✓ Signatur vorhanden' : 'Unterschrift ausstehend'}
          </span>
        </div>
      </div>
    </div>
  );
};
