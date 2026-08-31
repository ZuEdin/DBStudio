import {
  GaebPosition,
  GaebSection,
  GaebProjectDoc,
  GaebCalculationConfig,
  GaebEfbBreakdown,
  GaebLaborCalculation,
  GaebMaterialCalculation,
  GaebEquipmentCalculation,
  GaebSubcontractorCalculation,
} from './gaebTypes';
import { DatanormArticle } from '../datanorm/datanormTypes';

export const DEFAULT_GAEB_CALC_CONFIG: GaebCalculationConfig = {
  defaultWagePerHour: 54.5,
  defaultWageAddonPercent: 82.0,
  defaultLaborOverheadPercent: 18.0,
  defaultMaterialOverheadPercent: 12.5,
  defaultEquipmentOverheadPercent: 10.0,
  defaultSubconOverheadPercent: 8.0,
  defaultAgkPercent: 12.0,
  defaultBgkPercent: 7.5,
  defaultRiskAndProfitPercent: 6.5,
  defaultVatPercent: 19.0,
};

export class GaebCalculationEngine {
  /**
   * Calculates a complete EFB 221 / KBO Zuschlagskalkulation for a single position
   */
  public static calculatePositionEfb(
    pos: Partial<GaebPosition>,
    config: GaebCalculationConfig = DEFAULT_GAEB_CALC_CONFIG,
    customOverrides?: {
      hoursPerUnit?: number;
      wageRatePerHour?: number;
      materialPurchasingPrice?: number;
      materialDiscountPercent?: number;
      equipmentHours?: number;
      subcontractorPrice?: number;
      riskAndProfitPercent?: number;
    }
  ): GaebEfbBreakdown {
    // 1. Labor calculation
    const wageRate = customOverrides?.wageRatePerHour ?? config.defaultWagePerHour;
    const hours = customOverrides?.hoursPerUnit ?? (pos.costLabor ? pos.costLabor / wageRate : 0.75);
    const wageWithAddon = wageRate * (1 + config.defaultWageAddonPercent / 100);
    const effectiveWagePerHour = wageWithAddon * (1 + config.defaultLaborOverheadPercent / 100);
    const totalLaborPerUnit = hours * effectiveWagePerHour;

    const labor: GaebLaborCalculation = {
      hoursPerUnit: Number(hours.toFixed(3)),
      wageRatePerHour: wageRate,
      wageAddonPercent: config.defaultWageAddonPercent,
      laborOverheadPercent: config.defaultLaborOverheadPercent,
      effectiveWagePerHour: Number(effectiveWagePerHour.toFixed(2)),
      totalLaborPerUnit: Number(totalLaborPerUnit.toFixed(2)),
    };

    // 2. Material calculation
    const matListPrice = customOverrides?.materialPurchasingPrice ?? (pos.costMaterial ? pos.costMaterial * 1.15 : 25.0);
    const matDiscount = customOverrides?.materialDiscountPercent ?? 15.0;
    const matNetPrice = matListPrice * (1 - matDiscount / 100);
    const freight = 1.5;
    const totalMaterialPerUnit = (matNetPrice + freight) * (1 + config.defaultMaterialOverheadPercent / 100);

    const material: GaebMaterialCalculation = {
      listPurchasingPrice: matListPrice,
      purchasingDiscountPercent: matDiscount,
      netPurchasingPrice: Number(matNetPrice.toFixed(2)),
      freightAndPackagingPerUnit: freight,
      materialOverheadPercent: config.defaultMaterialOverheadPercent,
      totalMaterialPerUnit: Number(totalMaterialPerUnit.toFixed(2)),
    };

    // 3. Equipment calculation
    const equipHours = customOverrides?.equipmentHours ?? (pos.costEquipment ? pos.costEquipment / 45 : 0.15);
    const equipRate = 48.0;
    const totalEquipmentPerUnit = equipHours * equipRate * (1 + config.defaultEquipmentOverheadPercent / 100);

    const equipment: GaebEquipmentCalculation = {
      equipmentRatePerHour: equipRate,
      equipmentHoursPerUnit: Number(equipHours.toFixed(3)),
      equipmentOverheadPercent: config.defaultEquipmentOverheadPercent,
      totalEquipmentPerUnit: Number(totalEquipmentPerUnit.toFixed(2)),
    };

    // 4. Subcontractor calculation
    const subconPrice = customOverrides?.subcontractorPrice ?? (pos.costSubcontractor || 0);
    const totalSubconPerUnit = subconPrice * (1 + config.defaultSubconOverheadPercent / 100);

    const subcontractor: GaebSubcontractorCalculation = {
      subcontractorPricePerUnit: subconPrice,
      subcontractorOverheadPercent: config.defaultSubconOverheadPercent,
      totalSubcontractorPerUnit: Number(totalSubconPerUnit.toFixed(2)),
    };

    // 5. Direct cost per unit (Einzelkosten der Teilleistung - EKdT)
    const directCostPerUnit = totalLaborPerUnit + totalMaterialPerUnit + totalEquipmentPerUnit + totalSubconPerUnit;

    // 6. Overheads (BGK + AGK) & Risk/Profit
    const combinedOverheadPercent = config.defaultBgkPercent + config.defaultAgkPercent;
    const costWithOverhead = directCostPerUnit * (1 + combinedOverheadPercent / 100);
    
    const riskAndProfitPercent = customOverrides?.riskAndProfitPercent ?? config.defaultRiskAndProfitPercent;
    const unitPriceNet = costWithOverhead * (1 + riskAndProfitPercent / 100);
    
    const qty = pos.quantity || 1;
    const totalPriceNet = unitPriceNet * qty;
    
    const contributionMarginAmount = (unitPriceNet - directCostPerUnit) * qty;
    const marginPercent = unitPriceNet > 0 ? ((unitPriceNet - directCostPerUnit) / unitPriceNet) * 100 : 0;

    return {
      labor,
      material,
      equipment,
      subcontractor,
      directCostPerUnit: Number(directCostPerUnit.toFixed(2)),
      overheadCostPercent: combinedOverheadPercent,
      riskAndProfitPercent,
      unitPriceNet: Number(unitPriceNet.toFixed(2)),
      totalPriceNet: Number(totalPriceNet.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(1)),
      contributionMarginAmount: Number(contributionMarginAmount.toFixed(2)),
    };
  }

  /**
   * Recalculates and aggregates an entire GAEB project tree with all sections & totals
   */
  public static recalculateProjectDoc(
    doc: GaebProjectDoc,
    config: GaebCalculationConfig = DEFAULT_GAEB_CALC_CONFIG
  ): GaebProjectDoc {
    let projectNetTotal = 0;
    let projectLaborTotal = 0;
    let projectMaterialTotal = 0;
    let projectEquipmentTotal = 0;
    let projectSubconTotal = 0;
    let positionsCount = 0;

    const updatedSections: GaebSection[] = doc.sections.map((section) => {
      let sectionNetTotal = 0;
      let sectionLabor = 0;
      let sectionMaterial = 0;
      let sectionEquipment = 0;
      let sectionSubcon = 0;

      const updatedPositions = section.positions.map((pos) => {
        positionsCount++;
        const efb = pos.efbCalculation || this.calculatePositionEfb(pos, config);
        
        const posNet = efb.totalPriceNet;
        const posLabor = efb.labor.totalLaborPerUnit * (pos.quantity || 1);
        const posMaterial = efb.material.totalMaterialPerUnit * (pos.quantity || 1);
        const posEquipment = efb.equipment.totalEquipmentPerUnit * (pos.quantity || 1);
        const posSubcon = efb.subcontractor.totalSubcontractorPerUnit * (pos.quantity || 1);

        sectionNetTotal += posNet;
        sectionLabor += posLabor;
        sectionMaterial += posMaterial;
        sectionEquipment += posEquipment;
        sectionSubcon += posSubcon;

        return {
          ...pos,
          unitPrice: efb.unitPriceNet,
          totalPrice: posNet,
          costLabor: Number(posLabor.toFixed(2)),
          costMaterial: Number(posMaterial.toFixed(2)),
          costEquipment: Number(posEquipment.toFixed(2)),
          costSubcontractor: Number(posSubcon.toFixed(2)),
          efbCalculation: efb,
        };
      });

      projectNetTotal += sectionNetTotal;
      projectLaborTotal += sectionLabor;
      projectMaterialTotal += sectionMaterial;
      projectEquipmentTotal += sectionEquipment;
      projectSubconTotal += sectionSubcon;

      return {
        ...section,
        positions: updatedPositions,
        totalPrice: Number(sectionNetTotal.toFixed(2)),
        totalLaborPrice: Number(sectionLabor.toFixed(2)),
        totalMaterialPrice: Number(sectionMaterial.toFixed(2)),
        totalEquipmentPrice: Number(sectionEquipment.toFixed(2)),
        totalSubcontractorPrice: Number(sectionSubcon.toFixed(2)),
      };
    });

    const vatPercent = config.defaultVatPercent;
    const vatAmount = projectNetTotal * (vatPercent / 100);
    const grossTotal = projectNetTotal + vatAmount;

    return {
      ...doc,
      sections: updatedSections,
      totals: {
        netTotal: Number(projectNetTotal.toFixed(2)),
        vatPercent,
        vatAmount: Number(vatAmount.toFixed(2)),
        grossTotal: Number(grossTotal.toFixed(2)),
        laborTotal: Number(projectLaborTotal.toFixed(2)),
        materialTotal: Number(projectMaterialTotal.toFixed(2)),
        equipmentTotal: Number(projectEquipmentTotal.toFixed(2)),
        subcontractorTotal: Number(projectSubconTotal.toFixed(2)),
        totalPositionsCount: positionsCount,
      },
    };
  }

  /**
   * Links a Datanorm article into a GAEB position and calculates the resulting cost price
   */
  public static linkDatanormArticleToPosition(
    pos: GaebPosition,
    article: DatanormArticle,
    config: GaebCalculationConfig = DEFAULT_GAEB_CALC_CONFIG
  ): GaebPosition {
    const listPrice = article.priceGross || article.priceNet || 10;
    const efb = this.calculatePositionEfb(pos, config, {
      materialPurchasingPrice: listPrice,
      materialDiscountPercent: 20.0,
    });

    return {
      ...pos,
      shortText: pos.shortText || article.text1,
      unit: pos.unit || article.unit || 'Stk',
      linkedDatanormArticleNumber: article.articleNumber,
      unitPrice: efb.unitPriceNet,
      totalPrice: efb.totalPriceNet,
      efbCalculation: efb,
    };
  }

  /**
   * Formats OZ strings into hierarchical components (Gewerk, Titel, Untertitel, Position)
   */
  public static parseOzHierarchy(oz: string): {
    gewerk: string;
    titel: string;
    untertitel?: string;
    posNr: string;
    formatted: string;
  } {
    const clean = oz.replace(/[^\d.]/g, '');
    const parts = clean.split('.');

    if (parts.length >= 3) {
      return {
        gewerk: parts[0].padStart(2, '0'),
        titel: parts[1].padStart(2, '0'),
        untertitel: parts.length === 4 ? parts[2].padStart(2, '0') : undefined,
        posNr: (parts[parts.length - 1] || '0010').padStart(4, '0'),
        formatted: clean,
      };
    }

    return {
      gewerk: '01',
      titel: '01',
      posNr: clean.padStart(4, '0'),
      formatted: oz,
    };
  }
}
