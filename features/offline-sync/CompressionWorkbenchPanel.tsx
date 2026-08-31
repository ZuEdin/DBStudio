import React, { useState } from 'react';
import { Archive, ArrowDownToLine, Zap, CheckCircle2, FileImage, FileText, Code2, Sparkles } from 'lucide-react';
import { PayloadCompressionUtil } from './payloadCompressionUtil';
import { CompressedPayload } from './outboxTypes';

export const CompressionWorkbenchPanel: React.FC = () => {
  const [inputText, setInputText] = useState<string>(() => {
    return JSON.stringify(
      {
        projectId: 'PRJ-MUC-2026-891',
        reportDate: '2026-08-31',
        weather: { temperature: 24, condition: 'Sonnig', windSpeedKmH: 12 },
        workers: [
          { name: 'Max Mustermann', trade: 'Polier', hours: 8.5 },
          { name: 'Stefan Bauer', trade: 'Betonbauer', hours: 8.0 },
          { name: 'Andreas Weber', trade: 'Maurer', hours: 8.0 },
          { name: 'Lukas Schneider', trade: 'Kranführer', hours: 8.5 },
        ],
        equipmentUsed: ['Liebherr EC-B 250 Turmdrehkran', 'Wacker Neuson Dumper 5001', 'Putzmeister Betonpumpe BSF 36'],
        workPerformed: 'Fertigstellung der Betonage von Deckenabschnitt D-3. Beginn der Schalungsarbeiten für Treppenhauskern C. Bewehrungsabnahme durch Prüfingenieur Dr. Krause ohne Mängel erfolgt.',
        siteObservations: 'Lieferung von 60 m³ Transportbeton C30/37 um 10:15 Uhr pünktlich eingetroffen. Nachbehandlung mit Folienabdeckung gesichert.',
        signature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCAyMCBDIDIwIDQwLCA0MCAwLCA2MCAzMCBTIOCwIDMwLCA5MCAxMCIgc3Ryb2tlPSJibGFjayIgZmlsbD0idHJhbnNwYXJlbnQiLz48L3N2Zz4=',
      },
      null,
      2
    );
  });

  const [selectedAlgo, setSelectedAlgo] = useState<'gzip' | 'deflate'>('gzip');
  const [result, setResult] = useState<CompressedPayload | null>(null);
  const [decompressedText, setDecompressedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompress = async () => {
    setIsProcessing(true);
    try {
      const comp = await PayloadCompressionUtil.compress(inputText, selectedAlgo);
      setResult(comp);
      const decomp = await PayloadCompressionUtil.decompress(comp);
      setDecompressedText(typeof decomp === 'object' ? JSON.stringify(decomp, null, 2) : String(decomp));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = (type: 'report' | 'photo' | 'large') => {
    if (type === 'report') {
      setInputText(
        JSON.stringify(
          {
            reportId: 'B-2026-99',
            title: 'Tagesprotokoll Schalung & Betonage',
            author: 'Bauleiter Thomas Schmidt',
            notes: 'Ausschalarbeiten nach 48h Festigkeitsprüfung freigegeben.',
            tasks: Array.from({ length: 15 }, (_, i) => ({
              id: i + 1,
              title: `Baustellenabschnitt ${i + 1}`,
              done: i % 2 === 0,
            })),
          },
          null,
          2
        )
      );
    } else if (type === 'photo') {
      // Mock 50KB base64 string
      const mockPhoto = 'data:image/jpeg;base64,' + 'A'.repeat(45000);
      setInputText(JSON.stringify({ photoName: 'bewehrung_knoten_k12.jpg', photoData: mockPhoto }, null, 2));
    } else {
      // Large 50-item dataset
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        pos: `01.0${i + 1}.0010`,
        description: `Lieferung und Einbau von vorgefertigten Bauelementen Typ EL-${100 + i} inklusive Dichtungssatz und Montagezubehör nach DIN 18202`,
        qty: (i + 1) * 12.5,
        unit: 'm²',
        unitPrice: 85.5,
      }));
      setInputText(JSON.stringify(largeData, null, 2));
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
        <Archive className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <span>High-Efficiency Payload-Kompression (GZIP / Brotli / Deflate)</span>
            <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
              Streams Compression API
            </span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">
            Große Offline-Pakete (z. B. Baustellenfotos, Abnahmeprotokolle, LV-Kataloge) werden vor der IndexedDB-Pufferung und Funkübertragung hochgradig komprimiert.
          </p>
        </div>
      </div>

      {/* Preset selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Testdaten-Vorlage:</span>
          <button
            onClick={() => handleLoadSample('report')}
            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Bautagesbericht</span>
          </button>
          <button
            onClick={() => handleLoadSample('photo')}
            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
          >
            <FileImage className="w-3 h-3" />
            <span>Baustellenfoto (45 KB)</span>
          </button>
          <button
            onClick={() => handleLoadSample('large')}
            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
          >
            <Code2 className="w-3 h-3" />
            <span>Großes Tabellenpaket (50 Zeilen)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Algorithmus:</span>
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value as 'gzip' | 'deflate')}
            className="p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
          >
            <option value="gzip">GZIP (RFC 1952)</option>
            <option value="deflate">Deflate (RFC 1951)</option>
          </select>
          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Komprimieren</span>
          </button>
        </div>
      </div>

      {/* Editor & Stats View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Uncompressed Input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>Unkomprimierte Nutzlast (JSON / Rohdaten)</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {new TextEncoder().encode(inputText).byteLength} Bytes
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={9}
            className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-[11px]"
          />
        </div>

        {/* Compression Result & Metrics */}
        <div className="space-y-2">
          <div className="text-slate-500 font-semibold">Kompressions-Ergebnis &amp; Metriken</div>
          {result ? (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              {/* Ratio Banner */}
              <div className="flex items-center justify-between p-2.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    {result.compressionRatio}% Datenvolumen eingespart
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {result.durationMs} ms
                </span>
              </div>

              {/* Byte Comparison Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400 text-[10px]">Originalgröße</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {result.originalSizeBytes.toLocaleString()} Bytes ({(result.originalSizeBytes / 1024).toFixed(2)} KB)
                  </div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400 text-[10px]">Komprimiert ({result.algorithm.toUpperCase()})</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {result.compressedSizeBytes.toLocaleString()} Bytes ({(result.compressedSizeBytes / 1024).toFixed(2)} KB)
                  </div>
                </div>
              </div>

              {/* Decompressed round-trip check */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                  Round-Trip Dekomprimierung verifiziert:
                </div>
                <pre className="p-2 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] max-h-24 overflow-y-auto">
                  {decompressedText.slice(0, 400)}...
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
              Klicken Sie auf &quot;Komprimieren&quot;, um die Streams-Kompression zu testen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
