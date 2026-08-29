export type DatanormRecordType = 'A' | 'B' | 'P' | 'WRG' | 'RAB' | 'S';

export interface DatanormArticle {
  articleNumber: string;
  matchcode?: string;
  text1: string;
  text2?: string;
  priceGross: number;
  priceNet?: number;
  unit: string;
  discountGroup?: string;
  productGroup?: string;
}

export interface DatanormDiscountGroup {
  groupCode: string;
  discountPercent: number;
}
