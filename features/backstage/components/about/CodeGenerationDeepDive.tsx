import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Layers, 
  Cpu, 
  FileCode2, 
  CheckCircle2, 
  Boxes, 
  Sparkles, 
  Copy, 
  Check,
  Bot,
  Plug
} from 'lucide-react';
import { useUIStore } from '../../../../stores/useUIStore';

export const CodeGenerationDeepDive: React.FC = () => {
  const ui = useUIStore();
  const [selectedStack, setSelectedStack] = useState<'dotnet' | 'node' | 'php' | 'react'>('dotnet');
  const [copied, setCopied] = useState(false);

  const stackDetails = {
    dotnet: {
      name: '.NET 10 / ASP.NET Core & EF Core',
      badge: 'Enterprise Architecture',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30',
      description: 'Generiert saubere C# 14 Minimal APIs mit Entity Framework Core 10, Dependency Injection, Swagger/OpenAPI und asynchronen Repositories.',
      highlights: [
        'Entity Framework Core DbContext mit .UsingEntity<T>() für saubere m:n-Tabellen',
        'Strikte strongly-typed Models mit DataAnnotations (Required, MaxLength, ForeignKey)',
        'C# Record DTOs mit Request-Validation und Error-Handling Middleware',
        'Minimal API Route-Endpoints mit MapGet, MapPost, MapPut, MapDelete und IResult Responses',
        'Multi-Database Support: SQLite, SQL Server, PostgreSQL und MySQL per ConnectionString'
      ],
      sampleCode: `// Program.cs - .NET 10 Minimal API mit EF Core
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger().UseSwaggerUI();

app.MapGet("/api/kunden", async (AppDbContext db) => 
    await db.Kunden.Include(k => k.Auftraege).ToListAsync());

app.MapPost("/api/kunden", async (AppDbContext db, KundeDto dto) => {
    var entity = new Kunde { Name = dto.Name, Email = dto.Email };
    db.Kunden.Add(entity);
    await db.SaveChangesAsync();
    return Results.Created($"/api/kunden/{entity.Id}", entity);
});

app.Run();`
    },
    node: {
      name: 'Node.js Express & TypeScript',
      badge: 'Cloud Native / Serverless',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
      description: '100% TypeScript Backend mit Express, Zod-Validierung, JWT-Auth, asynchronen Controllern und Drizzle / Prisma ORM-Support.',
      highlights: [
        'Vollständige TypeScript Typ-Definitionen für alle Tabellen und Entitäts-Payloads',
        'Express Router mit asynchronen Middleware-Pipelines und globalem Error-Handler',
        'Zod Schemas für Laufzeit-Validierung aller eingehenden POST/PUT Requests',
        'Drizzle ORM / SQLite-WASM / PostgreSQL Driver mit Migration-Generator',
        'Vorkonfigurierte Dockerfile & docker-compose.yml für Instant-Deployment'
      ],
      sampleCode: `// server.ts - Express + TypeScript + Drizzle
import express from 'express';
import cors from 'cors';
import { db } from './db';
import { kundenTable } from './schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/kunden', async (req, res, next) => {
  try {
    const records = await db.select().from(kundenTable);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

app.listen(3000, () => console.log('API live on port 3000'));`
    },
    php: {
      name: 'PHP 8.3 PDO & Laravel / Slim',
      badge: 'Zero-Dependency Hosting',
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-500/30',
      description: 'Laufzeitoptimiertes PHP 8 Backend mit nativen PDO Prepared Statements, PSR-4 Autoloading und RESTful Routing für jedes Shared Webhosting.',
      highlights: [
        'Läuft auf jedem Standard-Webspace (cPanel, Plesk, Apache, NGINX) ohne Node/Docker',
        '100% PDO Prepared Statements zum vollständigen Schutz gegen SQL-Injections',
        'JSON REST-API mit sauberen HTTP-Statuscodes (200, 201, 400, 404, 500)',
        'Einfaches .htaccess URL-Rewriting und CORS-Header-Management',
        'Optionale Laravel Migrationen und Eloquent Model Generierung'
      ],
      sampleCode: `<?php
// api/kunden.php - PHP 8.3 PDO REST Controller
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDatabaseConnection();

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM kunden ORDER BY id DESC");
    echo json_encode(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO kunden (name, email) VALUES (?, ?)");
    $stmt->execute([$input['name'], $input['email']]);
    http_response_code(201);
    echo json_encode(['id' => $pdo->lastInsertId(), 'status' => 'created']);
    exit;
}`
    },
    react: {
      name: 'React SPA (Tailwind CSS & SDUI)',
      badge: 'Modern Frontend',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30',
      description: 'Dynamisches React 18+ Frontend mit Tailwind CSS, Lucide Icons, responsivem 1–4 Spalten Grid, Subforms und Server-Driven UI.',
      highlights: [
        'Vollwertiges Client-Side State Management (Zustand & IndexedDB)',
        'Server-Driven UI: Formulare und Tabellen rendern sich dynamisch aus Metadaten',
        'Integrierte Offline-Synchronisation mit Outbox Queue und 3-Wege-Merge',
        'Druckoptimierte Print-Layouts für A4 Dokumente mit automatischen Seitenumbrüchen',
        '100% barrierefreies und responsives Design für Desktop, Tablet und Smartphone'
      ],
      sampleCode: `// KundeForm.tsx - React + Tailwind Dynamic Form
import React, { useState } from 'react';
import { useKundeStore } from '../stores/useKundeStore';

export const KundeForm: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', status: 'aktiv' });
  const { saveKunde, isSyncing } = useKundeStore();

  return (
    <form onSubmit={(e) => { e.preventDefault(); saveKunde(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-1">Kundenname *</label>
          <input 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-[#1e1e24] border border-[#3a3a4c] rounded-lg p-2 text-sm text-white" 
            required 
          />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-bold">
        {isSyncing ? 'Speichern...' : 'Kunde anlegen'}
      </button>
    </form>
  );
};`
    }
  };

  const current = stackDetails[selectedStack];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#242432] border border-[#383848] rounded-xl p-6 space-y-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#383848] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="text-indigo-400" size={22} />
            Code-Generierungs-Engine &amp; Architektur-Deep-Dive
          </h2>
          <p className="text-xs text-neutral-300 mt-1">
            Kein proprietäres Bytecode-Format: DB Studio Pro erzeugt 100% lesbaren, unverschlüsselten Quellcode für moderne Frameworks.
          </p>
        </div>

        {/* Stack Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ui.setShowPluginGeneratorModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer"
          >
            <Plug size={13} />
            <span>AST Plugin Hub (Go / Py / Rust / C#)</span>
          </button>

          <button
            onClick={() => ui.setShowOllamaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow cursor-pointer"
          >
            <Bot size={13} />
            <span>Lokaler Ollama Copilot</span>
          </button>

          <div className="flex flex-wrap gap-1.5 bg-[#1b1b24] p-1 rounded-lg border border-[#333345]">
            {(['dotnet', 'node', 'php', 'react'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedStack(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedStack === key
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-[#2b2b3b]'
                }`}
              >
                {key === 'dotnet' ? '.NET 10 (C#)' : key === 'node' ? 'Node.js (TS)' : key === 'php' ? 'PHP 8.3 PDO' : 'React SDUI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Highlights & Information */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${current.badgeColor}`}>
              {current.badge}
            </span>
          </div>

          <h3 className="text-base font-bold text-white">{current.name}</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {current.description}
          </p>

          <div className="space-y-2 pt-2 border-t border-[#383848]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Architektur-Highlights:</div>
            {current.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="lg:col-span-7 bg-[#171720] border border-[#333345] rounded-xl overflow-hidden shadow-inner flex flex-col">
          <div className="bg-[#1f1f2b] px-4 py-2 border-b border-[#333345] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-indigo-400" />
              <span className="text-xs font-mono text-neutral-300">Generierter Quellcode (Auszug)</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-[#2b2b3b] hover:bg-[#38384d] transition-all"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Kopiert!' : 'Code kopieren'}
            </button>
          </div>

          <div className="p-4 overflow-x-auto font-mono text-xs text-neutral-300 leading-relaxed max-h-[280px]">
            <pre>
              <code>{current.sampleCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
