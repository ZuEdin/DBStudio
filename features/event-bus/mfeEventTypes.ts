/**
 * Standardized Cross-MFE Event Bus Payload Types
 * Enterprise Construction & Estimation Suite (Shell, CRM, Articles, Calc, Billing, Studio)
 */

export type MfeDomain = 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | 'STUDIO' | '*';

export const MFE_DRAG_MIME_TYPES = {
  ARTICLE: 'application/x-enterprise-article',
  POSITION: 'application/x-enterprise-position',
  ATTACHMENT: 'application/x-enterprise-attachment',
} as const;

export const MFE_EVENT_NAMES = {
  // Shell Events
  SHELL_PROJECT_SELECTED: 'shell:project:selected',
  SHELL_USER_AUTH: 'shell:user:authenticated',
  SHELL_ROUTE_CHANGED: 'shell:route:changed',
  SHELL_TENANT_CONFIG: 'shell:tenant:config',

  // CRM Events
  CRM_CUSTOMER_SELECTED: 'crm:customer:selected',
  CRM_CUSTOMER_UPDATED: 'crm:customer:updated',
  CRM_DISCOUNT_APPLIED: 'crm:discount:applied',
  CRM_CREDIT_CHECK_RESULT: 'crm:credit:check_result',

  // Articles Domain Events
  ARTICLES_PRICE_CHANGED: 'articles:price:changed',
  ARTICLES_DRAGGED_TO_CALC: 'articles:item:dragged_to_calc',
  ARTICLES_DATANORM_IMPORTED: 'articles:datanorm:imported',
  ARTICLES_PRICE_OVERRIDE: 'articles:price:override',

  // Calc Domain Events
  CALC_POSITION_ADDED: 'calc:position:added',
  CALC_TOTALS_CHANGED: 'calc:totals:changed',
  CALC_EFB_UPDATED: 'calc:efb:updated',
  CALC_OFFER_FINALIZED: 'calc:offer:finalized',
  CALC_CONVERT_TO_INVOICE: 'calc:convert:to_invoice',

  // Billing Domain Events
  BILLING_INVOICE_CREATED: 'billing:invoice:created',
  BILLING_PAYMENT_RECEIVED: 'billing:payment:received',
  BILLING_SKONTO_CALCULATED: 'billing:skonto:calculated',
  BILLING_XRECHNUNG_EXPORTED: 'billing:xrechnung:exported',

  // Studio Schema & System Events
  STUDIO_SCHEMA_MODIFIED: 'studio:schema:modified',
  STUDIO_RPC_REQUEST: 'studio:rpc:request',
  STUDIO_RPC_RESPONSE: 'studio:rpc:response',
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

export interface ShellRouteChangedPayload {
  activeDomain: MfeDomain;
  subRoute?: string;
  previousDomain?: MfeDomain;
}

export interface ShellTenantConfigPayload {
  tenantId: string;
  companyName: string;
  currency: string;
  defaultVatPercent: number;
  defaultPaymentTermsDays: number;
}

// CRM Domain Events
export interface CrmCustomerSelectedPayload {
  customerId: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  paymentTermsDays: number;
  discountPercentage: number;
  creditLimit?: number;
  currentExposure?: number;
  vatId?: string;
  iban?: string;
}

export interface CrmCustomerUpdatedPayload {
  customerId: string;
  companyName: string;
  paymentTermsDays: number;
  discountPercentage: number;
  vatId?: string;
  iban?: string;
}

export interface CrmDiscountAppliedPayload {
  customerId: string;
  projectId: string;
  discountPercent: number;
  specialReason?: string;
}

export interface CrmCreditCheckResultPayload {
  customerId: string;
  status: 'APPROVED' | 'WARN' | 'BLOCKED';
  creditLimit: number;
  currentExposure: number;
  availableCredit: number;
}

// Articles Domain Events
export interface ArticlesPriceChangedPayload {
  articleId: string;
  articleNumber: string;
  oldPrice: number;
  newPrice: number;
  validFrom: string;
}

export interface ArticlesDraggedToCalcPayload {
  articleId: string;
  articleNumber: string;
  name: string;
  shortText: string;
  unit: string;
  priceGross: number;
  priceNetPurchasing: number;
  discountGroup?: string;
  targetSectionOz?: string;
  quantity?: number;
}

export interface ArticlesDatanormImportedPayload {
  catalogName: string;
  articlesCount: number;
  timestamp: number;
  sourceSupplier: string;
}

// Calc Domain Events
export interface CalcPositionAddedPayload {
  projectId: string;
  oz: string;
  shortText: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  costLabor?: number;
  costMaterial?: number;
  costEquipment?: number;
}

export interface CalcTotalsChangedPayload {
  projectId: string;
  totalLabor: number;
  totalMaterial: number;
  totalEquipment: number;
  totalSubcontractor?: number;
  totalNet: number;
  totalGross: number;
}

export interface CalcEfbUpdatedPayload {
  projectId: string;
  positionId: string;
  oz: string;
  unitPriceNet: number;
  marginPercent: number;
  contributionMarginAmount: number;
}

export interface CalcOfferFinalizedPayload {
  projectId: string;
  offerNumber: string;
  netAmount: number;
  positionsCount: number;
}

export interface CalcConvertToInvoicePayload {
  projectId: string;
  offerNumber: string;
  customerId: string;
  invoiceType: 'ADVANCE' | 'PARTIAL' | 'FINAL';
  netTotal: number;
  grossTotal: number;
  selectedPositionIds: string[];
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
  dueDate: string;
}

export interface BillingPaymentReceivedPayload {
  invoiceId: string;
  paidAmount: number;
  paidDate: string;
  remainingAmount: number;
  isFullyPaid: boolean;
}

export interface BillingSkontoCalculatedPayload {
  invoiceId: string;
  skontoPercent: number;
  skontoDays: number;
  skontoAmount: number;
  netPayableWithSkonto: number;
}

export interface BillingXRechnungExportedPayload {
  invoiceId: string;
  invoiceNumber: string;
  standard: 'XRECHNUNG_3_0' | 'ZUGFERD_2_2';
  xmlByteLength: number;
}

// Studio Schema & RPC Events
export interface StudioSchemaModifiedPayload {
  tableId?: string;
  tableName?: string;
  action: 'CREATE' | 'ALTER' | 'DROP';
  timestamp: number;
}

export interface StudioRpcRequestPayload<T = any> {
  rpcMethod: string;
  args: T;
  requestId: string;
}

export interface StudioRpcResponsePayload<T = any> {
  requestId: string;
  result?: T;
  error?: string;
}
