
import { create } from 'zustand';
import { produce } from 'immer';
import { Project, Table, Query, Report, Form, Relationship, BackendConfig, DbType, ProjectData } from '../types/index';
import { initSqlEngine, syncTablesToSql, executeRawSql } from '../services/sqlEngine';
import { executeSelectQuery as executeJsQuery } from '../features/queries/utils/queryExecution';
import { generateSqlSelect } from '../utils/sqlHelper';

// --- Types ---
interface HistoryState {
    past: ProjectData[];
    future: ProjectData[];
}

interface ProjectStore extends ProjectData {
    // Meta
    projectId: string | null;
    projectName: string;
    
    // Actions
    init: () => Promise<void>;
    loadProject: (project: Project) => void;
    createNew: (type: DbType, name: string, config: BackendConfig, initialData?: Partial<ProjectData>) => void;
    
    // History Actions
    undo: () => void;
    redo: () => void;
    pushHistory: () => void; // Call before destructive changes

    // Data Actions
    setTables: (tables: Table[]) => void;
    updateTable: (table: Table) => void;
    setQueries: (queries: Query[]) => void;
    setReports: (reports: Report[]) => void;
    setForms: (forms: Form[]) => void;
    setRelationships: (relationships: Relationship[]) => void;
    setBackendConfig: (config: BackendConfig) => void;
    
    // Helpers
    executeQuery: (query: Query) => Record<string, any>[];
}

const initialData: ProjectData = {
    tables: [], queries: [], reports: [], forms: [], relationships: [],
    backendConfig: { 
        language: 'dotnet', dbType: DbType.SQL, projectName: 'MyProject', port: 5000, 
        dbConnection: '', useSwagger: true, frontendFramework: 'react' 
    }
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
    ...initialData,
    projectId: null,
    projectName: '',
    
    // History
    history: { past: [], future: [] } as any, // "any" to hide from store interface, handled internally

    init: async () => {
        await initSqlEngine();
    },

    loadProject: (project) => {
        set({
            projectId: project.id,
            projectName: project.name,
            tables: project.data.tables,
            queries: project.data.queries,
            reports: project.data.reports,
            forms: project.data.forms,
            relationships: project.data.relationships,
            backendConfig: project.data.backendConfig,
            history: { past: [], future: [] }
        } as any);
        syncTablesToSql(project.data.tables);
    },

    createNew: (type, name, config, initialData) => {
        const id = crypto.randomUUID();
        
        let tables = initialData?.tables || [];
        let queries = initialData?.queries || [];
        let forms = initialData?.forms || [];
        let reports = initialData?.reports || [];
        let relationships = initialData?.relationships || [];

        // Auto-create users table if needed and not present
        if (config.authConfig?.useUserLogin && !tables.some(t => t.name.toLowerCase() === 'users')) {
             tables.push({
                  id: 'sys_users',
                  name: 'Users',
                  fields: [
                      { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                      { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
                      { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
                      { id: 'u4', name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
                      { id: 'u5', name: 'Role', type: 'VARCHAR', length: 20, defaultValue: 'User' }
                  ],
                  data: []
              });
        }

        set({ 
            ...initialData, 
            projectId: id, 
            projectName: name, 
            backendConfig: config,
            tables, queries, forms, reports, relationships,
            history: { past: [], future: [] }
        } as any);
        
        syncTablesToSql(tables);
    },

    // --- History Logic ---
    pushHistory: () => {
        set(produce((state: any) => {
            const current: ProjectData = {
                tables: state.tables, queries: state.queries, reports: state.reports,
                forms: state.forms, relationships: state.relationships, backendConfig: state.backendConfig
            };
            // Limit history to 20 steps
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
                forms: state.forms, relationships: state.relationships, backendConfig: state.backendConfig
            };

            state.history.future.push(current);
            state.history.past = newPast;
            
            // Restore
            state.tables = previous.tables;
            state.queries = previous.queries;
            state.reports = previous.reports;
            state.forms = previous.forms;
            state.relationships = previous.relationships;
            state.backendConfig = previous.backendConfig;
        }));
        syncTablesToSql(get().tables);
    },

    redo: () => {
        set(produce((state: any) => {
            if (state.history.future.length === 0) return;
            const next = state.history.future.pop();
            
            const current: ProjectData = {
                tables: state.tables, queries: state.queries, reports: state.reports,
                forms: state.forms, relationships: state.relationships, backendConfig: state.backendConfig
            };

            state.history.past.push(current);
            
            // Restore
            state.tables = next.tables;
            state.queries = next.queries;
            state.reports = next.reports;
            state.forms = next.forms;
            state.relationships = next.relationships;
            state.backendConfig = next.backendConfig;
        }));
        syncTablesToSql(get().tables);
    },

    // --- Setters (with auto history push) ---
    setTables: (tables) => {
        get().pushHistory();
        set({ tables });
        syncTablesToSql(tables);
    },
    updateTable: (table) => {
        get().pushHistory();
        set(state => ({ tables: state.tables.map(t => t.id === table.id ? table : t) }));
        syncTablesToSql(get().tables);
    },
    setQueries: (queries) => { get().pushHistory(); set({ queries }); },
    setReports: (reports) => { get().pushHistory(); set({ reports }); },
    setForms: (forms) => { get().pushHistory(); set({ forms }); },
    setRelationships: (relationships) => { get().pushHistory(); set({ relationships }); },
    setBackendConfig: (config) => { get().pushHistory(); set({ backendConfig: config }); },

    executeQuery: (query) => {
        if (query.type !== 'SELECT') return [];
        
        // Try SQL Engine first
        try {
            const sql = generateSqlSelect(query.nodes, query.columns, get().tables, get().relationships, DbType.SQLite);
            if (!sql) return [];
            
            const results = executeRawSql(sql);
            return results;
        } catch (e) {
            console.warn("SQL Engine failed, falling back to JS", e);
            // Fallback to JS Engine
            return executeJsQuery(query, get().tables, get().relationships);
        }
    }
}));
