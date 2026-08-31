import {
  DatanormArticle,
  DatanormDiscountTierMatrix,
  DatanormTeuerungsMatrix,
  DatanormPositionCalculation,
} from './datanormTypes';

export const DEFAULT_DISCOUNT_TIERS: DatanormDiscountTierMatrix[] = [
  {
    groupCode: '01',
    groupName: 'Sanitär & Rohre (Standard)',
    tiers: [30, 5, 2.5, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    groupCode: '02',
    groupName: 'Heizung & Kesseltechnik',
    tiers: [25, 4, 3, 1.5, 0, 0, 0, 0, 0, 0],
  },
  {
    groupCode: '03',
    groupName: 'Elektro & Installation',
    tiers: [35, 7.5, 3, 2, 1, 0, 0, 0, 0, 0],
  },
  {
    groupCode: '04',
    groupName: 'Baustoffe & Schüttgüter',
    tiers: [18, 2.5, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    groupCode: '05',
    groupName: 'Dach & Holzwerkstoffe',
    tiers: [22, 5, 2, 0, 0, 0, 0, 0, 0, 0],
  },
];

export const DEFAULT_TEUERUNGS_MATRIX: DatanormTeuerungsMatrix[] = [
  {
    code: 'TZ-CU',
    name: 'Kupfer-Rohstoffzuschlag (DEL)',
    percentage: 14.5,
    basePrice: 150,
    currentPrice: 890,
  },
  {
    code: 'TZ-STAHL',
    name: 'Stahl- und Bewehrungszuschlag',
    percentage: 9.8,
    basePrice: 500,
    currentPrice: 780,
  },
  {
    code: 'TZ-ENERGIE',
    name: 'Energie- und Frachtteuerungszuschlag',
    percentage: 4.2,
  },
];

export class DatanormCalculationEngine {
  /**
   * Computes compound discount factor across up to 10 discount tiers
   */
  public static calculateCompoundDiscount(tiers: number[]): {
    discountMultiplier: number;
    combinedDiscountPercent: number;
  } {
    let multiplier = 1.0;
    for (let i = 0; i < 10; i++) {
      const discount = tiers[i] || 0;
      if (discount > 0) {
        multiplier *= 1 - discount / 100;
      }
    }
    const combinedDiscountPercent = Math.round((1 - multiplier) * 10000) / 100;
    return {
      discountMultiplier: multiplier,
      combinedDiscountPercent,
    };
  }

  /**
   * Calculates comprehensive purchasing costs, escalation surcharges, and selling prices
   */
  public static calculatePosition(
    article: DatanormArticle,
    quantity: number = 1,
    tierMatrixMap: Record<string, DatanormDiscountTierMatrix>,
    teuerungsMap: Record<string, DatanormTeuerungsMatrix>,
    customMarginPercent: number = 30
  ): DatanormPositionCalculation {
    const gross = article.priceGross || 0;
    const groupKey = article.discountGroup || '01';
    const discountGroup = tierMatrixMap[groupKey] || DEFAULT_DISCOUNT_TIERS[0];
    const tiers = discountGroup.tiers || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // 1. Calculate compound discount net purchase price
    const { discountMultiplier, combinedDiscountPercent } = this.calculateCompoundDiscount(tiers);
    const priceNetPurchasing = Math.round(gross * discountMultiplier * 100) / 100;

    // 2. Calculate Escalation Surcharge (Teuerungszuschlag)
    let teuerungPercent = 0;
    if (article.teuerungGroup && teuerungsMap[article.teuerungGroup]) {
      teuerungPercent = teuerungsMap[article.teuerungGroup].percentage || 0;
    }

    const teuerungAmount = Math.round(((priceNetPurchasing * teuerungPercent) / 100) * 100) / 100;
    const effectivePurchasingCost = Math.round((priceNetPurchasing + teuerungAmount) * 100) / 100;

    // 3. Calculate Selling Price (VK-Netto)
    const marginMultiplier = 1 + customMarginPercent / 100;
    const unitPriceSellingNet = Math.round(effectivePurchasingCost * marginMultiplier * 100) / 100;
    const totalPriceSellingNet = Math.round(unitPriceSellingNet * quantity * 100) / 100;

    return {
      articleNumber: article.articleNumber,
      description: article.text1,
      quantity,
      unit: article.unit || 'Stk',
      priceGross: gross,
      appliedTiers: tiers,
      combinedDiscountPercent,
      priceNetPurchasing,
      teuerungPercent,
      teuerungAmount,
      effectivePurchasingCost,
      marginPercent: customMarginPercent,
      unitPriceSellingNet,
      totalPriceSellingNet,
    };
  }
}
