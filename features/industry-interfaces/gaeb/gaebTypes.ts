export type GaebPhase = '81' | '82' | '83' | '84' | '85' | '86';

export interface GaebPosition {
  id: string;
  oz: string; // Ordnungszahl z.B. 01.02.0030
  shortText: string;
  longText?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  costLabor?: number;
  costMaterial?: number;
  costEquipment?: number;
  costSubcontractor?: number;
}

export interface GaebSection {
  id: string;
  oz: string; // z.B. 01 (Gewerk), 01.02 (Titel)
  title: string;
  subSections?: GaebSection[];
  positions: GaebPosition[];
  totalPrice?: number;
}

export interface GaebProjectDoc {
  projectNumber: string;
  projectName: string;
  phase: GaebPhase;
  currency: string;
  sections: GaebSection[];
}
