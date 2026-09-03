import { Project, Table, Relationship, Query, Form, Report, TableGroup } from '../../../types/index';

export type MergeStrategy = 'prefix' | 'unify' | 'federate';

export interface MergeSourceItem {
  id: string;
  name: string;
  type: 'saved_project' | 'template';
  project: Project;
  selected: boolean;
  domainPrefix: string;
  color: string;
  tableCount: number;
  relationCount: number;
}

export interface CrossDomainBridgeOption {
  id: string;
  name: string;
  description: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: '1:n' | '1:1';
  enabled: boolean;
}

export interface TableConflict {
  tableName: string;
  sourceNames: string[];
  fieldDiscrepancies: string[];
  resolution: 'prefix' | 'unify' | 'keep_target';
}

export interface MergePreflightAnalysis {
  totalTablesBefore: number;
  totalTablesAfter: number;
  totalRelationsAfter: number;
  conflicts: TableConflict[];
  crossDomainBridges: CrossDomainBridgeOption[];
  domainGroups: TableGroup[];
}

export interface MergeExecutionOptions {
  strategy: MergeStrategy;
  newProjectName?: string;
  createAsNewProject: boolean;
  activeSources: MergeSourceItem[];
  enabledBridges: CrossDomainBridgeOption[];
  customResolutions?: Record<string, 'prefix' | 'unify' | 'keep_target'>;
}

export interface ProjectMergeResult {
  mergedProject: Project;
  tablesAdded: number;
  relationshipsCreated: number;
  queriesImported: number;
  formsImported: number;
  reportsImported: number;
}
