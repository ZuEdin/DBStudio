
import { create } from 'zustand';
import { produce } from 'immer';
import { Project, Table, Query, Report, Form, Relationship, BackendConfig, DbType, ProjectData, Chart, Field, Workflow, TableNode } from '../types/index';
import { initSqlEngine, syncTablesToSql, executeRawSql } from '../services/sqlEngine';
import { executeSelectQuery as executeJsQuery } from '../features/queries/utils/queryExecution';
import { generateSqlSelect } from '../utils/sqlHelper';
import { saveProjectToStorage } from '../services/storageService';

interface ProjectStore extends ProjectData {
    projectId: string | null;
    projectName: string;
    init: () => Promise<void>;
    loadProject: (project: Project) => void;
    createNew: (type: DbType, name: string, config: BackendConfig, initialData?: Partial<ProjectData>) => void;
    closeProject: () => void;
    undo: () => void;
    redo: () => void;
    pushHistory: () => void;
    setTables: (tables: Table[]) => void;
    addTable: (table: Table) => void; 
    updateTable: (table: Table) => void;
    setQueries: (queries: Query[]) => void;
    setReports: (reports: Report[]) => void;
    setForms: (forms: Form[]) => void;
    setCharts: (charts: Chart[]) => void;
    setWorkflows: (workflows: Workflow[]) => void;
    setRelationships: (relationships: Relationship[]) => void;
    setBackendConfig: (config: BackendConfig) => void;
    setLayout: (layout: TableNode[]) => void; // New
    snapshot: () => void;
    saveProject: () => Promise<void>; 
    executeQuery: (query: Query) => Record<string, any>[];
}

const initialData: ProjectData = {
    tables: [], queries: [], reports: [], forms: [], charts: [], workflows: [], relationships: [], layout: [],
    backendConfig: { 
        language: 'dotnet', dbType: DbType.SQL, projectName: 'MyProject', port: 5000, 
        dbConnection: '', useSwagger: true, frontendFramework: 'react' 
    },
    lastSnapshot: []
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
    ...initialData,
    projectId: null,
    projectName: '',
    history: { past: [], future: [] } as any,

    init: async () => { await initSqlEngine(); },

    loadProject: (project) => {
        set({
            projectId: project.id,
            projectName: project.name,
            tables: project.data.tables || [],
            queries: project.data.queries || [],
            reports: project.data.reports || [],
            forms: project.data.forms || [],
            charts: project.data.charts || [],
            workflows: project.data.workflows || [],
            relationships: project.data.relationships || [],
            layout: project.data.layout || [], // Load layout
            backendConfig: project.data.backendConfig,
            lastSnapshot: project.data.lastSnapshot || [], 
            history: { past: [], future: [] }
        } as any);
        syncTablesToSql(project.data.tables || []);
    },

    createNew: (type, name, config, initialData) => {
        const id = crypto.randomUUID();
        let tables = [...(initialData?.tables || [])];
        let relationships = [...(initialData?.relationships || [])];
        
        // Auto-create Auth Tables
        if (config.authConfig?.useUserLogin && !tables.some(t => t.name.toLowerCase() === 'sys_users')) {
             const roleTableId = 'sys_roles';
             const rolePkId = crypto.randomUUID();
             const roleFields: Field[] = [
                 { id: rolePkId, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, 
                 { id: crypto.randomUUID(), name: 'Name', type: 'VARCHAR', length: 50 }
             ];
             
             const userTableId = 'sys_users';
             const userPkId = crypto.randomUUID();
             const roleFkId = crypto.randomUUID();
             const userFields: Field[] = [
                 { id: userPkId, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, 
                 { id: crypto.randomUUID(), name: 'Username', type: 'VARCHAR', length: 50 }, 
                 { id: crypto.randomUUID(), name: 'PasswordHash', type: 'VARCHAR', length: 255 }, 
                 { id: roleFkId, name: 'RoleId', type: 'INTEGER' }
             ];

             if (config.multiTenancy?.enabled && config.multiTenancy.strategy === 'discriminator') {
                 const tenantField = config.multiTenancy.tenantField || 'TenantId';
                 userFields.push({ id: crypto.randomUUID(), name: tenantField, type: 'VARCHAR', length: 50 });
                 roleFields.push({ id: crypto.randomUUID(), name: tenantField, type: 'VARCHAR', length: 50 });
             }

             tables.push({ id: roleTableId, name: 'sys_roles', fields: roleFields, data: [{Id:1, Name:'Admin'},{Id:2, Name:'User'}] });
             tables.push({ id: userTableId, name: 'sys_users', fields: userFields, data: [{Id:1, Username:'admin', RoleId:1}] });

             const permTableId = 'sys_permissions';
             tables.push({ id: permTableId, name: 'sys_permissions', fields: [{ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true }, { id: crypto.randomUUID(), name: 'RoleId', type: 'INTEGER' }, { id: crypto.randomUUID(), name: 'ObjectType', type: 'VARCHAR' }, { id: crypto.randomUUID(), name: 'CanRead', type: 'BOOLEAN' }, { id: crypto.randomUUID(), name: 'CanWrite', type: 'BOOLEAN' }, { id: crypto.randomUUID(), name: 'CanDelete', type: 'BOOLEAN' }] });
        }

        set({ 
            ...initialData, 
            projectId: id, 
            projectName: name, 
            backendConfig: config,
            tables,
            relationships,
            charts: [],
            workflows: [],
            layout: [], // Init empty
            lastSnapshot: [], 
            history: { past: [], future: [] }
        } as any);
        
        syncTablesToSql(tables);
    },

    closeProject: () => {
        set({
            ...initialData,
            projectId: null,
            projectName: '',
            history: { past: [], future: [] }
        } as any);
    },

    pushHistory: () => {
        set(produce((state: any) => {
            const current: ProjectData = {
                tables: state.tables, queries: state.queries, reports: state.reports,
                forms: state.forms, charts: state.charts, workflows: state.workflows, relationships: state.relationships, backendConfig: state.backendConfig,
                lastSnapshot: state.lastSnapshot, layout: state.layout
            };
            const newPast = [...state.history.past, current].slice(-20);
            state.history.past = newPast;
            state.history.future = [];
        }));
    },

    undo: () => {
        set(produce((state: any) => {
            if (state.history.past.length === 0) return;
            const previous = state.history.past[state.history.past.length - 1];
            const newPast = state.history.past.slice(0, -1);
            
            const current: ProjectData = {
                tables: state.tables, queries: state.queries, reports: state.reports,
                forms: state.forms, charts: state.charts, workflows: state.workflows, relationships: state.relationships, backendConfig: state.backendConfig,
                lastSnapshot: state.lastSnapshot, layout: state.layout
            };

            state.history.future.push(current);
            state.history.past = newPast;
            
            state.tables = previous.tables || [];
            state.queries = previous.queries || [];
            state.reports = previous.reports || [];
            state.forms = previous.forms || [];
            state.charts = previous.charts || [];
            state.workflows = previous.workflows || [];
            state.relationships = previous.relationships || [];
            state.layout = previous.layout || [];
            state.backendConfig = previous.backendConfig;
            state.lastSnapshot = previous.lastSnapshot;
        }));
        syncTablesToSql(get().tables);
    },

    redo: () => {
        set(produce((state: any) => {
            if (state.history.future.length === 0) return;
            const next = state.history.future.pop();
            const current: ProjectData = {
                tables: state.tables, queries: state.queries, reports: state.reports,
                forms: state.forms, charts: state.charts, workflows: state.workflows, relationships: state.relationships, backendConfig: state.backendConfig,
                lastSnapshot: state.lastSnapshot, layout: state.layout
            };
            state.history.past.push(current);
            state.tables = next.tables || [];
            state.queries = next.queries || [];
            state.reports = next.reports || [];
            state.forms = next.forms || [];
            state.charts = next.charts || [];
            state.workflows = next.workflows || [];
            state.relationships = next.relationships || [];
            state.layout = next.layout || [];
            state.backendConfig = next.backendConfig;
            state.lastSnapshot = next.lastSnapshot;
        }));
        syncTablesToSql(get().tables);
    },

    setTables: (tables) => { get().pushHistory(); set({ tables }); syncTablesToSql(tables); },
    addTable: (table) => { 
        const currentTables = get().tables;
        if (currentTables.some(t => t.id === table.id || t.name === table.name)) return;
        const newTables = [...currentTables, table];
        get().pushHistory(); 
        set({ tables: newTables }); 
        syncTablesToSql(newTables); 
    },
    updateTable: (table) => { get().pushHistory(); set(state => ({ tables: state.tables.map(t => t.id === table.id ? table : t) })); syncTablesToSql(get().tables); },
    
    setQueries: (queries) => { get().pushHistory(); set({ queries }); },
    setReports: (reports) => { get().pushHistory(); set({ reports }); },
    setForms: (forms) => { get().pushHistory(); set({ forms }); },
    setCharts: (charts) => { get().pushHistory(); set({ charts }); },
    setWorkflows: (workflows) => { get().pushHistory(); set({ workflows }); },
    setRelationships: (relationships) => { get().pushHistory(); set({ relationships }); },
    
    // Set Layout without pushing history on every drag frame to avoid lag, but saves on drop
    setLayout: (layout) => { set({ layout }); }, 
    
    setBackendConfig: (config) => { get().pushHistory(); set({ backendConfig: config }); },
    
    snapshot: () => {
        get().pushHistory();
        set(state => ({ lastSnapshot: JSON.parse(JSON.stringify(state.tables)) }));
    },

    saveProject: async () => {
        const state = get();
        if (!state.projectId) return;
        
        const project: Project = {
            id: state.projectId,
            name: state.projectName,
            lastModified: Date.now(),
            data: {
                tables: state.tables,
                queries: state.queries,
                reports: state.reports,
                forms: state.forms,
                charts: state.charts,
                workflows: state.workflows,
                relationships: state.relationships,
                layout: state.layout, // Persist layout
                backendConfig: state.backendConfig,
                lastSnapshot: state.lastSnapshot
            }
        };
        await saveProjectToStorage(project);
    },

    executeQuery: (query) => {
        if (query.type !== 'SELECT') return [];
        try {
            const sql = generateSqlSelect(query.nodes, query.columns, get().tables, get().relationships, DbType.SQLite);
            if (!sql) return [];
            return executeRawSql(sql);
        } catch (e) {
            console.warn("SQL Engine failed, falling back to JS", e);
            return executeJsQuery(query, get().tables, get().relationships);
        }
    }
}));
