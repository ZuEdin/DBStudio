import { useState } from 'react';
import { DbType, Table, Query, Relationship, Report, Form, SelectQuery } from '../types/index';

export const useDatabase = () => {
  const [dbType, setDbType] = useState<DbType | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const createInitialTables = (): Table[] => [
    { 
      id: 't1', 
      name: 'Kunden', 
      fields: [
        { id: 'f1', name: 'KundenID', type: 'INTEGER', isPrimaryKey: true },
        { id: 'f2', name: 'Name', type: 'VARCHAR' },
        { id: 'f3', name: 'Email', type: 'VARCHAR' }
      ],
      data: [
        { KundenID: 1, Name: 'Anna Schmidt', Email: 'anna.schmidt@example.com' },
        { KundenID: 2, Name: 'Ben Müller', Email: 'ben.mueller@example.com' },
        { KundenID: 3, Name: 'Carla Weber', Email: 'carla.weber@example.com' },
      ]
    },
    { 
      id: 't2', 
      name: 'Bestellungen', 
      fields: [
        { id: 'f4', name: 'BestellID', type: 'INTEGER', isPrimaryKey: true },
        { id: 'f5', name: 'KundenID', type: 'INTEGER' },
        { id: 'f6', name: 'Datum', type: 'DATE' },
        { id: 'f7', name: 'Betrag', type: 'INTEGER' }
      ],
       data: [
        { BestellID: 101, KundenID: 1, Datum: '2023-10-15', Betrag: 150 },
        { BestellID: 102, KundenID: 2, Datum: '2023-10-16', Betrag: 75 },
        { BestellID: 103, KundenID: 1, Datum: '2023-11-02', Betrag: 220 },
        { BestellID: 104, KundenID: 3, Datum: '2023-11-05', Betrag: 45 },
      ]
    }
  ];
  
  const createInitialRelationships = (): Relationship[] => [
    { id: 'r1', fromTableId: 't1', fromFieldId: 'f1', toTableId: 't2', toFieldId: 'f5', type: '1:n', referentialIntegrity: true }
  ];

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
      if (exists) {
        return prev.map(q => q.id === newQuery.id ? newQuery : q);
      }
      return [...prev, newQuery];
    });
  };

  const saveReport = (newReport: Report) => {
    setReports(prev => {
      const exists = prev.some(r => r.id === newReport.id);
      if (exists) {
        return prev.map(r => r.id === newReport.id ? newReport : r);
      }
      return [...prev, newReport];
    });
  };
  
  const saveForm = (newForm: Form) => {
    setForms(prev => {
      const exists = prev.some(f => f.id === newForm.id);
      if (exists) {
        return prev.map(f => f.id === newForm.id ? newForm : f);
      }
      return [...prev, newForm];
    });
  };

  const renameTable = (id: string, name: string) => {
    setTables(prev => prev.map(t => (t.id === id ? { ...t, name } : t)));
  };

  const renameQuery = (id: string, name: string) => {
    setQueries(prev => prev.map(q => (q.id === id ? { ...q, name } : q)));
  };

  const renameReport = (id: string, name: string) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, name } : r)));
  };

  const renameForm = (id: string, name: string) => {
    setForms(prev => prev.map(f => (f.id === id ? { ...f, name } : f)));
  };

  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setRelationships(prev => prev.filter(r => r.fromTableId !== id && r.toTableId !== id));
  };

  const deleteQuery = (id: string) => {
    setQueries(prev => prev.filter(q => q.id !== id));
  };
  
  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };
  
  const deleteForm = (id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const createNewDatabase = (type: DbType) => {
    setDbType(type);
    setTables(createInitialTables());
    setQueries([]);
    setReports([]);
    setForms([]);
    setRelationships(createInitialRelationships());
  };
  
  const resetDatabase = () => {
    setDbType(null);
    setTables([]);
    setQueries([]);
    setReports([]);
    setForms([]);
    setRelationships([]);
  };

  const deleteRelationship = (id: string) => {
    setRelationships(prev => prev.filter(r => r.id !== id));
  };

  const updateRelationship = (updatedRel: Relationship) => {
    setRelationships(prev => prev.map(r => r.id === updatedRel.id ? updatedRel : r));
  };
  
  const executeQuery = (query: Query): Record<string, any>[] => {
    // FIX: Add a type guard to ensure this function only processes SELECT queries.
    if (!query || query.type !== 'SELECT') return [];

    if (query.nodes.length === 0 || query.columns.length === 0) return [];

    let workingData: Record<string, any>[] = [];
    const queryTableIds = new Set(query.nodes.map(n => n.tableId));
    const initialTableId = query.nodes[0].tableId;
    const initialTable = tables.find(t => t.id === initialTableId);
    if (!initialTable || !initialTable.data) return [];

    workingData = initialTable.data.map(row => {
        const newRow: Record<string, any> = {};
        for (const key in row) { newRow[`${initialTable.name}.${key}`] = row[key]; }
        return newRow;
    });
    
    const joinedTables = new Set([initialTableId]);
    const relevantRels = relationships.filter(r => queryTableIds.has(r.fromTableId) && queryTableIds.has(r.toTableId));

    for (const rel of relevantRels) {
        const join = (t1Id: string, t2Id: string, f1Id: string, f2Id: string) => {
            if (joinedTables.has(t1Id) && !joinedTables.has(t2Id)) {
                const table1 = tables.find(t => t.id === t1Id)!;
                const table2 = tables.find(t => t.id === t2Id)!;
                if (!table2.data) return;
                
                const field1 = table1.fields.find(f => f.id === f1Id)!;
                const field2 = table2.fields.find(f => f.id === f2Id)!;
                
                const newData: Record<string, any>[] = [];
                workingData.forEach(row1 => {
                    table2.data!.forEach(row2 => {
                        if (row1[`${table1.name}.${field1.name}`] === row2[field2.name]) {
                            const newRow = {...row1};
                            for (const key in row2) { newRow[`${table2.name}.${key}`] = row2[key]; }
                            newData.push(newRow);
                        }
                    });
                });
                workingData = newData;
                joinedTables.add(t2Id);
            }
        };
        join(rel.fromTableId, rel.toTableId, rel.fromFieldId, rel.toFieldId);
        join(rel.toTableId, rel.fromTableId, rel.toFieldId, rel.fromFieldId);
    }

    const filteredData = workingData.filter(row => {
        for (const col of query.columns) {
            const validCriteria = col.criteria.filter(c => c && c.trim() !== '');
            if (validCriteria.length > 0) {
                const fieldName = `${col.tableName}.${col.fieldName}`;
                const cellValue = row[fieldName];
                const orConditionsMet = validCriteria.some(crit => {
                    const parts = crit.match(/(^\S*)\s*(.*)/)?.slice(1);
                    if (!parts || parts.length < 2) return String(cellValue) === crit;
                    let [operator, valueStr] = parts;
                    let value: any = valueStr.trim();
                    if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.substring(1, value.length - 1);
                    } else if (value !== '' && !isNaN(Number(value))) {
                        value = Number(value);
                    }
                    
                    switch(operator) {
                        case '=': return cellValue == value;
                        case '!=': return cellValue != value;
                        case '>': return cellValue > value;
                        case '<': return cellValue < value;
                        case '>=': return cellValue >= value;
                        case '<=': return cellValue <= value;
                        case 'LIKE': return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
                        default: return String(cellValue) === crit;
                    }
                });
                if (!orConditionsMet) return false;
            }
        }
        return true;
    });

    const selectedData = filteredData.map(row => {
        const newRow: Record<string, any> = {};
        query.columns.filter(c => c.show).forEach(col => {
           newRow[col.fieldName] = row[`${col.tableName}.${col.fieldName}`];
        });
        return newRow;
    });
    
    if (query.columns.some(c => c.sort)) {
        selectedData.sort((a, b) => {
            for (const col of query.columns) {
                if (col.sort) {
                    const valA = a[col.fieldName]; const valB = b[col.fieldName];
                    const direction = col.sort.toUpperCase() === 'DESC' ? -1 : 1;
                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                }
            }
            return 0;
        });
    }
    
    return selectedData;
  };

  return {
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
  };
};