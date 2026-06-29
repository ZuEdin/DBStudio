
import { create } from 'zustand';
import { produce } from 'immer';
import { Project, Table, Query, Report, Form, Relationship, BackendConfig, DbType, ProjectData, Chart, Field, Workflow, TableNode, FormElement, FormField, TableGroup } from '../types/index';
import { initSqlEngine, syncTablesToSql, executeRawSql } from '../services/sqlEngine';
import { executeSelectQuery as executeJsQuery } from '../features/queries/utils/queryExecution';
import { generateSqlSelect } from '../utils/sqlHelper';
import { saveProjectToStorage } from '../services/storageService';

interface ProjectStore extends ProjectData {
    projectId: string | null;
    projectName: string;
    init: () => Promise<void>;
    loadProject: (project: Project) => void;
    createNew: (type: DbType, name: string, config: BackendConfig, initialData?: Partial<ProjectData>) => Promise<void>;
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
    setPages: (pages: CustomPage[]) => void;
    setWorkflows: (workflows: Workflow[]) => void;
    setRelationships: (relationships: Relationship[]) => void;
    setBackendConfig: (config: BackendConfig) => void;
    setLayout: (layout: TableNode[]) => void; // New
    setTableGroups: (groups: TableGroup[]) => void;
    setTickets: (tickets: any[]) => void;
    setChats: (chats: any[]) => void;
    snapshot: () => void;
    saveProject: () => Promise<void>; 
    executeQuery: (query: Query) => Record<string, any>[];
}

const initialData: ProjectData = {
    tables: [], queries: [], reports: [], forms: [], charts: [], pages: [], workflows: [], relationships: [], layout: [], tableGroups: [], tickets: [], chats: [],
    backendConfig: { 
        language: 'dotnet', dbType: DbType.SQL, projectName: 'MyProject', port: 5000, 
        dbConnection: '', useSwagger: true, frontendFramework: 'react', stylingFramework: 'tailwind'
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
        try {
            localStorage.setItem('lastProjectId', project.id);
        } catch (e) {
            console.warn("localStorage not available", e);
        }
        set({
            projectId: project.id,
            projectName: project.name,
            tables: project.data.tables || [],
            queries: project.data.queries || [],
            reports: project.data.reports || [],
            forms: project.data.forms || [],
            charts: project.data.charts || [],
            pages: project.data.pages || [],
            workflows: project.data.workflows || [],
            relationships: project.data.relationships || [],
            layout: project.data.layout || [], // Load layout
            tableGroups: project.data.tableGroups || [],
            backendConfig: project.data.backendConfig,
            lastSnapshot: project.data.lastSnapshot || [], 
            history: { past: [], future: [] }
        } as any);
        syncTablesToSql(project.data.tables || []);
    },

    createNew: async (type, name, config, initialData) => {
        const id = crypto.randomUUID();
        let tables = [...(initialData?.tables || [])];
        let relationships = [...(initialData?.relationships || [])];
        let forms = [...(initialData?.forms || [])];
        
        // Auto-create Auth Tables & Forms
        if (config.authConfig?.useUserLogin && !tables.some(t => t.name.toLowerCase() === 'sys_users')) {
             // 1. ROLES
             const roleTableId = 'sys_roles';
             const rolePkId = crypto.randomUUID();
             const roleFields: Field[] = [
                 { id: rolePkId, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, 
                 { id: crypto.randomUUID(), name: 'Name', type: 'VARCHAR', length: 50 },
                 { id: crypto.randomUUID(), name: 'Description', type: 'VARCHAR', length: 255 }
             ];
             
             // 2. USERS (Auth credentials only)
             const userTableId = 'sys_users';
             const userPkId = crypto.randomUUID();
             const roleFkId = crypto.randomUUID();
             const userFields: Field[] = [
                 { id: userPkId, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, 
                 { id: crypto.randomUUID(), name: 'Username', type: 'VARCHAR', length: 50 }, 
                 { id: crypto.randomUUID(), name: 'Email', type: 'VARCHAR', length: 100 }, 
                 { id: crypto.randomUUID(), name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: true }, 
                 { id: crypto.randomUUID(), name: 'FirebaseUid', type: 'VARCHAR', length: 128, allowNull: true },
                 { id: crypto.randomUUID(), name: 'Provider', type: 'VARCHAR', length: 50, allowNull: true },
                 { id: roleFkId, name: 'RoleId', type: 'INTEGER' }
             ];

             // 3. PROFILES (Extended User Data)
             const profileTableId = 'sys_user_profiles';
             const profilePkId = crypto.randomUUID();
             const profileUserFkId = crypto.randomUUID();
             const profileFields: Field[] = [
                 { id: profilePkId, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                 { id: profileUserFkId, name: 'UserId', type: 'INTEGER' },
                 { id: crypto.randomUUID(), name: 'FirstName', type: 'VARCHAR', length: 100, allowNull: true },
                 { id: crypto.randomUUID(), name: 'LastName', type: 'VARCHAR', length: 100, allowNull: true },
                 { id: crypto.randomUUID(), name: 'Company', type: 'VARCHAR', length: 100, allowNull: true },
                 { id: crypto.randomUUID(), name: 'Street', type: 'VARCHAR', length: 200, allowNull: true },
                 { id: crypto.randomUUID(), name: 'City', type: 'VARCHAR', length: 100, allowNull: true },
                 { id: crypto.randomUUID(), name: 'Zip', type: 'VARCHAR', length: 20, allowNull: true },
                 { id: crypto.randomUUID(), name: 'Phone', type: 'VARCHAR', length: 50, allowNull: true }
             ];

             if (config.multiTenancy?.enabled && config.multiTenancy.strategy === 'discriminator') {
                 const tenantField = config.multiTenancy.tenantField || 'TenantId';
                 userFields.push({ id: crypto.randomUUID(), name: tenantField, type: 'VARCHAR', length: 50 });
                 roleFields.push({ id: crypto.randomUUID(), name: tenantField, type: 'VARCHAR', length: 50 });
                 profileFields.push({ id: crypto.randomUUID(), name: tenantField, type: 'VARCHAR', length: 50 });
             }

             tables.push({ id: roleTableId, name: 'sys_roles', fields: roleFields, data: [{Id:1, Name:'Admin', Description: 'Administrator'},{Id:2, Name:'User', Description: 'Standard User'}] });
             tables.push({ id: userTableId, name: 'sys_users', fields: userFields, data: [{Id:1, Username:'admin', Email:'admin@local.host', RoleId:1}] });
             tables.push({ id: profileTableId, name: 'sys_user_profiles', fields: profileFields, data: [] });

             // 4. PERMISSIONS
             const permTableId = 'sys_permissions';
             const permRoleFkId = crypto.randomUUID();
             tables.push({ 
                 id: permTableId, 
                 name: 'sys_permissions', 
                 fields: [
                     { id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, 
                     { id: permRoleFkId, name: 'RoleId', type: 'INTEGER' }, 
                     { id: crypto.randomUUID(), name: 'ObjectType', type: 'VARCHAR' }, 
                     { id: crypto.randomUUID(), name: 'ObjectId', type: 'VARCHAR' },
                     { id: crypto.randomUUID(), name: 'CanRead', type: 'BOOLEAN' }, 
                     { id: crypto.randomUUID(), name: 'CanWrite', type: 'BOOLEAN' }, 
                     { id: crypto.randomUUID(), name: 'CanDelete', type: 'BOOLEAN' }
                ] 
             });

             // Add Relationships
             relationships.push({
                 id: crypto.randomUUID(),
                 fromTableId: roleTableId,
                 fromFieldId: rolePkId,
                 toTableId: userTableId,
                 toFieldId: roleFkId,
                 type: '1:n',
                 referentialIntegrity: true
             });

             relationships.push({
                id: crypto.randomUUID(),
                fromTableId: userTableId,
                fromFieldId: userPkId,
                toTableId: profileTableId,
                toFieldId: profileUserFkId,
                type: '1:1',
                referentialIntegrity: true,
                onDelete: 'CASCADE'
            });

             relationships.push({
                id: crypto.randomUUID(),
                fromTableId: roleTableId,
                fromFieldId: rolePkId,
                toTableId: permTableId,
                toFieldId: permRoleFkId,
                type: '1:n',
                referentialIntegrity: true,
                onDelete: 'CASCADE'
            });

            // --- AUTO GENERATE FORMS ---
            // 1. Role Management Form
            const fRoleFields: FormField[] = [
                { fieldId: roleFields.find(f => f.name === 'Name')!.id, label: 'Bezeichnung' },
                { fieldId: roleFields.find(f => f.name === 'Description')!.id, label: 'Beschreibung' }
            ];
            
            forms.push({
                id: crypto.randomUUID(),
                name: 'Rollenverwaltung',
                sourceType: 'table',
                sourceId: roleTableId,
                fields: fRoleFields,
                layout: {
                    id: crypto.randomUUID(), type: 'container', className: 'p-6 bg-white space-y-4 max-w-2xl mx-auto',
                    children: [
                        { id: crypto.randomUUID(), type: 'label', label: 'Rolle definieren', className: 'text-xl font-bold text-slate-800 border-b pb-2' },
                        { id: crypto.randomUUID(), type: 'field', fieldId: fRoleFields[0].fieldId, label: 'Rollenname', className: 'mb-4' },
                        { id: crypto.randomUUID(), type: 'field', fieldId: fRoleFields[1].fieldId, label: 'Beschreibung', widgetType: 'textarea' }
                    ]
                }
            });

            // 2. User Management Form (With Lookup)
            const fUserFields: FormField[] = [
                { fieldId: userFields.find(f => f.name === 'Username')!.id, label: 'Benutzername' },
                { fieldId: userFields.find(f => f.name === 'Email')!.id, label: 'E-Mail' },
                { fieldId: userFields.find(f => f.name === 'PasswordHash')!.id, label: 'Passwort' },
                { fieldId: roleFkId, label: 'Rolle' }
            ];

            forms.push({
                id: crypto.randomUUID(),
                name: 'Benutzerverwaltung',
                sourceType: 'table',
                sourceId: userTableId,
                fields: fUserFields,
                layout: {
                    id: crypto.randomUUID(), type: 'container', className: 'p-6 bg-white space-y-6',
                    children: [
                        { id: crypto.randomUUID(), type: 'label', label: 'Benutzerkonto', className: 'text-xl font-bold text-slate-800 border-b pb-2 flex items-center gap-2' },
                        { 
                            id: crypto.randomUUID(), type: 'container', className: 'grid grid-cols-2 gap-6',
                            children: [
                                { id: crypto.randomUUID(), type: 'field', fieldId: fUserFields[0].fieldId, label: 'Benutzername' },
                                { id: crypto.randomUUID(), type: 'field', fieldId: fUserFields[1].fieldId, label: 'E-Mail Adresse' }
                            ]
                        },
                        { 
                            id: crypto.randomUUID(), type: 'container', className: 'grid grid-cols-2 gap-6 p-4 bg-slate-50 border rounded-lg',
                            children: [
                                { 
                                    id: crypto.randomUUID(), type: 'field', fieldId: roleFkId, label: 'Zugriffsrolle', 
                                    widgetType: 'select', 
                                    lookup: {
                                        tableId: roleTableId,
                                        valueFieldId: rolePkId,
                                        labelFields: [roleFields.find(f => f.name === 'Name')!.id]
                                    }
                                },
                                { id: crypto.randomUUID(), type: 'field', fieldId: fUserFields[2].fieldId, label: 'Initialpasswort', widgetType: 'text' }
                            ]
                        }
                    ]
                }
            });
        }

        try {
            localStorage.setItem('lastProjectId', id);
        } catch (e) {
            console.warn("localStorage not available", e);
        }

        set({ 
            ...initialData, 
            projectId: id, 
            projectName: name, 
            backendConfig: config,
            tables,
            relationships,
            forms,
            charts: initialData?.charts || [],
            workflows: initialData?.workflows || [],
            layout: initialData?.layout || [],
            tableGroups: initialData?.tableGroups || [],
            lastSnapshot: [], 
            history: { past: [], future: [] }
        } as any);
        
        syncTablesToSql(tables);
        
        // AUTO-SAVE ON CREATE
        await get().saveProject();
    },

    closeProject: () => {
        try {
            localStorage.removeItem('lastProjectId');
        } catch (e) {
            console.warn("localStorage not available", e);
        }
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
                lastSnapshot: state.lastSnapshot, layout: state.layout, tableGroups: state.tableGroups
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
                lastSnapshot: state.lastSnapshot, layout: state.layout, tableGroups: state.tableGroups
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
            state.tableGroups = previous.tableGroups || [];
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
                lastSnapshot: state.lastSnapshot, layout: state.layout, tableGroups: state.tableGroups
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
            state.tableGroups = next.tableGroups || [];
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
    setPages: (pages) => { get().pushHistory(); set({ pages }); },
    setWorkflows: (workflows) => { get().pushHistory(); set({ workflows }); },
    setRelationships: (relationships) => { get().pushHistory(); set({ relationships }); },
    
    setTickets: (tickets) => { set({ tickets }); },
    setChats: (chats) => { set({ chats }); },
    
    setLayout: (layout) => { set({ layout }); }, 
    setTableGroups: (tableGroups) => { get().pushHistory(); set({ tableGroups }); },
    
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
                pages: state.pages,
                workflows: state.workflows,
                relationships: state.relationships,
                layout: state.layout, 
                tableGroups: state.tableGroups,
                backendConfig: state.backendConfig,
                lastSnapshot: state.lastSnapshot,
                tickets: state.tickets,
                chats: state.chats
            }
        };
        await saveProjectToStorage(project);
    },

    executeQuery: (query) => {
        if (query.type !== 'SELECT') return [];
        try {
            const sql = generateSqlSelect(query.nodes, query.columns, get().tables, get().relationships, DbType.SQLite, true);
            if (!sql) return [];
            return executeRawSql(sql);
        } catch (e) {
            console.warn("SQL Engine failed, falling back to JS", e);
            return executeJsQuery(query, get().tables, get().relationships);
        }
    }
}));
