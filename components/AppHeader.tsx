
import React from 'react';
import { BackendConfig } from '../types/index';

interface AppHeaderProps {
  projectName: string;
  backendConfig: BackendConfig;
  onExport: (config: BackendConfig) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ projectName, backendConfig, onExport }) => {
  return (
    <div className="bg-slate-800 text-white text-xs px-2 py-1 flex justify-between items-center select-none shrink-0 print:hidden">
        <span>DB Studio Pro - {projectName}</span>
        <button onClick={() => onExport(backendConfig)} className="hover:text-blue-300">Sicherung erstellen (.dbsp)</button>
    </div>
  );
};
