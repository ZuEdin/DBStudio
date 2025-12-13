
import React, { useState, useEffect } from 'react';
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report } from '../../types/index';
import Editor from '@monaco-editor/react';
import { FileCode, Download, Wand2, Folder, FolderOpen, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { generateBackendCode } from '../../utils/backendGenerators';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';

interface BackendViewProps {
  tables: Table[];
  relationships: Relationship[];
  queries: Query[];
  forms?: Form[]; 
  reports?: Report[]; // Add reports prop
  exportTrigger: number;
  generateTrigger: number;
  config: BackendConfig;
}

// Helper types for tree structure
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  file?: VirtualFile;
}

const buildFileTree = (files: VirtualFile[]): TreeNode[] => {
  const root: TreeNode[] = [];
  
  files.forEach(file => {
    // Standardize path separators
    const parts = file.path.replace(/\\/g, '/').split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      
      let existingNode = currentLevel.find(n => n.name === part);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path: path,
          type: isFile ? 'file' : 'folder',
          children: [],
          file: isFile ? file : undefined
        };
        currentLevel.push(existingNode);
      }
      
      currentLevel = existingNode.children;
    });
  });

  // Recursive sort: Folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
      });
      nodes.forEach(n => sortNodes(n.children));
  };
  
  sortNodes(root);
  return root;
};

// Recursive Component for rendering Tree
const FileTreeItem: React.FC<{ 
  node: TreeNode, 
  level: number, 
  selectedPath: string | undefined,
  onSelect: (file: VirtualFile) => void 
}> = ({ node, level, selectedPath, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = node.type === 'file' && node.file?.path === selectedPath;
    
    const handleClick = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else if (node.file) {
            onSelect(node.file);
        }
    };

    const getIcon = () => {
        if (node.type === 'folder') {
            return isOpen ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />;
        }
        // File Icons
        if (node.name.endsWith('.cs')) return <FileCode size={14} className="text-green-600" />;
        if (node.name.endsWith('.ts')) return <FileCode size={14} className="text-blue-500" />;
        if (node.name.endsWith('.js')) return <FileCode size={14} className="text-yellow-500" />;
        if (node.name.endsWith('.json')) return <FileCode size={14} className="text-orange-500" />;
        if (node.name.endsWith('.html')) return <FileCode size={14} className="text-red-500" />;
        if (node.name.endsWith('.css')) return <FileCode size={14} className="text-sky-400" />;
        if (node.name.endsWith('.php')) return <FileCode size={14} className="text-purple-500" />;
        return <FileCode size={14} className="text-slate-500" />;
    };

    return (
        <div>
            <div 
                className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none text-sm whitespace-nowrap ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={handleClick}
            >
                <span className="text-slate-400">
                    {node.type === 'folder' && (
                        isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    )}
                    {node.type === 'file' && <div className="w-3" />}
                </span>
                {getIcon()}
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isOpen && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem 
                            key={child.path} 
                            node={child} 
                            level={level + 1} 
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const BackendView: React.FC<BackendViewProps> = ({ tables, relationships, queries, forms = [], reports = [], exportTrigger, generateTrigger, config }) => {
  const [generatedFiles, setGeneratedFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);

  // Regenerate when ANY data changes or trigger happens
  useEffect(() => {
    handleGenerate();
  }, [generateTrigger, tables, relationships, queries, config]); 

  useEffect(() => {
      if(exportTrigger > 0) {
          handleExportZip();
      }
  }, [exportTrigger]);

  useEffect(() => {
      setFileTree(buildFileTree(generatedFiles));
  }, [generatedFiles]);

  const handleGenerate = () => {
    try {
        // Pass forms AND reports to generator
        const files = generateBackendCode(tables, relationships, queries, config, forms, reports);
        setGeneratedFiles(files);
        
        // Keep selection if file still exists, else select first reasonable entry point
        if (!selectedFile || !files.find(f => f.path === selectedFile.path)) {
            const entry = files.find(f => f.name === 'Program.cs' || f.name === 'server.js' || f.name === 'index.php') || files[0];
            setSelectedFile(entry || null);
        } else {
            const updated = files.find(f => f.path === selectedFile.path);
            if(updated && updated.content !== selectedFile.content) {
                setSelectedFile(updated);
            }
        }
    } catch (error) {
        console.error("Code Generation Error:", error);
    }
  };

  const handleExportZip = async () => {
    if (generatedFiles.length === 0) {
        alert("Keine Dateien zum Exportieren vorhanden. Bitte generieren Sie zuerst den Code.");
        return;
    }
    const zip = new JSZip();
    
    generatedFiles.forEach(file => {
      zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}_FullStack.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAiRefactor = async () => {
      if (!selectedFile || !aiPrompt) return;
      setIsAiProcessing(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `Du bist ein Senior Developer. Hier ist der Code der Datei '${selectedFile.name}' (${selectedFile.language}).
              Projekt-Kontext: ${config.language}, ${config.projectName}.
              
              Code:
              ${selectedFile.content}
              
              Aufgabe: ${aiPrompt}
              
              Gib NUR den kompletten, neuen Code zurück, ohne Markdown-Formatierung.`
          });
          
          const newCode = response.text?.trim() || selectedFile.content;
          
          // Remove Markdown block if AI adds it
          const cleanCode = newCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

          const newFiles = generatedFiles.map(f => f.path === selectedFile.path ? { ...f, content: cleanCode } : f);
          setGeneratedFiles(newFiles);
          setSelectedFile({ ...selectedFile, content: cleanCode });
          setAiPrompt('');
      } catch (error) {
          console.error("AI Error", error);
          alert("Fehler bei der AI-Anfrage.");
      }
      setIsAiProcessing(false);
  };

  return (
    <div className="flex h-full bg-slate-100">
      {/* File Explorer Sidebar */}
      <div className="w-72 flex flex-col border-r border-slate-300 bg-slate-50">
        <div className="p-3 border-b border-slate-200 bg-slate-100 font-bold text-xs text-slate-600 uppercase tracking-wider flex justify-between items-center">
            <span>Projekt Explorer</span>
            <div className="flex items-center gap-2">
                <button onClick={handleGenerate} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Neu generieren">
                    <RefreshCw size={12} />
                </button>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">{generatedFiles.length} Dateien</span>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
            {fileTree.length > 0 ? (
                fileTree.map(node => (
                    <FileTreeItem 
                        key={node.path} 
                        node={node} 
                        level={0} 
                        selectedPath={selectedFile?.path}
                        onSelect={setSelectedFile}
                    />
                ))
            ) : (
                <div className="p-4 text-center text-slate-400 text-sm">
                    Keine Dateien generiert. Klicken Sie auf "Generieren" im Menüband.
                </div>
            )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="h-9 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
                <FileCode size={14} className="text-slate-400" />
                <span className="font-mono text-sm text-slate-700 font-medium">{selectedFile?.path}</span>
            </div>
            <button onClick={handleExportZip} className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1 transition-colors">
                <Download size={14}/> Download
            </button>
        </div>
        
        {/* Monaco Editor */}
        <div className="flex-1 relative">
            {selectedFile ? (
                <Editor
                    height="100%"
                    language={selectedFile.language}
                    value={selectedFile.content}
                    theme="vs-light"
                    options={{ 
                        minimap: { enabled: false }, 
                        fontSize: 13, 
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                    }}
                    onChange={(val) => {
                        if (val && selectedFile) {
                            const newFiles = generatedFiles.map(f => f.path === selectedFile.path ? { ...f, content: val } : f);
                            setGeneratedFiles(newFiles);
                            setSelectedFile({ ...selectedFile, content: val });
                        }
                    }}
                />
            ) : (
                <div className="flex h-full items-center justify-center flex-col text-slate-300 gap-2">
                    <FileCode size={48} className="opacity-20" />
                    <p>Wählen Sie eine Datei aus dem Explorer.</p>
                </div>
            )}
        </div>

        {/* AI Assistant Bar */}
        <div className="h-auto border-t border-slate-200 bg-slate-50 p-3">
            <div className="flex gap-2 items-center max-w-4xl mx-auto">
                <div className="p-1.5 bg-purple-100 rounded text-purple-600 shrink-0">
                    <Wand2 size={16} />
                </div>
                <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiRefactor()}
                    placeholder="AI-Refactoring: 'Füge Try-Catch hinzu', 'Ändere Namespace', 'Erstelle Unit Tests'..."
                    className="flex-1 border border-slate-300 rounded p-1.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <button 
                    onClick={handleAiRefactor}
                    disabled={isAiProcessing || !selectedFile}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    {isAiProcessing ? 'Generiere...' : 'Ausführen'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
