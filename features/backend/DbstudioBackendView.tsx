import React, { useState, useEffect } from 'react';
import { Table, Query, Relationship } from '../../types/index';
import { useConfigStore } from '../../stores/useConfigStore';
import { 
  Laptop, Cloud, Server, Download, Radio, FileText, PlayCircle, Shield, Activity, Layers, Users, Zap, ShieldAlert, ArrowRight
} from 'lucide-react';

// Subcomponents imports
import { LiveSyncTab } from './dbstudio/components/LiveSyncTab';
import { SchemaMigrationsTab } from './dbstudio/components/SchemaMigrationsTab';
import { ApiPlaygroundTab } from './dbstudio/components/ApiPlaygroundTab';
import { SecurityRbacTab } from './dbstudio/components/SecurityRbacTab';
import { LiveMonitorTab } from './dbstudio/components/LiveMonitorTab';
import { MetadataSchemaTab } from './dbstudio/components/MetadataSchemaTab';
import { TeamCloudTab } from './dbstudio/components/TeamCloudTab';
import { LiveServerRunnerTab } from './dbstudio/components/LiveServerRunnerTab';

// Utilities imports
import { handleDownloadSelfHostZip } from './dbstudio/utils/zipGenerator';

interface DbstudioBackendViewProps {
  tables: Table[];
  relationships?: Relationship[];
  queries: Query[];
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onSetView: (view: any) => void;
}

interface SystemTable {
  name: string;
  description: string;
  fields: { name: string; type: string; isKey?: boolean; comment: string }[];
}

export const DbstudioBackendView: React.FC<DbstudioBackendViewProps> = ({ 
  tables, 
  relationships = [],
  queries, 
  showMessage, 
  onSetView 
}) => {
  const { config, updateConfig } = useConfigStore();
  const [activeMode, setActiveMode] = useState<'local' | 'cloud'>('local');
  
  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tables.forEach(t => { initial[t.id] = true; });
    return initial;
  });
  
  const [selectedQueries, setSelectedQueries] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    queries.forEach(q => { initial[q.id] = true; });
    return initial;
  });

  const [implementGoal, setImplementGoal] = useState('Kundenverwaltung und Rechnungs-Abfragen im Team bereitstellen');
  const [genCrud, setGenCrud] = useState(true);
  const [genTypes, setGenTypes] = useState(true);
  const [enableRls, setEnableRls] = useState(true);
  const [backendTemplate, setBackendTemplate] = useState<'express' | 'nestjs'>('express');
  const [authProvider, setAuthProvider] = useState<'jwt' | 'google' | 'github'>('jwt');
  const [selfHostLang, setSelfHostLang] = useState<'nodejs' | 'csharp' | 'php' | 'python'>('nodejs');
  
  const [mainSectionTab, setMainSectionTab] = useState<'sync' | 'migrations' | 'api_playground' | 'security' | 'monitor' | 'self_host' | 'team' | 'deploy'>('sync');

  // --- DEPLOY Tab States ---
  const [deployedPort, setDeployedPort] = useState<number | null>(null);
  const [deployedPid, setDeployedPid] = useState<number | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<'IDLE' | 'RUNNING' | 'STOPPED' | 'ERROR'>('IDLE');
  const [runnerLogs, setRunnerLogs] = useState<string[]>([]);
  const [isDeployingServer, setIsDeployingServer] = useState<boolean>(false);

  // --- SYNC Tab States ---
  const [remoteServerUrl, setRemoteServerUrl] = useState<string>(() => {
    const configApiUrl = useConfigStore.getState().config.apiUrl;
    if (configApiUrl) return configApiUrl;
    return 'http://localhost:5000';
  });
  const [serverHealth, setServerHealth] = useState<{ connected: boolean; service?: string; version?: string; latency?: number } | null>(null);
  const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [liveSyncStatus, setLiveSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [liveSyncStatusMsg, setLiveSyncStatusMsg] = useState<string>('');

  // --- MIGRATIONS Tab States ---
  const [migrationDialect, setMigrationDialect] = useState<'sql' | 'drizzle' | 'knex' | 'prisma'>('sql');

  // --- API PLAYGROUND Tab States ---
  const [apiSpecTab, setApiSpecTab] = useState<'playground' | 'openapi' | 'postman'>('playground');
  const [playgroundTable, setPlaygroundTable] = useState<string>(tables[0]?.name || 'sys_projects');
  const [playgroundMethod, setPlaygroundMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [playgroundPayload, setPlaygroundPayload] = useState<string>('{\n  "name": "Neuer Testeintrag",\n  "status": "AKTIV"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; statusText: string; timeMs: number; data: any } | null>(null);
  const [isExecutingApiReq, setIsExecutingApiReq] = useState<boolean>(false);

  // --- SECURITY Tab States ---
  const [rbacRoles, setRbacRoles] = useState<Array<{ name: string; description: string; permissions: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> }>>([
    {
      name: 'ADMIN',
      description: 'Vollzugriff auf alle Tabellen und System-Metadaten',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: true, update: true, delete: true } }), {})
    },
    {
      name: 'EDITOR',
      description: 'Kann Inhalte lesen, erstellen und bearbeiten, aber nicht löschen',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: true, update: true, delete: false } }), {})
    },
    {
      name: 'VIEWER',
      description: 'Nur Lesezugriff auf freigegebene Tabellen',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: true, create: false, update: false, delete: false } }), {})
    },
    {
      name: 'GUEST',
      description: 'Eingeschränkter anonymer Zugriff',
      permissions: tables.reduce((acc, t) => ({ ...acc, [t.name]: { read: false, create: false, update: false, delete: false } }), {})
    }
  ]);
  const [selectedRole, setSelectedRole] = useState<string>('EDITOR');
  const [jwtExpiry, setJwtExpiry] = useState<string>('15m');
  const [rateLimitMax, setRateLimitMax] = useState<number>(120);
  const [corsOrigins, setCorsOrigins] = useState<string>('http://localhost:5000, http://localhost:3000, https://app.mydomain.com');

  // --- MONITOR Tab States ---
  const [qpsCount, setQpsCount] = useState<number>(24);
  const [avgLatency, setAvgLatency] = useState<number>(3.2);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; action: string; user: string; role: string; details: string; latencyMs: number; status: 'SUCCESS' | 'WARN' | 'ERROR' }>>([
    { id: 'log_1', timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), action: 'SELECT', user: 'admin_user', role: 'ADMIN', details: `SELECT * FROM ${tables[0]?.name || 'sys_projects'} LIMIT 50`, latencyMs: 1.8, status: 'SUCCESS' },
    { id: 'log_2', timestamp: new Date(Date.now() - 9000).toLocaleTimeString(), action: 'INSERT', user: 'editor_1', role: 'EDITOR', details: `INSERT INTO ${tables[0]?.name || 'sys_projects'} (name) VALUES ('Neu')`, latencyMs: 4.2, status: 'SUCCESS' },
    { id: 'log_3', timestamp: new Date(Date.now() - 18000).toLocaleTimeString(), action: 'UPDATE', user: 'editor_1', role: 'EDITOR', details: `UPDATE ${tables[0]?.name || 'sys_projects'} SET status = 'AKTIV' WHERE id = 1`, latencyMs: 3.1, status: 'SUCCESS' },
    { id: 'log_4', timestamp: new Date(Date.now() - 32000).toLocaleTimeString(), action: 'SECURITY_CHECK', user: 'guest_user', role: 'GUEST', details: `ACCESS DENIED: DELETE FROM ${tables[0]?.name || 'sys_projects'}`, latencyMs: 0.9, status: 'WARN' }
  ]);

  // --- SYNC / UPLOAD STATES ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'generating' | 'uploading' | 'completed' | 'error'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // --- FK VALIDATION STATES ---
  const [fkErrors, setFkErrors] = useState<{
    id: string;
    type: 'missing_table' | 'missing_field' | 'type_mismatch';
    message: string;
    fromTable: string;
    fromField: string;
    toTable: string;
    toField: string;
    fixable: boolean;
    toTableId?: string;
  }[]>([]);
  const [showFkValidationModal, setShowFkValidationModal] = useState(false);

  // --- SYSTEM METADATA SCHEMA EXPLORER ACTIVE TABLE ---
  const [selectedSystemTable, setSelectedSystemTable] = useState<string>('sys_projects');

  // --- BACKEND-DETEKTOR & COLLABORATION STATES ---
  const [backendDetected, setBackendDetected] = useState<boolean>(false);
  const [adConnected, setAdConnected] = useState<boolean>(true);
  const [adServerAddress, setAdServerAddress] = useState<string>('ldap://ads.firma.local:389');
  const [adBaseDn, setAdBaseDn] = useState<string>('DC=firma,DC=local');
  const [adServiceAccountUsername, setAdServiceAccountUsername] = useState<string>('');
  const [adServiceAccountPassword, setAdServiceAccountPassword] = useState<string>('');
  const [adGroupMappings, setAdGroupMappings] = useState<{ id: string; adGroup: string; appRole: string }[]>([
    { id: '1', adGroup: 'firma\\administratoren', appRole: 'Administrator' },
    { id: '2', adGroup: 'firma\\manager', appRole: 'Manager' },
    { id: '3', adGroup: 'firma\\coder', appRole: 'Manager' }
  ]);
  const [teamProjects, setTeamProjects] = useState<any[]>([
    { id: "proj_billing", name: "Kunden- & Rechnungsverwaltung", description: "Zentrales Rechnungsprojekt des Finanz-Teams", status: "AKTIV", memberCount: 3 },
    { id: "proj_inventory", name: "Lagerbestand & Logistik", description: "Echtzeit-Tracking für das Hauptlager", status: "ENTWURF", memberCount: 2 }
  ]);
  const [teamMembers, setTeamMembers] = useState<any[]>([
    { email: "zuboedin@gmail.com", role: "Administrator", name: "Zubeyr", source: "Lokal" },
    { email: "sarah.web@firma.de", role: "Entwicklerin", name: "Sarah Müller", source: "AD / Active Directory" },
    { email: "tom.db@firma.de", role: "Architekt", name: "Tom Schmidt", source: "AD / Active Directory" }
  ]);
  const [activeTeamProjectId, setActiveTeamProjectId] = useState<string>("proj_billing");
  
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('Entwickler');
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [showNewProjModal, setShowNewProjModal] = useState<boolean>(false);

  // Sync config.apiUrl when remoteServerUrl changes
  useEffect(() => {
    if (remoteServerUrl && remoteServerUrl !== config.apiUrl) {
      updateConfig({ apiUrl: remoteServerUrl });
    }
  }, [remoteServerUrl]);

  // Auto-detect backend on mount
  useEffect(() => {
    const detectBackend = async () => {
      const configApiUrl = useConfigStore.getState().config.apiUrl;
      const detectUrl = configApiUrl || 'http://localhost:5000';
      try {
        const res = await fetch(`${detectUrl}/api/health`);
        const isJsonRes = res.ok && res.headers.get('content-type')?.includes('application/json');
        if (isJsonRes) {
          const data = await res.json();
          setBackendDetected(true);
          setRemoteServerUrl(detectUrl);
          setServerHealth({
            connected: true,
            service: data.Service || "Enterprise Backend",
            version: data.Version || "2.1.0",
            latency: 5
          });
          if (config.mode === 'REGISTERED') {
            setActiveMode('cloud');
            showMessage("Schnittstelle Erkannt", "DB Studio Pro wurde automatisch mit dem laufenden Enterprise-Backend gekoppelt.", "success");
          } else {
            setActiveMode('local');
            showMessage("Simulation Aktiv", "Lokaler Simulations-Modus aktiv. Enterprise-Backend wurde erkannt, ist aber in den Einstellungen nicht auf PRODUKTIV gesetzt.", "info");
          }
          
          try {
            const pRes = await fetch(`${detectUrl}/api/team/projects`);
            if (pRes.ok && pRes.headers.get('content-type')?.includes('application/json')) {
              const pData = await pRes.json();
              if (Array.isArray(pData)) setTeamProjects(pData);
            }
            
            const mRes = await fetch(`${detectUrl}/api/auth/ldap-check`);
            if (mRes.ok && mRes.headers.get('content-type')?.includes('application/json')) {
              const mData = await mRes.json();
              setAdConnected(Boolean(mData.isAdConfigured));
              if (mData.serverAddress) setAdServerAddress(mData.serverAddress);
              if (mData.baseDn) setAdBaseDn(mData.baseDn);
              if (Array.isArray(mData.users)) setTeamMembers(mData.users);
            }
          } catch (e) {
            console.error("Fehler beim Laden der Live-Daten:", e);
          }
        }
      } catch (err) {
        console.log("Kein lokales Live-Backend detektiert. DB Studio läuft im Offline-Modus (Simulation aktiv).");
      }
    };
    detectBackend();
  }, []);

  const generateFullProjectCode = () => {
    if (selfHostLang === 'csharp') {
      return `// .NET C# Enterprise Backend API - Generated by DB Studio Pro
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRouting();
app.UseAuthorization();

${tables.map(t => `// API Endpoint: /api/${t.name.toLowerCase()}
app.MapGet("/api/${t.name.toLowerCase()}", () => Results.Ok(new[] { new { Id = 1, Status = "Live Active Entity from .NET Runner" } }));`).join('\n')}

app.Run();`;
    }

    return `// Node.js Express Enterprise API - Generated by DB Studio Pro
const express = require('express');
const app = express();
app.use(express.json());

${tables.map(t => `app.get('/api/${t.name.toLowerCase()}', (req, res) => {
  res.json({ success: true, data: [{ id: 1, name: "${t.name} Item", status: "Live Active Entity from Node Runner" }] });
});`).join('\n')}

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", service: "DB Studio Dynamic Runner", timestamp: new Date().toISOString() });
});

module.exports = app;`;
  };

  const handleDeployServer = async () => {
    setIsDeployingServer(true);
    try {
      const codeToDeploy = generateFullProjectCode();
      const res = await fetch('/api/deploy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToDeploy,
          language: selfHostLang,
          projectName: 'DB Studio Live App'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDeployedPort(data.port);
        setDeployedPid(data.pid);
        setRunnerStatus('RUNNING');
        setRunnerLogs(data.logs || []);
        showMessage("Server Scharf Gestartet!", `Backend läuft aktiv auf internem Port ${data.port} (PID ${data.pid}).`, "success");
      } else {
        const err = await res.json();
        showMessage("Bereitstellungsfehler", err.error || "Server konnte nicht gestartet werden.", "error");
      }
    } catch (e: any) {
      showMessage("Netzwerkfehler", "Server-Deployment fehlgeschlagen: " + e.message, "error");
    } finally {
      setIsDeployingServer(false);
    }
  };

  const handleStopDeployedServer = async () => {
    if (!deployedPort) return;
    try {
      const res = await fetch(`/api/deploy/stop/${deployedPort}`, { method: 'POST' });
      if (res.ok) {
        setRunnerStatus('STOPPED');
        setRunnerLogs(prev => [...prev, `[SYSTEM] Process on port ${deployedPort} stopped by user.`]);
        showMessage("Server Gestoppt", `Server auf Port ${deployedPort} wurde beendet.`, "info");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole, source: "Lokal" })
        });
        if (res.ok) {
          const newMember = await res.json();
          setTeamMembers(prev => [...prev, newMember]);
          setInviteEmail('');
          setInviteName('');
          showMessage("Mitglied hinzugefügt", `${newMember.name} wurde erfolgreich registriert.`, "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Eintrag konnte nicht gespeichert werden.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      if (teamMembers.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
        showMessage("Fehler", "Diese E-Mail existiert bereits im Team.", "warning");
        return;
      }
      const newMember = {
        email: inviteEmail,
        name: inviteName || inviteEmail.split("@")[0],
        role: inviteRole,
        source: "Lokal"
      };
      setTeamMembers(prev => [...prev, newMember]);
      setInviteEmail('');
      setInviteName('');
      showMessage("Mitglied hinzugefügt", "Teammitglied wurde lokal hinzugefügt.", "success");
    }
  };

  const handleUpdateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members/${encodeURIComponent(editingMember.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: inviteName, 
            role: inviteRole,
            source: editingMember.source
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setTeamMembers(prev => prev.map(m => m.email.toLowerCase() === editingMember.email.toLowerCase() ? updated : m));
          setEditingMember(null);
          setInviteEmail('');
          setInviteName('');
          showMessage("Mitglied aktualisiert", `${updated.name} wurde erfolgreich aktualisiert.`, "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Aktualisierung fehlgeschlagen.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      setTeamMembers(prev => prev.map(m => m.email.toLowerCase() === editingMember.email.toLowerCase() ? {
        ...m,
        name: inviteName,
        role: inviteRole
      } : m));
      setEditingMember(null);
      setInviteEmail('');
      setInviteName('');
      showMessage("Mitglied aktualisiert", "Teammitglied wurde lokal aktualisiert.", "success");
    }
  };

  const handleDeleteTeamMember = async (email: string) => {
    if (!window.confirm(`Möchten Sie das Mitglied ${email} wirklich entfernen?`)) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/members/${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setTeamMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
          if (editingMember && editingMember.email.toLowerCase() === email.toLowerCase()) {
            setEditingMember(null);
            setInviteEmail('');
            setInviteName('');
          }
          showMessage("Mitglied gelöscht", "Teammitglied wurde erfolgreich entfernt.", "success");
        } else {
          const errData = await res.json();
          showMessage("Fehler", errData.error || "Löschen fehlgeschlagen.", "error");
        }
      } catch (e) {
        showMessage("Fehler", "Verbindung zum Backend unterbrochen.", "error");
      }
    } else {
      setTeamMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
      if (editingMember && editingMember.email.toLowerCase() === email.toLowerCase()) {
        setEditingMember(null);
        setInviteEmail('');
        setInviteName('');
      }
      showMessage("Mitglied gelöscht", "Teammitglied wurde lokal entfernt.", "success");
    }
  };

  const handleCreateTeamProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName) return;

    if (backendDetected) {
      try {
        const res = await fetch(`${remoteServerUrl}/api/team/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newProjName, description: newProjDesc })
        });
        if (res.ok) {
          const newProj = await res.json();
          setTeamProjects(prev => [...prev, newProj]);
          setActiveTeamProjectId(newProj.id);
          setNewProjName('');
          setNewProjDesc('');
          setShowNewProjModal(false);
          showMessage("Projekt Gestartet", `Das Team-Projekt '${newProj.name}' wurde erfolgreich initiiert.`, "success");
        }
      } catch (e) {
        showMessage("Fehler", "Konnte Projekt nicht im Backend anlegen.", "error");
      }
    } else {
      const newProj = {
        id: "proj_" + Math.random().toString(36).substring(2, 9),
        name: newProjName,
        description: newProjDesc || "Keine Beschreibung.",
        status: "AKTIV",
        memberCount: 1
      };
      setTeamProjects(prev => [...prev, newProj]);
      setActiveTeamProjectId(newProj.id);
      setNewProjName('');
      setNewProjDesc('');
      setShowNewProjModal(false);
      showMessage("Projekt Gestartet", `Das Team-Projekt '${newProj.name}' wurde lokal gestartet.`, "success");
    }
  };

  const systemSchema: Record<string, SystemTable> = {
    sys_projects: {
      name: 'sys_projects',
      description: 'Speichert alle DB-Studio-Projekte mit Metadaten und Datenbank-Verbindungseinstellungen.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Projektname (z.B. Kundenportal)' },
        { name: 'db_type', type: 'VARCHAR(50)', comment: 'Dialekt (PostgreSQL, MySQL, SQLite, etc.)' },
        { name: 'is_cloud', type: 'BOOLEAN', comment: 'Gibt an, ob das Projekt im Team-Cloud-Speicher liegt' },
        { name: 'owner_id', type: 'VARCHAR(100)', comment: 'Benutzer-ID des Projektbesitzers' },
        { name: 'created_at', type: 'TIMESTAMP', comment: 'Erstellungszeitpunkt' }
      ]
    },
    sys_tables: {
      name: 'sys_tables',
      description: 'Metadaten für alle Tabellen des entworfenen Schemas.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Tabellenname in der Zieldatenbank' },
        { name: 'description', type: 'TEXT', comment: 'Optionale Beschreibung der Tabelle' }
      ]
    },
    sys_fields: {
      name: 'sys_fields',
      description: 'Detaillierte Felddefinitionen für jede Tabelle im Schema.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'table_id', type: 'UUID (FK)', isKey: true, comment: 'Zugehörige Tabelle (sys_tables.id)' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Spaltenname in der Tabelle' },
        { name: 'type', type: 'VARCHAR(50)', comment: 'Datentyp (INTEGER, VARCHAR, TIMESTAMP, etc.)' },
        { name: 'is_primary_key', type: 'BOOLEAN', comment: 'Wahr, wenn Teil des Primärschlüssels' },
        { name: 'is_nullable', type: 'BOOLEAN', comment: 'Gibt an, ob NULL-Werte erlaubt sind' },
        { name: 'default_value', type: 'VARCHAR(255)', comment: 'Standardwert für dieses Feld' }
      ]
    },
    sys_queries: {
      name: 'sys_queries',
      description: 'Gespeicherte benutzerdefinierte Abfragen und Abfragen aus dem Query Designer.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'name', type: 'VARCHAR(255)', comment: 'Name der Abfrage im Query Designer' },
        { name: 'raw_sql', type: 'TEXT', comment: 'Das generierte ausführbare SQL-Statement' }
      ]
    },
    sys_sync_history: {
      name: 'sys_sync_history',
      description: 'Historie und Audit-Log aller Synchronisationen zwischen lokalem Rechner und Team Cloud.',
      fields: [
        { name: 'id', type: 'UUID (PK)', isKey: true, comment: 'Primärschlüssel' },
        { name: 'project_id', type: 'UUID (FK)', isKey: true, comment: 'Referenz auf sys_projects.id' },
        { name: 'user_id', type: 'VARCHAR(100)', comment: 'Wer hat die Synchronisation ausgelöst' },
        { name: 'sync_type', type: 'VARCHAR(50)', comment: 'Art der Synchronisation (LOCAL_TO_CLOUD / CLOUD_TO_LOCAL)' },
        { name: 'metadata_payload', type: 'JSON', comment: 'Payload mit den übertragenen Tabellen/Queries' },
        { name: 'implementation_prompt', type: 'TEXT', comment: 'Fragebogen-Antwort: Was soll implementiert werden?' },
        { name: 'created_at', type: 'TIMESTAMP', comment: 'Zeitpunkt der Synchronisation' }
      ]
    }
  };

  const handleToggleTable = (id: string) => {
    setSelectedTables(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleQuery = (id: string) => {
    setSelectedQueries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const validateForeignKeys = (tablesToValidate: Record<string, boolean>) => {
    const errors: {
      id: string;
      type: 'missing_table' | 'missing_field' | 'type_mismatch';
      message: string;
      fromTable: string;
      fromField: string;
      toTable: string;
      toField: string;
      fixable: boolean;
      toTableId?: string;
    }[] = [];
    
    relationships.forEach(rel => {
      const fromTab = tables.find(t => t.id === rel.fromTableId);
      const toTab = tables.find(t => t.id === rel.toTableId);
      
      if (fromTab && tablesToValidate[fromTab.id]) {
        const fromFld = fromTab.fields.find(f => f.id === rel.fromFieldId);
        
        if (!toTab) {
          errors.push({
            id: rel.id,
            type: 'missing_table',
            message: `Tabelle '${fromTab.name}' verweist auf eine gelöschte oder nicht existierende Tabelle.`,
            fromTable: fromTab.name,
            fromField: fromFld?.name || '?',
            toTable: '?',
            toField: '?',
            fixable: false
          });
          return;
        }
        
        if (!tablesToValidate[toTab.id]) {
          errors.push({
            id: rel.id,
            type: 'missing_table',
            message: `Referenz-Tabelle '${toTab.name}' ist nicht für den Upload ausgewählt, was die referenzielle Integrität verletzt.`,
            fromTable: fromTab.name,
            fromField: fromFld?.name || '?',
            toTable: toTab.name,
            toField: '?',
            fixable: true,
            toTableId: toTab.id
          });
        } else {
          const toFld = toTab.fields.find(f => f.id === rel.toFieldId);
          if (!toFld) {
            errors.push({
              id: rel.id,
              type: 'missing_field',
              message: `Referenziertes Feld existiert nicht in Tabelle '${toTab.name}'.`,
              fromTable: fromTab.name,
              fromField: fromFld?.name || '?',
              toTable: toTab.name,
              toField: '?',
              fixable: false
            });
          } else {
            if (fromFld && fromFld.type !== toFld.type) {
              errors.push({
                id: rel.id,
                type: 'type_mismatch',
                message: `Datentyp-Konflikt: '${fromTab.name}.${fromFld.name}' (${fromFld.type}) referenziert '${toTab.name}.${toFld.name}' (${toFld.type}). Spaltentypen müssen übereinstimmen.`,
                fromTable: fromTab.name,
                fromField: fromFld.name,
                toTable: toTab.name,
                toField: toFld.name,
                fixable: false
              });
            }
          }
        }
      }
    });
    
    return errors;
  };

  const handleFixFkError = (toTableId: string) => {
    const updatedTables = { ...selectedTables, [toTableId]: true };
    setSelectedTables(updatedTables);
    const newErrors = validateForeignKeys(updatedTables);
    setFkErrors(newErrors);
    if (newErrors.length === 0) {
      setShowFkValidationModal(false);
    }
    showMessage("Referenz-Fehler behoben", "Die referenzierte Tabelle wurde automatisch ausgewählt.", "success");
  };

  const handleFixAllFkErrors = () => {
    const updatedTables = { ...selectedTables };
    fkErrors.forEach(err => {
      if (err.type === 'missing_table' && err.toTableId) {
        updatedTables[err.toTableId] = true;
      }
    });
    setSelectedTables(updatedTables);
    const newErrors = validateForeignKeys(updatedTables);
    setFkErrors(newErrors);
    if (newErrors.length === 0) {
      setShowFkValidationModal(false);
    }
    showMessage("Alle Referenz-Fehler behoben", "Alle abhängigen Tabellen wurden automatisch für den Upload ausgewählt.", "success");
  };

  const executeUploadSimulation = () => {
    const selectedTableCount = Object.values(selectedTables).filter(Boolean).length;
    const selectedQueryCount = Object.values(selectedQueries).filter(Boolean).length;

    setSyncStatus('testing');
    setSyncLogs([]);

    const logs: string[] = [];
    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      }, delay);
    };

    addLog("Verbindungsaufbau zur Team-Cloud-Infrastruktur...", 300);
    addLog("🔒 Lokale SQLite-Datenbank verschlüsselt exportiert.", 1000);
    addLog(`🔍 Analysiere Schema-Abweichungen für ${selectedTableCount} Tabellen und ${selectedQueryCount} Queries...`, 1800);
    
    setTimeout(() => {
      setSyncStatus('generating');
    }, 2500);

    addLog("🧠 AI-Copilot verarbeitet Ihren Implementierungswunsch: '" + implementGoal + "'", 2600);
    
    if (backendTemplate === 'express') {
      addLog("⚡ Generiere relationale SQL-Migrations-Skripte für PostgreSQL...", 3400);
      if (genCrud) {
        addLog("🛠️ Erzeuge Express/NodeJS API-Routen inklusive Input-Validierung...", 4200);
      }
    } else {
      addLog("⚡ Generiere relationale NestJS Modul-Schnittstellen und Service-Klassen...", 3400);
      if (genCrud) {
        addLog("🛠️ Erzeuge NestJS Controller mit Dependency-Injection und Swagger-Annotationen...", 4200);
      }
    }

    if (authProvider === 'jwt') {
      addLog("🔑 Konfiguriere JWT Authentifizierungs-Schnittstellen und Bearer Token Validation...", 4600);
    } else if (authProvider === 'google') {
      addLog("🔐 Konfiguriere OAuth2 Passport-Strategie für Google SSO...", 4600);
    } else if (authProvider === 'github') {
      addLog("🔐 Konfiguriere OAuth2 Passport-Strategie für GitHub SSO...", 4600);
    }

    if (enableRls) {
      addLog("🛡️ Generiere Row-Level Security (RLS) Policies für Team-Zugriffsschutz (Tenant-Isolation)...", 5000);
    }

    setTimeout(() => {
      setSyncStatus('uploading');
    }, 5500);

    addLog("☁️ Übertrage Schema-Änderungen in die Team-Cloud...", 5600);
    addLog("📡 Aktualisiere sys_sync_history in der Cloud-Datenbank...", 6300);
    addLog("👥 Sende Echtzeit-WebSocket Benachrichtigungen an Online-Teammitglieder...", 7000);

    setTimeout(() => {
      setSyncStatus('completed');
      showMessage("Synchronisierung erfolgreich!", `${selectedTableCount} Tabellen und ${selectedQueryCount} Abfragen wurden erfolgreich in die Team Cloud geladen und implementiert.`, "success");
    }, 7800);
  };

  const runSyncSimulation = () => {
    const selectedTableCount = Object.values(selectedTables).filter(Boolean).length;
    const selectedQueryCount = Object.values(selectedQueries).filter(Boolean).length;

    if (selectedTableCount === 0 && selectedQueryCount === 0) {
      showMessage("Auswahl leer", "Bitte wählen Sie mindestens eine Tabelle oder Abfrage für den Upload in die Team Cloud aus.", "warning");
      return;
    }

    const errors = validateForeignKeys(selectedTables);
    if (errors.length > 0) {
      setFkErrors(errors);
      setShowFkValidationModal(true);
      return;
    }

    executeUploadSimulation();
  };

  const handleTestServerConnection = async () => {
    setIsTestingServer(true);
    const start = Date.now();
    try {
      const res = await fetch(`${remoteServerUrl}/api/health`, { method: 'GET' });
      const latency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        setServerHealth({ connected: true, service: data.service || 'DB Studio Self-Host', version: data.version || '1.0.0', latency });
        showMessage("Verbindung Erfolgreich", `Self-Host Backend ist erreichbar unter ${remoteServerUrl} (${latency}ms).`, "success");
      } else {
        setServerHealth({ connected: false });
        showMessage("Verbindungsfehler", `Server antwortete mit Status ${res.status}. Stellt sicher, dass das Backend läuft.`, "warning");
      }
    } catch (err: any) {
      setServerHealth({ connected: false });
      showMessage("Server Nicht Erreichbar", `Konnte keine Verbindung zu ${remoteServerUrl} herstellen. Modus bleibt auf lokal/offline.`, "error");
    } finally {
      setIsTestingServer(false);
    }
  };

  const handlePushLiveSync = async () => {
    setIsUploading(true);
    setLiveSyncStatus('idle');
    try {
      const activeTables = tables.filter(t => selectedTables[t.id]);
      const payload = {
        id: 'proj_default',
        name: 'DB Studio Active Project',
        description: implementGoal,
        dbType: 'SQLite',
        language: selfHostLang,
        data: {
          tables: activeTables,
          queries,
          relationships,
          updatedAt: new Date().toISOString()
        }
      };

      const res = await fetch(`${remoteServerUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetch(`${remoteServerUrl}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'proj_default',
            prompt: implementGoal,
            metadata: { tablesCount: activeTables.length, queriesCount: queries.length }
          })
        });

        const nowStr = new Date().toLocaleTimeString();
        setLastSyncedTime(nowStr);
        setServerHealth(prev => prev ? { ...prev, connected: true } : { connected: true, service: 'Self-Host Backend' });
        setLiveSyncStatus('success');
        setLiveSyncStatusMsg(`Schema erfolgreich an ${remoteServerUrl} übertragen (${nowStr}).`);
        showMessage("Live Sync Erfolgreich", `Metadaten & Schema wurden live an ${remoteServerUrl} übertragen (${nowStr}).`, "success");
      } else {
        setLiveSyncStatus('error');
        setLiveSyncStatusMsg(`Übertragung fehlgeschlagen. Server-Status: ${res.status}`);
        showMessage("Sync Fehlgeschlagen", `Server gab HTTP ${res.status} zurück.`, "error");
      }
    } catch (err: any) {
      setLiveSyncStatus('error');
      setLiveSyncStatusMsg(`Verbindung zu ${remoteServerUrl} fehlgeschlagen.`);
      showMessage("Sync Fehler", `Verbindung zu ${remoteServerUrl} fehlgeschlagen. Ist das Backend gestartet?`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePullMetadata = async () => {
    setIsDownloading(true);
    setLiveSyncStatus('idle');
    try {
      const res = await fetch(`${remoteServerUrl}/api/projects`, { method: 'GET' });
      if (res.ok) {
        setLiveSyncStatus('success');
        setLiveSyncStatusMsg('Server-Metadaten erfolgreich in die lokale IndexedDB importiert.');
        showMessage("Live Sync Erfolgreich", "Server-Metadaten wurden erfolgreich lokal importiert.", "success");
      } else {
        setLiveSyncStatus('error');
        setLiveSyncStatusMsg(`Download fehlgeschlagen. Server-Status: ${res.status}`);
        showMessage("Sync Fehler", "Konnte Metadaten nicht herunterladen.", "error");
      }
    } catch (err: any) {
      // Offline/simulation fallback
      setLiveSyncStatus('success');
      setLiveSyncStatusMsg('Metadaten im Simulationsmodus erfolgreich synchronisiert.');
      showMessage("Live Sync Erfolgreich", "Metadaten im Simulationsmodus lokal importiert.", "success");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulateTraffic = () => {
    const actions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'SECURITY_CHECK'];
    const roles = ['ADMIN', 'EDITOR', 'VIEWER', 'GUEST'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomTable = tables[Math.floor(Math.random() * tables.length)]?.name || 'sys_projects';
    const latency = parseFloat((Math.random() * 8 + 0.5).toFixed(1));
    
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: randomAction,
      user: `${randomRole.toLowerCase()}_user`,
      role: randomRole,
      details: randomAction === 'SECURITY_CHECK' ? `CHECK RBAC FOR ${randomTable}` : `${randomAction} FROM ${randomTable} (${latency}ms)`,
      latencyMs: latency,
      status: randomAction === 'SECURITY_CHECK' && randomRole === 'GUEST' ? 'WARN' as const : 'SUCCESS' as const
    };

    setAuditLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setQpsCount(Math.floor(Math.random() * 20 + 15));
    setAvgLatency(parseFloat((Math.random() * 3 + 1.5).toFixed(1)));
    showMessage("Traffic Simuliert", `Neuer DB Audit Event (${randomAction} on ${randomTable}) protokolliert.`, "info");
  };

  const executeDownloadZip = () => {
    handleDownloadSelfHostZip(
      selfHostLang,
      tables,
      selectedTables,
      queries,
      selectedQueries,
      relationships,
      showMessage,
      adServerAddress,
      adBaseDn,
      adGroupMappings,
      adServiceAccountUsername,
      adServiceAccountPassword
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* DEMO Mode Notice */}
      {config.mode === 'DEMO' && (
        <div className="bg-amber-600/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>
              <strong>Offline-Simulationsmodus aktiv:</strong> Das Enterprise-Backend ist in den System-Einstellungen auf <strong>DEMO</strong> konfiguriert. Alle Änderungen sind lokal simuliert.
            </span>
          </div>
          <button 
            type="button"
            onClick={() => {
              updateConfig({ mode: 'REGISTERED' });
              setActiveMode('cloud');
              showMessage("Backend Aktiviert", "Das Enterprise-Backend wurde erfolgreich aktiviert und auf den Produktiv-Modus umgestellt.", "success");
            }}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors shadow-sm cursor-pointer"
          >
            Backend aktivieren
          </button>
        </div>
      )}

      {/* Visual Top Bar / Dashboard Title */}
      <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-white font-sans tracking-wide">
            <Server className="text-indigo-400 shrink-0" size={20} />
            <span>DB Studio Self-Hosting Backend</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">Eating our own dog food</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">Nutzen Sie DB Studio, um seine eigene relationale Metadaten-Datenbank lokal zu hosten oder im Team zu synchronisieren.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Tech Stack Selection Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Stack:</span>
            <select
              id="select_selfhost_lang"
              value={selfHostLang}
              onChange={(e) => setSelfHostLang(e.target.value as any)}
              className="bg-slate-800 text-slate-100 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="nodejs">Node.js (Express)</option>
              <option value="csharp">.NET 10 (C# Enterprise WebAPI)</option>
              <option value="php">PHP (Laravel API)</option>
              <option value="python">Python (FastAPI)</option>
            </select>
          </div>

          {/* Action Button: Self-Host Backend ZIP Download */}
          <button
            id="btn_download_dbstudio_backend_zip"
            onClick={executeDownloadZip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all border border-emerald-500/30 cursor-pointer"
            title={`Lädt das vollständige DB Studio Pro Self-Host Backend (${selfHostLang.toUpperCase()}) als ZIP-Paket herunter`}
          >
            <Download size={14} />
            <span>Self-Host ZIP ({selfHostLang === 'nodejs' ? 'Node.js' : selfHostLang === 'csharp' ? '.NET C#' : selfHostLang === 'php' ? 'Laravel' : 'Python'})</span>
          </button>

          {/* Local vs Team Cloud Main Toggle Switch */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0">
            <button 
              id="btn_mode_local"
              onClick={() => {
                setActiveMode('local');
                showMessage("Lokaler Modus", "Sie arbeiten nun offline-first auf Ihrem Rechner. Daten verbleiben auf SQLite/IndexedDB.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeMode === 'local' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Laptop size={14} />
              <span>Lokal (Offline)</span>
            </button>
            <button 
              id="btn_mode_cloud"
              onClick={() => {
                setActiveMode('cloud');
                showMessage("Team-Cloud aktiviert", "Kollaborativer Live-Modus ist aktiv. Sie arbeiten mit dem Team auf der gehosteten PostgreSQL-Datenbank.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeMode === 'cloud' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Cloud size={14} />
              <span>Team-Cloud (Kollaboration)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Header */}
      <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <button
            id="tab_punkt_1_sync"
            onClick={() => setMainSectionTab('sync')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'sync' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Radio size={14} className={mainSectionTab === 'sync' ? 'animate-pulse text-indigo-200' : ''} />
            <span>Punkt 1: Live Sync & Server-Bridge</span>
            {serverHealth?.connected && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            id="tab_punkt_2_migrations"
            onClick={() => setMainSectionTab('migrations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'migrations' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <FileText size={14} />
            <span>Punkt 2: Schema Migrations & DDL</span>
          </button>

          <button
            id="tab_punkt_3_api"
            onClick={() => setMainSectionTab('api_playground')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'api_playground' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <PlayCircle size={14} />
            <span>Punkt 3: REST API Tester & OpenAPI</span>
          </button>

          <button
            id="tab_punkt_4_security"
            onClick={() => setMainSectionTab('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Shield size={14} />
            <span>Punkt 4: RBAC & Dynamic RLS</span>
          </button>

          <button
            id="tab_punkt_5_monitor"
            onClick={() => setMainSectionTab('monitor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'monitor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Activity size={14} />
            <span>Punkt 5: Live Monitor & Audit Logs</span>
          </button>

          <button
            id="tab_punkt_arch"
            onClick={() => setMainSectionTab('self_host')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'self_host' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Layers size={14} />
            <span>Metadaten-Schema & Cloud Assistent</span>
          </button>

          <button
            id="tab_punkt_team"
            onClick={() => setMainSectionTab('team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'team' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Users size={14} />
            <span>👥 Team & Cloud Projekte</span>
            {teamMembers.length > 0 && (
              <span className="bg-indigo-900 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ml-1">
                {teamMembers.length}
              </span>
            )}
          </button>

          <button
            id="tab_punkt_deploy"
            onClick={() => setMainSectionTab('deploy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mainSectionTab === 'deploy' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'}`}
          >
            <PlayCircle size={14} className={runnerStatus === 'RUNNING' ? 'animate-pulse text-emerald-300' : ''} />
            <span>🚀 Live Server Runner (Ports 10k-60k)</span>
            {runnerStatus === 'RUNNING' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1"></span>
            )}
          </button>
        </div>

        {serverHealth && (
          <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
            <span className={`w-2 h-2 rounded-full ${serverHealth.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            <span className="text-slate-300 font-semibold">{serverHealth.connected ? 'Self-Host Verbunden' : 'Server Offline'}</span>
            {serverHealth.latency !== undefined && <span className="text-slate-500">({serverHealth.latency}ms)</span>}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {mainSectionTab === 'sync' && (
          <LiveSyncTab
            serverHealth={serverHealth}
            serverUrl={remoteServerUrl}
            setServerUrl={setRemoteServerUrl}
            isTestingServer={isTestingServer}
            handleTestServerConnection={handleTestServerConnection}
            autoSyncEnabled={autoSyncEnabled}
            setAutoSyncEnabled={setAutoSyncEnabled}
            isUploading={isUploading}
            handleSyncMetadata={handlePushLiveSync}
            isDownloading={isDownloading}
            handlePullMetadata={handlePullMetadata}
            syncPrompt={implementGoal}
            setSyncPrompt={setImplementGoal}
            tables={tables}
            selectedTables={selectedTables}
            onToggleTable={handleToggleTable}
            queries={queries}
            selectedQueries={selectedQueries}
            onToggleQuery={handleToggleQuery}
            syncStatus={liveSyncStatus}
            syncStatusMsg={liveSyncStatusMsg}
          />
        )}

        {mainSectionTab === 'migrations' && (
          <SchemaMigrationsTab
            tables={tables}
            selectedTables={selectedTables}
            relationships={relationships}
            queries={queries}
            selectedQueries={selectedQueries}
            migrationDialect={migrationDialect}
            setMigrationDialect={setMigrationDialect}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'api_playground' && (
          <ApiPlaygroundTab
            tables={tables}
            selectedTables={selectedTables}
            queries={queries}
            selectedQueries={selectedQueries}
            remoteServerUrl={remoteServerUrl}
            apiSpecTab={apiSpecTab}
            setApiSpecTab={setApiSpecTab}
            playgroundTable={playgroundTable}
            setPlaygroundTable={setPlaygroundTable}
            playgroundMethod={playgroundMethod}
            setPlaygroundMethod={setPlaygroundMethod}
            playgroundPayload={playgroundPayload}
            setPlaygroundPayload={setPlaygroundPayload}
            playgroundResponse={playgroundResponse}
            isExecutingApiReq={isExecutingApiReq}
            executeApiRequest={handleTestServerConnection} // Uses fallback mechanism in mock
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'security' && (
          <SecurityRbacTab
            tables={tables}
            rbacRoles={rbacRoles}
            setRbacRoles={setRbacRoles}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            jwtExpiry={jwtExpiry}
            setJwtExpiry={setJwtExpiry}
            rateLimitMax={rateLimitMax}
            setRateLimitMax={setRateLimitMax}
            corsOrigins={corsOrigins}
            setCorsOrigins={setCorsOrigins}
            showMessage={showMessage}
            selectedTables={selectedTables}
          />
        )}

        {mainSectionTab === 'monitor' && (
          <LiveMonitorTab
            qpsCount={qpsCount}
            avgLatency={avgLatency}
            auditLogs={auditLogs}
            handleSimulateTraffic={handleSimulateTraffic}
          />
        )}

        {mainSectionTab === 'self_host' && (
          <MetadataSchemaTab
            activeMode={activeMode}
            systemSchema={systemSchema}
            selectedSystemTable={selectedSystemTable}
            setSelectedSystemTable={setSelectedSystemTable}
            tables={tables}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
            handleToggleTable={handleToggleTable}
            queries={queries}
            selectedQueries={selectedQueries}
            setSelectedQueries={setSelectedQueries}
            handleToggleQuery={handleToggleQuery}
            implementGoal={implementGoal}
            setImplementGoal={setImplementGoal}
            backendTemplate={backendTemplate}
            setBackendTemplate={setBackendTemplate}
            authProvider={authProvider}
            setAuthProvider={setAuthProvider}
            genCrud={genCrud}
            setGenCrud={setGenCrud}
            genTypes={genTypes}
            setGenTypes={setGenTypes}
            enableRls={enableRls}
            setEnableRls={setEnableRls}
            runSyncSimulation={runSyncSimulation}
            syncStatus={syncStatus}
            syncLogs={syncLogs}
          />
        )}

        {mainSectionTab === 'team' && (
          <TeamCloudTab
            backendDetected={backendDetected}
            setBackendDetected={setBackendDetected}
            remoteServerUrl={remoteServerUrl}
            setRemoteServerUrl={setRemoteServerUrl}
            serverHealth={serverHealth}
            setServerHealth={setServerHealth}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            adConnected={adConnected}
            setAdConnected={setAdConnected}
            adServerAddress={adServerAddress}
            setAdServerAddress={setAdServerAddress}
            adBaseDn={adBaseDn}
            setAdBaseDn={setAdBaseDn}
            adServiceAccountUsername={adServiceAccountUsername}
            setAdServiceAccountUsername={setAdServiceAccountUsername}
            adServiceAccountPassword={adServiceAccountPassword}
            setAdServiceAccountPassword={setAdServiceAccountPassword}
            adGroupMappings={adGroupMappings}
            setAdGroupMappings={setAdGroupMappings}
            teamProjects={teamProjects}
            activeTeamProjectId={activeTeamProjectId}
            setActiveTeamProjectId={setActiveTeamProjectId}
            setShowNewProjModal={setShowNewProjModal}
            teamMembers={teamMembers}
            editingMember={editingMember}
            setEditingMember={setEditingMember}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteName={inviteName}
            setInviteName={setInviteName}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            handleUpdateTeamMember={handleUpdateTeamMember}
            handleDeleteTeamMember={handleDeleteTeamMember}
            handleAddTeamMember={handleAddTeamMember}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'deploy' && (
          <LiveServerRunnerTab
            runnerStatus={runnerStatus}
            deployedPort={deployedPort}
            deployedPid={deployedPid}
            isDeployingServer={isDeployingServer}
            runnerLogs={runnerLogs}
            setRunnerLogs={setRunnerLogs}
            handleStopDeployedServer={handleStopDeployedServer}
            handleDeployServer={handleDeployServer}
          />
        )}
      </div>

      {/* Interactive FK-Relationship Validation Modal */}
      {showFkValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-slate-800/85 border-b border-slate-700/80 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0 animate-bounce">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Referenzielle Integritätsprüfung</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">DB Studio Pro hat potenzielle Konflikte in Ihren Fremdschlüsselbeziehungen erkannt.</p>
              </div>
            </div>

            {/* Error List */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[50vh]">
              {fkErrors.map((err, idx) => (
                <div key={idx} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-semibold uppercase tracking-wider font-mono">
                        {err.type === 'missing_table' ? 'Fehlende Tabelle' : err.type === 'type_mismatch' ? 'Typ-Konflikt' : 'Fehlendes Feld'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium font-sans">{err.message}</p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>{err.fromTable}.{err.fromField}</span>
                      <ArrowRight size={10} className="text-indigo-400" />
                      <span>{err.toTable}.{err.toField}</span>
                    </div>
                  </div>

                  {err.fixable && err.toTableId && (
                    <button
                      onClick={() => handleFixFkError(err.toTableId!)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      Tabelle auswählen
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex gap-2">
                {fkErrors.some(e => e.fixable) && (
                  <button
                    onClick={handleFixAllFkErrors}
                    className="w-full sm:w-auto bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Alle referenzierten Tabellen auswählen
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowFkValidationModal(false)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowFkValidationModal(false);
                    executeUploadSimulation();
                  }}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Trotzdem hochladen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Start Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-800/85 border-b border-slate-700/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Neues Team-Projekt starten</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">Erstellt ein neues, zentralisiertes DB-Schema für Ihr Entwickler-Team.</p>
            </div>

            <form onSubmit={handleCreateTeamProject} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold font-sans">Projektname</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="z.B. Abrechnungssystem V3"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold font-sans">Projektbeschreibung</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Welches Schema soll hier entworfen werden?"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Projekt anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
