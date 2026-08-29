import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Layers, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Box, 
  Server, 
  Play, 
  HardDrive,
  Activity,
  Globe,
  Sparkles
} from 'lucide-react';
import { DeploymentRecord, DeploymentTarget, LocalProject } from '../../types/bridge';
import { bridgeApi } from '../../services/bridgeApi';

interface DeploymentsTabProps {
  deployments: DeploymentRecord[];
  onTriggerDeploy: (config: any) => Promise<void>;
  onRollback: (id: string) => Promise<void>;
}

export const DeploymentsTab: React.FC<DeploymentsTabProps> = ({
  deployments,
  onTriggerDeploy,
  onRollback
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [projectName, setProjectName] = useState('StandardProjekt');
  const [target, setTarget] = useState<DeploymentTarget>('self_contained_binary');
  const [port, setPort] = useState<number>(5000);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Lokaler Deployment & Release Manager</h2>
          </div>
          <p className="text-xs text-slate-400">Kompilieren und veröffentlichen Sie generierten Code lokal als Executable, Docker-Container oder Windows-Dienst.</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Neues Deployment</span>
        </button>
      </div>

      <div className="space-y-3">
        {deployments.map((dep) => (
          <div key={dep.id} className="bg-[#0E1524]/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{dep.projectName}</h4>
                <p className="text-xs text-slate-400">{dep.version} • {dep.target}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onRollback(dep.id)} className="p-2 bg-slate-800 text-slate-300 rounded-xl text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
