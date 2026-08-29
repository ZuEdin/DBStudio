import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Zap,
  Server
} from 'lucide-react';
import { LocalOllamaService, OllamaStatus } from '../../../services/localOllamaService';
import { useProjectStore } from '../../../stores/useProjectStore';

interface LocalOllamaCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalOllamaCopilotModal: React.FC<LocalOllamaCopilotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useProjectStore();
  const [status, setStatus] = useState<OllamaStatus>({
    isAvailable: false,
    endpoint: LocalOllamaService.getEndpoint(),
    models: [],
    selectedModel: LocalOllamaService.getSelectedModel(),
  });
  const [isProbing, setIsProbing] = useState(false);
  const [prompt, setPrompt] = useState<string>('Erstelle eine SQL-Abfrage für alle offenen Projekte mit Kundenadresse und Summe der Rechnungen.');
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endpointInput, setEndpointInput] = useState<string>(LocalOllamaService.getEndpoint());

  useEffect(() => {
    if (isOpen) {
      handleProbe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProbe = async () => {
    setIsProbing(true);
    LocalOllamaService.setEndpoint(endpointInput);
    const result = await LocalOllamaService.probeLocalDaemon(endpointInput);
    setStatus(result);
    setIsProbing(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResponseOutput('');

    const res = await LocalOllamaService.generateCompletion(
      prompt,
      'Du bist ein präziser SQL- und Datenbank-Experte für DB Studio Pro. Gib sauberen SQL-Code ohne unnötigen Chat-Ballast aus.',
      status.selectedModel
    );

    setResponseOutput(res.text);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[84vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Lokale KI &amp; Ollama Copilot (100% Offline)
                </h2>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-bold">
                  Zero-Cloud-Garantie
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nutzt Ihr lokales Ollama (http://localhost:11434) oder LM Studio für SQL- und Schema-Vorschläge.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Local Daemon Status Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="http://localhost:11434"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 font-mono text-xs text-white outline-none w-48"
            />
            <button
              onClick={handleProbe}
              disabled={isProbing}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer"
            >
              <RefreshCw size={12} className={isProbing ? 'animate-spin' : ''} />
              <span>Daemon prüfen</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {status.isAvailable ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 size={15} />
                <span>Ollama aktiv ({status.latencyMs}ms)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertCircle size={15} />
                <span>Kein Daemon gefunden (Offline-Heuristik aktiv)</span>
              </div>
            )}

            {status.models.length > 0 && (
              <select
                value={status.selectedModel}
                onChange={(e) => {
                  setStatus({ ...status, selectedModel: e.target.value });
                  LocalOllamaService.setSelectedModel(e.target.value);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-purple-300 font-bold outline-none"
              >
                {status.models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.details?.parameter_size || 'Modell'})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Ihre Abfrage- oder Modellierungs-Aufgabe:</span>
              <span className="text-[11px] font-normal text-slate-500">
                Wird 100% lokal verarbeitet – keine Daten verlassen Ihren Computer
              </span>
            </label>
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="z. B. Schreibe ein SQL-Skript für GAEB Positionen mit Los-Zusammenfassung..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none font-mono"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-md shrink-0"
              >
                <Zap size={18} className={isGenerating ? 'animate-pulse' : ''} />
                <span>{isGenerating ? 'Berechne...' : 'Generieren'}</span>
              </button>
            </div>
          </div>

          {/* Response Output Box */}
          <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-purple-400" />
                <span>Generierter Code / SQL-Statement</span>
              </div>
              {responseOutput && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
              {responseOutput || (
                <span className="text-slate-600">
                  Klicken Sie auf &quot;Generieren&quot;, um lokale SQL-Abfragen oder Schema-Erweiterungen mit Ollama zu berechnen.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Datenschutz: Lokale Ausführung auf eigenem Host</span>
          </div>
          <div>Modell: {status.selectedModel}</div>
        </div>

      </div>
    </div>
  );
};
