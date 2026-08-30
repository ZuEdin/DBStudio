import React from 'react';
import { DockerStackConfig } from '../types';
import { Server, Database, Globe, Layers, ShieldCheck, Activity, Cpu, Box, Radio } from 'lucide-react';

interface DockerTopologyDiagramProps {
  config: DockerStackConfig;
  onUpdateConfig?: (updates: Partial<DockerStackConfig>) => void;
}

export const DockerTopologyDiagram: React.FC<DockerTopologyDiagramProps> = ({ config }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-inner">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Box className="text-cyan-400" size={18} />
          <span className="font-semibold text-sm text-slate-200">Container Topology & Network Architecture</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
          Network: bridge (app-network)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Step 1: Internet / Ingress */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-2 shadow-sm">
            <Globe size={24} />
          </div>
          <span className="font-medium text-xs text-slate-300">Client / Browser</span>
          <span className="text-[11px] text-slate-400 mt-1 font-mono">Port :{config.httpPort}</span>
          <div className="mt-2 text-[10px] bg-slate-900/60 px-2 py-0.5 rounded text-slate-400">
            HTTP / HTTPS / WS
          </div>
        </div>

        {/* Step 2: Gateway / Reverse Proxy */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-cyan-500/40 rounded-lg text-center relative shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-2">
            <ShieldCheck size={24} />
          </div>
          <span className="font-medium text-xs text-cyan-200">
            {config.reverseProxy.toUpperCase()} Gateway
          </span>
          <span className="text-[11px] text-slate-400 mt-1 font-mono">
            {config.domainName || 'localhost'}
          </span>
          <div className="mt-2 text-[10px] bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded text-cyan-300">
            SSL & Gzip & SPA Route
          </div>
        </div>

        {/* Step 3: Backend API */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-indigo-500/40 rounded-lg text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-2">
            <Server size={24} />
          </div>
          <span className="font-medium text-xs text-indigo-200">
            {config.backendLanguage.toUpperCase()} API
          </span>
          <span className="text-[11px] text-slate-400 mt-1 font-mono">
            Port :{config.backendPort}
          </span>
          <div className="mt-2 text-[10px] bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded text-indigo-300">
            REST & OpenAPI v3.1
          </div>
        </div>

        {/* Step 4: Database & Cache */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-emerald-500/40 rounded-lg text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
            <Database size={24} />
          </div>
          <span className="font-medium text-xs text-emerald-200">
            {config.dbEngine.toUpperCase()} DB
          </span>
          <span className="text-[11px] text-slate-400 mt-1 font-mono">
            Port :{config.dbPort}
          </span>
          <div className="mt-2 text-[10px] bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-emerald-300">
            Volume: db_data (init.sql)
          </div>
        </div>
      </div>

      {/* Auxiliary Services Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${config.includeFrontend ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            Frontend ({config.frontendFramework.toUpperCase()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${config.includeRedis ? 'bg-amber-400' : 'bg-slate-600'}`} />
            Redis Cache
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${config.includeDbAdmin ? 'bg-purple-400' : 'bg-slate-600'}`} />
            {config.dbEngine === 'postgres' ? 'pgAdmin 4' : 'Adminer'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
          <Activity size={12} className="text-emerald-400" /> Auto Healthchecks: Active
        </div>
      </div>
    </div>
  );
};
