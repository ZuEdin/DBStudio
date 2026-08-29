import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/tabs/OverviewTab';
import { DependenciesTab } from './components/tabs/DependenciesTab';
import { DatabaseTab } from './components/tabs/DatabaseTab';
import { DeveloperTodosTab } from './components/tabs/DeveloperTodosTab';
import { WorkspacesTab } from './components/tabs/WorkspacesTab';
import { DeploymentsTab } from './components/tabs/DeploymentsTab';
import { TerminalTab } from './components/tabs/TerminalTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { ApiDocsTab } from './components/tabs/ApiDocsTab';
import { bridgeApi } from './services/bridgeApi';
import { EnvironmentHealth, BridgeProcess, DeploymentRecord } from './types/bridge';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<EnvironmentHealth>({
    dotnetSdk: { installed: true, version: '10.0.301' },
    nodejs: { installed: true, version: 'v22.17.1' },
    npm: { installed: true, version: '11.6.2' },
    docker: { installed: true, running: true, version: '27.1.1' },
    bridgePort: 5050,
    isOnline: true,
    osPlatform: 'Windows 11 (x64)'
  });
  const [processes, setProcesses] = useState<BridgeProcess[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);

  useEffect(() => {
    loadStatusData();
    const interval = setInterval(loadStatusData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatusData = async () => {
    try {
      const [healthData, procData, depData] = await Promise.all([
        bridgeApi.getHealth(),
        bridgeApi.getProcesses(),
        bridgeApi.getDeployments()
      ]);
      setHealth(healthData);
      setProcesses(procData);
      setDeployments(depData);
    } catch {
      // Offline fallback
    }
  };

  const handleStartProcess = async (id: string) => {
    await bridgeApi.startProcess(id);
    loadStatusData();
  };

  const handleStopProcess = async (id: string) => {
    await bridgeApi.stopProcess(id);
    loadStatusData();
  };

  const handleRestartProcess = async (id: string) => {
    await bridgeApi.restartProcess(id);
    loadStatusData();
  };

  const handleTriggerDeploy = async (config: any) => {
    const record = await bridgeApi.triggerDeployment(config);
    setDeployments(prev => [record, ...prev]);
  };

  const handleRollback = async (id: string) => {
    await bridgeApi.rollbackDeployment(id);
    loadStatusData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab
            health={health}
            processes={processes}
            onStartProcess={handleStartProcess}
            onStopProcess={handleStopProcess}
            onRestartProcess={handleRestartProcess}
          />
        )}

        {activeTab === 'dependencies' && <DependenciesTab />}

        {activeTab === 'database' && <DatabaseTab />}

        {activeTab === 'todos' && <DeveloperTodosTab />}

        {activeTab === 'workspaces' && <WorkspacesTab />}

        {activeTab === 'deployments' && (
          <DeploymentsTab
            deployments={deployments}
            onTriggerDeploy={handleTriggerDeploy}
            onRollback={handleRollback}
          />
        )}

        {activeTab === 'terminal' && <TerminalTab processes={processes} />}

        {activeTab === 'security' && <SecurityTab />}

        {activeTab === 'api_docs' && <ApiDocsTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
};

export default App;
