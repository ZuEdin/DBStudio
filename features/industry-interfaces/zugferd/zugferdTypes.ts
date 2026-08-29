export type ZugferdProfile = 'MINIMUM' | 'BASIC' | 'COMFORT' | 'EXTENDED' | 'XRECHNUNG';

export interface ZugferdInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  seller: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
    country: string;
    vatId: string;
    iban: string;
    bic?: string;
  };
  buyer: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
    country: string;
    vatId?: string;
    buyerReference?: string; // Leitweg-ID
  };
  lineItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    totalAmount: number;
  }>;
  totalNet: number;
  totalVat: number;
  totalGross: number;
}
