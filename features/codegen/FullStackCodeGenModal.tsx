import React, { useState } from 'react';
import { X, Code2, Download, Copy, Check, Terminal, Cpu, Layers, Server, Globe, FileCode, ShieldCheck, Database, Box } from 'lucide-react';
import { Table, Relationship } from '../../types';
import { generateDotNet10Solution } from '../../utils/generators/dotnet10Generator';
import { generateNodeBackendProject } from '../../utils/generators/nodeNestFastifyGenerator';
import { generatePhpLaravelProject } from '../../utils/generators/phpLaravelFilamentGenerator';
import { generatePythonFastApiProject } from '../../utils/generators/pythonFastApiGenerator';
import { generateModernFrontendProject } from '../../utils/generators/frontendModernGenerator';
import { generateWordPressPlugin } from '../../utils/generators/wordpressGenerator';
import { generateNextcloudApp } from '../../utils/generators/nextcloudGenerator';
import { generateStrapiV5Project, generateDirectusProject } from '../../utils/generators/strapiDirectusGenerator';
import {
  generateFilamentV3ResourceProject,
  generateNextjsRefineAdminProject,
  generateSupabasePocketbaseBootstrap,
} from '../../utils/generators/adminDashboardsGenerator';
import { generateDevOpsArtifacts } from '../../utils/generators/devOpsOpenApiGenerator';
import { saveCodeProjectToIndexedDB } from '../../utils/generators/services/codeGenIndexedDBService';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';

interface FullStackCodeGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  relationships: Relationship[];
}

export type CodeGenStack =
  | 'DOTNET_10'
  | 'NODE_NEST'
  | 'PHP_LARAVEL'
  | 'FILAMENT_V3'
  | 'NEXTJS_REFINE'
  | 'SUPABASE_POCKETBASE'
  | 'PYTHON_FASTAPI'
  | 'REACT_19'
  | 'ANGULAR_19'
  | 'VUE_35'
  | 'SVELTE_5'
  | 'WORDPRESS_PLUGIN'
  | 'NEXTCLOUD_APP'
  | 'STRAPI_V5'
  | 'DIRECTUS_10'
  | 'DEVOPS_OPENAPI';

export const FullStackCodeGenModal: React.FC<FullStackCodeGenModalProps> = ({
  isOpen,
  onClose,
  tables,
  relationships,
}) => {
  const [activeStack, setActiveStack] = useState<CodeGenStack>('DOTNET_10');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let generatedFiles: Record<string, string> = {};

  switch (activeStack) {
    case 'DOTNET_10':
      generatedFiles = generateDotNet10Solution(tables, relationships, {
        projectName: 'EnterpriseSolution',
        useCleanArchitecture: true,
        useFastEndpoints: true,
        useNativeAot: true,
      });
      break;
    case 'NODE_NEST':
      generatedFiles = generateNodeBackendProject(tables, relationships, {
        framework: 'FASTIFY',
        orm: 'DRIZZLE',
        useZod: true,
        useSwagger: true,
      });
      break;
    case 'PHP_LARAVEL':
      generatedFiles = generatePhpLaravelProject(tables, relationships, {
        framework: 'LARAVEL_11',
        useFilamentV3: true,
        usePestPhp: true,
      });
      break;
    case 'FILAMENT_V3':
      generatedFiles = generateFilamentV3ResourceProject(tables, relationships);
      break;
    case 'NEXTJS_REFINE':
      generatedFiles = generateNextjsRefineAdminProject(tables, relationships);
      break;
    case 'SUPABASE_POCKETBASE':
      generatedFiles = generateSupabasePocketbaseBootstrap(tables, relationships);
      break;
    case 'PYTHON_FASTAPI':
      generatedFiles = generatePythonFastApiProject(tables, relationships, {
        useAlembic: true,
        usePytest: true,
        useTestcontainers: true,
      });
      break;
    case 'REACT_19':
      generatedFiles = generateModernFrontendProject(tables, { framework: 'REACT_19' });
      break;
    case 'ANGULAR_19':
      generatedFiles = generateModernFrontendProject(tables, { framework: 'ANGULAR_19' });
      break;
    case 'VUE_35':
      generatedFiles = generateModernFrontendProject(tables, { framework: 'VUE_35' });
      break;
    case 'SVELTE_5':
      generatedFiles = generateModernFrontendProject(tables, { framework: 'SVELTE_5' });
      break;
    case 'WORDPRESS_PLUGIN': {
      const vFiles = generateWordPressPlugin(tables);
      generatedFiles = vFiles.reduce((acc, f) => {
        acc[f.path] = f.content;
        return acc;
      }, {} as Record<string, string>);
      break;
    }
    case 'NEXTCLOUD_APP': {
      const vFiles = generateNextcloudApp(tables);
      generatedFiles = vFiles.reduce((acc, f) => {
        acc[f.path] = f.content;
        return acc;
      }, {} as Record<string, string>);
      break;
    }
    case 'STRAPI_V5':
      generatedFiles = generateStrapiV5Project(tables, relationships, { projectName: 'EnterpriseStrapi' });
      break;
    case 'DIRECTUS_10':
      generatedFiles = generateDirectusProject(tables, relationships, { projectName: 'EnterpriseDirectus' });
      break;
    case 'DEVOPS_OPENAPI':
      generatedFiles = generateDevOpsArtifacts('Enterprise App', tables);
      break;
  }

  const filePaths = Object.keys(generatedFiles);
  const currentPath = selectedFilePath && generatedFiles[selectedFilePath] ? selectedFilePath : filePaths[0] || '';
  const fileContent = generatedFiles[currentPath] || '';

  const { requireConfirmation } = useDisclaimerStore();

  const handleCopy = () => {
    requireConfirmation(`Code-Kopie (${activeStack})`, () => {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSaveToIndexedDB = () => {
    requireConfirmation(`IndexedDB Quellcode-Sicherung (${activeStack})`, async () => {
      await saveCodeProjectToIndexedDB({
        id: `proj_${Date.now()}`,
        projectName: `Project_${activeStack}`,
        targetStack: activeStack,
        generatedAt: Date.now(),
        filesCount: filePaths.length,
        zipSizeKb: Math.round(JSON.stringify(generatedFiles).length / 1024),
        filesJson: JSON.stringify(generatedFiles),
      });
      alert('Projekt erfolgreich in IndexedDB gespeichert!');
    });
  };

  const handleDownloadFile = () => {
    requireConfirmation(`Datei-Export (${currentPath.split('/').pop() || activeStack})`, () => {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentPath.split('/').pop() || 'code.txt';
      a.click();
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Code2 size={20} className="text-emerald-400" />
            <h3 className="font-bold text-base">Full-Stack & Clean Architecture Code-Generierungs-Engine</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stack Selection Tabs */}
        <div className="bg-slate-100 border-b border-slate-300 p-2 flex gap-1 overflow-x-auto text-xs shrink-0">
          {[
            { id: 'DOTNET_10', label: 'C# .NET 10 EF Core', icon: Cpu },
            { id: 'NODE_NEST', label: 'Node.js Fastify / Drizzle', icon: Server },
            { id: 'PHP_LARAVEL', label: 'PHP 8.4 Laravel', icon: FileCode },
            { id: 'FILAMENT_V3', label: 'Filament v3 Admin Panel', icon: Layers },
            { id: 'NEXTJS_REFINE', label: 'Next.js 15 & Refine Admin', icon: Globe },
            { id: 'SUPABASE_POCKETBASE', label: 'Supabase RLS & PocketBase', icon: Database },
            { id: 'PYTHON_FASTAPI', label: 'Python FastAPI / SQLAlchemy', icon: Terminal },
            { id: 'REACT_19', label: 'React 19 TanStack v5', icon: Globe },
            { id: 'ANGULAR_19', label: 'Angular 19 Signals', icon: Layers },
            { id: 'VUE_35', label: 'Vue 3.5 Pinia', icon: Globe },
            { id: 'SVELTE_5', label: 'Svelte 5 Runes', icon: Globe },
            { id: 'WORDPRESS_PLUGIN', label: 'WordPress Plugin (CPT/ACF/Gutenberg)', icon: FileCode },
            { id: 'NEXTCLOUD_APP', label: 'Nextcloud OCP App', icon: Layers },
            { id: 'STRAPI_V5', label: 'Strapi v5 Headless CMS', icon: Box },
            { id: 'DIRECTUS_10', label: 'Directus 10 Schema Engine', icon: Database },
            { id: 'DEVOPS_OPENAPI', label: 'OpenAPI / Docker / CI-CD', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveStack(tab.id as CodeGenStack);
                  setSelectedFilePath('');
                }}
                className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition shrink-0 ${
                  activeStack === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Split Layout: Explorer (Left) & Code Editor Preview (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-300 p-3 overflow-y-auto text-xs space-y-1">
            <div className="font-bold text-slate-500 text-[10px] uppercase mb-2">Generierte Dateistruktur</div>
            {filePaths.map((path) => (
              <button
                key={path}
                onClick={() => setSelectedFilePath(path)}
                className={`w-full text-left px-2.5 py-1.5 rounded font-mono text-[11px] truncate block transition ${
                  currentPath === path
                    ? 'bg-blue-100 text-blue-900 font-bold border border-blue-300'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                {path}
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center text-xs font-mono shrink-0">
              <span className="text-emerald-400 font-bold">{currentPath}</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Kopiert' : 'Code Kopieren'}</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs whitespace-pre text-slate-200 selection:bg-blue-700 selection:text-white">
              {fileContent}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-between items-center shrink-0">
          <button
            onClick={handleSaveToIndexedDB}
            className="px-3.5 py-1.5 rounded bg-slate-800 text-white font-bold hover:bg-slate-900 text-xs"
          >
            In IndexedDB speichern
          </button>

          <div className="flex gap-2 text-xs">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
              Schließen
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download size={14} />
              <span>Datei herunterladen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
