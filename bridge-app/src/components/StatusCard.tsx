import React, { useState } from 'react';
import { AlertCircle, LucideIcon, Copy, Check } from 'lucide-react';

interface StatusCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  isReady: boolean;
  version?: string;
  path?: string;
  badge?: string;
  tags?: string[];
  statusNote?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  isReady,
  version,
  path,
  badge,
  tags,
  statusNote
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    if (path) {
      navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
      isReady 
        ? 'bg-white dark:bg-[#131b2e]/80 backdrop-blur-md border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/40 hover:shadow-md dark:hover:shadow-emerald-950/20' 
        : 'bg-white dark:bg-[#151722]/80 backdrop-blur-md border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
            isReady 
              ? 'bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:via-emerald-600/10 dark:to-teal-500/5 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 glow-emerald' 
              : 'bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-600/5 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 glow-amber'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              {title}
              {badge && (
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {badge}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        {isReady ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Bereit
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Offen
          </span>
        )}
      </div>

      {/* Details Box */}
      <div className="bg-slate-50 dark:bg-[#0A0F1A]/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2 shadow-inner">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Version:</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold tracking-tight bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
            {version || 'N/A'}
          </span>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200 dark:border-slate-800/60">
            {tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {statusNote && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800/40">
            {statusNote}
          </div>
        )}

        {path && (
          <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-slate-500 shrink-0 mr-2">Pfad:</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-600 dark:text-slate-400 truncate text-[10px]" title={path}>{path}</span>
              <button 
                onClick={handleCopyPath}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 p-0.5 rounded"
                title="Pfad kopieren"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
