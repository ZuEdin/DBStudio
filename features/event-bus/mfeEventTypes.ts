/**
 * Standardized Cross-MFE Event Bus Payload Types
 * Enterprise Construction & Estimation Suite
 */

export type MfeDomain = 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | 'STUDIO' | '*';

export const MFE_DRAG_MIME_TYPES = {
  ARTICLE: 'application/x-enterprise-article',
  POSITION: 'application/x-enterprise-position',
  ATTACHMENT: 'application/x-enterprise-attachment',
} as const;

export interface MfeBaseEvent<T = any> {
  eventId: string;
  eventType: string;
  sourceDomain: MfeDomain;
  targetDomain?: MfeDomain;
  timestamp: number;
  version: '1.0';
  correlationId?: string;
  payload: T;
}

// Shell Domain Events
export interface ShellProjectSelectedPayload {
  projectId: string;
  projectNumber: string;
  customerId?: string;
  title: string;
}

export interface ShellUserAuthenticatedPayload {
  userId: string;
  roles: string[];
  tenantId: string;
  permissions: string[];
}

// CRM Domain Events
export interface CrmCustomerUpdatedPayload {
  customerId: string;
  companyName: string;
  paymentTermsDays: number;
  discountPercentage: number;
  vatId?: string;
  iban?: string;
}

// Articles Domain Events
export interface ArticlesPriceChangedPayload {
  articleId: string;
  articleNumber: string;
  oldPrice: number;
  newPrice: number;
  validFrom: string;
}

// Calc Domain Events
export interface CalcTotalsChangedPayload {
  projectId: string;
  totalLabor: number;
  totalMaterial: number;
  totalEquipment: number;
  totalSubcontractor?: number;
  totalNet: number;
  totalGross: number;
}

export interface CalcOfferFinalizedPayload {
  projectId: string;
  offerNumber: string;
  netAmount: number;
  positionsCount: number;
}

// Billing Domain Events
export interface BillingInvoiceCreatedPayload {
  invoiceId: string;
  invoiceNumber: string;
  projectId: string;
  customerId: string;
  netAmount: number;
  grossAmount: number;
  invoiceType: 'ADVANCE' | 'PARTIAL' | 'FINAL';
}

export interface BillingPaymentReceivedPayload {
  invoiceId: string;
  paidAmount: number;
  paidDate: string;
  remainingAmount: number;
}

// Studio Schema & Query Sync Events
export interface StudioSchemaModifiedPayload {
  tableId?: string;
  tableName?: string;
  action: 'CREATE' | 'ALTER' | 'DROP';
  timestamp: number;
}

export interface StudioQueryExecutedPayload {
  queryId?: string;
  queryName?: string;
  rowCount: number;
  executionTimeMs: number;
  results?: any[];
}

// Drag & Drop Cross-MFE Payload
export interface CrossMfeDragArticlePayload {
  type: 'ARTICLE';
  articleId: string;
  articleNumber: string;
  shortText: string;
  unit: string;
  unitPriceMaterial: number;
  unitPriceLabor: number;
}

export interface CrossMfeDragPositionPayload {
  type: 'POSITION';
  positionId: string;
  oz: string;
  shortText: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// Multi-DB Sync Matrix & Hybrid Replication Events
export interface ReplicationSyncStartedPayload {
  syncBatchId: string;
  rulesCount: number;
  mode: 'full' | 'delta';
  timestamp: number;
}

export interface ReplicationConflictDetectedPayload {
  conflictId: string;
  tableName: string;
  recordId: string | number;
  conflictingFields: string[];
  localTimestamp: number;
  remoteTimestamp: number;
}

export interface ReplicationConflictResolvedPayload {
  conflictId: string;
  tableName: string;
  recordId: string | number;
  strategy: string;
  winner: 'local' | 'remote' | 'merged';
}

export interface ReplicationSyncCompletedPayload {
  syncBatchId: string;
  status: 'success' | 'partial' | 'failed';
  totalSynced: number;
  conflictsCount: number;
  durationMs: number;
}

