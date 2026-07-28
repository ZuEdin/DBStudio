import React, { useState } from 'react';
import { Zap, Copy, Check, FileCode, Server, Radio, Database } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';

interface DotnetBackendSettingsProps {
  activeProjectId: string | undefined;
}

export const DotnetBackendSettings: React.FC<DotnetBackendSettingsProps> = ({ activeProjectId }) => {
  const store = useProjectStore();
  const [namespace, setNamespace] = useState('DbStudio.Backend');
  const [enableSignalR, setEnableSignalR] = useState(true);
  const [enableJwt, setEnableJwt] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'program' | 'hub' | 'context' | 'models'>('program');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const cleanCsharpName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
  };

  const getCsharpType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('number')) return 'int';
    if (t.includes('bool')) return 'bool';
    if (t.includes('date') || t.includes('time')) return 'DateTime';
    if (t.includes('float') || t.includes('double') || t.includes('decimal')) return 'decimal';
    return 'string';
  };

  // 1. Program.cs
  const generateProgramCs = () => {
    return `// ==========================================
// Program.cs (.NET 10 Minimal API + SignalR)
// Generated dynamically by DB Studio
// ==========================================

using Microsoft.EntityFrameworkCore;
using ${namespace}.Data;
${enableSignalR ? `using ${namespace}.Hubs;\n` : ''}
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Project SQLite DB (Self-contained for project isolation)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source=App_Data/${activeProjectId || 'project'}.db"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

${enableSignalR ? `builder.Services.AddSignalR();\n` : ''}
var app = builder.Build();

// Ensure App_Data folder and SQLite DB exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Dynamic Endpoints
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", framework = ".NET 10", signalR = ${enableSignalR ? 'true' : 'false'} }));

${enableSignalR ? `app.MapHub<ProjectHub>("/hubs/project");\n` : ''}
app.Run();`;
  };

  // 2. ProjectHub.cs
  const generateProjectHubCs = () => {
    return `// ==========================================
// ProjectHub.cs (SignalR Hub)
// Handles real-time synchronization of project DB states
// ==========================================

using Microsoft.AspNetCore.SignalR;

namespace ${namespace}.Hubs;

public class ProjectHub : Hub
{
    public async Task JoinProjectGroup(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, projectId);
        await Clients.Caller.SendAsync("Notify", $"Joined project: {projectId}");
    }

    public async Task BroadcastSchemaUpdate(string projectId, string changeType, string entityName)
    {
        await Clients.Group(projectId).SendAsync("SchemaChanged", new {
            ProjectId = projectId,
            ChangeType = changeType,
            EntityName = entityName,
            Timestamp = DateTime.UtcNow
        });
    }
}`;
  };

  // 3. AppDbContext.cs
  const generateDbContextCs = () => {
    const dbSets = store.tables.map(t => {
      const clsName = cleanCsharpName(t.name);
      return `    public DbSet<${clsName}> ${clsName}s { get; set; } = null!;`;
    }).join('\n');

    return `// ==========================================
// AppDbContext.cs (Entity Framework Core)
// Directly maps DB Studio project tables
// ==========================================

using Microsoft.EntityFrameworkCore;
using ${namespace}.Models;

namespace ${namespace}.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

${dbSets}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Custom keys & relations config
    }
}`;
  };

  // 4. Models.cs
  const generateModelsCs = () => {
    return store.tables.map(t => {
      const clsName = cleanCsharpName(t.name);
      const props = (t.fields || []).map(col => {
        const pType = getCsharpType(col.type);
        const pName = cleanCsharpName(col.name);
        const isKey = col.isPrimaryKey ? '    [System.ComponentModel.DataAnnotations.Key]\n' : '';
        return `${isKey}    public ${pType} ${pName} { get; set; }${pType === 'string' ? ' = string.Empty;' : ''}`;
      }).join('\n\n');

      return `namespace ${namespace}.Models;

public class ${clsName}
{
${props}
}`;
    }).join('\n\n');
  };

  const getCodeText = () => {
    switch (activeTab) {
      case 'program': return generateProgramCs();
      case 'hub': return generateProjectHubCs();
      case 'context': return generateDbContextCs();
      case 'models': return generateModelsCs();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden p-1">
      {/* Configuration Column */}
      <div className="lg:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server size={14} className="text-amber-600" />
              .NET 10 Service Engine
            </h3>
            <p className="text-[11px] text-slate-500">Konfigurieren Sie die Architektur und generieren Sie performante C#-Klassen.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">C# Namespace</label>
            <input 
              type="text" 
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700"
              placeholder="DbStudio.Backend"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Features & Middleware</label>
            
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableSignalR} 
                onChange={(e) => setEnableSignalR(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-amber-600"
              />
              <Radio size={14} className="text-amber-500" />
              <span>SignalR Hub (Echtzeit-Synchronisation)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableJwt} 
                onChange={(e) => setEnableJwt(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-amber-600"
              />
              <Zap size={14} className="text-amber-500" />
              <span>JWT Bearer Auth & Policy Check</span>
            </label>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-[11px] text-slate-500 space-y-1.5 mt-4">
          <div className="font-semibold text-slate-700 dark:text-slate-300">💡 .NET 10 Vorteile:</div>
          <p>• Volle Unterstützung von C# 14 Features.</p>
          <p>• Native AOT Compilation für sofortigen Start.</p>
          <p>• Minimal APIs mit optimiertem Routing.</p>
        </div>
      </div>

      {/* Code generator Column */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          {/* File Tab selectors */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 w-full overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('program')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold border-b-2 transition ${
                activeTab === 'program' 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCode size={13} /> Program.cs
            </button>
            {enableSignalR && (
              <button
                onClick={() => setActiveTab('hub')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'hub' 
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Radio size={13} /> ProjectHub.cs
              </button>
            )}
            <button
              onClick={() => setActiveTab('context')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold border-b-2 transition ${
                activeTab === 'context' 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Database size={13} /> AppDbContext.cs
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold border-b-2 transition ${
                activeTab === 'models' 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCode size={13} /> Models.cs ({store.tables.length})
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(getCodeText(), activeTab)}
            className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 text-white text-[11px] px-2.5 py-1 rounded transition shrink-0 ml-2"
          >
            {copiedFile === activeTab ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copiedFile === activeTab ? 'Kopiert!' : 'Code kopieren'}
          </button>
        </div>

        {/* Code editor pane */}
        <div className="flex-1 overflow-auto bg-slate-900 dark:bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
          <pre>{getCodeText()}</pre>
        </div>
      </div>
    </div>
  );
};
