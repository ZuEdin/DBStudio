
import React, { useState } from 'react';
import { DeploymentConfig, DeploymentTarget } from '../../../types/index';
import { X, Upload, Server, Cloud, Globe, Ship } from 'lucide-react';

interface DeploymentModalProps {
  config: DeploymentConfig | undefined;
  onSave: (config: DeploymentConfig) => void;
  onClose: () => void;
  onDeploy: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ config, onSave, onClose, onDeploy }) => {
  const [target, setTarget] = useState<DeploymentTarget>(config?.target || 'docker');
  
  // Docker
  const [dockerImage, setDockerImage] = useState(config?.dockerImageName || 'myapp:latest');
  const [dockerPort, setDockerPort] = useState(config?.dockerPort || 8080);

  // FTP
  const [ftpHost, setFtpHost] = useState(config?.ftpHost || '');
  const [ftpUser, setFtpUser] = useState(config?.ftpUser || '');
  const [ftpPath, setFtpPath] = useState(config?.ftpPath || '/public_html');

  const handleSave = () => {
      onSave({
          target,
          dockerImageName: dockerImage,
          dockerPort,
          ftpHost,
          ftpUser,
          ftpPath
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex overflow-hidden h-[600px]">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Globe className="text-blue-400"/> Publish</h2>
            
            <div className="space-y-2 flex-1">
                <button onClick={() => setTarget('docker')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${target === 'docker' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Ship size={18} /> Docker / Container
                </button>
                <button onClick={() => setTarget('ftp')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${target === 'ftp' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Upload size={18} /> FTP / SFTP
                </button>
                <button onClick={() => setTarget('azure')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${target === 'azure' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Cloud size={18} /> Azure App Service
                </button>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-400">
                Ready for Production
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Konfiguration: {target.toUpperCase()}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                {target === 'docker' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 text-sm">
                            Erstellt ein <code>Dockerfile</code> und <code>docker-compose.yml</code> für die Anwendung. Ideal für lokale Tests oder Cloud-Container (AWS ECS, Azure Container Apps).
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Image Name</label>
                            <input type="text" value={dockerImage} onChange={e => setDockerImage(e.target.value)} className="w-full border border-slate-300 rounded p-2" placeholder="mycompany/myapp:v1" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Exposed Port</label>
                            <input type="number" value={dockerPort} onChange={e => setDockerPort(parseInt(e.target.value))} className="w-full border border-slate-300 rounded p-2" />
                        </div>
                    </div>
                )}

                {target === 'ftp' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-orange-800 text-sm">
                            Generiert ein Upload-Skript für klassische Webhoster. Perfekt für PHP-Backends oder statische Frontends (Shops, Formulare).
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">FTP Host</label>
                            <input type="text" value={ftpHost} onChange={e => setFtpHost(e.target.value)} className="w-full border border-slate-300 rounded p-2" placeholder="ftp.example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Benutzername</label>
                            <input type="text" value={ftpUser} onChange={e => setFtpUser(e.target.value)} className="w-full border border-slate-300 rounded p-2" placeholder="webmaster" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Zielpfad (Remote)</label>
                            <input type="text" value={ftpPath} onChange={e => setFtpPath(e.target.value)} className="w-full border border-slate-300 rounded p-2" placeholder="/httpdocs/myapp" />
                        </div>
                    </div>
                )}

                {target === 'azure' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                         <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg text-sky-800 text-sm">
                            Erstellt eine GitHub Actions Pipeline (YAML) für Continuous Deployment nach Azure.
                        </div>
                        <div className="text-center py-10 text-slate-400">
                            <Cloud size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>Pipeline-Konfiguration wird generiert...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50">Abbrechen</button>
                <button 
                    onClick={() => { handleSave(); onDeploy(); }} 
                    className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
                >
                    <Upload size={18} /> Konfiguration speichern & Generieren
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
