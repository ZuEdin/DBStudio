/**
 * Standardized Cross-MFE Event Bus Payload Types
 * Enterprise Construction & Estimation Suite
 */

export type MfeDomain = 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | 'STUDIO' | '*';

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
  totalSubcontractor: number;
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
