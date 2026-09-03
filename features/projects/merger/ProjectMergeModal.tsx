import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { getTemplates } from '../../../data/templates/index';
import { getAllProjects, getProjectById, saveProjectToStorage } from '../../../services/storageService';
import { ProjectMergerService } from '../../../services/projectMergerService';
import { MergeSourceItem, MergeStrategy, MergePreflightAnalysis, CrossDomainBridgeOption } from './types';
import { SourceSelectionStep } from './components/SourceSelectionStep';
import { StrategyConfigStep } from './components/StrategyConfigStep';
import { ConflictPreflightStep } from './components/ConflictPreflightStep';
import { Project, DbType } from '../../../types/index';
import { GitMerge, X, ArrowRight, ArrowLeft, Check, Layers, ShieldCheck, Sparkles } from 'lucide-react';

interface ProjectMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMergeModal: React.FC<ProjectMergeModalProps> = ({ isOpen, onClose }) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sources, setSources] = useState<MergeSourceItem[]>([]);
  const [strategy, setStrategy] = useState<MergeStrategy>('prefix');
  const [newProjectName, setNewProjectName] = useState<string>('Enterprise Construction & ERP Suite');
  const [createAsNewProject, setCreateAsNewProject] = useState<boolean>(true);
  const [bridges, setBridges] = useState<CrossDomainBridgeOption[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load candidate templates and saved projects on mount
  useEffect(() => {
    if (!isOpen) return;

    const templates = getTemplates('de');
    const initialSources: MergeSourceItem[] = [];

    // Pre-populate with relevant templates (e.g. E-Commerce and Project Management)
    const ecomTpl = templates.find(t => t.id === 'ecommerce_orders');
    const pmTpl = templates.find(t => t.id === 'pm_taskboard');

    if (ecomTpl) {
      initialSources.push({
        id: ecomTpl.id,
        name: ecomTpl.name,
        type: 'template',
        project: {
          id: ecomTpl.id,
          name: ecomTpl.name,
          lastModified: Date.now(),
          data: ecomTpl.data
        },
        selected: true,
        domainPrefix: 'ecom',
        color: 'emerald',
        tableCount: ecomTpl.data.tables.length,
        relationCount: (ecomTpl.data.relationships || []).length
      });
    }

    if (pmTpl) {
      initialSources.push({
        id: pmTpl.id,
        name: pmTpl.name,
        type: 'template',
        project: {
          id: pmTpl.id,
          name: pmTpl.name,
          lastModified: Date.now(),
          data: pmTpl.data
        },
        selected: true,
        domainPrefix: 'pm',
        color: 'indigo',
        tableCount: pmTpl.data.tables.length,
        relationCount: (pmTpl.data.relationships || []).length
      });
    }

    // Load user's saved projects from storage
    getAllProjects().then(metaList => {
      const otherProjects = metaList.filter(m => m.id !== store.projectId);
      otherProjects.slice(0, 4).forEach(m => {
        getProjectById(m.id).then(fullProj => {
          if (fullProj && fullProj.data?.tables) {
            setSources(prev => {
              if (prev.some(x => x.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  name: m.name,
                  type: 'saved_project',
                  project: fullProj,
                  selected: false,
                  domainPrefix: m.name.substring(0, 4).toLowerCase(),
                  color: 'cyan',
                  tableCount: fullProj.data.tables.length,
                  relationCount: (fullProj.data.relationships || []).length
                }
              ];
            });
          }
        });
      });
    });

    setSources(initialSources);
    setStep(1);
  }, [isOpen, store.projectId]);

  // Current active project as target
  const currentTargetProject: Project = useMemo(() => ({
    id: store.projectId || 'current_project',
    name: store.projectName || 'Aktuelles Projekt',
    lastModified: Date.now(),
    data: {
      backendConfig: store.backendConfig || {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'CurrentProject',
        port: 5000,
        frontendPort: 3000,
        dbConnection: 'Server=localhost;Database=CurrentProject;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react'
      },
      tables: store.tables || [],
      relationships: store.relationships || [],
      queries: store.queries || [],
      forms: store.forms || [],
      reports: store.reports || [],
      layout: store.layout || [],
      tableGroups: store.tableGroups || []
    }
  }), [store]);

  // Preflight analysis recalculation
  const preflightAnalysis: MergePreflightAnalysis = useMemo(() => {
    const active = sources.filter(s => s.selected);
    const analysis = ProjectMergerService.analyzePreflight(currentTargetProject, active);
    if (bridges.length > 0) {
      analysis.crossDomainBridges = bridges;
    }
    return analysis;
  }, [currentTargetProject, sources, bridges]);

  // Sync discovered bridges
  useEffect(() => {
    const active = sources.filter(s => s.selected);
    const analysis = ProjectMergerService.analyzePreflight(currentTargetProject, active);
    setBridges(analysis.crossDomainBridges);
  }, [sources, currentTargetProject]);

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const updateSourcePrefix = (id: string, prefix: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, domainPrefix: prefix } : s));
  };

  const updateSourceColor = (id: string, color: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  };

  const addTemplateAsSource = (tplId: string) => {
    const tpl = getTemplates('de').find(t => t.id === tplId);
    if (!tpl) return;
    setSources(prev => [
      ...prev,
      {
        id: tpl.id,
        name: tpl.name,
        type: 'template',
        project: {
          id: tpl.id,
          name: tpl.name,
          lastModified: Date.now(),
          data: tpl.data
        },
        selected: true,
        domainPrefix: tpl.id.split('_')[0] || 'dom',
        color: 'purple',
        tableCount: tpl.data.tables.length,
        relationCount: (tpl.data.relationships || []).length
      }
    ]);
  };

  const toggleBridge = (bridgeId: string) => {
    setBridges(prev => prev.map(b => b.id === bridgeId ? { ...b, enabled: !b.enabled } : b));
  };

  const handleExecuteMerge = async () => {
    setIsProcessing(true);
    try {
      const activeSources = sources.filter(s => s.selected);
      const result = ProjectMergerService.executeMerge(currentTargetProject, {
        strategy,
        newProjectName,
        createAsNewProject,
        activeSources,
        enabledBridges: bridges.filter(b => b.enabled)
      });

      if (createAsNewProject) {
        // Save as a new consolidated project and load it
        await store.createNew(
          DbType.SQL,
          newProjectName,
          result.mergedProject.data.backendConfig,
          result.mergedProject.data
        );
        ui.addToast(`Neues Multi-Domänen-Projekt "${newProjectName}" erfolgreich erstellt!`, 'success');
      } else {
        // Merge in-place into active project
        store.executeAction(s => {
          s.tables = result.mergedProject.data.tables;
          s.relationships = result.mergedProject.data.relationships;
          s.queries = result.mergedProject.data.queries;
          s.forms = result.mergedProject.data.forms;
          s.reports = result.mergedProject.data.reports;
          s.layout = result.mergedProject.data.layout;
          s.tableGroups = result.mergedProject.data.tableGroups;
        });
        await store.saveProject();
        ui.addToast(`${result.tablesAdded} Tabellen & ${result.relationshipsCreated} Relationen erfolgreich integriert!`, 'success');
      }

      onClose();
    } catch (err: any) {
      console.error('Merge error:', err);
      ui.addToast('Fehler bei der Zusammenführung: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Projekt & Domänen-Zusammenführung
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 font-mono">
                  FEDERATION V2
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Mehrere relationale Domänen, Schemas und Vorlagen nahtlos konsolidieren
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-medium ${step === 1 ? 'text-indigo-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>1</span>
              <span>Quellen auswählen</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-2 font-medium ${step === 2 ? 'text-indigo-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>2</span>
              <span>Strategie & Präfixe</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-2 font-medium ${step === 3 ? 'text-indigo-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>3</span>
              <span>Konflikt-Preflight & Brücken</span>
            </div>
          </div>
          <div className="text-slate-400 text-xs">Schritt {step} von 3</div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <SourceSelectionStep
              sources={sources}
              currentProjectName={currentTargetProject.name}
              onToggleSource={toggleSource}
              availableTemplates={getTemplates('de').map(t => ({
                id: t.id,
                name: t.name,
                category: t.category,
                description: t.description,
                tableCount: t.data.tables.length
              }))}
              onAddTemplateAsSource={addTemplateAsSource}
            />
          )}

          {step === 2 && (
            <StrategyConfigStep
              strategy={strategy}
              setStrategy={setStrategy}
              sources={sources.filter(s => s.selected)}
              onUpdateSourcePrefix={updateSourcePrefix}
              onUpdateSourceColor={updateSourceColor}
              newProjectName={newProjectName}
              setNewProjectName={setNewProjectName}
              createAsNewProject={createAsNewProject}
              setCreateAsNewProject={setCreateAsNewProject}
            />
          )}

          {step === 3 && (
            <ConflictPreflightStep
              analysis={preflightAnalysis}
              onToggleBridge={toggleBridge}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-700 flex items-center justify-between">
          <button
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1) as any)}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Abbrechen
            </button>

            {step < 3 ? (
              <button
                disabled={sources.filter(s => s.selected).length === 0}
                onClick={() => setStep(prev => Math.min(3, prev + 1) as any)}
                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                Weiter <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={isProcessing}
                onClick={handleExecuteMerge}
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                {isProcessing ? 'Wird zusammengeführt...' : 'Zusammenführung jetzt ausführen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
