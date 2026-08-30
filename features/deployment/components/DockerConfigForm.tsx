import React from 'react';
import { DockerStackConfig, BackendLanguageType, DatabaseEngineType, ReverseProxyType, CloudTargetType } from '../types';
import { Server, Database, Shield, Globe, Layers, Settings2, Cpu } from 'lucide-react';

interface DockerConfigFormProps {
  config: DockerStackConfig;
  onChange: (newConfig: DockerStackConfig) => void;
}

export const DockerConfigForm: React.FC<DockerConfigFormProps> = ({ config, onChange }) => {
  const update = (patch: Partial<DockerStackConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* 1. Stack Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Language */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            <Server size={14} className="text-indigo-600" />
            Backend Technologie & Sprache
          </label>
          <select
            value={config.backendLanguage}
            onChange={(e) => update({ backendLanguage: e.target.value as BackendLanguageType })}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium text-slate-800 dark:text-slate-100"
          >
            <option value="nodejs">Node.js (Express / TypeScript / Fastify)</option>
            <option value="dotnet">.NET 8/9 (ASP.NET Core Web API)</option>
            <option value="python">Python (FastAPI / Uvicorn)</option>
            <option value="go">Go (Fiber / Gin High Performance)</option>
            <option value="php">PHP 8.3 (Apache / PDO)</option>
            <option value="rust">Rust (Axum / Actix)</option>
          </select>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Container Port:</span>
            <input
              type="number"
              value={config.backendPort}
              onChange={(e) => update({ backendPort: parseInt(e.target.value) || 5000 })}
              className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono text-center"
            />
          </div>
        </div>

        {/* Database Engine */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            <Database size={14} className="text-emerald-600" />
            Datenbank Container Engine
          </label>
          <select
            value={config.dbEngine}
            onChange={(e) => {
              const engine = e.target.value as DatabaseEngineType;
              const port = engine === 'postgres' ? 5432 : engine === 'mysql' ? 3306 : engine === 'mssql' ? 1433 : 5432;
              update({ dbEngine: engine, dbPort: port });
            }}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium text-slate-800 dark:text-slate-100"
          >
            <option value="postgres">PostgreSQL 16/17 (Empfohlen für Enterprise)</option>
            <option value="mysql">MySQL 8.4 LTS / MariaDB 11</option>
            <option value="mssql">Microsoft SQL Server 2022 (Linux)</option>
          </select>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span>DB Name:</span>
              <input
                type="text"
                value={config.dbName}
                onChange={(e) => update({ dbName: e.target.value })}
                className="w-full px-2 py-1 mt-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono"
              />
            </div>
            <div>
              <span>DB User:</span>
              <input
                type="text"
                value={config.dbUser}
                onChange={(e) => update({ dbUser: e.target.value })}
                className="w-full px-2 py-1 mt-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Proxy & Gateway */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Shield size={14} className="text-cyan-600" />
          Reverse Proxy & Ingress Routing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Gateway Engine:</label>
            <select
              value={config.reverseProxy}
              onChange={(e) => update({ reverseProxy: e.target.value as ReverseProxyType })}
              className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-medium"
            >
              <option value="nginx">Nginx (Production Ready)</option>
              <option value="traefik">Traefik v3 (Cloud Native)</option>
              <option value="none">Kein Proxy (Direkte Port-Bindung)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">HTTP Ingress Port:</label>
            <input
              type="number"
              value={config.httpPort}
              onChange={(e) => update({ httpPort: parseInt(e.target.value) || 80 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Domain / Hostname:</label>
            <input
              type="text"
              value={config.domainName}
              placeholder="localhost oder app.example.com"
              onChange={(e) => update({ domainName: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* 3. Add-on Services & Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400">
          <input
            type="checkbox"
            checked={config.includeFrontend}
            onChange={(e) => update({ includeFrontend: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Frontend Container</span>
            <span className="text-[11px] text-slate-500">React/Vite Production Nginx</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-400">
          <input
            type="checkbox"
            checked={config.includeDbAdmin}
            onChange={(e) => update({ includeDbAdmin: e.target.checked })}
            className="w-4 h-4 text-purple-600 rounded"
          />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">DB Web Admin</span>
            <span className="text-[11px] text-slate-500">
              {config.dbEngine === 'postgres' ? 'pgAdmin 4 (:8080)' : 'Adminer (:8080)'}
            </span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400">
          <input
            type="checkbox"
            checked={config.includeRedis}
            onChange={(e) => update({ includeRedis: e.target.checked })}
            className="w-4 h-4 text-amber-600 rounded"
          />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Redis 7 Cache</span>
            <span className="text-[11px] text-slate-500">In-Memory Cache & Queues</span>
          </div>
        </label>
      </div>

      {/* 4. Automation & Data Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enableSeedData}
            onChange={(e) => update({ enableSeedData: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded"
          />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Auto-Seed & DDL Bootstrap</span>
            <span className="text-[11px] text-slate-500">Erstellt Tabellen und Beispieldaten in 01_init.sql</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enableHealthchecks}
            onChange={(e) => update({ enableHealthchecks: e.target.checked })}
            className="w-4 h-4 text-cyan-600 rounded"
          />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Healthchecks & Auto-Recovery</span>
            <span className="text-[11px] text-slate-500">Restart policy: unless-stopped + pg_isready</span>
          </div>
        </label>
      </div>
    </div>
  );
};
