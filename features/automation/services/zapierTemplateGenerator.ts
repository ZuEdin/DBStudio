import { Workflow, Table } from '../../../types/index';

export interface ZapierWebhookTemplate {
  title: string;
  description: string;
  eventType: 'table.created' | 'table.updated' | 'table.deleted' | 'workflow.triggered' | 'custom';
  samplePayload: Record<string, any>;
  zapierCatchHookUrlGuide: string;
  zapierCodeStepJs: string;
  zapierCodeStepPython: string;
}

export function generateZapierTemplates(workflow?: Workflow, tables: Table[] = []): ZapierWebhookTemplate[] {
  const templates: ZapierWebhookTemplate[] = [];

  const mainTable = tables[0] || {
    id: 'tbl_orders',
    name: 'KundenAuftraege',
    fields: [
      { id: 'f1', name: 'id', type: 'INTEGER', isPrimaryKey: true },
      { id: 'f2', name: 'auftragsnummer', type: 'VARCHAR' },
      { id: 'f3', name: 'kunde_name', type: 'VARCHAR' },
      { id: 'f4', name: 'gesamtbetrag', type: 'DECIMAL' },
      { id: 'f5', name: 'status', type: 'VARCHAR' }
    ]
  };

  const sampleRecord: Record<string, any> = {};
  mainTable.fields.forEach(f => {
    if (f.name === 'id') sampleRecord[f.name] = 1042;
    else if (f.type === 'INTEGER' || f.type === 'DECIMAL') sampleRecord[f.name] = 4850.00;
    else if (f.type === 'DATE') sampleRecord[f.name] = new Date().toISOString().split('T')[0];
    else if (f.type === 'BOOLEAN') sampleRecord[f.name] = true;
    else sampleRecord[f.name] = `Beispiel ${f.name}`;
  });

  // 1. New Record Created Trigger
  templates.push({
    title: `Neuer Datensatz in '${mainTable.name}'`,
    description: `Triggert Zapier sofort, wenn ein neuer Datensatz in '${mainTable.name}' angelegt wird.`,
    eventType: 'table.created',
    samplePayload: {
      event: 'table.insert',
      table: mainTable.name,
      timestamp: new Date().toISOString(),
      origin: 'DB Studio Pro Event-Bus',
      recordId: 1042,
      data: sampleRecord,
      meta: {
        actor: 'user_operator_1',
        workspace: 'DBStudio_Enterprise'
      }
    },
    zapierCatchHookUrlGuide: '1. In Zapier Trigger "Webhooks by Zapier" wählen.\n2. Event: "Catch Hook" auswählen.\n3. Kopieren Sie die Webhook-URL in DB Studio Webhook-Hub oder Event-Bus.',
    zapierCodeStepJs: `// Zapier Code by Zapier (JavaScript)
const payload = inputData;
const record = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;

output = {
  id: record.id || payload.recordId,
  table: payload.table,
  status: record.status || 'NEW',
  summary: \`Neuer Eintrag in \${payload.table} von \${record.kunde_name || 'Unbekannt'}\`,
  rawPayload: payload
};`,
    zapierCodeStepPython: `# Zapier Code by Zapier (Python 3.11)
import json

raw_data = input_data.get('data', '{}')
record = json.loads(raw_data) if isinstance(raw_data, str) else raw_data

return {
    'id': record.get('id', input_data.get('recordId')),
    'table': input_data.get('table', 'Unknown'),
    'event': input_data.get('event'),
    'summary': f"Neuer Datensatz in {input_data.get('table')}"
}`
  });

  // 2. Workflow Execution Completed Trigger
  templates.push({
    title: `Workflow Abschluss: '${workflow?.name || 'Automations-Pipeline'}'`,
    description: 'Triggert Zapier nach erfolgreichem Durchlauf eines DB Studio Pro Workflows (z. B. für CRM-Sync oder Rechnungsversand).',
    eventType: 'workflow.triggered',
    samplePayload: {
      event: 'workflow.completed',
      workflowId: workflow?.id || 'wf_master_sync',
      workflowName: workflow?.name || 'Enterprise Bau & Rechnungs-Sync',
      executionId: 'exec_849204',
      status: 'SUCCESS',
      executionDurationMs: 342,
      processedItemsCount: 18,
      timestamp: new Date().toISOString(),
      outputSummary: {
        emailsSent: 3,
        recordsUpdated: 15,
        pdfGenerated: true
      }
    },
    zapierCatchHookUrlGuide: 'Verbinden Sie Zapier Webhook mit Ihrem Workflow Endknoten.',
    zapierCodeStepJs: `// Zapier Code Action
const wf = inputData;
output = {
  workflowName: wf.workflowName,
  status: wf.status,
  itemsProcessed: parseInt(wf.processedItemsCount || '0', 10),
  isSuccessful: wf.status === 'SUCCESS'
};`,
    zapierCodeStepPython: `return {
    'workflow': input_data.get('workflowName'),
    'is_success': input_data.get('status') == 'SUCCESS',
    'count': int(input_data.get('processedItemsCount', 0))
}`
  });

  return templates;
}
