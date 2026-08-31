export type GaebPhase = 
  | '80' // Universalkatalog / Standardleistungsbuch
  | '81' // Leistungsbeschreibung
  | '82' // Kostenansatz / Kostenschätzung
  | '83' // Angebotsaufforderung / Ausschreibung (LV)
  | '84' // Angebotsabgabe / Bieterangebot
  | '85' // Nebenangebot
  | '86' // Auftragserteilung / Vergabe
  | '89'; // Aufmaß / Abrechnung

export type GaebPositionType = 
  | 'Normal' 
  | 'Grund' 
  | 'Wahl' 
  | 'BedarfMitGesamt' 
  | 'BedarfOhneGesamt' 
  | 'Eventual' 
  | 'Pauschal' 
  | 'Hinweistext';

export interface GaebLaborCalculation {
  hoursPerUnit: number;        // Zeitansatz in Std/ME (z.B. 0.85 h/m²)
  wageRatePerHour: number;     // Kalkulatorischer Mittellohn (€/h)
  wageAddonPercent: number;    // Lohnnebenkosten / Lohnzusatzkosten in % (z.B. 82%)
  laborOverheadPercent: number;// Lohngemeinkosten in % (z.B. 18%)
  effectiveWagePerHour: number;// Effektiver Verrechnungslohn (€/h)
  totalLaborPerUnit: number;   // Lohn-Kostenanteil je Einheit (€)
}

export interface GaebMaterialCalculation {
  listPurchasingPrice: number;    // Listen-EK (€)
  purchasingDiscountPercent: number; // Lieferantenrabatt in % (z.B. 25%)
  netPurchasingPrice: number;     // Netto-Einkaufspreis (€)
  freightAndPackagingPerUnit: number; // Fracht / Verpackung / Nebenkosten (€)
  materialOverheadPercent: number;// Materialgemeinkosten (MGK) in % (z.B. 12%)
  totalMaterialPerUnit: number;   // Material-Kostenanteil je Einheit (€)
}

export interface GaebEquipmentCalculation {
  equipmentRatePerHour: number;   // Gerätesatz (€/h)
  equipmentHoursPerUnit: number;  // Geräteeinsatzdauer (h/ME)
  equipmentOverheadPercent: number; // Gerätegemeinkosten in % (z.B. 10%)
  totalEquipmentPerUnit: number;  // Geräte-Kostenanteil je Einheit (€)
}

export interface GaebSubcontractorCalculation {
  subcontractorPricePerUnit: number; // NU-Vergabepreis (€)
  subcontractorOverheadPercent: number; // Nachunternehmer-Zuschlag in % (z.B. 8%)
  totalSubcontractorPerUnit: number; // NU-Kostenanteil je Einheit (€)
}

export interface GaebEfbBreakdown {
  labor: GaebLaborCalculation;
  material: GaebMaterialCalculation;
  equipment: GaebEquipmentCalculation;
  subcontractor: GaebSubcontractorCalculation;
  directCostPerUnit: number;        // Einzelkosten der Teilleistung (EKdT)
  overheadCostPercent: number;      // Baustellengemeinkosten (BGK) & Allgemeine Geschäftskosten (AGK) in %
  riskAndProfitPercent: number;     // Wagnis & Gewinn (W&G) in % (z.B. 6.5%)
  unitPriceNet: number;             // Einheitspreis Netto (EP)
  totalPriceNet: number;            // Gesamtpreis Netto (GB = Menge * EP)
  marginPercent: number;            // Marge / Deckungsbeitrag in %
  contributionMarginAmount: number; // Absoluter Deckungsbeitrag (€)
}

export interface GaebPosition {
  id: string;
  oz: string; // Ordnungszahl z.B. 01.02.0030
  positionType?: GaebPositionType;
  shortText: string;
  longText?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  
  // Direct cost fields
  costLabor?: number;
  costMaterial?: number;
  costEquipment?: number;
  costSubcontractor?: number;

  // Rich EFB-221 calculation breakdown
  efbCalculation?: GaebEfbBreakdown;

  // Datanorm link
  linkedDatanormArticleNumber?: string;
}

export interface GaebSection {
  id: string;
  oz: string; // z.B. 01 (Gewerk), 01.02 (Titel), 01.02.03 (Untertitel)
  title: string;
  description?: string;
  subSections?: GaebSection[];
  positions: GaebPosition[];
  totalPrice?: number;
  totalLaborPrice?: number;
  totalMaterialPrice?: number;
  totalEquipmentPrice?: number;
  totalSubcontractorPrice?: number;
}

export interface GaebProjectDoc {
  projectNumber: string;
  projectName: string;
  phase: GaebPhase;
  currency: string;
  tendererName?: string;
  clientName?: string;
  creationDate?: string;
  sections: GaebSection[];
  totals?: {
    netTotal: number;
    vatPercent: number;
    vatAmount: number;
    grossTotal: number;
    laborTotal: number;
    materialTotal: number;
    equipmentTotal: number;
    subcontractorTotal: number;
    totalPositionsCount: number;
  };
}

export interface GaebCalculationConfig {
  defaultWagePerHour: number;        // Standard-Mittellohn (€/h, z.B. 52.00)
  defaultWageAddonPercent: number;   // Lohnzusatzkosten in % (z.B. 82)
  defaultLaborOverheadPercent: number; // Lohn-Gemeinkostenzuschlag in % (z.B. 15)
  defaultMaterialOverheadPercent: number; // Material-Gemeinkostenzuschlag in % (z.B. 12)
  defaultEquipmentOverheadPercent: number;// Geräte-Gemeinkostenzuschlag in % (z.B. 10)
  defaultSubconOverheadPercent: number;   // Fremdleistungszuschlag in % (z.B. 8)
  defaultAgkPercent: number;         // Allgemeine Geschäftskosten in % (z.B. 12)
  defaultBgkPercent: number;         // Baustellengemeinkosten in % (z.B. 8)
  defaultRiskAndProfitPercent: number;// Wagnis & Gewinn in % (z.B. 6.5)
  defaultVatPercent: number;         // MwSt. in % (z.B. 19)
}
