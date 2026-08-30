import { Table } from '../../../types/index';
import { validatePayloadAgainstTable, ValidationResult } from './payloadValidator';

export interface WebhookEndpoint {
  id: string;
  name: string;
  provider: 'stripe' | 'github' | 'shopify' | 'custom' | 'zapier' | 'n8n';
  eventTopic: string;
  targetTableId?: string;
  secretToken: string;
  autoInsert: boolean;
  active: boolean;
  samplePayload: Record<string, any>;
}

export interface IngestionLogEntry {
  id: string;
  timestamp: string;
  endpointName: string;
  provider: string;
  status: 'SUCCESS' | 'VALIDATION_FAILED' | 'REJECTED';
  durationMs: number;
  payload: Record<string, any>;
  validationResult: ValidationResult;
  insertedId?: string | number;
}

export function getDefaultWebhookEndpoints(tables: Table[] = []): WebhookEndpoint[] {
  const defaultTable = tables[0]?.id;

  return [
    {
      id: 'ep_stripe_charge',
      name: 'Stripe Payment Ingestion',
      provider: 'stripe',
      eventTopic: 'payment_intent.succeeded',
      targetTableId: defaultTable,
      secretToken: 'whsec_test_51MzQ849201948',
      autoInsert: true,
      active: true,
      samplePayload: {
        id: 'evt_3Mjjkw2eZvKYlo2C0Q6v3p2A',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_3Mjjkw2eZvKYlo2C0Q6v3p2A',
            amount: 14900,
            currency: 'eur',
            customer: 'cus_N624a9vL0k',
            status: 'succeeded',
            metadata: {
              order_id: '1042',
              customer_name: 'Max Mustermann Bau GmbH'
            }
          }
        }
      }
    },
    {
      id: 'ep_github_ci',
      name: 'GitHub Webhook Deployment',
      provider: 'github',
      eventTopic: 'push',
      targetTableId: defaultTable,
      secretToken: 'gh_webhook_secret_x99a',
      autoInsert: false,
      active: true,
      samplePayload: {
        ref: 'refs/heads/main',
        repository: {
          name: 'db-studio-enterprise-backend',
          full_name: 'enterprise/db-studio-backend'
        },
        pusher: {
          name: 'lead-dev',
          email: 'dev@enterprise-bau.de'
        },
        head_commit: {
          id: 'b7a94f1c',
          message: 'feat(db): update migration schema v3.0',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      id: 'ep_custom_bau',
      name: 'Baudokumentation Sensor / App',
      provider: 'custom',
      eventTopic: 'construction.daily_log',
      targetTableId: defaultTable,
      secretToken: 'custom_sec_bau_2026',
      autoInsert: true,
      active: true,
      samplePayload: {
        baustelle_id: 'BS-2026-Berlin',
        projektleiter: 'Dipl.-Ing. Schmidt',
        temperatur_celsius: 18.5,
        wetter: 'Sonnig',
        fortschritt_prozent: 64.2,
        dokumentiert_am: new Date().toISOString().split('T')[0]
      }
    }
  ];
}

export function simulateWebhookIngestion(
  endpoint: WebhookEndpoint,
  rawPayload: Record<string, any>,
  tables: Table[]
): IngestionLogEntry {
  const startTime = performance.now();
  const targetTable = tables.find(t => t.id === endpoint.targetTableId) || tables[0];

  // Extract nested data if standard Stripe/GitHub wrapper
  let normalizedData = rawPayload;
  if (endpoint.provider === 'stripe' && rawPayload.data?.object) {
    const obj = rawPayload.data.object;
    normalizedData = {
      ...obj,
      ...(obj.metadata || {})
    };
  }

  const validationResult = targetTable
    ? validatePayloadAgainstTable(normalizedData, targetTable)
    : { isValid: true, issues: [], mappedRecord: normalizedData, unmappedFields: [] };

  const durationMs = Math.round(performance.now() - startTime);

  return {
    id: `ingest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString(),
    endpointName: endpoint.name,
    provider: endpoint.provider,
    status: validationResult.isValid ? 'SUCCESS' : 'VALIDATION_FAILED',
    durationMs,
    payload: rawPayload,
    validationResult,
    insertedId: validationResult.isValid ? Math.floor(1000 + Math.random() * 9000) : undefined
  };
}
