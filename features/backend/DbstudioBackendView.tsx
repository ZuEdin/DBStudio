import React, { useState } from 'react';
import { Table, Query, Relationship } from '../../types/index';
import { 
  Laptop, Cloud, Server, Database, Key, Send, UploadCloud, 
  CheckCircle2, AlertCircle, RefreshCw, PlusCircle, ArrowRight, 
  Layers, Users, Play, Code, CheckSquare, MessageSquare, Terminal,
  AlertTriangle, ShieldAlert
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

      {/* Main Content Layout Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
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
