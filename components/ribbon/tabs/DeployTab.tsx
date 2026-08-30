import React, { useState, useEffect } from 'react';
import { Settings, Play, Download, AppWindow, Server, UploadCloud, CircuitBoard, CloudLightning, Radio, X, Database, Eye, Check, FileCode, RefreshCw, GitCommit, Globe, ShieldCheck, ShieldAlert, History, Laptop, Terminal, Layers, Package } from 'lucide-react';
import { BackendConfig, DbType, FrontendFramework, StylingFramework } from '../../../types/index';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdownButton } from '../RibbonDropdownButton';
import { useTranslation } from 'react-i18next';
import { useBridgeStore } from '../../../stores/useBridgeStore';

interface DeployTabProps {
  onAction: (action: string) => void;
  backendConfig: BackendConfig;
  setBackendConfig: (config: BackendConfig) => void;
  onOpenSettings: () => void;
}

const getDefaultPort = (framework: FrontendFramework): number => {
    switch (framework) {
        case 'angular':
        case 'angular-modern': return 4200;
        case 'vue': return 5173;
        case 'blazor':
        case 'mudblazor': return 5002;
        case 'maui': return 5003;
        case 'maui-native': return 5004;
        default: return 3000;
    }
};

export const DeployTab: React.FC<DeployTabProps> = ({ onAction, backendConfig, setBackendConfig, onOpenSettings }) => {
  const { t } = useTranslation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend' | 'connection'>('backend');

  const { 
    config: bridgeConfig, 
    isOnline: isBridgeOnline, 
    isChecking: isBridgeChecking 
  } = useBridgeStore();

  const isRelayBridge = bridgeConfig.host.includes('.php') || bridgeConfig.useCustomPort === false || (bridgeConfig.host.startsWith('https://') && !bridgeConfig.host.includes('127.0.0.1') && !bridgeConfig.host.includes('localhost'));
  const bridgeLabelText = isRelayBridge ? 'PHP Relay' : `Port ${bridgeConfig.port || 5050}`;

  const getDbLabel = (type: DbType) => {
    switch(type) {
      case 'SQL': return 'SQL Server';
      case 'MySQL': return 'MySQL';
      case 'SQLite': return 'SQLite';
      case 'PostgreSQL': return 'PostgreSQL';
      case 'NoSQL': return 'NoSQL (Mongo)';
      default: return type;
    }
  };

  const getDbShortLabel = (type: DbType) => {
    switch(type) {
      case 'SQL': return 'SQL Server';
      case 'MySQL': return 'MySQL';
      case 'SQLite': return 'SQLite';
      case 'PostgreSQL': return 'PostgreSQL';
      case 'NoSQL': return 'MongoDB';
      default: return String(type);
    }
  };

  const getFrontendLabel = (fw: FrontendFramework) => {
    switch(fw) {
      case 'react': return 'React';
      case 'vue': return 'Vue.js';
      case 'angular-modern': return 'Angular 19 (Standalone & Signals)';
      case 'angular': return 'Angular (Klassisch / NgModule)';
      case 'blazor': return 'Blazor (Bootstrap 5 WASM)';
      case 'mudblazor': return 'MudBlazor (Material Design WASM)';
      case 'maui': return '.NET MAUI (Blazor Hybrid)';
      case 'maui-native': return '.NET MAUI (XAML / Native)';
      case 'none': return 'Keins (Nur API)';
      default: return fw;
    }
  };

  const getFrontendShortLabel = (fw: FrontendFramework) => {
    switch(fw) {
      case 'react': return 'React';
      case 'vue': return 'Vue.js';
      case 'angular-modern': return 'Angular 19';
      case 'angular': return 'Angular';
      case 'blazor': return 'Blazor';
      case 'mudblazor': return 'MudBlazor';
      case 'maui': return '.NET MAUI';
      case 'maui-native': return 'MAUI Native';
      case 'none': return 'Nur API';
      default: return String(fw);
    }
  };

  const getFrontendFullLabel = (fw: FrontendFramework, styling?: string) => {
    const fwName = getFrontendLabel(fw);
    return `${fwName} (${styling || 'tailwind'})`;
  };

  const getBackendLabel = (lang: string) => {
    switch(lang) {
      case 'dotnet': return '.NET API';
      case 'nodejs': return 'Node.js';
      case 'python': return 'Python';
      case 'php': return 'PHP';
      case 'laravel': return 'Laravel';
      case 'electron': return 'Electron';
      case 'tauri': return 'Tauri (Rust)';
      default: return lang;
    }
  };

  const getBackendShortLabel = (lang: string, version?: string) => {
    switch(lang) {
      case 'dotnet': return `.NET ${version || '9.0'}`;
      case 'nodejs': return 'Node.js';
      case 'python': return 'Python';
      case 'php': return 'PHP';
      case 'laravel': return 'Laravel';
      case 'electron': return 'Electron';
      case 'tauri': return 'Tauri';
      default: return lang;
    }
  };

  const getProtocolLabel = (mode?: 'http' | 'https' | 'both') => {
    if (mode === 'http') return 'Nur HTTP';
    if (mode === 'https') return 'Nur HTTPS';
    return 'HTTP & HTTPS';
  };

  return (
    <div className="flex gap-3 items-center h-full relative">
        {/* Settings Overview Group - Heights & spacing adjusted so badges fit cleanly */}
        <div className="relative flex flex-col justify-between h-[88px] w-[270px] shrink-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
             <div className="flex items-center gap-1.5 min-w-0">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
               <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">
                 Aktive Konfiguration
               </span>
             </div>
             <button 
               onClick={() => setShowSettingsModal(true)}
               className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 p-0.5 rounded transition-colors cursor-pointer"
               title="Generator- & Backend-Einstellungen anpassen"
             >
               <Settings size={12} />
             </button>
           </div>
           
           <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs py-0.5">
              <div className="flex items-center gap-1 min-w-0" title={`Datenbank: ${getDbLabel(backendConfig.dbType)}`}>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">DB:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">{getDbShortLabel(backendConfig.dbType)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0" title={`Backend API: ${getBackendLabel(backendConfig.language)} ${backendConfig.language === 'dotnet' ? (backendConfig.backendVersion || '10.0') : ''}`}>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">API:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 truncate text-[11px]">{getBackendShortLabel(backendConfig.language, backendConfig.backendVersion)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0" title={`Frontend: ${getFrontendFullLabel(backendConfig.frontendFramework, backendConfig.stylingFramework)}`}>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Web:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate text-[11px]">{getFrontendShortLabel(backendConfig.frontendFramework)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0" title={`Port: ${backendConfig.port}${backendConfig.language === 'dotnet' ? ` / ${backendConfig.port + 1}` : ''}`}>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Port:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate text-[11px]">{backendConfig.port}{backendConfig.language === 'dotnet' ? `/${backendConfig.port + 1}` : ''}</span>
              </div>
           </div>

           <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 overflow-hidden">
              <span className="text-[9px] leading-tight bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">
                {getProtocolLabel(backendConfig.protocolMode)}
              </span>
              {backendConfig.useSwagger && (
                <span className="text-[9px] leading-tight bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">
                  Swagger
                </span>
              )}
              <span className="text-[9px] leading-tight bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium ml-auto shrink-0 whitespace-nowrap truncate" title={`Styling: ${backendConfig.stylingFramework || 'tailwind'}`}>
                {backendConfig.stylingFramework || 'tailwind'}
              </span>
           </div>
        </div>

        {/* Schema & DB Ops Dropdown Button Group */}
        <RibbonGroup label="Schema & DB Ops">
            <RibbonDropdownButton 
                icon={<GitCommit className="text-indigo-600" />} 
                label="Schema & DB Ops" 
                menuHeader="Schema & Datenbank-Operationen"
                onMainClick={() => onAction('open_schema_diff')} 
                size="large"
                items={[
                    {
                        id: 'schema_diff',
                        label: 'Visueller Schema-Diff',
                        description: 'Vergleich mit gespeicherten Snapshots & Tabellenstrukturen',
                        icon: <GitCommit size={14} className="text-indigo-600" />,
                        onClick: () => onAction('open_schema_diff'),
                        badge: 'Diff',
                        badgeColor: 'indigo'
                    },
                    {
                        id: 'preflight_check',
                        label: 'Pre-Flight Risk Check',
                        description: 'Risikoanalyse & Zero-Downtime Validierung vor Ausführung',
                        icon: <ShieldCheck size={14} className="text-emerald-600" />,
                        onClick: () => onAction('open_schema_diff'),
                        badge: 'Sicher',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'migrations',
                        label: 'Migrationen & SQL Code',
                        description: 'Flyway, Liquibase & native DDL Migrationsskripte',
                        icon: <Database size={14} className="text-blue-600" />,
                        onClick: () => onAction('open_migrations'),
                        badge: 'DDL',
                        badgeColor: 'blue'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Live API & Mocking Dropdown Button Group */}
        <RibbonGroup label="Live API & Mocking">
            <RibbonDropdownButton 
                icon={<Globe className="text-emerald-600" />} 
                label="Live API & Mocking" 
                menuHeader="REST API & Simulation"
                onMainClick={() => onAction('open_openapi_mock')} 
                size="large"
                items={[
                    {
                        id: 'openapi_spec',
                        label: 'OpenAPI 3.1 & Swagger',
                        description: 'Interaktive Spezifikation & API-Dokumentation aller Endpunkte',
                        icon: <Globe size={14} className="text-emerald-600" />,
                        onClick: () => onAction('open_openapi_mock'),
                        badge: 'v3.1',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'mock_server',
                        label: 'Live Mock Server',
                        description: 'In-Browser REST-Server für sofortige Frontend-Tests mit Testdaten',
                        icon: <Radio size={14} className="text-teal-600" />,
                        onClick: () => onAction('open_openapi_mock'),
                        badge: 'Mock',
                        badgeColor: 'blue'
                    },
                    {
                        id: 'postman_curl',
                        label: 'Postman Collection & cURL',
                        description: 'Postman JSON & vorkonfigurierte cURL Befehle exportieren',
                        icon: <FileCode size={14} className="text-orange-600" />,
                        onClick: () => onAction('open_openapi_mock'),
                        badge: 'Export',
                        badgeColor: 'amber'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Security & Governance Dropdown Button Group */}
        <RibbonGroup label="Security & Data Gov">
            <RibbonDropdownButton 
                icon={<ShieldAlert className="text-rose-600" />} 
                label="Security & Data Gov" 
                menuHeader="Sicherheit & Data Governance"
                onMainClick={() => onAction('open_security_rls')} 
                size="large"
                items={[
                    {
                        id: 'rls_roles',
                        label: 'RLS & Rollen',
                        description: 'Row Level Security & Mandantentrennung für alle Tabellen',
                        icon: <ShieldAlert size={14} className="text-rose-600" />,
                        onClick: () => onAction('open_security_rls'),
                        badge: 'RLS',
                        badgeColor: 'rose'
                    },
                    {
                        id: 'crud_matrix',
                        label: 'CRUD Matrix',
                        description: 'Granulare Berechtigungen (Create, Read, Update, Delete) je Rolle',
                        icon: <ShieldCheck size={14} className="text-emerald-600" />,
                        onClick: () => onAction('open_security_rls'),
                        badge: 'Rollen',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'audit_trail',
                        label: 'Audit & Time-Travel',
                        description: 'Revisionssichere Änderungshistorie und Point-in-Time Wiederherstellung',
                        icon: <History size={14} className="text-purple-600" />,
                        onClick: () => onAction('open_audit_trail'),
                        badge: 'Audit',
                        badgeColor: 'purple'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Extensions Group */}
        <RibbonGroup label="Extensions">
            <RibbonDropdownButton 
                icon={<CircuitBoard className="text-purple-600" />} 
                label="Integrations Hub" 
                menuHeader="Erweiterungen & Schnittstellen"
                onMainClick={() => onAction('open_integrations')} 
                size="large"
                items={[
                    {
                        id: 'integrations_hub',
                        label: 'Integrations Hub',
                        description: 'Konnektoren, Webhooks & Drittanbieter-Anbindungen verwalten',
                        icon: <CircuitBoard size={14} className="text-purple-600" />,
                        onClick: () => onAction('open_integrations'),
                        badge: 'Hub',
                        badgeColor: 'purple'
                    },
                    {
                        id: 'ai_llm',
                        label: 'AI & LLM Services',
                        description: 'Gemini, OpenAI, Vector DB & KI-Funktionen für Datenbank & SDUI',
                        icon: <CloudLightning size={14} className="text-amber-500" />,
                        onClick: () => onAction('open_integrations'),
                        badge: 'AI',
                        badgeColor: 'amber'
                    },
                    {
                        id: 'chat_realtime',
                        label: 'Chat / Realtime Sync',
                        description: 'WebSockets, SSE & Echtzeit-Kollaboration für Multi-User',
                        icon: <Radio size={14} className="text-blue-500" />,
                        onClick: () => onAction('open_integrations'),
                        badge: 'Realtime',
                        badgeColor: 'blue'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Cloud & DevOps Dropdown Group */}
        <RibbonGroup label="Cloud & DevOps">
            <RibbonDropdownButton 
                icon={<UploadCloud className="text-indigo-600" />} 
                label="Cloud & DevOps" 
                menuHeader="Cloud Deployment & DevOps"
                onMainClick={() => onAction('open_docker_deployer')} 
                size="large"
                items={[
                    {
                        id: 'docker_compose_deployer',
                        label: '1-Klick Docker & Cloud Deployer',
                        description: 'Schlüsselfertige Multi-Container Setups (PostgreSQL, Redis, Nginx & APIs)',
                        icon: <Layers size={14} className="text-cyan-600" />,
                        onClick: () => onAction('open_docker_deployer'),
                        badge: '1-Klick',
                        badgeColor: 'teal'
                    },
                    {
                        id: 'cicd_pipeline_generator',
                        label: 'CI/CD Pipeline Generator (GitHub & GitLab)',
                        description: 'Automatisierte Multi-Arch Docker Builds, Tests & Cloud Run Deployment',
                        icon: <GitCommit size={14} className="text-blue-600" />,
                        onClick: () => onAction('open_cicd_pipeline'),
                        badge: 'CI/CD',
                        badgeColor: 'blue'
                    },
                    {
                        id: 'automation_n8n_zapier',
                        label: 'n8n & Zapier Workflow Export',
                        description: 'No-Code Automation Flows & Event-Bridges exportieren',
                        icon: <CloudLightning size={14} className="text-orange-600" />,
                        onClick: () => onAction('open_automation_modal'),
                        badge: 'NoCode',
                        badgeColor: 'amber'
                    },
                    {
                        id: 'webhook_ingestion_hub',
                        label: 'Webhook & Event Ingestion Hub',
                        description: 'Inbound Webhook-Listener & Schema-Validator für Drittanbieter',
                        icon: <Radio size={14} className="text-cyan-600" />,
                        onClick: () => onAction('open_webhook_hub'),
                        badge: 'Ingest',
                        badgeColor: 'teal'
                    },
                    {
                        id: 'cloud_deploy',
                        label: 'Cloud Deployment',
                        description: 'Vercel, AWS, Azure, GCP & Docker Container deployen',
                        icon: <UploadCloud size={14} className="text-indigo-600" />,
                        onClick: () => onAction('open_deployment_modal'),
                        badge: 'Cloud',
                        badgeColor: 'indigo'
                    },
                    {
                        id: 'self_host',
                        label: 'Self-Host & On-Premise',
                        description: 'Lokales Backend & Container-Instanz bereitstellen',
                        icon: <Server size={14} className="text-emerald-600" />,
                        onClick: () => onAction('dbstudio_backend'),
                        badge: 'Server',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'multi_db_sync',
                        label: 'Multi-DB Sync & Hybrid-Replikation',
                        description: 'Heterogene Replikation zwischen SQLite (Lokal) und PostgreSQL (Cloud)',
                        icon: <RefreshCw size={14} className="text-indigo-600" />,
                        onClick: () => onAction('open_sync_matrix'),
                        badge: 'Hybrid',
                        badgeColor: 'indigo'
                    },
                    {
                        id: 'offline_sync',
                        label: 'Offline Sync & PWA',
                        description: 'Offline-Replikation & IndexedDB Synchronisation',
                        icon: <RefreshCw size={14} className="text-teal-600" />,
                        onClick: () => onAction('open_offline_sync'),
                        badge: 'Sync',
                        badgeColor: 'teal'
                    },
                    {
                        id: 'environments',
                        label: 'Umgebungen & Staging',
                        description: 'Dev-, Staging- & Produktiv-Konfigurationen verwalten',
                        icon: <Server size={14} className="text-blue-600" />,
                        onClick: () => onAction('open_envs'),
                        badge: 'Stage',
                        badgeColor: 'blue'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Lokale Bridge (PC Execution Runner) Dropdown Group */}
        <RibbonGroup label="Lokale Ausführung">
            <RibbonDropdownButton 
                icon={<Laptop className={isBridgeOnline ? "text-emerald-600 animate-pulse" : "text-slate-400"} />} 
                label="Auf PC ausführen" 
                sublabel={isBridgeOnline ? `Online (${bridgeLabelText})` : `Offline (${bridgeLabelText})`}
                menuHeader={isRelayBridge ? 'PHP Relay Gateway & Local Runner' : `Lokale Bridge & Runner (${bridgeLabelText})`}
                onMainClick={() => onAction('deploy_to_bridge')} 
                size="large"
                className={isBridgeOnline ? "ring-2 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20" : ""}
                items={[
                    {
                        id: 'bridge_run',
                        label: 'Auf lokalem PC starten',
                        description: 'Vollständige App auf lokalem Rechner kompilieren & ausführen',
                        icon: <Laptop size={14} className="text-emerald-600" />,
                        onClick: () => onAction('deploy_to_bridge'),
                        badge: isBridgeOnline ? 'Online' : 'Offline',
                        badgeColor: isBridgeOnline ? 'emerald' : 'rose'
                    },
                    {
                        id: 'bridge_terminal',
                        label: 'Live-Konsole & Terminal',
                        description: 'Echtzeit-Terminalausgabe, Build-Logs & Prozess-Status',
                        icon: <Terminal size={14} className="text-indigo-600" />,
                        onClick: () => onAction('open_bridge_runner'),
                        badge: 'Logs',
                        badgeColor: 'indigo'
                    },
                    {
                        id: 'bridge_store',
                        label: 'Shared Store (Aktiv)',
                        description: 'Gemeinsamer npm/NuGet Cache & Offline-Abhängigkeiten',
                        icon: <Layers size={14} className="text-emerald-600" />,
                        onClick: () => onAction('open_bridge_options'),
                        badge: 'Shared',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'bridge_settings',
                        label: 'Bridge-Einstellungen',
                        description: 'Port, Authentifizierungstoken & Runner-Optionen konfigurieren',
                        icon: <Settings size={14} className="text-slate-600" />,
                        onClick: () => onAction('open_bridge_options'),
                        badge: bridgeLabelText,
                        badgeColor: 'blue'
                    }
                ]}
            />
        </RibbonGroup>

        {/* WordPress Plugin Generator Dropdown Group */}
        <RibbonGroup label="WordPress">
            <RibbonDropdownButton 
                icon={<Package className="text-blue-600" />} 
                label="WP Plugin Gen" 
                sublabel="Forms & REST"
                menuHeader="WordPress Plugin & REST Generator"
                onMainClick={() => onAction('open_wordpress_generator')} 
                size="large"
                items={[
                    {
                        id: 'wp_studio',
                        label: 'WP Plugin Studio',
                        description: 'Visueller Generator für Custom Post Types, Tabellen & Admin-Menüs',
                        icon: <Package size={14} className="text-blue-600" />,
                        onClick: () => onAction('open_wordpress_generator'),
                        badge: 'Studio',
                        badgeColor: 'blue'
                    },
                    {
                        id: 'wp_zip',
                        label: 'Plugin ZIP herunterladen',
                        description: 'Installationsbereites .zip Archiv für WordPress 6.x erstellen',
                        icon: <Download size={14} className="text-indigo-600" />,
                        onClick: () => onAction('open_wordpress_generator'),
                        badge: 'ZIP',
                        badgeColor: 'indigo'
                    },
                    {
                        id: 'wp_shortcodes',
                        label: 'Shortcodes & Block Widgets',
                        description: 'Gutenberg-Blöcke & PHP-Shortcodes für Tabellen & Formulare',
                        icon: <FileCode size={14} className="text-emerald-600" />,
                        onClick: () => onAction('open_wordpress_generator'),
                        badge: 'Code',
                        badgeColor: 'emerald'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Export Dropdown Group */}
        <RibbonGroup label="Export" isLast>
            <RibbonDropdownButton 
                icon={<Download className="text-emerald-600" />} 
                label="Export & ZIP" 
                sublabel="Codegenerierung"
                menuHeader="Projekt-Export & Quellcode"
                onMainClick={() => onAction('backend_generate')} 
                size="large"
                items={[
                    {
                        id: 'export_code',
                        label: 'Codegenerierung starten',
                        description: 'Backend- & Frontend-Dateien gemäß Ziel-Stack kompilieren',
                        icon: <FileCode size={14} className="text-emerald-600" />,
                        onClick: () => onAction('backend_generate'),
                        badge: 'Code',
                        badgeColor: 'emerald'
                    },
                    {
                        id: 'export_zip',
                        label: 'Projekt als ZIP exportieren',
                        description: 'Gesamte Projektstruktur inklusive Configs & DDL als ZIP sichern',
                        icon: <Download size={14} className="text-blue-600" />,
                        onClick: () => onAction('backend_export'),
                        badge: 'ZIP',
                        badgeColor: 'blue'
                    }
                ]}
            />
        </RibbonGroup>

        {/* Generator settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-[520px] max-w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Generator & Backend-Konfiguration</h3>
                    <p className="text-[11px] text-slate-500">Passen Sie die Ziel-Technologien und Netzwerk-Ports an</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-200 bg-white">
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'backend' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('backend')}
                >
                  Backend
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'frontend' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('frontend')}
                >
                  Frontend
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'connection' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('connection')}
                >
                  Connection String
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs h-[400px]">
                
                {activeTab === 'backend' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Datenbanktyp</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.dbType}
                            onChange={e => setBackendConfig({ ...backendConfig, dbType: e.target.value as DbType })}
                        >
                            <option value="SQL">SQL Server</option>
                            <option value="MySQL">MySQL</option>
                            <option value="SQLite">SQLite</option>
                            <option value="PostgreSQL">PostgreSQL</option>
                            <option value="NoSQL">NoSQL (Mongo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Backend-Technologie</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.language}
                            onChange={e => {
                                const lang = e.target.value as any;
                                let newFrontend = backendConfig.frontendFramework;
                                if (lang !== 'dotnet' && ['blazor', 'mudblazor', 'maui', 'maui-native'].includes(newFrontend)) {
                                    newFrontend = 'react';
                                }
                                const updatedConfig = { ...backendConfig, language: lang, frontendFramework: newFrontend };
                                if (lang === 'electron') {
                                    updatedConfig.deploymentConfig = {
                                        ...(backendConfig.deploymentConfig || { target: 'electron' }),
                                        target: 'electron'
                                    };
                                } else if (lang === 'tauri') {
                                    updatedConfig.deploymentConfig = {
                                        ...(backendConfig.deploymentConfig || { target: 'tauri' }),
                                        target: 'tauri'
                                    };
                                } else if (backendConfig.language === 'electron' || backendConfig.language === 'tauri') {
                                    if (backendConfig.deploymentConfig?.target === 'electron' || backendConfig.deploymentConfig?.target === 'tauri') {
                                        updatedConfig.deploymentConfig = {
                                            ...backendConfig.deploymentConfig,
                                            target: 'docker'
                                        };
                                    }
                                }
                                setBackendConfig(updatedConfig);
                            }}
                        >
                            <option value="dotnet">.NET API</option>
                            <option value="nodejs">Node.js</option>
                            <option value="python">Python</option>
                            <option value="php">PHP</option>
                            <option value="laravel">Laravel</option>
                            <option value="electron">Electron</option>
                            <option value="tauri">Tauri (Rust)</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditional .NET Version option */}
                    {backendConfig.language === 'dotnet' && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <label className="block font-bold text-slate-700 mb-1">.NET SDK Version</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-mono text-blue-700 focus:outline-none focus:border-blue-500"
                            value={backendConfig.backendVersion || '9.0'}
                            onChange={e => setBackendConfig({ ...backendConfig, backendVersion: e.target.value })}
                        >
                            <option value="9.0">9.0 (Empfohlen für Visual Studio 2022)</option>
                            <option value="8.0">8.0 (LTS - Long Term Support)</option>
                            <option value="10.0">10.0 (Preview / VS v18+)</option>
                            <option value="7.0">7.0</option>
                            <option value="6.0">6.0 (LTS)</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Wählen Sie 9.0 oder 8.0 passend zu Ihrem lokal installierten .NET SDK in Visual Studio 2022.
                        </p>
                      </div>
                    )}

                    {/* Protocol Selector for Swagger (HTTP / HTTPS / Both) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <label className="block font-bold text-slate-700">Entwicklungs-Protokolle & Swagger</label>
                      <div className="grid grid-cols-1 gap-2">
                        <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                          value={backendConfig.protocolMode || 'both'}
                          onChange={e => setBackendConfig({ ...backendConfig, protocolMode: e.target.value as any })}
                        >
                          <option value="both">HTTP & HTTPS gleichzeitig zur Auswahl anbieten (Standard)</option>
                          <option value="http">Nur HTTP einsetzen (z.B. http://localhost:5000)</option>
                          <option value="https">Nur HTTPS einsetzen (z.B. https://localhost:5001)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="checkbox"
                          id="useSwaggerCheckbox"
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          checked={backendConfig.useSwagger}
                          onChange={e => setBackendConfig({ ...backendConfig, useSwagger: e.target.checked })}
                        />
                        <label htmlFor="useSwaggerCheckbox" className="font-semibold text-slate-700 cursor-pointer select-none">
                          Swagger / OpenAPI Dokumentation aktivieren und beim Starten anzeigen
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">API Port (Localhost)</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.port}
                            onChange={e => setBackendConfig({ ...backendConfig, port: parseInt(e.target.value) || 5000 })}
                        />
                        {backendConfig.language === 'dotnet' && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">HTTPS Port: {backendConfig.port + 1}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'frontend' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Frontend-Framework</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.frontendFramework}
                            onChange={e => {
                                const fw = e.target.value as FrontendFramework;
                                const updatedConfig = { 
                                    ...backendConfig, 
                                    frontendFramework: fw,
                                    frontendPort: getDefaultPort(fw)
                                };
                                setBackendConfig(updatedConfig);
                            }}
                        >
                            {backendConfig.language === 'dotnet' && (
                              <optgroup label=".NET Exklusive Frontends">
                                <option value="blazor">Blazor (Bootstrap 5 WASM)</option>
                                <option value="mudblazor">MudBlazor (Material Design WASM)</option>
                                <option value="maui">.NET MAUI (Blazor Hybrid)</option>
                                <option value="maui-native">.NET MAUI (XAML / Native)</option>
                              </optgroup>
                            )}
                            <optgroup label="Universelle Web-Frontends">
                              <option value="react">React</option>
                              <option value="vue">Vue.js</option>
                              <option value="angular-modern">Angular 19 (Standalone &amp; Signals)</option>
                              <option value="angular">Angular (Klassisch / NgModule)</option>
                              <option value="none">Keins (Nur API)</option>
                            </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Styling Framework</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.stylingFramework || 'tailwind'}
                            onChange={e => {
                                const fw = e.target.value as any;
                                setBackendConfig({ ...backendConfig, stylingFramework: fw });
                            }}
                        >
                            <option value="tailwind">Tailwind CSS</option>
                            <option value="bootstrap">Bootstrap</option>
                            <option value="none">Keins / Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Frontend Port (Localhost)</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.frontendPort || 3000}
                            onChange={e => setBackendConfig({ ...backendConfig, frontendPort: parseInt(e.target.value) || 3000 })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'connection' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Verbindungszeichenfolge (Connection String)</h4>
                      <p className="text-slate-500 text-[11px] mb-3">Geben Sie die Verbindungszeichenfolge für die Datenbank an. Diese wird im Backend konfiguriert.</p>
                      
                      <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        placeholder="Server=localhost;Database=my_db;User Id=root;Password=***;"
                        value={backendConfig.dbConnection || ''}
                        onChange={e => setBackendConfig({ ...backendConfig, dbConnection: e.target.value })}
                      />

                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => {
                            setShowSettingsModal(false);
                            onOpenSettings();
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                        >
                          <Database size={12} />
                          Erweiterten Assistenten öffnen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> Speichern & Schließen
                </button>
              </div>

            </div>
          </div>
        )}
    </div>
  );
};
