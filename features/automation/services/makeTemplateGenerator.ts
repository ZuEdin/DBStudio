import { Workflow, Table } from '../../../types/index';

export interface MakeBlueprintExport {
  name: string;
  flow: Array<{
    id: number;
    module: string;
    version: number;
    parameters: Record<string, any>;
    mapper: Record<string, any>;
    metadata?: Record<string, any>;
  }>;
  metadata: {
    instant: boolean;
    version: number;
    scenario: {
      roundtrips: number;
      maxErrors: number;
      autoCommit: boolean;
      sequential: boolean;
      confidential: boolean;
    };
    designer: {
      orphans: any[];
    };
  };
}

export function generateMakeBlueprint(workflow?: Workflow, tables: Table[] = []): MakeBlueprintExport {
  const targetTable = tables[0]?.name || 'DBStudioRecords';
  
  return {
    name: `DB Studio Pro - ${workflow?.name || 'Data Ingestion Scenario'}`,
    flow: [
      {
        id: 1,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: {
          hook: 98124
        },
        mapper: {},
        metadata: {
          designer: {
            x: 0,
            y: 0,
            name: 'DB Studio Event Inbound Webhook'
          },
          restore: {},
          expect: [
            { name: 'event', type: 'text', label: 'Event Name' },
            { name: 'table', type: 'text', label: 'Tabelle' },
            { name: 'recordId', type: 'number', label: 'Datensatz ID' },
            { name: 'data', type: 'collection', label: 'Datensatz Nutzlast' }
          ]
        }
      },
      {
        id: 2,
        module: 'builtin:BasicRouter',
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: {
            x: 300,
            y: 0
          }
        }
      },
      {
        id: 3,
        module: 'http:ActionMakeRequest',
        version: 3,
        parameters: {
          handleErrors: false
        },
        mapper: {
          url: `http://localhost:5000/api/v1/tables/${targetTable}/sync`,
          method: 'POST',
          headers: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'X-DB-Studio-Auth', value: 'Bearer {{secrets.API_KEY}}' }
          ],
          body: '{\n  "status": "PROCESSED_BY_MAKE",\n  "processedAt": "{{now}}",\n  "originalId": "{{1.recordId}}"\n}',
          type: 'raw',
          parseResponse: true
        },
        metadata: {
          designer: {
            x: 600,
            y: -100,
            name: 'DB Studio Acknowledge Callback'
          }
        }
      }
    ],
    metadata: {
      instant: true,
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        sequential: false,
        confidential: false
      },
      designer: {
        orphans: []
      }
    }
  };
}
