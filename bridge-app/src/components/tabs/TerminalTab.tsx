import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy, Check, Filter } from 'lucide-react';
import { TerminalLogEntry, BridgeProcess } from '../../types/bridge';

interface TerminalTabProps {
  processes: BridgeProcess[];
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ processes }) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://127.0.0.1:5050/logs');
        
        ws.onopen = () => {
          setLogs(prev => [
            ...prev,
            { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), stream: 'system', message: '🟢 Live-Terminal WebSocket verbunden & bereit.' }
          ]);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEntry: TerminalLogEntry = {
              id: Date.now() + Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              stream: data.stream || 'stdout',
              message: data.message || (typeof data === 'string' ? data : JSON.stringify(data)),
              processId: data.processId
            };
            setLogs(prev => [...prev.slice(-400), newEntry]);
          } catch {
            setLogs(prev => [
              ...prev.slice(-400),
              { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), stream: 'stdout', message: event.data }
            ]);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = selectedProcessId === 'all'
    ? logs
    : logs.filter(l => !l.processId || l.processId === selectedProcessId);

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.stream}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0E1524]/80 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
            Live Console Stream ({filteredLogs.length} Zeilen)
          </div>

          <div className="flex items-center gap-1.5 ml-4">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="bg-slate-50 dark:bg-[#080D17] border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-200 rounded-xl px-3 py-1.5 font-mono"
            >
              <option value="all">Alle Prozesse & System-Logs</option>
              {processes.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.name} (Port: {proc.port || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-[#080D17] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>

          <button 
            onClick={() => setLogs([])}
            className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Leeren</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#060A11] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        <div className="space-y-1 flex-1 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="text-slate-600 select-none">{log.timestamp}</span>
              <span className="text-emerald-400 font-semibold">[{log.stream}]</span>
              <span>{log.message}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
