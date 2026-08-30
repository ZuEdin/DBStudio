import { Workflow, WorkflowNode, WorkflowEdge, Table } from '../../../types/index';

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
}

export interface N8nConnectionItem {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflowExport {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, { main: N8nConnectionItem[][] }>;
  active: boolean;
  settings: {
    executionOrder?: 'v1';
    timezone?: string;
    saveExecutionProgress?: boolean;
    saveManualExecutions?: boolean;
    callerPolicy?: string;
  };
  versionId?: string;
  meta: {
    templateCredsSetupCompleted?: boolean;
    instanceId: string;
    schemaVersion?: string;
  };
  tags?: Array<{ id: string; name: string }>;
}

export function generateEnhancedN8nWorkflow(
  workflow: Workflow,
  tables: Table[] = [],
  baseUrl = 'http://localhost:5000'
): N8nWorkflowExport {
  const nodes: N8nNode[] = [];
  const connections: Record<string, { main: N8nConnectionItem[][] }> = {};

  const nodeIdToNameMap: Record<string, string> = {};
  const usedNames = new Set<string>();

  const getUniqueName = (base: string) => {
    let name = base.trim() || 'Node';
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${base} ${++counter}`;
    }
    usedNames.add(name);
    return name;
  };

  // 1. Process all nodes
  (workflow.nodes || []).forEach((node: WorkflowNode, index: number) => {
    const rawLabel = node.data?.label || `Node_${index + 1}`;
    const nodeName = getUniqueName(rawLabel);
    nodeIdToNameMap[node.id] = nodeName;

    const posX = Math.round(node.position?.x ?? (index * 260 + 100));
    const posY = Math.round(node.position?.y ?? (index % 2 === 0 ? 200 : 350));

    let n8nType = 'n8n-nodes-base.httpRequest';
    let typeVersion = 1;
    let parameters: Record<string, any> = {};

    switch (node.type) {
      case 'triggerNode': {
        const trigger = node.data?.triggerConfig;
        if (trigger?.event === 'onSchedule') {
          n8nType = 'n8n-nodes-base.scheduleTrigger';
          typeVersion = 1.2;
          parameters = {
            rule: {
              interval: [
                {
                  field: trigger.cronExpression ? 'cronExpression' : 'minutes',
                  expression: trigger.cronExpression || '0 * * * *',
                  minutesInterval: trigger.intervalMinutes || 15
                }
              ]
            }
          };
        } else if (trigger?.event === 'onManual') {
          n8nType = 'n8n-nodes-base.manualTrigger';
          typeVersion = 1;
          parameters = {};
        } else {
          n8nType = 'n8n-nodes-base.webhook';
          typeVersion = 2;
          const eventPath = trigger?.event || 'db-event';
          parameters = {
            httpMethod: 'POST',
            path: `db-studio/${eventPath.toLowerCase()}`,
            responseMode: 'onReceived',
            responseData: 'allEntries',
            options: {
              rawBody: false
            }
          };
        }
        break;
      }

      case 'databaseActionNode':
      case 'actionNode': {
        const dbConfig = node.data?.dbActionConfig;
        const targetTable = tables.find(t => t.id === dbConfig?.tableId);
        const tableName = targetTable?.name || dbConfig?.tableId || 'records';
        
        n8nType = 'n8n-nodes-base.postgres';
        typeVersion = 2.4;
        
        if (dbConfig?.action === 'insert') {
          parameters = {
            operation: 'insert',
            schema: { __rl: true, value: 'public', mode: 'list' },
            table: { __rl: true, value: tableName, mode: 'list' },
            columns: {
              mappingMode: 'autoMapInputData',
              value: {}
            }
          };
        } else if (dbConfig?.action === 'update') {
          parameters = {
            operation: 'update',
            schema: { __rl: true, value: 'public', mode: 'list' },
            table: { __rl: true, value: tableName, mode: 'list' },
            updateKey: 'id',
            columns: {
              mappingMode: 'autoMapInputData',
              value: {}
            }
          };
        } else if (dbConfig?.action === 'delete') {
          parameters = {
            operation: 'deleteTable',
            schema: { __rl: true, value: 'public', mode: 'list' },
            table: { __rl: true, value: tableName, mode: 'list' },
            deleteKey: 'id'
          };
        } else {
          parameters = {
            operation: 'executeQuery',
            query: `SELECT * FROM "${tableName}" LIMIT 50;`
          };
        }
        break;
      }

      case 'emailActionNode': {
        const emailConfig = node.data?.emailConfig;
        n8nType = 'n8n-nodes-base.emailSend';
        typeVersion = 2.1;
        parameters = {
          toEmail: emailConfig?.to || 'admin@example.com',
          subject: emailConfig?.subject || 'DB Studio Pro Notification',
          text: emailConfig?.body || 'Automated message from DB Studio Pro Workflow',
          options: {
            attachments: emailConfig?.attachReport ? 'all' : undefined
          }
        };
        break;
      }

      case 'apiNode': {
        const apiConfig = node.data?.apiConfig;
        n8nType = 'n8n-nodes-base.httpRequest';
        typeVersion = 4.2;
        parameters = {
          method: apiConfig?.method || 'GET',
          url: apiConfig?.url || `${baseUrl}/api/v1/sync`,
          sendBody: ['POST', 'PUT', 'PATCH'].includes(apiConfig?.method || ''),
          specifyBody: 'json',
          jsonBody: apiConfig?.body || '{\n  "source": "db_studio",\n  "timestamp": "={{ $now.toISO() }}"\n}',
          options: {
            response: {
              response: {
                fullResponse: false
              }
            }
          }
        };
        break;
      }

      case 'conditionNode': {
        n8nType = 'n8n-nodes-base.if';
        typeVersion = 2;
        parameters = {
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: '',
              typeValidation: 'strict'
            },
            conditions: [
              {
                id: 'cond_1',
                leftValue: '={{ $json.status }}',
                rightValue: 'success',
                operator: {
                  type: 'string',
                  operation: 'equals'
                }
              }
            ],
            combinator: 'and'
          }
        };
        break;
      }

      case 'loopNode': {
        n8nType = 'n8n-nodes-base.splitInBatches';
        typeVersion = 3;
        parameters = {
          batchSize: 1,
          options: {}
        };
        break;
      }

      case 'scriptNode': {
        n8nType = 'n8n-nodes-base.code';
        typeVersion = 2;
        parameters = {
          language: 'javaScript',
          jsCode: `// DB Studio Pro - Data Transform\nfor (const item of $input.all()) {\n  item.json.processedAt = new Date().toISOString();\n  item.json.studioOrigin = "${workflow.name || 'Workflow'}";\n}\nreturn $input.all();`
        };
        break;
      }

      default: {
        n8nType = 'n8n-nodes-base.set';
        typeVersion = 3.2;
        parameters = {
          assignments: {
            assignments: [
              {
                id: 'set_1',
                name: 'workflow_status',
                value: 'executed',
                type: 'string'
              }
            ]
          }
        };
        break;
      }
    }

    nodes.push({
      id: node.id,
      name: nodeName,
      type: n8nType,
      typeVersion,
      position: [posX, posY],
      parameters
    });
  });

  // 2. Build Connections
  (workflow.edges || []).forEach((edge: WorkflowEdge) => {
    const sourceNodeName = nodeIdToNameMap[edge.source];
    const targetNodeName = nodeIdToNameMap[edge.target];

    if (sourceNodeName && targetNodeName) {
      if (!connections[sourceNodeName]) {
        connections[sourceNodeName] = { main: [[]] };
      }

      const connectionIndex = edge.sourceHandle === 'false' ? 1 : 0;
      while (connections[sourceNodeName].main.length <= connectionIndex) {
        connections[sourceNodeName].main.push([]);
      }

      connections[sourceNodeName].main[connectionIndex].push({
        node: targetNodeName,
        type: 'main',
        index: 0
      });
    }
  });

  return {
    name: workflow.name || 'DB Studio Pro Automation',
    nodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
      timezone: 'Europe/Berlin',
      saveExecutionProgress: true,
      saveManualExecutions: true
    },
    meta: {
      templateCredsSetupCompleted: true,
      instanceId: 'db-studio-pro-cloud',
      schemaVersion: '1.0'
    },
    tags: [
      { id: 'db-studio', name: 'DB Studio Pro' },
      { id: 'database', name: 'Database Automation' }
    ]
  };
}
