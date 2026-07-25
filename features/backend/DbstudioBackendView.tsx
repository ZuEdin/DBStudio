import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Table, Query, Relationship } from '../../types/index';
import { 
  Laptop, Cloud, Server, Database, Key, Send, UploadCloud, 
  CheckCircle2, AlertCircle, RefreshCw, PlusCircle, ArrowRight, 
  Layers, Users, Play, Code, CheckSquare, MessageSquare, Terminal,
  AlertTriangle, ShieldAlert, Download, FolderPlus, Globe, Radio,
  PlayCircle, FileText, Share2, Sparkles, Copy, Sliders, Check,
  Shield, Lock, Activity, Eye, Cpu, BarChart2, Clock, UserCheck
} from 'lucide-react';

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
  // Mode selection: 'local' | 'cloud'
  const [activeMode, setActiveMode] = useState<'local' | 'cloud'>('local');
  
  // Selected tables and queries for upload
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

  // Upload Questionnaire State
  const [implementGoal, setImplementGoal] = useState('Kundenverwaltung und Rechnungs-Abfragen im Team bereitstellen');
  const [genCrud, setGenCrud] = useState(true);
  const [genTypes, setGenTypes] = useState(true);
  const [enableRls, setEnableRls] = useState(true);
  const [backendTemplate, setBackendTemplate] = useState<'express' | 'nestjs'>('express');
  const [authProvider, setAuthProvider] = useState<'jwt' | 'google' | 'github'>('jwt');
  const [selfHostLang, setSelfHostLang] = useState<'nodejs' | 'csharp' | 'php' | 'python'>('nodejs');
  
  // Navigation Tabs for Points 1, 2, 3, 4, 5 & Architecture
  const [mainSectionTab, setMainSectionTab] = useState<'sync' | 'migrations' | 'api_playground' | 'security' | 'monitor' | 'self_host'>('sync');

  // --- PUNKT 1: Live Sync & Remote Backend Connection ---
  const [remoteServerUrl, setRemoteServerUrl] = useState<string>('http://localhost:3000');
  const [serverHealth, setServerHealth] = useState<{ connected: boolean; service?: string; version?: string; latency?: number } | null>(null);
  const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // --- PUNKT 2: Versioned Migrations & DDL ---
  const [migrationDialect, setMigrationDialect] = useState<'sql' | 'drizzle' | 'knex' | 'prisma'>('sql');

  // --- PUNKT 3: REST API Playground & Specs ---
  const [apiSpecTab, setApiSpecTab] = useState<'playground' | 'openapi' | 'postman'>('playground');
  const [playgroundTable, setPlaygroundTable] = useState<string>(tables[0]?.name || 'sys_projects');
  const [playgroundMethod, setPlaygroundMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [playgroundPayload, setPlaygroundPayload] = useState<string>('{\n  "name": "Neuer Testeintrag",\n  "status": "AKTIV"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; statusText: string; timeMs: number; data: any } | null>(null);
  const [isExecutingApiReq, setIsExecutingApiReq] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // --- PUNKT 4: Security & Dynamic RBAC Roles Generator ---
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
  const [corsOrigins, setCorsOrigins] = useState<string>('http://localhost:3000, https://app.mydomain.com');

  // --- PUNKT 5: Audit Log & Realtime Database Monitor ---
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [qpsCount, setQpsCount] = useState<number>(24);
  const [avgLatency, setAvgLatency] = useState<number>(3.2);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; action: string; user: string; role: string; details: string; latencyMs: number; status: 'SUCCESS' | 'WARN' | 'ERROR' }>>([
    { id: 'log_1', timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), action: 'SELECT', user: 'admin_user', role: 'ADMIN', details: `SELECT * FROM ${tables[0]?.name || 'sys_projects'} LIMIT 50`, latencyMs: 1.8, status: 'SUCCESS' },
    { id: 'log_2', timestamp: new Date(Date.now() - 9000).toLocaleTimeString(), action: 'INSERT', user: 'editor_1', role: 'EDITOR', details: `INSERT INTO ${tables[0]?.name || 'sys_projects'} (name) VALUES ('Neu')`, latencyMs: 4.2, status: 'SUCCESS' },
    { id: 'log_3', timestamp: new Date(Date.now() - 18000).toLocaleTimeString(), action: 'UPDATE', user: 'editor_1', role: 'EDITOR', details: `UPDATE ${tables[0]?.name || 'sys_projects'} SET status = 'AKTIV' WHERE id = 1`, latencyMs: 3.1, status: 'SUCCESS' },
    { id: 'log_4', timestamp: new Date(Date.now() - 32000).toLocaleTimeString(), action: 'SECURITY_CHECK', user: 'guest_user', role: 'GUEST', details: `ACCESS DENIED: DELETE FROM ${tables[0]?.name || 'sys_projects'}`, latencyMs: 0.9, status: 'WARN' }
  ]);

  // Sync Animation State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'generating' | 'uploading' | 'completed'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sql' | 'backend' | 'auth'>('sql');

  // FK Validation State
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

  // Interactive Metadata Schema Explorer Active Table
  const [selectedSystemTable, setSelectedSystemTable] = useState<string>('sys_projects');

  // Core System Schema that DB Studio uses for its own database backend
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

  // Central Dynamic Template Generator for Cloud Hub
  const getGeneratedCodeForTab = (
    tab: 'sql' | 'backend' | 'auth',
    tpl: 'express' | 'nestjs',
    prov: 'jwt' | 'google' | 'github',
    rls: boolean
  ): string => {
    const activeTables = tables.filter(t => selectedTables[t.id]);

    if (tab === 'sql') {
      const sqlTables = activeTables.map(t => {
        const fieldsSql = t.fields
          .map(f => {
            let sql = `  ${f.name} ${f.type === 'INTEGER' ? 'SERIAL' : f.type === 'VARCHAR' ? 'VARCHAR(255)' : f.type}`;
            if (f.isPrimaryKey) sql += ' PRIMARY KEY';
            if (f.isUnique) sql += ' UNIQUE';
            if (!f.allowNull && !f.isPrimaryKey) sql += ' NOT NULL';
            return sql;
          })
          .join(',\n');
        return `CREATE TABLE IF NOT EXISTS ${t.name.toLowerCase()} (\n${fieldsSql}\n);\n`;
      }).join('\n');

      const rlsSql = rls ? activeTables.map(t => `ALTER TABLE ${t.name.toLowerCase()} ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON ${t.name.toLowerCase()} 
  USING (tenant_id = current_setting('app.current_tenant_id'));`).join('\n') : '';

      return `-- ==========================================
-- DB STUDIO GENERATED MIGRATION
-- TYPE: LOCAL_TO_CLOUD
-- GOAL: ${implementGoal}
-- ==========================================

-- 1. Update System Meta-Database
INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, created_at)
VALUES (
  '${crypto.randomUUID()}', 
  'sys_proj_active_1', 
  'dev_user_u1', 
  'LOCAL_TO_CLOUD', 
  '${implementGoal.replace(/'/g, "''")}', 
  CURRENT_TIMESTAMP
);

-- 2. Create target tables in Cloud (PostgreSQL Dialect)
${sqlTables}
${rls ? `
-- 3. Row-Level Security Policies for Multi-Tenant Isolation
${rlsSql}
` : ''}`;
    }

    if (tab === 'backend') {
      if (tpl === 'express') {
        const expressRoutes = activeTables.map(t => {
          const lowerName = t.name.toLowerCase();
          const zodSchema = `const ${t.name}Schema = z.object({\n${t.fields.map(f => `  ${f.name}: ${f.type === 'INTEGER' ? 'z.number()' : f.type === 'BOOLEAN' ? 'z.boolean()' : 'z.string()'}`).join(',\n')}\n});`;

          return `// ==========================================
// ${t.name} CRUD Routes with Multi-Tenant RLS
// ==========================================
${zodSchema}

// List all ${lowerName} for authorized tenant
router.get('/api/${lowerName}', authenticateUser, rlsContextMiddleware, async (req: any, res: any) => {
  try {
    const records = await db('${lowerName}'); // PostgreSQL RLS limits output to tenantId automatically
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create ${lowerName} within active tenant
router.post('/api/${lowerName}', authenticateUser, rlsContextMiddleware, async (req: any, res: any) => {
  try {
    const validatedData = ${t.name}Schema.parse(req.body);
    const [newRecord] = await db('${lowerName}')
      .insert({ ...validatedData, tenant_id: req.user.tenantId })
      .returning('*');
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});`;
        }).join('\n\n');

        return `/**
 * DB Studio Pro - Express Cloud Hub Router
 * Objective: ${implementGoal}
 */
import express from 'express';
import { db } from './db/connection';
import { authenticateUser } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Middleware to set tenant context in database session for PostgreSQL Row-Level Security (RLS)
const rlsContextMiddleware = async (req: any, res: any, next: any) => {
  if (req.user && req.user.tenantId) {
    // Sets the local variable in this connection session for RLS policy enforcement
    await db.raw("SET LOCAL app.current_tenant_id = ?", [req.user.tenantId]);
  }
  next();
};

${expressRoutes}

export default router;`;
      } else {
        // NestJS
        const nestControllers = activeTables.map(t => {
          const lowerName = t.name.toLowerCase();
          return `  // --- ${t.name} CRUD Endpoints ---
  @Get('${lowerName}')
  @ApiOperation({ summary: 'List all ${lowerName} for active tenant' })
  async findAll${t.name}(@TenantId() tenantId: string) {
    try {
      // NestJS Service enforces Row-Level Isolation at DB session level
      return await this.tablesService.findForTenant('${lowerName}', tenantId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('${lowerName}')
  @ApiOperation({ summary: 'Create a new ${lowerName} in active tenant' })
  async create${t.name}(@TenantId() tenantId: string, @Body() body: any) {
    try {
      return await this.tablesService.createInTenant('${lowerName}', tenantId, body);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }`;
        }).join('\n\n');

        return `/**
 * DB Studio Pro - NestJS Cloud Hub Controller
 * Objective: ${implementGoal}
 */
import { Controller, Get, Post, Body, UseGuards, Req, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TenantId } from './auth/tenant-id.decorator';
import { TablesService } from './tables.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cloud-hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class CloudHubController {
  constructor(private readonly tablesService: TablesService) {}

${nestControllers}
}`;
      }
    }

    if (tab === 'auth') {
      if (tpl === 'express') {
        if (prov === 'jwt') {
          return `/**
 * DB Studio Pro - JWT Express Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dbstudio-cloudhub-super-secret-key-2026';

export const authenticateUser = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      tenantId: decoded.tenantId, // Tenant ID used for Row Level Security (RLS)
      role: decoded.role || 'User'
    };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};`;
        } else if (prov === 'google') {
          return `/**
 * DB Studio Pro - Passport Google OAuth2 Strategy (Express)
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/connection';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists or register them in our system schema
      let user = await db('sys_users').where('sso_provider_id', profile.id).first();
      
      if (!user) {
        // Register and assign to a unique Tenant ID for Row Level Security (RLS)
        const tenantId = 'tenant-' + Math.random().toString(36).substring(2, 10);
        [user] = await db('sys_users').insert({
          username: profile.emails?.[0]?.value || profile.displayName,
          sso_provider: 'google',
          sso_provider_id: profile.id,
          tenant_id: tenantId,
          role: 'User'
        }).returning('*');
      }
      
      return done(null, {
        id: user.id,
        username: user.username,
        tenantId: user.tenant_id,
        role: user.role
      });
    } catch (err) {
      return done(err);
    }
  }
));`;
        } else {
          return `/**
 * DB Studio Pro - Passport GitHub OAuth2 Strategy (Express)
 */
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from '../db/connection';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists or register them in our system schema
      let user = await db('sys_users').where('sso_provider_id', profile.id).first();
      
      if (!user) {
        // Register and assign to a unique Tenant ID for Row Level Security (RLS)
        const tenantId = 'tenant-' + Math.random().toString(36).substring(2, 10);
        [user] = await db('sys_users').insert({
          username: profile.username || profile.displayName,
          sso_provider: 'github',
          sso_provider_id: profile.id,
          tenant_id: tenantId,
          role: 'User'
        }).returning('*');
      }
      
      return done(null, {
        id: user.id,
        username: user.username,
        tenantId: user.tenant_id,
        role: user.role
      });
    } catch (err) {
      return done(err);
    }
  }
));`;
        }
      } else {
        // NestJS
        if (prov === 'jwt') {
          return `/**
 * DB Studio Pro - NestJS JWT Authentication Strategy
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dbstudio-cloudhub-super-secret-key-2026',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload: tenantId is required.');
    }
    return { 
      userId: payload.sub, 
      username: payload.username, 
      tenantId: payload.tenantId, // Used directly by RLS interceptors
      role: payload.role 
    };
  }
}`;
        } else if (prov === 'google') {
          return `/**
 * DB Studio Pro - NestJS Google OAuth2 Strategy
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      tenantId: 'tenant-' + profile.id.substring(0, 8) // Mandantenzuordnung via RLS
    };
    done(null, user);
  }
}`;
        } else {
          return `/**
 * DB Studio Pro - NestJS GitHub OAuth2 Strategy
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const user = {
      username: profile.username,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      accessToken,
      tenantId: 'tenant-' + profile.id.substring(0, 8) // Tenant-Isolierung für Postgres RLS
    };
    done(null, user);
  }
}`;
        }
      }
    }

    return '';
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
      
      // If the fromTable is selected for sync
      if (fromTab && tablesToValidate[fromTab.id]) {
        const fromFld = fromTab.fields.find(f => f.id === rel.fromFieldId);
        
        // 1. Check if the destination table is selected
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
          // Both tables are selected, now check fields
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
            // Check type mismatch
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

  // Reactively regenerate code when configurations change while sync is completed
  React.useEffect(() => {
    if (syncStatus === 'completed') {
      const code = getGeneratedCodeForTab(activeTab, backendTemplate, authProvider, enableRls);
      setGeneratedCode(code);
    }
  }, [activeTab, backendTemplate, authProvider, enableRls, syncStatus, selectedTables]);

  const executeUploadSimulation = () => {
    const selectedTableCount = Object.values(selectedTables).filter(Boolean).length;
    const selectedQueryCount = Object.values(selectedQueries).filter(Boolean).length;

    setSyncStatus('testing');
    setSyncLogs([]);
    setGeneratedCode('');

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
      const code = getGeneratedCodeForTab(activeTab, backendTemplate, authProvider, enableRls);
      setGeneratedCode(code);
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

    // Run Foreign Key Validation
    const errors = validateForeignKeys(selectedTables);
    if (errors.length > 0) {
      setFkErrors(errors);
      setShowFkValidationModal(true);
      return;
    }

    executeUploadSimulation();
  };

  const handleDownloadSelfHostZip = async () => {
    try {
      const zip = new JSZip();

      // Common Schema SQL - Fully mirrors all IndexedDB Object Stores & DB Studio Pro State
      const schemaSql = `-- DB Studio Pro Self-Host System Schema
-- Fully mirrors all IndexedDB Object Stores & DB Studio Pro State

-- 1. Projects Metadata
CREATE TABLE IF NOT EXISTS sys_projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  db_type VARCHAR(50) DEFAULT 'SQLite',
  language VARCHAR(50) DEFAULT 'nodejs',
  is_cloud INTEGER DEFAULT 0,
  owner_id VARCHAR(100) DEFAULT 'admin',
  last_modified BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Complete Payload (Full JSON Dump matching IndexedDB projects_data)
CREATE TABLE IF NOT EXISTS sys_project_payloads (
  project_id VARCHAR(36) PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 3. Normalized Tables Metadata
CREATE TABLE IF NOT EXISTS sys_tables (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_api_import INTEGER DEFAULT 0,
  api_config_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 4. Normalized Fields Metadata
CREATE TABLE IF NOT EXISTS sys_fields (
  id VARCHAR(36) PRIMARY KEY,
  table_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_primary_key INTEGER DEFAULT 0,
  is_auto_increment INTEGER DEFAULT 0,
  is_unique INTEGER DEFAULT 0,
  is_nullable INTEGER DEFAULT 1,
  default_value VARCHAR(255),
  comment TEXT,
  FOREIGN KEY (table_id) REFERENCES sys_tables(id) ON DELETE CASCADE
);

-- 5. Foreign Key Relationships
CREATE TABLE IF NOT EXISTS sys_relationships (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  from_table_id VARCHAR(255),
  from_field_id VARCHAR(255),
  to_table_id VARCHAR(255),
  to_field_id VARCHAR(255),
  rel_type VARCHAR(20) DEFAULT '1:n',
  on_delete VARCHAR(50) DEFAULT 'CASCADE',
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 6. Saved SQL Queries
CREATE TABLE IF NOT EXISTS sys_queries (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  query_type VARCHAR(50) DEFAULT 'SELECT',
  raw_sql TEXT,
  nodes_json TEXT,
  columns_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 7. Forms Builder Definitions
CREATE TABLE IF NOT EXISTS sys_forms (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  table_id VARCHAR(255),
  layout_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 8. Reports & Dashboards
CREATE TABLE IF NOT EXISTS sys_reports (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 9. Custom Pages & SDUI Custom Components
CREATE TABLE IF NOT EXISTS sys_pages (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  definition_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sys_custom_components (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  definition_json TEXT,
  FOREIGN KEY (project_id) REFERENCES sys_projects(id) ON DELETE CASCADE
);

-- 10. Dynamic Table Records (Stores user data rows for all custom tables)
CREATE TABLE IF NOT EXISTS sys_table_data (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  data_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Users & Auth
CREATE TABLE IF NOT EXISTS sys_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'User',
  ad_sid VARCHAR(255),
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Support Tickets & AI Chats Storage
CREATE TABLE IF NOT EXISTS sys_chats (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  user_id VARCHAR(100),
  title VARCHAR(255),
  messages_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_tickets (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  user_id VARCHAR(100),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'OPEN',
  payload_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Sync & Audit History
CREATE TABLE IF NOT EXISTS sys_sync_history (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  implementation_prompt TEXT,
  metadata_payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO sys_users (id, username, email, password_hash, role)
VALUES ('admin_usr_1', 'admin', 'admin@dbstudio.local', '$2b$10$hash_demo', 'Admin');

INSERT OR IGNORE INTO sys_projects (id, name, db_type, is_cloud, owner_id)
VALUES ('proj_default', 'Hauptprojekt', 'PostgreSQL', 1, 'admin');
`;
      zip.file("schema.sql", schemaSql);

      if (selfHostLang === 'nodejs') {
        // Node.js Express Backend
        const packageJson = {
          name: "db-studio-pro-selfhost-backend",
          version: "1.0.0",
          description: "Self-Hosting Metadata, Dynamic Data & Sync Backend for DB Studio Pro (Node.js Express)",
          main: "server.js",
          scripts: {
            start: "node server.js",
            dev: "nodemon server.js",
            initdb: "node scripts/initdb.js"
          },
          dependencies: {
            express: "^4.19.2",
            cors: "^2.8.5",
            dotenv: "^16.4.5",
            jsonwebtoken: "^9.0.2",
            bcryptjs: "^2.4.3",
            sqlite3: "^5.1.7"
          },
          devDependencies: {
            nodemon: "^3.1.0"
          }
        };
        zip.file("package.json", JSON.stringify(packageJson, null, 2));

        const serverJs = `/**
 * DB Studio Pro - Complete Self-Host Backend Server (Node.js Express)
 * Supports full IndexedDB state sync: Projects, Payload, Tables, Fields, Queries, Forms, Reports, Custom Components, Data Rows, Users & Chats.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'dbstudio_meta.db');
const db = new sqlite3.Database(dbPath);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DB Studio Pro Self-Host Backend (Node.js)', version: '1.0.0' });
});

// GET /api/projects - List projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM sys_projects ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/projects/:id - Load single project + full data payload
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM sys_projects WHERE id = ?', [id], (err, proj) => {
    if (err || !proj) return res.status(404).json({ error: 'Projekt nicht gefunden' });
    db.get('SELECT data_json FROM sys_project_payloads WHERE project_id = ?', [id], (err2, payload) => {
      let data = {};
      if (payload && payload.data_json) {
        try { data = JSON.parse(payload.data_json); } catch(e){}
      }
      res.json({ ...proj, data });
    });
  });
});

// POST /api/projects - Create or update full project state
app.post('/api/projects', (req, res) => {
  const { id, name, description, data, dbType, language } = req.body;
  const projId = id || 'proj_' + Date.now();
  const projName = name || 'Neues Projekt';
  const now = Date.now();

  db.run(
    \`INSERT INTO sys_projects (id, name, description, db_type, language, last_modified) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, last_modified=excluded.last_modified\`,
    [projId, projName, description || '', dbType || 'SQLite', language || 'nodejs', now],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (data) {
        const payloadStr = JSON.stringify(data);
        db.run(
          \`INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?)
           ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json, updated_at=CURRENT_TIMESTAMP\`,
          [projId, payloadStr]
        );
      }
      res.json({ success: true, id: projId, name: projName });
    }
  );
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', (req, res) => {
  db.run('DELETE FROM sys_projects WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET /api/data/:tableName - Dynamic User Table Data Rows
app.get('/api/data/:tableName', (req, res) => {
  const { tableName } = req.params;
  const projectId = req.query.projectId || 'proj_default';
  db.all('SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?', [tableName, projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const records = rows.map(r => {
      try { return JSON.parse(r.data_json); } catch(e){ return null; }
    }).filter(Boolean);
    res.json(records);
  });
});

// POST /api/data/:tableName - Insert or Update Dynamic Table Data Row
app.post('/api/data/:tableName', (req, res) => {
  const { tableName } = req.params;
  const record = req.body;
  const projectId = req.query.projectId || record.projectId || 'proj_default';
  const recordId = record.id ? String(record.id) : 'rec_' + Date.now();
  const sysId = \`\${tableName}_\${recordId}\`;

  db.run(
    \`INSERT INTO sys_table_data (id, project_id, table_name, record_id, data_json) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=CURRENT_TIMESTAMP\`,
    [sysId, projectId, tableName, recordId, JSON.stringify(record)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, recordId });
    }
  );
});

// GET /api/users - Users management
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM sys_users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/sync
app.post('/api/sync', (req, res) => {
  const { projectId, prompt, metadata } = req.body;
  const syncId = 'sync_' + Date.now();
  db.run(
    'INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, metadata_payload) VALUES (?, ?, ?, ?, ?, ?)',
    [syncId, projectId || 'proj_default', 'admin', 'LOCAL_TO_CLOUD', prompt || 'Sync', JSON.stringify(metadata || {})],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, syncId, message: 'DB Studio Metadaten & IndexedDB erfolgreich synchronisiert' });
    }
  );
});

app.listen(PORT, () => console.log(\`DB Studio Node.js Backend läuft auf http://localhost:\${PORT}\`));
`;
        zip.file("server.js", serverJs);

        const initDbJs = `const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../dbstudio_meta.db');
const sqlPath = path.resolve(__dirname, '../schema.sql');
const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');
db.exec(sql, (err) => {
  if (err) console.error('Fehler:', err);
  else console.log('Alle DB Studio Metadaten & Data Tables erfolgreich initialisiert!');
  db.close();
});
`;
        zip.file("scripts/initdb.js", initDbJs);
        zip.file("Dockerfile", `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`);
        zip.file("docker-compose.yml", `version: '3.8'\nservices:\n  dbstudio-backend:\n    build: .\n    ports:\n      - "3000:3000"\n    restart: always`);
        zip.file("README.md", `# DB Studio Pro - Node.js Self-Host Backend\n\nUnterstützt alle IndexedDB Object Stores (Projects, Tables, Fields, Queries, Forms, Reports, Custom Components, Data Rows, Users).\n\n1. \`npm install\`\n2. \`npm run initdb\`\n3. \`npm start\``);
        zip.file("start.bat", `@echo off\ncall npm install\ncall npm run initdb\ncall npm start\npause`);
        zip.file("start.sh", `#!/bin/bash\nnpm install\nnpm run initdb\nnpm start`);

      } else if (selfHostLang === 'csharp') {
        // .NET 8 C# Web API Backend
        zip.file("DBStudioBackend.csproj", `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.2" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>
</Project>`);

        zip.file("Program.cs", `using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddDbContext<MetaDbContext>(options =>
    options.UseSqlite("Data Source=dbstudio_meta.db"));

var app = builder.Build();
app.UseCors("AllowAll");
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<MetaDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/api/health", () => new { Status = "ok", Service = "DB Studio Self-Host (.NET 8)", Version = "1.0.0" });
app.MapControllers();
app.Run();

public class MetaDbContext : DbContext {
    public MetaDbContext(DbContextOptions<MetaDbContext> options) : base(options) {}
    public DbSet<SysProject> SysProjects => Set<SysProject>();
    public DbSet<SysPayload> SysProjectPayloads => Set<SysPayload>();
    public DbSet<SysTableData> SysTableData => Set<SysTableData>();
    public DbSet<SysUser> SysUsers => Set<SysUser>();
}

public class SysProject {
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string DbType { get; set; } = "SQLite";
    public string Language { get; set; } = "csharp";
    public bool IsCloud { get; set; }
    public string OwnerId { get; set; } = "admin";
    public long LastModified { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}

public class SysPayload {
    public string ProjectId { get; set; } = "";
    public string DataJson { get; set; } = "{}";
}

public class SysTableData {
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = "proj_default";
    public string TableName { get; set; } = "";
    public string RecordId { get; set; } = "";
    public string DataJson { get; set; } = "{}";
}

public class SysUser {
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "User";
}
`);

        zip.file("Controllers/ProjectsController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase {
    private readonly MetaDbContext _db;
    public ProjectsController(MetaDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetProjects() => Ok(await _db.SysProjects.ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(string id) {
        var proj = await _db.SysProjects.FindAsync(id);
        if (proj == null) return NotFound();
        var payload = await _db.SysProjectPayloads.FirstOrDefaultAsync(p => p.ProjectId == id);
        return Ok(new { proj.Id, proj.Name, proj.DbType, proj.Language, Data = payload?.DataJson });
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] SysProject proj) {
        _db.SysProjects.Add(proj);
        await _db.SaveChangesAsync();
        return Ok(new { Success = true, proj.Id });
    }
}
`);

        zip.file("appsettings.json", JSON.stringify({
          Logging: { LogLevel: { Default: "Information" } },
          AllowedHosts: "*"
        }, null, 2));

        zip.file("Dockerfile", `FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\nWORKDIR /src\nCOPY . .\nRUN dotnet publish -c Release -o /app\nFROM mcr.microsoft.com/dotnet/aspnet:8.0\nWORKDIR /app\nCOPY --from=build /app .\nEXPOSE 80\nENTRYPOINT ["dotnet", "DBStudioBackend.dll"]`);
        zip.file("README.md", `# DB Studio Pro - .NET 8 C# Self-Host Backend\n\n1. \`dotnet run\`\n2. Open Swagger UI at \`http://localhost:5000/swagger\``);
        zip.file("start.bat", `@echo off\ndotnet run\npause`);
        zip.file("start.sh", `#!/bin/bash\ndotnet run`);

      } else if (selfHostLang === 'php') {
        // PHP / Laravel Backend
        zip.file("composer.json", JSON.stringify({
          name: "dbstudio/selfhost-backend",
          description: "DB Studio Pro Self-Host Backend (Laravel API)",
          type: "project",
          require: {
            "php": "^8.2",
            "laravel/framework": "^11.0"
          }
        }, null, 2));

        zip.file("routes/api.php", `<?php
use Illuminate\\Support\\Facades\\Route;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Http\\Request;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'DB Studio Self-Host (Laravel API)', 'version' => '1.0.0']);
});

Route::get('/projects', function () {
    return response()->json(DB::select('SELECT * FROM sys_projects ORDER BY created_at DESC'));
});

Route::get('/projects/{id}', function ($id) {
    $proj = DB::selectOne('SELECT * FROM sys_projects WHERE id = ?', [$id]);
    if (!$proj) return response()->json(['error' => 'Nicht gefunden'], 404);
    $payload = DB::selectOne('SELECT data_json FROM sys_project_payloads WHERE project_id = ?', [$id]);
    $proj->data = $payload ? json_decode($payload->data_json) : null;
    return response()->json($proj);
});

Route::post('/projects', function (Request $request) {
    $id = $request->input('id', 'proj_' . time());
    DB::insert('INSERT INTO sys_projects (id, name, db_type, is_cloud, owner_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name', [
        $id, $request->input('name', 'Neues Projekt'), $request->input('db_type', 'SQLite'), $request->input('is_cloud', 0), 'admin'
    ]);
    if ($request->has('data')) {
        DB::insert('INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json', [
            $id, json_encode($request->input('data'))
        ]);
    }
    return response()->json(['success' => true, 'id' => $id]);
});

Route::get('/data/{tableName}', function ($tableName, Request $request) {
    $rows = DB::select('SELECT data_json FROM sys_table_data WHERE table_name = ?', [$tableName]);
    return response()->json(array_map(fn($r) => json_decode($r->data_json), $rows));
});
`);

        zip.file("Dockerfile", `FROM php:8.2-cli\nRUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev\nWORKDIR /app\nCOPY . .\nEXPOSE 8000\nCMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]`);
        zip.file("README.md", `# DB Studio Pro - PHP Laravel Self-Host Backend\n\n1. \`composer install\`\n2. \`php artisan serve\``);
        zip.file("start.bat", `@echo off\nphp artisan serve\npause`);
        zip.file("start.sh", `#!/bin/bash\nphp artisan serve`);

      } else if (selfHostLang === 'python') {
        // Python FastAPI Backend
        zip.file("requirements.txt", `fastapi>=0.110.0\nuvicorn>=0.28.0\npydantic>=2.6.0\nsqlite3-to-mysql>=1.4.0\n`);

        zip.file("main.py", `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3, os, time, json
from pydantic import BaseModel
from typing import Optional, Any

app = FastAPI(title="DB Studio Pro Self-Host Backend (Python FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "dbstudio_meta.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "DB Studio Self-Host (Python FastAPI)", "version": "1.0.0"}

@app.get("/api/projects")
def get_projects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sys_projects ORDER BY created_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/projects/{proj_id}")
def get_project(proj_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sys_projects WHERE id = ?", (proj_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    cursor.execute("SELECT data_json FROM sys_project_payloads WHERE project_id = ?", (proj_id,))
    payload = cursor.fetchone()
    conn.close()
    result = dict(proj)
    result["data"] = json.loads(payload["data_json"]) if payload and payload["data_json"] else {}
    return result

class ProjectSave(BaseModel):
    id: Optional[str] = None
    name: str = "Neues Projekt"
    db_type: str = "SQLite"
    language: str = "python"
    data: Optional[Any] = None

@app.post("/api/projects")
def save_project(proj: ProjectSave):
    conn = get_db()
    cursor = conn.cursor()
    proj_id = proj.id or f"proj_{int(time.time())}"
    now = int(time.time() * 1000)
    cursor.execute(
        """INSERT INTO sys_projects (id, name, db_type, language, last_modified) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, last_modified=excluded.last_modified""",
        (proj_id, proj.name, proj.db_type, proj.language, now)
    )
    if proj.data is not None:
        cursor.execute(
            """INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?)
               ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json""",
            (proj_id, json.dumps(proj.data))
        )
    conn.commit()
    conn.close()
    return {"success": True, "id": proj_id, "name": proj.name}

@app.get("/api/data/{table_name}")
def get_table_data(table_name: str, project_id: str = "proj_default"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?", (table_name, project_id))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        try: records.append(json.loads(r["data_json"]))
        except: pass
    return records

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`);

        zip.file("Dockerfile", `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["python", "main.py"]`);
        zip.file("docker-compose.yml", `version: '3.8'\nservices:\n  dbstudio-python-backend:\n    build: .\n    ports:\n      - "8000:8000"\n    restart: always`);
        zip.file("README.md", `# DB Studio Pro - Python FastAPI Self-Host Backend\n\n1. \`pip install -r requirements.txt\`\n2. \`python main.py\``);
        zip.file("start.bat", `@echo off\npip install -r requirements.txt\npython main.py\npause`);
        zip.file("start.sh", `#!/bin/bash\npip install -r requirements.txt\npython main.py`);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      const langLabel = selfHostLang === 'nodejs' ? 'NodeJS' : selfHostLang === 'csharp' ? 'DotNet_CSharp' : selfHostLang === 'php' ? 'Laravel_PHP' : 'Python_FastAPI';
      a.download = `DBStudio_SelfHost_Backend_${langLabel}.zip`;
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showMessage("Self-Host Backend Heruntergeladen", `Das vollständige Self-Hosting Backend (${selfHostLang.toUpperCase()}) für DB Studio Pro wurde erfolgreich als ZIP heruntergeladen.`, "success");
    } catch (err: any) {
      showMessage("Export-Fehler", err?.message || "Fehler beim Erstellen des Self-Host ZIP Pakets", "error");
    }
  };

  // --- PUNKT 1: Live Server Sync Handlers ---
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
    setIsTestingServer(true);
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
        showMessage("Live Sync Erfolgreich", `Metadaten & Schema wurden live an ${remoteServerUrl} übertragen (${nowStr}).`, "success");
      } else {
        showMessage("Sync Fehlgeschlagen", `Server gab HTTP ${res.status} zurück.`, "error");
      }
    } catch (err: any) {
      showMessage("Sync Fehler", `Verbindung zu ${remoteServerUrl} fehlgeschlagen. Ist das Backend gestartet?`, "error");
    } finally {
      setIsTestingServer(false);
    }
  };

  // --- PUNKT 3: REST API Tester & Generators ---
  const handleExecuteApiRequest = async () => {
    setIsExecutingApiReq(true);
    const start = Date.now();
    try {
      const cleanTable = playgroundTable.toLowerCase();
      const url = `${remoteServerUrl}/api/data/${cleanTable}`;
      
      let reqOptions: RequestInit = {
        method: playgroundMethod,
        headers: { 'Content-Type': 'application/json' }
      };

      if (playgroundMethod === 'POST' || playgroundMethod === 'PUT') {
        reqOptions.body = playgroundPayload;
      }

      const res = await fetch(url, reqOptions);
      const timeMs = Date.now() - start;
      
      let data: any;
      try {
        data = await res.json();
      } catch (e) {
        data = { message: "Kein JSON zurückgegeben oder Antwort war leer" };
      }

      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        timeMs,
        data
      });
      showMessage("API Test Ausgeführt", `HTTP ${res.status} in ${timeMs}ms von ${url}`, res.ok ? "success" : "warning");
    } catch (err: any) {
      // Offline fallback simulator using local IndexedDB table mock data
      const timeMs = Date.now() - start;
      const mockTable = tables.find(t => t.name.toLowerCase() === playgroundTable.toLowerCase());
      const mockData = mockTable ? mockTable.fields.map(f => ({ [f.name]: f.type === 'INTEGER' ? 1 : f.type === 'VARCHAR' ? 'Beispiel' : 'Value' })) : [{ id: 1, name: "Simulation Data", note: "Server offline - Simulation aus IndexedDB Schema" }];
      
      setPlaygroundResponse({
        status: 200,
        statusText: 'OK (Local Simulation)',
        timeMs,
        data: playgroundMethod === 'GET' ? mockData : { success: true, message: "Datensatz in lokaler Simulation erstellt/aktualisiert", payload: playgroundPayload }
      });
      showMessage("Lokale Simulation", `Server nicht direkt erreichbar. Antwort wurde lokal aus dem IndexedDB-Schema simuliert.`, "info");
    } finally {
      setIsExecutingApiReq(false);
    }
  };

  const generateOpenApiSpec = () => {
    const activeTables = tables.filter(t => selectedTables[t.id]);
    const paths: any = {};

    activeTables.forEach(t => {
      const name = t.name.toLowerCase();
      paths[`/api/data/${name}`] = {
        get: {
          summary: `Alle Eintragszeilen für ${t.name} abrufen`,
          responses: { "200": { description: "Erfolgreich", content: { "application/json": {} } } }
        },
        post: {
          summary: `Neuen Datensatz in ${t.name} erstellen`,
          requestBody: { content: { "application/json": { schema: { type: "object" } } } },
          responses: { "201": { description: "Erstellt" } }
        }
      };
    });

    return JSON.stringify({
      openapi: "3.0.0",
      info: { title: "DB Studio Pro Self-Host REST API", version: "1.0.0", description: implementGoal },
      servers: [{ url: remoteServerUrl }],
      paths
    }, null, 2);
  };

  const generatePostmanCollection = () => {
    const activeTables = tables.filter(t => selectedTables[t.id]);
    const items = activeTables.map(t => {
      const name = t.name.toLowerCase();
      return {
        name: `Table: ${t.name}`,
        item: [
          {
            name: `Get All ${t.name}`,
            request: { method: "GET", url: { raw: `{{baseUrl}}/api/data/${name}` } }
          },
          {
            name: `Create ${t.name}`,
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: { mode: "raw", raw: JSON.stringify(t.fields.reduce((acc: any, f) => { acc[f.name] = f.type === 'INTEGER' ? 1 : 'Sample'; return acc; }, {}), null, 2) },
              url: { raw: `{{baseUrl}}/api/data/${name}` }
            }
          }
        ]
      };
    });

    return JSON.stringify({
      info: { name: "DB Studio Pro Postman Collection", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
      variable: [{ key: "baseUrl", value: remoteServerUrl }],
      item: items
    }, null, 2);
  };

  const generateMigrationScripts = (dialect: 'sql' | 'drizzle' | 'knex' | 'prisma') => {
    const activeTables = tables.filter(t => selectedTables[t.id]);
    const ts = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);

    if (dialect === 'drizzle') {
      return `// Drizzle ORM Schema Export (${ts})
import { pgTable, serial, text, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

${activeTables.map(t => `export const ${t.name.toLowerCase()} = pgTable('${t.name.toLowerCase()}', {
${t.fields.map(f => `  ${f.name}: ${f.type === 'INTEGER' ? 'integer' : 'varchar'}('${f.name}')${f.isPrimaryKey ? '.primaryKey()' : ''}${!f.allowNull ? '.notNull()' : ''}`).join(',\n')}
});`).join('\n\n')}`;
    }

    if (dialect === 'knex') {
      return `// Knex.js Migration File (${ts}_create_schema.js)
exports.up = function(knex) {
  return knex.schema
${activeTables.map(t => `    .createTable('${t.name.toLowerCase()}', function(table) {
${t.fields.map(f => `      table.${f.type === 'INTEGER' ? 'integer' : 'string'}('${f.name}')${f.isPrimaryKey ? '.primaryKey()' : ''};`).join('\n')}
    })`).join('\n')};
};

exports.down = function(knex) {
  return knex.schema
${activeTables.map(t => `    .dropTableIfExists('${t.name.toLowerCase()}')`).join('\n')};
};`;
    }

    if (dialect === 'prisma') {
      return `// Prisma Schema Export (${ts})
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${activeTables.map(t => `model ${t.name} {
${t.fields.map(f => `  ${f.name} ${f.type === 'INTEGER' ? 'Int' : 'String'} ${f.isPrimaryKey ? '@id @default(autoincrement())' : ''}`).join('\n')}
}`).join('\n\n')}`;
    }

    // Default SQL
    return `-- ==========================================
-- MIGRATION: ${ts}_001_initial_schema.sql
-- ==========================================

${activeTables.map(t => `CREATE TABLE IF NOT EXISTS ${t.name.toLowerCase()} (
${t.fields.map(f => `  ${f.name} ${f.type === 'INTEGER' ? 'INT' : 'VARCHAR(255)'}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}`).join(',\n')}
);`).join('\n\n')}

-- ROLLBACK SCRIPT:
${activeTables.map(t => `DROP TABLE IF EXISTS ${t.name.toLowerCase()};`).join('\n')}`;
  };

  const generateRlsPolicies = () => {
    const activeTables = tables.filter(t => selectedTables[t.id]);
    return `-- ==========================================
-- ROW LEVEL SECURITY (RLS) & RBAC POLICIES
-- ==========================================

-- Enable Row Level Security on all active tables
${activeTables.map(t => `ALTER TABLE ${t.name.toLowerCase()} ENABLE ROW LEVEL SECURITY;`).join('\n')}

-- RBAC Policies for Role Matrix
${rbacRoles.map(role => {
  return `-- Policy for Role: ${role.name} (${role.description})
${activeTables.map(t => {
  const perm = role.permissions[t.name] || { read: false, create: false, update: false, delete: false };
  const policies = [];
  if (perm.read) {
    policies.push(`CREATE POLICY "${t.name.toLowerCase()}_select_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR SELECT TO ${role.name.toLowerCase()} USING (true);`);
  }
  if (perm.create) {
    policies.push(`CREATE POLICY "${t.name.toLowerCase()}_insert_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR INSERT TO ${role.name.toLowerCase()} WITH CHECK (auth.role() = '${role.name}');`);
  }
  if (perm.update) {
    policies.push(`CREATE POLICY "${t.name.toLowerCase()}_update_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR UPDATE TO ${role.name.toLowerCase()} USING (auth.uid() = user_id OR auth.role() = 'ADMIN');`);
  }
  if (perm.delete) {
    policies.push(`CREATE POLICY "${t.name.toLowerCase()}_delete_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR DELETE TO ${role.name.toLowerCase()} USING (auth.role() = 'ADMIN');`);
  }
  return policies.join('\n');
}).filter(Boolean).join('\n')}`;
}).join('\n\n')}`;
  };

  const generateRbacMiddlewareCode = () => {
    return `// Express.js JWT & RBAC Middleware Generator
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'db_studio_secret_key';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    (req as any).user = user;
    next();
  });
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role || 'GUEST';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: \`Forbidden: Role '\${userRole}' lacks privileges.\` 
      });
    }
    next();
  };
}`;
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

  const handleSwitchTab = (tab: 'sql' | 'backend' | 'auth') => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Visual Top Bar / Dashboard Title */}
      <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-white">
            <Server className="text-indigo-400 shrink-0" size={20} />
            <span>DB Studio Self-Hosting Backend</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">Eating our own dog food</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Nutzen Sie DB Studio, um seine eigene relationale Metadaten-Datenbank lokal zu hosten oder im Team zu synchronisieren.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Tech Stack Selection Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400">Stack:</span>
            <select
              id="select_selfhost_lang"
              value={selfHostLang}
              onChange={(e) => setSelfHostLang(e.target.value as any)}
              className="bg-slate-800 text-slate-100 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="nodejs">Node.js (Express)</option>
              <option value="csharp">.NET 8 (C# WebAPI)</option>
              <option value="php">PHP (Laravel API)</option>
              <option value="python">Python (FastAPI)</option>
            </select>
          </div>

          {/* Action Button: Self-Host Backend ZIP Download */}
          <button
            id="btn_download_dbstudio_backend_zip"
            onClick={handleDownloadSelfHostZip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all border border-emerald-500/30"
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMode === 'local' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMode === 'cloud' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Cloud size={14} />
              <span>Team-Cloud (Kollaboration)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Header for Points 1, 2, 3 & Architecture */}
      <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <button
            id="tab_punkt_1_sync"
            onClick={() => setMainSectionTab('sync')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'sync' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Radio size={14} className={mainSectionTab === 'sync' ? 'animate-pulse text-indigo-200' : ''} />
            <span>Punkt 1: Live Sync & Server-Bridge</span>
            {serverHealth?.connected && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            id="tab_punkt_2_migrations"
            onClick={() => setMainSectionTab('migrations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'migrations' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <FileText size={14} />
            <span>Punkt 2: Schema Migrations & DDL</span>
          </button>

          <button
            id="tab_punkt_3_api"
            onClick={() => setMainSectionTab('api_playground')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'api_playground' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <PlayCircle size={14} />
            <span>Punkt 3: REST API Tester & OpenAPI</span>
          </button>

          <button
            id="tab_punkt_4_security"
            onClick={() => setMainSectionTab('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Shield size={14} />
            <span>Punkt 4: RBAC & Dynamic RLS</span>
          </button>

          <button
            id="tab_punkt_5_monitor"
            onClick={() => setMainSectionTab('monitor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'monitor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Activity size={14} />
            <span>Punkt 5: Live Monitor & Audit Logs</span>
          </button>

          <button
            id="tab_punkt_arch"
            onClick={() => setMainSectionTab('self_host')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mainSectionTab === 'self_host' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Layers size={14} />
            <span>Metadaten-Schema & Cloud Assistent</span>
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

      {/* Main Content Layout Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* ================= PUNKT 1: LIVE SYNC & REMOTE BRIDGE ================= */}
        {mainSectionTab === 'sync' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            {/* Live Connection Control Box */}
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="text-indigo-400" size={20} />
                    <span>Punkt 1: Live Realtime Sync & Server Bridge</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">Local IndexedDB ⇄ Self-Host Backend</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Verbinden Sie DB Studio Pro direkt mit Ihrem lokalen oder gehosteten Backend-Server für automatischen Datenabgleich.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>⚡ Auto-Sync Aktiv</span>
                  </label>
                </div>
              </div>

              {/* Connection URL Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-7 flex items-center bg-slate-950 rounded-xl border border-slate-700/80 px-3 py-2 text-xs">
                  <Globe size={16} className="text-slate-400 shrink-0 mr-2" />
                  <span className="text-slate-500 font-mono mr-1">URL:</span>
                  <input
                    type="text"
                    value={remoteServerUrl}
                    onChange={(e) => setRemoteServerUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="bg-transparent text-white font-mono flex-1 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-5 flex items-center gap-2">
                  <button
                    onClick={handleTestServerConnection}
                    disabled={isTestingServer}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={14} className={isTestingServer ? 'animate-spin' : ''} />
                    <span>Verbindung Testen</span>
                  </button>

                  <button
                    onClick={handlePushLiveSync}
                    disabled={isTestingServer}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Live Push Sync</span>
                  </button>
                </div>
              </div>

              {/* Status Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Verbindungsstatus</p>
                  <p className={`font-bold flex items-center gap-2 ${serverHealth?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${serverHealth?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {serverHealth?.connected ? 'Online & Verbunden' : 'Lokaler Offline-Modus'}
                  </p>
                  {serverHealth?.service && <p className="text-[11px] text-slate-400">{serverHealth.service} ({serverHealth.version})</p>}
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Letzter Sync</p>
                  <p className="font-bold text-slate-200">{lastSyncedTime ? lastSyncedTime : 'Noch nicht synchronisiert'}</p>
                  <p className="text-[11px] text-slate-500">IndexedDB local persistent store</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Integrität & Tabellen</p>
                  <p className="font-bold text-indigo-300">{tables.length} Tabellen ({queries.length} Queries)</p>
                  <p className="text-[11px] text-emerald-400">FK Relationships validated</p>
                </div>
              </div>
            </div>

            {/* Live Sync Event Log */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
              <h3 className="text-slate-400 uppercase tracking-wider text-[11px] font-bold flex items-center justify-between">
                <span>Live Sync Protokoll & Ereignisse</span>
                <span className="text-emerald-400">IndexedDB WebSocket / HTTP Stream</span>
              </h3>
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-slate-300 max-h-48 overflow-y-auto">
                <div className="text-emerald-400">&gt; [IndexedDB] Lokaler Speicher 'db_studio_pro' geladen.</div>
                <div className="text-slate-400">&gt; [Schema Engine] {tables.length} Tabellen ({tables.map(t => t.name).join(', ')}) im Speicher.</div>
                {lastSyncedTime && <div className="text-indigo-400">&gt; [Live Sync] Erfolgreich synchronisiert mit {remoteServerUrl} um {lastSyncedTime}.</div>}
                {autoSyncEnabled && <div className="text-amber-400">&gt; [Auto-Sync] Beobachte lokale IndexedDB-Events...</div>}
              </div>
            </div>
          </div>
        )}

        {/* ================= PUNKT 2: SCHEMA MIGRATIONS & DDL ================= */}
        {mainSectionTab === 'migrations' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="text-indigo-400" size={20} />
                    <span>Punkt 2: Automatische DB Schema Migrationen & DDL Export</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Generieren Sie sofort ausführbare SQL DDL Migrationsdateien und ORM-Schemas für Ihre Produktiv-Datenbanken.</p>
                </div>

                {/* Dialect Selector */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
                  <button
                    onClick={() => setMigrationDialect('sql')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${migrationDialect === 'sql' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Raw SQL DDL
                  </button>
                  <button
                    onClick={() => setMigrationDialect('drizzle')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${migrationDialect === 'drizzle' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Drizzle ORM
                  </button>
                  <button
                    onClick={() => setMigrationDialect('knex')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${migrationDialect === 'knex' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Knex.js
                  </button>
                  <button
                    onClick={() => setMigrationDialect('prisma')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${migrationDialect === 'prisma' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Prisma
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs relative overflow-hidden">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 text-slate-400">
                  <span className="text-indigo-400 font-bold">
                    📄 {migrationDialect === 'sql' ? '001_initial_schema.sql' : migrationDialect === 'drizzle' ? 'schema.ts' : migrationDialect === 'knex' ? 'migration.js' : 'schema.prisma'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateMigrationScripts(migrationDialect));
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                      showMessage("Kopiert", "Migrations-Code wurde in die Zwischenablage kopiert.", "success");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Kopiert!' : 'Code Kopieren'}</span>
                  </button>
                </div>

                <pre className="text-slate-300 overflow-x-auto p-2 leading-relaxed max-h-96">
                  <code>{generateMigrationScripts(migrationDialect)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= PUNKT 3: REST API PLAYGROUND & OPENAPI ================= */}
        {mainSectionTab === 'api_playground' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <PlayCircle className="text-indigo-400" size={20} />
                    <span>Punkt 3: REST API Playground & OpenAPI / Postman Specs</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Interaktiver API-Tester und automatischer Export von OpenAPI 3.0 Specs & Postman Collections.</p>
                </div>

                {/* Sub-tab Switch */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
                  <button
                    onClick={() => setApiSpecTab('playground')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${apiSpecTab === 'playground' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    API Playground
                  </button>
                  <button
                    onClick={() => setApiSpecTab('openapi')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${apiSpecTab === 'openapi' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    OpenAPI 3.0 Spec
                  </button>
                  <button
                    onClick={() => setApiSpecTab('postman')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${apiSpecTab === 'postman' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Postman Collection
                  </button>
                </div>
              </div>

              {/* API Playground View */}
              {apiSpecTab === 'playground' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tabelle auswählen</label>
                      <select
                        value={playgroundTable}
                        onChange={(e) => setPlaygroundTable(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs font-mono p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.name}>{t.name} (/api/data/{t.name.toLowerCase()})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">HTTP Methode</label>
                      <div className="grid grid-cols-4 gap-2 font-mono text-xs font-bold">
                        {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                          <button
                            key={m}
                            onClick={() => setPlaygroundMethod(m as any)}
                            className={`py-2 rounded-xl border transition-all ${playgroundMethod === m ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(playgroundMethod === 'POST' || playgroundMethod === 'PUT') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">JSON Body Payload</label>
                        <textarea
                          rows={6}
                          value={playgroundPayload}
                          onChange={(e) => setPlaygroundPayload(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleExecuteApiRequest}
                      disabled={isExecutingApiReq}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Play size={14} />
                      <span>Anfrage Senden ({playgroundMethod} /api/data/{playgroundTable.toLowerCase()})</span>
                    </button>
                  </div>

                  {/* Right Response Viewer */}
                  <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-slate-400">
                      <span className="font-bold text-slate-200">HTTP Antwort-Stream</span>
                      {playgroundResponse && (
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${playgroundResponse.status >= 200 && playgroundResponse.status < 300 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {playgroundResponse.status} {playgroundResponse.statusText}
                          </span>
                          <span className="text-slate-500">{playgroundResponse.timeMs}ms</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 overflow-y-auto flex-1 font-mono text-slate-300 leading-relaxed max-h-80">
                      {playgroundResponse ? (
                        <pre><code>{JSON.stringify(playgroundResponse.data, null, 2)}</code></pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
                          <Terminal size={24} className="opacity-40" />
                          <p>Klicken Sie auf 'Anfrage Senden', um die REST API-Schnittstelle zu testen.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* OpenAPI Spec View */}
              {apiSpecTab === 'openapi' && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs space-y-3">
                  <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                    <span className="text-indigo-400 font-bold">openapi_v3_specification.json</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateOpenApiSpec());
                        showMessage("Kopiert", "OpenAPI 3.0 Spezifikation kopiert.", "success");
                      }}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      Spec Kopieren
                    </button>
                  </div>
                  <pre className="text-slate-300 overflow-x-auto max-h-96"><code>{generateOpenApiSpec()}</code></pre>
                </div>
              )}

              {/* Postman Collection View */}
              {apiSpecTab === 'postman' && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs space-y-3">
                  <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                    <span className="text-indigo-400 font-bold">postman_collection.json</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatePostmanCollection());
                        showMessage("Kopiert", "Postman Collection JSON kopiert.", "success");
                      }}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      Collection Kopieren
                    </button>
                  </div>
                  <pre className="text-slate-300 overflow-x-auto max-h-96"><code>{generatePostmanCollection()}</code></pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PUNKT 4: SECURITY & DYNAMIC RBAC ================= */}
        {mainSectionTab === 'security' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="text-indigo-400" size={20} />
                    <span>Punkt 4: Security & Dynamic RBAC Roles Generator</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">Row Level Security (RLS) Active</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Definieren Sie rollenbasierte Zugriffsrechte (RBAC), Zeilenebenen-Sicherheitsregeln (RLS) und Sicherheits-Guards.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Role selected:</span>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
                    {rbacRoles.map(r => (
                      <button
                        key={r.name}
                        onClick={() => setSelectedRole(r.name)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${selectedRole === r.name ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Role Permissions Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Tabellen-Zugriffsmatrix für Rolle '{selectedRole}'</span>
                  <span className="text-slate-400 font-normal text-[11px]">{rbacRoles.find(r => r.name === selectedRole)?.description}</span>
                </h3>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Tabelle</th>
                        <th className="p-3 text-center">SELECT (Read)</th>
                        <th className="p-3 text-center">INSERT (Create)</th>
                        <th className="p-3 text-center">UPDATE (Edit)</th>
                        <th className="p-3 text-center">DELETE (Remove)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {tables.map(t => {
                        const currentRoleObj = rbacRoles.find(r => r.name === selectedRole);
                        const perm = currentRoleObj?.permissions[t.name] || { read: false, create: false, update: false, delete: false };

                        const togglePerm = (type: 'read' | 'create' | 'update' | 'delete') => {
                          setRbacRoles(prev => prev.map(r => {
                            if (r.name !== selectedRole) return r;
                            const updatedTablePerm = { ...r.permissions[t.name], [type]: !r.permissions[t.name]?.[type] };
                            return { ...r, permissions: { ...r.permissions, [t.name]: updatedTablePerm } };
                          }));
                        };

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-indigo-300 flex items-center gap-2">
                              <Database size={14} className="text-slate-500" />
                              <span>{t.name}</span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.read}
                                onChange={() => togglePerm('read')}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.create}
                                onChange={() => togglePerm('create')}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.update}
                                onChange={() => togglePerm('update')}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.delete}
                                onChange={() => togglePerm('delete')}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Config Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-slate-300 font-bold block">JWT Expiration Policy</label>
                  <input
                    type="text"
                    value={jwtExpiry}
                    onChange={(e) => setJwtExpiry(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                    placeholder="15m"
                  />
                  <p className="text-[10px] text-slate-500">Gültigkeitsdauer des Access-Tokens (z.B. 15m, 1h, 7d)</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-slate-300 font-bold block">IP Rate Limiter (req/min)</label>
                  <input
                    type="number"
                    value={rateLimitMax}
                    onChange={(e) => setRateLimitMax(parseInt(e.target.value) || 60)}
                    className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Maximale Anfragen pro IP-Adresse in einer Minute</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-slate-300 font-bold block">CORS Origin Whitelist</label>
                  <input
                    type="text"
                    value={corsOrigins}
                    onChange={(e) => setCorsOrigins(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Erlaubte Client-Domains für API-Aufrufe</p>
                </div>
              </div>

              {/* Generated Policy Scripts & Middleware */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                    <span className="text-indigo-400 font-bold">🔒 postgresql_rls_policies.sql</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateRlsPolicies());
                        showMessage("Kopiert", "PostgreSQL RLS Policies in Zwischenablage kopiert.", "success");
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      SQL Kopieren
                    </button>
                  </div>
                  <pre className="text-slate-300 max-h-56 overflow-y-auto leading-relaxed"><code>{generateRlsPolicies()}</code></pre>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                    <span className="text-indigo-400 font-bold">🛡️ rbac_auth_middleware.ts</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateRbacMiddlewareCode());
                        showMessage("Kopiert", "Express RBAC Middleware in Zwischenablage kopiert.", "success");
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      TS Kopieren
                    </button>
                  </div>
                  <pre className="text-slate-300 max-h-56 overflow-y-auto leading-relaxed"><code>{generateRbacMiddlewareCode()}</code></pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PUNKT 5: AUDIT LOG & LIVE MONITOR ================= */}
        {mainSectionTab === 'monitor' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="text-indigo-400 animate-pulse" size={20} />
                    <span>Punkt 5: Audit Log & Realtime Database Monitor</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">Telemetry Stream Active</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Echtzeit-Überwachung von Datenbank-Abfragen, Performance-Latenzen, QPS und Audit-Sicherheitsprotokollen.</p>
                </div>

                <button
                  onClick={handleSimulateTraffic}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>⚡ Traffic Event Simulieren</span>
                </button>
              </div>

              {/* Health Metrics Gauges */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Abfragen/Sek (QPS)</p>
                  <p className="text-xl font-bold text-indigo-400">{qpsCount} <span className="text-xs text-slate-500 font-normal">req/s</span></p>
                  <p className="text-[10px] text-emerald-400">↑ Normaler Durchsatz</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Ø Latenz</p>
                  <p className="text-xl font-bold text-emerald-400">{avgLatency} <span className="text-xs text-slate-500 font-normal">ms</span></p>
                  <p className="text-[10px] text-emerald-400">⚡ Sehr schnell</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Connection Pool</p>
                  <p className="text-xl font-bold text-slate-200">12 / 50</p>
                  <p className="text-[10px] text-slate-400">24% Auslastung</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Cache Hit Rate</p>
                  <p className="text-xl font-bold text-indigo-300">98.6%</p>
                  <p className="text-[10px] text-emerald-400">In-Memory Cache</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1 col-span-2 md:col-span-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Speicher (IndexedDB)</p>
                  <p className="text-xl font-bold text-slate-200">1.4 MB</p>
                  <p className="text-[10px] text-slate-500">Persistent local storage</p>
                </div>
              </div>

              {/* Realtime Audit Trail Table */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    <span>Realtime DB Audit Log & Execution History</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">{auditLogs.length} protokollierte Ereignisse</span>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Zeitstempel</th>
                        <th className="p-3">Aktion</th>
                        <th className="p-3">User & Rolle</th>
                        <th className="p-3">Details & Abfrage</th>
                        <th className="p-3 text-right">Latenz</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50">
                          <td className="p-3 text-slate-400 text-[11px]">{log.timestamp}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              log.action === 'SELECT' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              log.action === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              log.action === 'UPDATE' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              log.action === 'DELETE' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-200">
                            {log.user} <span className="text-[10px] text-slate-500">({log.role})</span>
                          </td>
                          <td className="p-3 text-slate-300 font-mono text-[11px] truncate max-w-md">{log.details}</td>
                          <td className="p-3 text-right font-bold text-slate-400">{log.latencyMs} ms</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                              log.status === 'WARN' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ARCHITECTURE & METADATA EXPLORER ================= */}
        {mainSectionTab === 'self_host' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column (System Schema Explorer & Mode Details) */}
        <div className="xl:col-span-4 space-y-6 flex flex-col h-full min-h-0">
          
          {/* Active Mode Status Panel */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/60 relative overflow-hidden shrink-0">
            <div className={`absolute top-0 left-0 right-0 h-1 ${activeMode === 'local' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <h2 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <span>Aktueller Status</span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold border ${activeMode === 'local' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'local' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                {activeMode === 'local' ? 'Lokal-First' : 'Team-Cloud Online'}
              </span>
            </h2>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeMode === 'local' 
                ? "Sie arbeiten auf Ihrer lokalen Entwickler-Maschine. Alle Datenbank-Spezifikationen, Relationen, Tickets und Entwürfe werden sicher in einer lokalen SQLite-Datei gesichert."
                : "Sie sind mit der mandantenfähigen Team-Cloud verbunden. Ihre Änderungen werden in Echtzeit via WebSockets synchronisiert. Sarah und Tom können Ihre Änderungen sofort sehen."}
            </p>

            <div className="mt-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-xs flex items-center gap-3">
              <Database className="text-slate-400" size={16} />
              <div>
                <p className="font-semibold text-slate-200">Verwendete Metadaten-DB:</p>
                <p className="font-mono text-[10px] text-slate-400">{activeMode === 'local' ? 'sqlite://localhost/db_studio_pro.db' : 'postgresql://dbstudio-cloud-cluster:5432/main_metadata'}</p>
              </div>
            </div>
          </div>

          {/* DB Studio's Own Schema Explorer */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col flex-1 min-h-[350px]">
            <div className="p-4 border-b border-slate-700/60 flex items-center gap-2">
              <Layers className="text-indigo-400" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">System Metadaten-Tabellen</h3>
            </div>
            
            <div className="grid grid-cols-2 p-2 gap-1 border-b border-slate-700/50 shrink-0">
              {Object.keys(systemSchema).map(tblName => (
                <button
                  key={tblName}
                  onClick={() => setSelectedSystemTable(tblName)}
                  className={`text-left p-2 rounded text-xs font-mono transition-colors truncate ${selectedSystemTable === tblName ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-slate-700/40 text-slate-400'}`}
                >
                  📁 {tblName}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-white font-mono">{systemSchema[selectedSystemTable].name}</h4>
                <p className="text-xs text-slate-400 mt-1">{systemSchema[selectedSystemTable].description}</p>
              </div>

              <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/55">
                <div className="grid grid-cols-12 bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 p-2 border-b border-slate-700/60 font-mono">
                  <div className="col-span-5">Feld</div>
                  <div className="col-span-4">Typ</div>
                  <div className="col-span-3 text-right">Details</div>
                </div>
                <div className="divide-y divide-slate-800 font-mono text-[11px] max-h-48 overflow-y-auto">
                  {systemSchema[selectedSystemTable].fields.map(f => (
                    <div key={f.name} className="grid grid-cols-12 p-2 hover:bg-slate-800/30 group">
                      <div className="col-span-5 font-semibold text-slate-200 flex items-center gap-1">
                        {f.isKey && <Key size={10} className="text-amber-400" />}
                        <span>{f.name}</span>
                      </div>
                      <div className="col-span-4 text-indigo-300">{f.type}</div>
                      <div className="col-span-3 text-right text-slate-500 text-[10px] group-hover:text-slate-300" title={f.comment}>Info</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sync Upload Assistant & Output) */}
        <div className="xl:col-span-8 flex flex-col space-y-6">
          
          {/* Synchronisierungs-Assistent */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/60 relative">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <UploadCloud className="text-indigo-400" size={18} />
              <span>Lokale Daten & Schema in die Team-Cloud laden</span>
            </h2>

            {/* Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Tables list */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex justify-between items-center">
                  <span>Tabellen für Upload ({tables.length})</span>
                  <button 
                    onClick={() => {
                      const allSelected = Object.values(selectedTables).every(Boolean);
                      const next: Record<string, boolean> = {};
                      tables.forEach(t => { next[t.id] = !allSelected; });
                      setSelectedTables(next);
                    }}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Alle an/abwählen
                  </button>
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                  {tables.map(t => (
                    <label key={t.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={!!selectedTables[t.id]} 
                        onChange={() => handleToggleTable(t.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                      />
                      <span className="font-mono text-white font-semibold">{t.name}</span>
                      <span className="text-[10px] text-slate-500 ml-auto">({t.fields.length} Felder)</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Queries list */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex justify-between items-center">
                  <span>Abfragen für Upload ({queries.length})</span>
                  <button 
                    onClick={() => {
                      const allSelected = Object.values(selectedQueries).every(Boolean);
                      const next: Record<string, boolean> = {};
                      queries.forEach(q => { next[q.id] = !allSelected; });
                      setSelectedQueries(next);
                    }}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Alle an/abwählen
                  </button>
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                  {queries.length > 0 ? (
                    queries.map(q => (
                      <label key={q.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={!!selectedQueries[q.id]} 
                          onChange={() => handleToggleQuery(q.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                        />
                        <span className="font-mono text-white truncate max-w-[150px]" title={q.name}>{q.name}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 rounded ml-auto">SELECT</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">Keine benutzerdefinierten Abfragen entworfen.</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Prompt / Questionnaire */}
            <div className="bg-slate-900/45 p-4 rounded-xl border border-slate-700/50 mb-6 space-y-4">
              <div className="flex gap-2 items-center">
                <Terminal size={14} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Implementierungs-Fragebogen (Team Cloud Integration)</h3>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Was soll in diesem Team-Cloud-Projekt implementiert werden?</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={implementGoal}
                    onChange={e => setImplementGoal(e.target.value)}
                    placeholder="z.B. Erstelle eine Tabelle für Aufgaben und verknüpfe sie mit Kunden"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Backend-Architektur / Framework</label>
                  <select
                    value={backendTemplate}
                    onChange={e => setBackendTemplate(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                  >
                    <option value="express">Express.js (NodeJS Template)</option>
                    <option value="nestjs">NestJS (TypeScript Controller & Services)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Authentifizierungs-Methode</label>
                  <select
                    value={authProvider}
                    onChange={e => setAuthProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                  >
                    <option value="jwt">JWT (JSON Web Token & Bearer Strategy)</option>
                    <option value="google">Google OAuth2 SSO Strategy</option>
                    <option value="github">GitHub SSO & Passport Integration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-800/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={genCrud}
                    onChange={e => setGenCrud(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span>CRUD-Endpunkte erzeugen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={genTypes}
                    onChange={e => setGenTypes(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span>TypeScript & Zod Validierung</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={enableRls}
                    onChange={e => setEnableRls(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span>Row-Level Security (RLS)</span>
                </label>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Die Daten werden an Ihre Team-Instanz übermittelt und dort live registriert.
              </p>
              <button
                onClick={runSyncSimulation}
                disabled={syncStatus !== 'idle' && syncStatus !== 'completed'}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all shrink-0"
              >
                {syncStatus === 'idle' || syncStatus === 'completed' ? (
                  <>
                    <UploadCloud size={16} />
                    <span>In Team-Cloud hochladen</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Synchronisiere...</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync Console & Code Output */}
          {syncStatus !== 'idle' && (
            <div className="bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
              
              {/* Console Header */}
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">Console & Code Generator</span>
                </div>

                {syncStatus === 'completed' && (
                  <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                    <button 
                      onClick={() => handleSwitchTab('sql')}
                      className={`px-2 py-1 rounded-md transition-all ${activeTab === 'sql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      migrations.sql
                    </button>
                    <button 
                      onClick={() => handleSwitchTab('backend')}
                      className={`px-2 py-1 rounded-md transition-all ${activeTab === 'backend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {backendTemplate === 'express' ? 'routes.ts' : 'cloud-hub.controller.ts'}
                    </button>
                    <button 
                      onClick={() => handleSwitchTab('auth')}
                      className={`px-2 py-1 rounded-md transition-all ${activeTab === 'auth' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {backendTemplate === 'express' ? 'auth.ts' : 'jwt.strategy.ts'}
                    </button>
                  </div>
                )}
              </div>

              {/* Console Body Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 flex-1 divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-[220px]">
                
                {/* Live Logs Left Panel */}
                <div className="p-4 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 bg-slate-950/80">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-emerald-400 font-bold">&gt;</span> {log}
                    </div>
                  ))}
                  {syncStatus !== 'completed' && (
                    <div className="flex items-center gap-2 text-slate-500 animate-pulse mt-2">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Analysiere & verarbeite Metadaten-Strom...</span>
                    </div>
                  )}
                </div>

                {/* Code Preview Right Panel */}
                <div className="bg-slate-900/40 overflow-hidden flex flex-col font-mono text-[11px]">
                  {syncStatus === 'completed' ? (
                    <div className="p-4 overflow-y-auto flex-1 max-h-64 md:max-h-none">
                      <pre className="text-slate-300 leading-normal whitespace-pre">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-500 gap-2 p-6 text-center">
                      <Code size={24} className="opacity-25" />
                      <p>Warten auf Generierung der Migrations-Skripte und API-Schnittstellen...</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* Active Cloud Collaborators Card (Simulated Cloud Multiplayer) */}
          {activeMode === 'cloud' && (
            <div className="bg-slate-800/35 p-5 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-200 shrink-0">
              <div className="flex items-center gap-3">
                <Users className="text-emerald-400 shrink-0" size={18} />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Aktive Teammitglieder in der Cloud</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Folgende Personen bearbeiten dieses Schema gerade live mit Ihnen.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-center shrink-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  <span className="text-white font-medium">Ich (u1)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-slate-900 animate-pulse" />
                  <span className="font-medium">Sarah (u2)</span>
                  <span className="text-[10px] text-slate-500">Bearbeitet 'Bestellungen'</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border-2 border-slate-900 animate-pulse" />
                  <span className="font-medium">Tom (u3)</span>
                  <span className="text-[10px] text-slate-500">Erstellt Query 'Umsätze'</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
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
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Referenzielle Integritätsprüfung</h3>
                <p className="text-xs text-slate-400 mt-0.5">DB Studio Pro hat potenzielle Konflikte in Ihren Fremdschlüsselbeziehungen erkannt.</p>
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
                    <p className="text-xs text-slate-200 font-medium">{err.message}</p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>{err.fromTable}.{err.fromField}</span>
                      <ArrowRight size={10} className="text-indigo-400" />
                      <span>{err.toTable}.{err.toField}</span>
                    </div>
                  </div>

                  {err.fixable && err.toTableId && (
                    <button
                      onClick={() => handleFixFkError(err.toTableId!)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0"
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
                    className="w-full sm:w-auto bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold px-4 py-2 rounded-lg text-xs transition-all"
                  >
                    Alle referenzierten Tabellen auswählen
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowFkValidationModal(false)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowFkValidationModal(false);
                    executeUploadSimulation();
                  }}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Trotzdem hochladen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
