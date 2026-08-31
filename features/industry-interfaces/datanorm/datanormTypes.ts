export type DatanormRecordType = 'A' | 'B' | 'P' | 'WRG' | 'RAB' | 'S';

export interface DatanormArticle {
  articleNumber: string;
  matchcode?: string;
  text1: string;
  text2?: string;
  priceGross: number; // Listen-Bruttopreis (G-Preis)
  priceNet?: number;   // Errechneter oder übergebener Netto-Einkaufspreis
  unit: string;
  discountGroup?: string; // e.g. "01", "RAB-HEIZUNG"
  productGroup?: string;  // e.g. "WG-10", "SANITÄR"
  teuerungGroup?: string; // e.g. "TZ-CU" (Kupferzuschlag)
}

export interface DatanormProductGroup {
  groupCode: string;
  description: string;
  defaultDiscountGroup?: string;
  teuerungPercent?: number;
}

/**
 * DATANORM 5.0 10-level discount tier matrix per discount group (RAB-Satz)
 */
export interface DatanormDiscountTierMatrix {
  groupCode: string;
  groupName: string;
  // 10-step discount chain in % (e.g. Step 1: Grundrabatt 35%, Step 2: Großkundenbonus 5%, etc.)
  tiers: number[]; // Array of up to 10 percentage values
}

export interface DatanormTeuerungsMatrix {
  code: string; // e.g. "TZ-CU", "TZ-STAHL", "TZ-ENERGIE"
  name: string; // e.g. "Kupfer-Teuerungszuschlag (DEL-Notiz)"
  percentage: number; // e.g. 12.5%
  basePrice?: number;
  currentPrice?: number;
}

export interface DatanormPositionCalculation {
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  priceGross: number;
  appliedTiers: number[];
  combinedDiscountPercent: number; // Total compound discount percentage
  priceNetPurchasing: number;      // Netto-EK vor Teuerung
  teuerungPercent: number;         // Teuerungszuschlag in %
  teuerungAmount: number;          // Teuerungszuschlag in €
  effectivePurchasingCost: number; // Einstandspreis (Gestehungskosten EK)
  marginPercent: number;           // Kalkulierter Aufschlag / Marge in % (z.B. 35%)
  unitPriceSellingNet: number;     // Angebotspreis Netto (VK-Netto)
  totalPriceSellingNet: number;    // Gesamt-Verkaufspreis Netto
}
