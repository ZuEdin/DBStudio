import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Award, Lock, UserCheck, AlertTriangle } from 'lucide-react';

export interface ApprovalStamp {
  stageId: string;
  stageName: string;
  requiredRole: string;
  status: 'pending' | 'approved' | 'rejected';
  signedBy?: string;
  signedAt?: string;
  signatureHash?: string;
  comment?: string;
}

interface FourEyesApprovalWidgetProps {
  id: string;
  label?: string;
  value?: any;
  isReadOnly?: boolean;
  currentUser?: string;
  currentUserRole?: string;
  onChange: (value: any) => void;
}

const DEFAULT_STAGES: ApprovalStamp[] = [
  {
    stageId: 'stage_1',
    stageName: '1. Prüfung: Bauleitung / Fachkalkulation',
    requiredRole: 'Bauleiter',
    status: 'pending',
  },
  {
    stageId: 'stage_2',
    stageName: '2. Freigabe: Geschäftsführung / Finanzen',
    requiredRole: 'GF',
    status: 'pending',
  },
];

export const FourEyesApprovalWidget: React.FC<FourEyesApprovalWidgetProps> = ({
  id,
  label = '4-Augen-Freigabe & Freigabestempel',
  value,
  isReadOnly = false,
  currentUser = 'Max Mustermann',
  currentUserRole = 'Bauleiter',
  onChange,
}) => {
  const [stages, setStages] = useState<ApprovalStamp[]>(() => {
    if (value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_STAGES;
  });

  const [activeComment, setActiveComment] = useState<{ [stageId: string]: string }>({});

  const handleApprove = (stageId: string) => {
    if (isReadOnly) return;
    const now = new Date();
    const hash = `SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    const updatedStages = stages.map((st) => {
      if (st.stageId !== stageId) return st;
      return {
        ...st,
        status: 'approved' as const,
        signedBy: currentUser,
        signedAt: now.toLocaleString('de-DE'),
        signatureHash: hash,
        comment: activeComment[stageId] || 'Freigabe erteilt',
      };
    });

    setStages(updatedStages);
    onChange(updatedStages);
  };

  const handleReject = (stageId: string) => {
    if (isReadOnly) return;
    const now = new Date();
    const updatedStages = stages.map((st) => {
      if (st.stageId !== stageId) return st;
      return {
        ...st,
        status: 'rejected' as const,
        signedBy: currentUser,
        signedAt: now.toLocaleString('de-DE'),
        comment: activeComment[stageId] || 'Freigabe abgelehnt',
      };
    });

    setStages(updatedStages);
    onChange(updatedStages);
  };

  const handleReset = (stageId: string) => {
    if (isReadOnly) return;
    const updatedStages = stages.map((st) => {
      if (st.stageId !== stageId) return st;
      return {
        ...st,
        status: 'pending' as const,
        signedBy: undefined,
        signedAt: undefined,
        signatureHash: undefined,
        comment: undefined,
      };
    });

    setStages(updatedStages);
    onChange(updatedStages);
  };

  const allApproved = stages.every((s) => s.status === 'approved');
  const hasRejection = stages.some((s) => s.status === 'rejected');

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            VOB 4-Augen-Prinzip
          </span>
        </div>
        <div>
          {allApproved ? (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 size={12} /> Vollständig freigegeben
            </span>
          ) : hasRejection ? (
            <span className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300 dark:border-rose-800">
              <XCircle size={12} /> Freigabe abgelehnt
            </span>
          ) : (
            <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-800">
              <Clock size={12} /> Prüfung ausstehend
            </span>
          )}
        </div>
      </div>

      {/* Approval Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stages.map((stage, idx) => {
          const isSigned = stage.status === 'approved';
          const isRejected = stage.status === 'rejected';

          return (
            <div
              key={stage.stageId}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                isSigned
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : isRejected
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-slate-500" />
                    {stage.stageName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Rolle: {stage.requiredRole}
                  </span>
                </div>

                {isSigned ? (
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Freigegeben durch {stage.signedBy}
                      </span>
                      <Award size={14} className="text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Datum: {stage.signedAt}</span>
                      <span className="font-mono text-[10px]">{stage.signatureHash}</span>
                    </div>
                    {stage.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded">
                        "{stage.comment}"
                      </p>
                    )}
                  </div>
                ) : isRejected ? (
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg space-y-1">
                    <div className="text-xs text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1">
                      <XCircle size={13} className="text-rose-600" /> Abgelehnt durch {stage.signedBy}
                    </div>
                    <div className="text-[11px] text-slate-500">{stage.signedAt}</div>
                    {stage.comment && (
                      <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded">
                        Grund: {stage.comment}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Optionaler Freigabe-Vermerk..."
                      value={activeComment[stage.stageId] || ''}
                      onChange={(e) =>
                        setActiveComment({ ...activeComment, [stage.stageId]: e.target.value })
                      }
                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isReadOnly && (
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  {stage.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(stage.stageId)}
                        className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} /> Ablehnen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(stage.stageId)}
                        className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 size={12} /> Digital signieren
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReset(stage.stageId)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-auto"
                    >
                      Signatur zurücksetzen
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
