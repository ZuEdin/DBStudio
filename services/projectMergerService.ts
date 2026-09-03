import { Project, ProjectData, Table, Relationship, TableGroup, TableNode } from '../types/index';
import { MergeSourceItem, MergePreflightAnalysis, MergeExecutionOptions, ProjectMergeResult, CrossDomainBridgeOption, TableConflict } from '../features/projects/merger/types';
import { globalEventBus } from '../features/event-bus/mfeEventBus';
import { MFE_EVENT_NAMES } from '../features/event-bus/mfeEventTypes';

const extractData = (p: Project): ProjectData => {
  if (p && p.data && Array.isArray(p.data.tables)) {
    return p.data;
  }
  return (p as unknown as ProjectData) || {
    tables: [],
    relationships: [],
    queries: [],
    forms: [],
    reports: [],
    layout: [],
    tableGroups: [],
    backendConfig: {} as any
  };
};

export class ProjectMergerService {
  /**
   * Preflight Analysis: Checks collisions and auto-detects cross-domain link candidates
   */
  public static analyzePreflight(
    currentTarget: Project,
    selectedSources: MergeSourceItem[]
  ): MergePreflightAnalysis {
    const targetData = extractData(currentTarget);
    const existingTableNames = new Set(targetData.tables.map(t => t.name.toLowerCase()));
    const conflicts: TableConflict[] = [];

    selectedSources.forEach(src => {
      const srcData = extractData(src.project);
      srcData.tables.forEach(t => {
        const lowerName = t.name.toLowerCase();
        if (existingTableNames.has(lowerName)) {
          const targetTable = targetData.tables.find(x => x.name.toLowerCase() === lowerName);
          const targetFields = new Set((targetTable?.fields || []).map(f => f.name.toLowerCase()));
          const discrepancies = t.fields
            .filter(f => !targetFields.has(f.name.toLowerCase()))
            .map(f => `+${f.name} (${f.type})`);

          conflicts.push({
            tableName: t.name,
            sourceNames: [currentTarget.name || 'Aktuelles Projekt', src.name],
            fieldDiscrepancies: discrepancies,
            resolution: 'prefix'
          });
        }
      });
    });

    const crossDomainBridges = this.detectCrossDomainBridges(currentTarget, selectedSources);

    const domainGroups: TableGroup[] = selectedSources.map(s => ({
      id: `grp_${s.domainPrefix.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: `${s.name} (Domäne)`,
      color: s.color || 'blue'
    }));

    const totalBefore = targetData.tables.length;
    const totalTablesAfter = totalBefore + selectedSources.reduce((acc, s) => acc + extractData(s.project).tables.length, 0);
    const totalRelationsAfter = (targetData.relationships || []).length +
      selectedSources.reduce((acc, s) => acc + (extractData(s.project).relationships || []).length, 0) +
      crossDomainBridges.filter(b => b.enabled).length;

    return {
      totalTablesBefore: totalBefore,
      totalTablesAfter,
      totalRelationsAfter,
      conflicts,
      crossDomainBridges,
      domainGroups
    };
  }

  /**
   * Detects domain bridge opportunities between projects
   */
  public static detectCrossDomainBridges(
    target: Project,
    sources: MergeSourceItem[]
  ): CrossDomainBridgeOption[] {
    const bridges: CrossDomainBridgeOption[] = [];
    const allProjects = [
      { name: 'Aktuelles Projekt', data: extractData(target), prefix: 'target' },
      ...sources.map(s => ({ name: s.name, data: extractData(s.project), prefix: s.domainPrefix }))
    ];

    const hasTable = (nameRegex: RegExp) => allProjects.find(p => p.data.tables.some(t => nameRegex.test(t.name)));

    const hrProj = hasTable(/^(Employee|Department)$/i);
    const pmProj = hasTable(/^(Task|Project|Workspace)$/i);
    const ecomProj = hasTable(/^(Customer|Order)$/i);
    const iotProj = hasTable(/^(Device|Incident)$/i);
    const eduProj = hasTable(/^(Course|Session|Enrollment)$/i);

    if (hrProj && pmProj && hrProj !== pmProj) {
      bridges.push({
        id: 'bridge_emp_task',
        name: 'HR-Mitarbeiter als Task-Verantwortliche',
        description: 'Verknüpft Employee.Id aus HR mit Task.AssignedUserId im Projektmanagement.',
        fromTable: 'Employee',
        fromField: 'Id',
        toTable: 'Task',
        toField: 'AssignedUserId',
        type: '1:n',
        enabled: true
      });
    }

    if (hrProj && ecomProj && hrProj !== ecomProj) {
      bridges.push({
        id: 'bridge_emp_sales',
        name: 'Vertriebsmitarbeiter für Aufträge',
        description: 'Verknüpft Employee.Id mit Order für Provisions- und Vertriebszuordnungen.',
        fromTable: 'Employee',
        fromField: 'Id',
        toTable: 'Order',
        toField: 'SalesRepresentativeId',
        type: '1:n',
        enabled: false
      });
    }

    if (iotProj && pmProj && iotProj !== pmProj) {
      bridges.push({
        id: 'bridge_iot_incident_task',
        name: 'Maschinenstörung generiert Wartungsaufgabe',
        description: 'Verknüpft Incident.Id aus der IoT-Telemetrie mit einem Wartungs-Task.',
        fromTable: 'Incident',
        fromField: 'Id',
        toTable: 'Task',
        toField: 'IncidentId',
        type: '1:n',
        enabled: true
      });
    }

    if (ecomProj && eduProj && ecomProj !== eduProj) {
      bridges.push({
        id: 'bridge_customer_enrollment',
        name: 'Kunde als Rechnungsempfänger für Kursbuchung',
        description: 'Verknüpft Customer.Id mit Enrollment.CustomerId.',
        fromTable: 'Customer',
        fromField: 'Id',
        toTable: 'Enrollment',
        toField: 'CustomerId',
        type: '1:n',
        enabled: true
      });
    }

    return bridges;
  }

  /**
   * Executes the Project Merge operation
   */
  public static executeMerge(
    baseTarget: Project,
    options: MergeExecutionOptions
  ): ProjectMergeResult {
    const targetData = extractData(baseTarget);
    const mergedData: ProjectData = JSON.parse(JSON.stringify(targetData));

    if (options.createAsNewProject && options.newProjectName && mergedData.backendConfig) {
      mergedData.backendConfig.projectName = options.newProjectName.replace(/[^a-zA-Z0-9]/g, '');
    }

    mergedData.tables = mergedData.tables || [];
    mergedData.relationships = mergedData.relationships || [];
    mergedData.queries = mergedData.queries || [];
    mergedData.forms = mergedData.forms || [];
    mergedData.reports = mergedData.reports || [];
    mergedData.tableGroups = mergedData.tableGroups || [];
    mergedData.layout = mergedData.layout || [];

    let maxX = 0;
    mergedData.layout.forEach(l => {
      if (l.x > maxX) maxX = l.x;
    });
    if (maxX === 0) maxX = 600;

    let tablesAddedCount = 0;
    let relsAddedCount = 0;
    let queriesCount = 0;
    let formsCount = 0;
    let reportsCount = 0;

    const tableIdMap = new Map<string, string>();
    const fieldIdMap = new Map<string, string>();

    options.activeSources.forEach((source, sIdx) => {
      const srcData = extractData(source.project);
      const prefix = options.strategy === 'prefix' ? `${source.domainPrefix}_` : '';
      const domainXOffset = maxX + 450 + (sIdx * 800);
      const groupId = `grp_${source.domainPrefix}`;

      // 1. Process and append tables
      srcData.tables.forEach(tbl => {
        const newTableId = `${prefix}${tbl.id}`;
        const newTableName = options.strategy === 'prefix' ? `${source.domainPrefix.toUpperCase()}_${tbl.name}` : tbl.name;
        tableIdMap.set(tbl.id, newTableId);

        const newFields = tbl.fields.map(fld => {
          const newFldId = `${prefix}${fld.id}`;
          fieldIdMap.set(fld.id, newFldId);
          return { ...fld, id: newFldId };
        });

        const newTable: Table = {
          ...tbl,
          id: newTableId,
          name: newTableName,
          fields: newFields,
          data: tbl.data ? JSON.parse(JSON.stringify(tbl.data)) : []
        };

        mergedData.tables.push(newTable);
        tablesAddedCount++;

        // Layout placement
        const origLayout = (srcData.layout || []).find(l => l.id === tbl.id || l.tableId === tbl.id);
        mergedData.layout.push({
          id: newTableId,
          tableId: newTableId,
          x: (origLayout?.x || 50) + domainXOffset,
          y: origLayout?.y || 60,
          groupId
        });
      });

      // 2. Process and append relationships
      (srcData.relationships || []).forEach(rel => {
        const fromT = tableIdMap.get(rel.fromTableId) || `${prefix}${rel.fromTableId}`;
        const toT = tableIdMap.get(rel.toTableId) || `${prefix}${rel.toTableId}`;
        const fromF = fieldIdMap.get(rel.fromFieldId) || `${prefix}${rel.fromFieldId}`;
        const toF = fieldIdMap.get(rel.toFieldId) || `${prefix}${rel.toFieldId}`;

        const newRel: Relationship = {
          ...rel,
          id: `rel_${fromT}_${toT}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          fromTableId: fromT,
          toTableId: toT,
          fromFieldId: fromF,
          toFieldId: toF
        };

        mergedData.relationships.push(newRel);
        relsAddedCount++;
      });

      // 3. Process Queries, Forms, Reports
      (srcData.queries || []).forEach(q => {
        const newQuery = JSON.parse(JSON.stringify(q));
        newQuery.id = `${prefix}${q.id}`;
        newQuery.name = `[${source.domainPrefix.toUpperCase()}] ${q.name}`;
        (newQuery.nodes || []).forEach((n: any) => {
          if (tableIdMap.has(n.tableId)) n.tableId = tableIdMap.get(n.tableId)!;
        });
        (newQuery.columns || []).forEach((c: any) => {
          if (tableIdMap.has(c.tableId)) c.tableId = tableIdMap.get(c.tableId)!;
          if (fieldIdMap.has(c.fieldId)) c.fieldId = fieldIdMap.get(c.fieldId)!;
        });
        mergedData.queries.push(newQuery);
        queriesCount++;
      });

      (srcData.forms || []).forEach(f => {
        const newForm = JSON.parse(JSON.stringify(f));
        newForm.id = `${prefix}${f.id}`;
        newForm.name = `[${source.domainPrefix.toUpperCase()}] ${f.name}`;
        if (newForm.sourceId && tableIdMap.has(newForm.sourceId)) {
          newForm.sourceId = tableIdMap.get(newForm.sourceId)!;
        }
        mergedData.forms.push(newForm);
        formsCount++;
      });

      (srcData.reports || []).forEach(r => {
        const newReport = JSON.parse(JSON.stringify(r));
        newReport.id = `${prefix}${r.id}`;
        newReport.name = `[${source.domainPrefix.toUpperCase()}] ${r.name}`;
        if (newReport.sourceId && tableIdMap.has(newReport.sourceId)) {
          newReport.sourceId = tableIdMap.get(newReport.sourceId)!;
        }
        mergedData.reports.push(newReport);
        reportsCount++;
      });

      // 4. Create visual Domain Table Group
      mergedData.tableGroups.push({
        id: groupId,
        name: `${source.name} Domäne`,
        color: source.color || 'blue'
      });
    });

    // 5. Create Enabled Cross-Domain Bridges
    options.enabledBridges.forEach(bridge => {
      const fromTbl = mergedData.tables.find(t => t.name.endsWith(bridge.fromTable) || t.name === bridge.fromTable);
      const toTbl = mergedData.tables.find(t => t.name.endsWith(bridge.toTable) || t.name === bridge.toTable);

      if (fromTbl && toTbl) {
        const fromFld = fromTbl.fields.find(f => f.name === bridge.fromField) || fromTbl.fields.find(f => f.isPrimaryKey);
        let toFld = toTbl.fields.find(f => f.name === bridge.toField);

        if (!toFld && fromFld) {
          toFld = {
            id: `fld_fk_${bridge.toField.toLowerCase()}_${Date.now()}`,
            name: bridge.toField,
            type: fromFld.type,
            length: fromFld.length
          };
          toTbl.fields.push(toFld);
        }

        if (fromFld && toFld) {
          mergedData.relationships.push({
            id: `rel_bridge_${bridge.id}`,
            fromTableId: fromTbl.id,
            fromFieldId: fromFld.id,
            toTableId: toTbl.id,
            toFieldId: toFld.id,
            type: bridge.type,
            referentialIntegrity: false
          });
          relsAddedCount++;
        }
      }
    });

    // 6. Broadcast Event on MFE Event-Bus
    globalEventBus.publish(MFE_EVENT_NAMES.STUDIO_SCHEMA_MODIFIED, 'STUDIO', {
      projectName: options.newProjectName || baseTarget.name,
      tablesCount: mergedData.tables.length,
      relationshipsCount: mergedData.relationships.length,
      operation: 'PROJECT_MERGE_CONSOLIDATION'
    });

    const mergedProject: Project = {
      id: options.createAsNewProject ? crypto.randomUUID() : baseTarget.id,
      name: options.newProjectName || baseTarget.name,
      lastModified: Date.now(),
      data: mergedData
    };

    return {
      mergedProject,
      tablesAdded: tablesAddedCount,
      relationshipsCreated: relsAddedCount,
      queriesImported: queriesCount,
      formsImported: formsCount,
      reportsImported: reportsCount
    };
  }
}
