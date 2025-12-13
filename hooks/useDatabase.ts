
import { useState, useEffect } from 'react';
import { DbType, Table, Query, Relationship, Report, Form, SelectQuery, Project, BackendConfig, FormElement } from '../types/index';
import { executeSelectQuery } from '../features/queries/utils/queryExecution';
import { saveProjectToStorage } from '../services/storageService';

export const useDatabase = () => {
  // Project State
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');

  const [dbType, setDbType] = useState<DbType | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  
  const [loadedBackendConfig, setLoadedBackendConfig] = useState<BackendConfig | null>(null);

  // Define Demo Data Structure (IT Notebook Lending)
  const getDemoData = () => {
      // 1. Tables
      const tables: Table[] = [
        { 
          id: 't_ma', 
          name: 'Mitarbeiter', 
          fields: [
            { id: 'f_ma_1', name: 'MitarbeiterID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_ma_2', name: 'Vorname', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_3', name: 'Nachname', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_4', name: 'Abteilung', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_5', name: 'Email', type: 'VARCHAR', length: 100 }
          ],
          data: [
            { MitarbeiterID: 1, Vorname: 'Max', Nachname: 'Mustermann', Abteilung: 'Vertrieb', Email: 'max.mustermann@firma.de' },
            { MitarbeiterID: 2, Vorname: 'Erika', Nachname: 'Gabler', Abteilung: 'Marketing', Email: 'erika.gabler@firma.de' },
            { MitarbeiterID: 3, Vorname: 'Klaus', Nachname: 'Kleber', Abteilung: 'IT-Support', Email: 'klaus.kleber@firma.de' },
            { MitarbeiterID: 4, Vorname: 'Julia', Nachname: 'Sommer', Abteilung: 'HR', Email: 'julia.sommer@firma.de' },
          ]
        },
        { 
          id: 't_nb', 
          name: 'Notebooks', 
          fields: [
            { id: 'f_nb_1', name: 'GeraeteID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_nb_2', name: 'Modell', type: 'VARCHAR', length: 100 },
            { id: 'f_nb_3', name: 'Seriennummer', type: 'VARCHAR', length: 50 },
            { id: 'f_nb_4', name: 'Kaufdatum', type: 'DATE' },
            { id: 'f_nb_5', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Verfügbar' } 
          ],
           data: [
            { GeraeteID: 101, Modell: 'Dell XPS 13', Seriennummer: 'DX13-998877', Kaufdatum: '2023-01-15', Status: 'Verliehen' },
            { GeraeteID: 102, Modell: 'MacBook Pro 14', Seriennummer: 'MBP-2023-AA', Kaufdatum: '2023-03-10', Status: 'Verliehen' },
            { GeraeteID: 103, Modell: 'Lenovo ThinkPad X1', Seriennummer: 'TP-X1-5544', Kaufdatum: '2022-11-05', Status: 'Verfügbar' },
            { GeraeteID: 104, Modell: 'Dell Latitude 5520', Seriennummer: 'DL-5520-1122', Kaufdatum: '2022-06-20', Status: 'Reparatur' },
          ]
        },
        { 
          id: 't_vl', 
          name: 'Verleihliste', 
          fields: [
            { id: 'f_vl_1', name: 'VerleihID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_vl_2', name: 'MitarbeiterID', type: 'INTEGER' }, // FK
            { id: 'f_vl_3', name: 'GeraeteID', type: 'INTEGER' }, // FK
            { id: 'f_vl_4', name: 'Ausgabedatum', type: 'DATE' },
            { id: 'f_vl_5', name: 'Rueckgabedatum', type: 'DATE', allowNull: true }
          ],
           data: [
            { VerleihID: 1, MitarbeiterID: 1, GeraeteID: 101, Ausgabedatum: '2023-10-01', Rueckgabedatum: '' },
            { VerleihID: 2, MitarbeiterID: 2, GeraeteID: 102, Ausgabedatum: '2023-10-15', Rueckgabedatum: '' },
            { VerleihID: 3, MitarbeiterID: 3, GeraeteID: 103, Ausgabedatum: '2023-09-01', Rueckgabedatum: '2023-09-15' }, 
          ]
        }
      ];
      
      // 2. Relationships
      const relationships: Relationship[] = [
        { id: 'r1', fromTableId: 't_ma', fromFieldId: 'f_ma_1', toTableId: 't_vl', toFieldId: 'f_vl_2', type: '1:n', referentialIntegrity: true },
        { id: 'r2', fromTableId: 't_nb', fromFieldId: 'f_nb_1', toTableId: 't_vl', toFieldId: 'f_vl_3', type: '1:n', referentialIntegrity: true }
      ];

      // 3. Queries
      const queries: Query[] = [
          {
              id: 'q_active',
              type: 'SELECT',
              name: 'Aktive Ausleihen',
              nodes: [
                  { id: 'n1', tableId: 't_vl', x: 250, y: 50 },
                  { id: 'n2', tableId: 't_ma', x: 50, y: 50 },
                  { id: 'n3', tableId: 't_nb', x: 450, y: 50 }
              ],
              columns: [
                  { id: 'qc1', tableId: 't_ma', fieldId: 'f_ma_2', tableName: 'Mitarbeiter', fieldName: 'Vorname', sort: '', show: true, criteria: [''] },
                  { id: 'qc2', tableId: 't_ma', fieldId: 'f_ma_3', tableName: 'Mitarbeiter', fieldName: 'Nachname', sort: 'ASC', show: true, criteria: [''] },
                  { id: 'qc3', tableId: 't_nb', fieldId: 'f_nb_2', tableName: 'Notebooks', fieldName: 'Modell', sort: '', show: true, criteria: [''] },
                  { id: 'qc4', tableId: 't_vl', fieldId: 'f_vl_4', tableName: 'Verleihliste', fieldName: 'Ausgabedatum', sort: '', show: true, criteria: [''] },
                  { id: 'qc5', tableId: 't_vl', fieldId: 'f_vl_5', tableName: 'Verleihliste', fieldName: 'Rueckgabedatum', sort: '', show: true, criteria: ['IS NULL'] } // Updated Criteria
              ]
          }
      ];

      // 4. Forms
      const forms: Form[] = [
          {
              id: 'frm_ma',
              name: 'Mitarbeiter verwalten',
              sourceType: 'table',
              sourceId: 't_ma',
              layout: {
                  id: 'root_ma',
                  type: 'container',
                  className: 'p-6 bg-white space-y-4 max-w-2xl mx-auto',
                  children: [
                      { id: 'l1', type: 'label', label: 'Stammdaten Mitarbeiter', className: 'text-lg font-bold text-slate-700 border-b pb-2 mb-4' },
                      { id: 'c1', type: 'container', className: 'grid grid-cols-2 gap-4', children: [
                          { id: 'f1', type: 'field', fieldId: 'f_ma_2', label: 'Vorname' },
                          { id: 'f2', type: 'field', fieldId: 'f_ma_3', label: 'Nachname' }
                      ]},
                      { id: 'f3', type: 'field', fieldId: 'f_ma_4', label: 'Abteilung' },
                      { id: 'f4', type: 'field', fieldId: 'f_ma_5', label: 'E-Mail Adresse' },
                  ]
              }
          },
          {
              id: 'frm_vl',
              name: 'Geräteausgabe',
              sourceType: 'table',
              sourceId: 't_vl',
              mode: 'edit',
              layout: {
                  id: 'root_vl',
                  type: 'container',
                  className: 'p-6 bg-white space-y-4 max-w-xl mx-auto border rounded shadow-sm',
                  children: [
                      { id: 'l_vl', type: 'label', label: 'Neuen Verleih erfassen', className: 'text-xl font-bold text-indigo-700 mb-6' },
                      { 
                          id: 'f_vl_ma', 
                          type: 'field', 
                          fieldId: 'f_vl_2', 
                          label: 'Mitarbeiter auswählen', 
                          widgetType: 'select',
                          lookup: {
                              tableId: 't_ma',
                              valueFieldId: 'f_ma_1',
                              labelFields: ['f_ma_2', 'f_ma_3', 'f_ma_4'] // Vorname, Nachname, Abteilung
                          }
                      },
                      { 
                          id: 'f_vl_nb', 
                          type: 'field', 
                          fieldId: 'f_vl_3', 
                          label: 'Gerät auswählen', 
                          widgetType: 'select',
                          lookup: {
                              tableId: 't_nb',
                              valueFieldId: 'f_nb_1',
                              labelFields: ['f_nb_2', 'f_nb_3'] // Modell, Serial
                          }
                      },
                      { id: 'sep', type: 'container', className: 'border-t my-4' },
                      { id: 'f_vl_date', type: 'field', fieldId: 'f_vl_4', label: 'Ausgabedatum', widgetType: 'date' },
                      { id: 'f_vl_ret', type: 'field', fieldId: 'f_vl_5', label: 'Rückgabedatum (Optional)', widgetType: 'date' }
                  ]
              }
          }
      ];

      // 5. Reports
      const reports: Report[] = [
          {
              id: 'rep_handover',
              name: 'Übergabeprotokoll (Offen)',
              sourceType: 'query',
              sourceId: 'q_active',
              groupingFieldId: 'qc2', // Nachname
              summaries: [],
              columns: [
                  { fieldId: 'qc1', label: 'Vorname', visible: true, order: 0 },
                  { fieldId: 'qc2', label: 'Nachname', visible: true, order: 1 },
                  { fieldId: 'qc3', label: 'Gerät', visible: true, order: 2 },
                  { fieldId: 'qc4', label: 'Ausgabe am', visible: true, order: 3 }
              ],
              settings: {
                  orientation: 'portrait',
                  pageBreakAfterGroup: false
              }
          }
      ];

      return { tables, relationships, queries, forms, reports };
  };

  const loadProject = (project: Project) => {
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setTables(project.data.tables);
      setQueries(project.data.queries);
      setReports(project.data.reports);
      setForms(project.data.forms);
      setRelationships(project.data.relationships);
      setDbType(project.data.backendConfig.dbType);
      setLoadedBackendConfig(project.data.backendConfig);
  };

  const persistProject = async (overrideConfig?: BackendConfig) => {
      if (!currentProjectId || !dbType) return;
      
      const configToSave: BackendConfig = overrideConfig || loadedBackendConfig || {
          language: 'dotnet',
          backendVersion: '9.0',
          dbType: dbType,
          projectName: currentProjectName.replace(/\s+/g, ''),
          port: 5000,
          dbConnection: '',
          useSwagger: true,
          frontendFramework: 'react'
      };

      const project: Project = {
          id: currentProjectId,
          name: currentProjectName,
          lastModified: Date.now(),
          data: {
              tables,
              queries,
              reports,
              forms,
              relationships,
              backendConfig: configToSave
          }
      };
      await saveProjectToStorage(project);
  };

  const saveTable = (newTable: Table, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setTables(prev => [...prev, newTable]);
    } else {
      setTables(prev => prev.map(t => t.id === newTable.id ? newTable : t));
    }
  };

  const saveQuery = (newQuery: Query) => {
    setQueries(prev => {
      const exists = prev.some(q => q.id === newQuery.id);
      return exists ? prev.map(q => q.id === newQuery.id ? newQuery : q) : [...prev, newQuery];
    });
  };

  const saveReport = (newReport: Report) => {
    setReports(prev => {
      const exists = prev.some(r => r.id === newReport.id);
      return exists ? prev.map(r => r.id === newReport.id ? newReport : r) : [...prev, newReport];
    });
  };
  
  const saveForm = (newForm: Form) => {
    setForms(prev => {
      const exists = prev.some(f => f.id === newForm.id);
      return exists ? prev.map(f => f.id === newForm.id ? newForm : f) : [...prev, newForm];
    });
  };

  const renameTable = (id: string, name: string) => setTables(prev => prev.map(t => (t.id === id ? { ...t, name } : t)));
  const renameQuery = (id: string, name: string) => setQueries(prev => prev.map(q => (q.id === id ? { ...q, name } : q)));
  const renameReport = (id: string, name: string) => setReports(prev => prev.map(r => (r.id === id ? { ...r, name } : r)));
  const renameForm = (id: string, name: string) => setForms(prev => prev.map(f => (f.id === id ? { ...f, name } : f)));
  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setRelationships(prev => prev.filter(r => r.fromTableId !== id && r.toTableId !== id));
  };
  const deleteQuery = (id: string) => setQueries(prev => prev.filter(q => q.id !== id));
  const deleteReport = (id: string) => setReports(prev => prev.filter(r => r.id !== id));
  const deleteForm = (id: string) => setForms(prev => prev.filter(f => f.id !== id));
  const deleteRelationship = (id: string) => setRelationships(prev => prev.filter(r => r.id !== id));
  const updateRelationship = (updatedRel: Relationship) => setRelationships(prev => prev.map(r => r.id === updatedRel.id ? updatedRel : r));

  const createNewDatabase = (type: DbType, projectName: string, isDemo: boolean = false) => {
    const newId = crypto.randomUUID();
    let newTables: Table[] = [];
    let newRels: Relationship[] = [];
    let newQueries: Query[] = [];
    let newForms: Form[] = [];
    let newReports: Report[] = [];

    if (isDemo) {
        const demoData = getDemoData();
        newTables = demoData.tables;
        newRels = demoData.relationships;
        newQueries = demoData.queries;
        newForms = demoData.forms;
        newReports = demoData.reports;
    }
    
    // Init State
    setCurrentProjectId(newId);
    setCurrentProjectName(projectName);
    setDbType(type);
    setTables(newTables);
    setQueries(newQueries);
    setReports(newReports);
    setForms(newForms);
    setRelationships(newRels);

    // Initial Save
    const initialConfig: BackendConfig = {
        language: 'dotnet',
        backendVersion: '9.0',
        dbType: type,
        projectName: projectName.replace(/\s+/g, ''),
        port: 5000,
        dbConnection: '',
        useSwagger: true,
        frontendFramework: 'react'
    };
    setLoadedBackendConfig(initialConfig);

    const project: Project = {
        id: newId,
        name: projectName,
        lastModified: Date.now(),
        data: {
            tables: newTables,
            queries: newQueries,
            reports: newReports,
            forms: newForms,
            relationships: newRels,
            backendConfig: initialConfig
        }
    };
    saveProjectToStorage(project);
  };
  
  const resetDatabase = () => {
    setDbType(null);
    setCurrentProjectId(null);
    setTables([]);
    setQueries([]);
    setReports([]);
    setForms([]);
    setRelationships([]);
  };

  const exportProject = async (config: BackendConfig) => {
      if (!currentProjectId) return;
      const projectData: Project = {
          id: currentProjectId,
          name: currentProjectName,
          lastModified: Date.now(),
          data: {
              tables, queries, reports, forms, relationships, backendConfig: config
          }
      };
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.dbsp`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const executeQuery = (query: Query): Record<string, any>[] => {
    if (!query || query.type !== 'SELECT') return [];
    return executeSelectQuery(query as SelectQuery, tables, relationships);
  };

  return {
    currentProjectId,
    currentProjectName,
    loadedBackendConfig,
    dbType,
    tables,
    queries,
    reports,
    forms,
    relationships,
    setRelationships,
    saveTable,
    saveQuery,
    saveReport,
    saveForm,
    createNewDatabase,
    loadProject,
    persistProject,
    resetDatabase,
    deleteRelationship,
    updateRelationship,
    renameTable,
    renameQuery,
    renameReport,
    renameForm,
    deleteTable,
    deleteQuery,
    deleteReport,
    deleteForm,
    executeQuery,
    exportProject
  };
};
