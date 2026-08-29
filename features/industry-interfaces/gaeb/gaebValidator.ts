import { GaebProjectDoc, GaebSection, GaebPosition } from './gaebTypes';

export interface GaebValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'schema' | 'oz_structure' | 'missing_price' | 'bidder_text' | 'unit_standard' | 'calculation';
  oz?: string;
  positionId?: string;
  sectionId?: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  fixType?: 'fix_unit' | 'fix_price' | 'fix_oz' | 'fix_bidder_text' | 'recalc_total';
}

export interface GaebValidationResult {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: GaebValidationIssue[];
  stats: {
    totalSections: number;
    totalPositions: number;
    filledPricesCount: number;
    missingPricesCount: number;
    bidderTextComplementsCount: number;
    totalNetValue: number;
  };
}

export class GaebValidator {
  private static STANDARD_UNITS: Record<string, string> = {
    'stk': 'Stk',
    'stck': 'Stk',
    'stück': 'Stk',
    'qm': 'm²',
    'm2': 'm²',
    'cbm': 'm³',
    'm3': 'm³',
    'lfm': 'm',
    'm1': 'm',
    'meter': 'm',
    'std': 'Std',
    'h': 'Std',
    'stunden': 'Std',
    'psch': 'Psch',
    'pauschal': 'Psch',
    'kg': 'kg',
    't': 't',
    'to': 't',
    'tonne': 't',
    'l': 'l',
    'liter': 'l',
  };

  /**
   * Performs deep verification of a GAEB Document according to GAEB DA XML 3.2 / 3.3 rules
   */
  public static validate(doc: GaebProjectDoc): GaebValidationResult {
    const issues: GaebValidationIssue[] = [];
    const seenOzs = new Set<string>();

    let totalPositions = 0;
    let filledPrices = 0;
    let missingPrices = 0;
    let bidderTextsCount = 0;
    let totalNetValue = 0;

    // 1. Project Level Checks
    if (!doc.projectName || doc.projectName.trim().length === 0) {
      issues.push({
        id: 'err_proj_name',
        severity: 'error',
        category: 'schema',
        message: 'Projektbezeichnung (PrjInfo / LblPrj) ist leer oder fehlt.',
        suggestion: 'Geben Sie einen eindeutigen Projektnamen ein.',
        autoFixable: false,
      });
    }

    if (!doc.projectNumber || doc.projectNumber.trim().length === 0) {
      issues.push({
        id: 'warn_proj_no',
        severity: 'warning',
        category: 'schema',
        message: 'Projektnummer (PrjID / No) ist nicht definiert.',
        suggestion: 'Standard-Projektnummer PRJ-GAEB-01 vergeben.',
        autoFixable: true,
        fixType: 'fix_oz',
      });
    }

    if (doc.sections.length === 0) {
      issues.push({
        id: 'err_no_sections',
        severity: 'error',
        category: 'schema',
        message: 'Das Leistungsverzeichnis enthält keine Bereiche/Gewerke (BoQCtgy).',
        autoFixable: false,
      });
    }

    // 2. Sections & Positions Loop
    doc.sections.forEach((sec, sIdx) => {
      if (!sec.oz || sec.oz.trim().length === 0) {
        issues.push({
          id: `warn_sec_oz_${sec.id}`,
          severity: 'warning',
          category: 'oz_structure',
          sectionId: sec.id,
          message: `Bereich "${sec.title}" hat keine Ordnungszahl (OZ).`,
          suggestion: `Automatische OZ ${String(sIdx + 1).padStart(2, '0')} vergeben.`,
          autoFixable: true,
          fixType: 'fix_oz',
        });
      }

      sec.positions.forEach((pos, pIdx) => {
        totalPositions++;
        const posOz = pos.oz || `${sec.oz || '01'}.${String((pIdx + 1) * 10).padStart(4, '0')}`;

        // Duplicate OZ check
        if (seenOzs.has(posOz)) {
          issues.push({
            id: `err_dup_oz_${pos.id}`,
            severity: 'error',
            category: 'oz_structure',
            oz: posOz,
            positionId: pos.id,
            message: `Doppelte Ordnungszahl (OZ) "${posOz}" gefunden. Jede Position muss eindeutig sein.`,
            suggestion: 'OZ eindeutig durchnummerieren (z.B. in 10er-Schritten).',
            autoFixable: true,
            fixType: 'fix_oz',
          });
        }
        seenOzs.add(posOz);

        // OZ Structure Format check (standard GAEB 2.2.4 or 2.4.4 digits)
        const ozPattern = /^\d{2}(\.\d{2})*(\.\d{4})?$/;
        if (!ozPattern.test(posOz) && !/^\d{2,8}$/.test(posOz)) {
          issues.push({
            id: `info_oz_format_${pos.id}`,
            severity: 'info',
            category: 'oz_structure',
            oz: posOz,
            positionId: pos.id,
            message: `OZ "${posOz}" weicht von der Standard-GAEB-Maske ab (z.B. GG.TT.PPPP).`,
            autoFixable: false,
          });
        }

        // Unit Verification
        const cleanUnit = (pos.unit || '').trim().toLowerCase();
        if (cleanUnit && this.STANDARD_UNITS[cleanUnit] && this.STANDARD_UNITS[cleanUnit] !== pos.unit) {
          issues.push({
            id: `warn_unit_${pos.id}`,
            severity: 'warning',
            category: 'unit_standard',
            oz: posOz,
            positionId: pos.id,
            message: `Einheit "${pos.unit}" sollte nach GAEB/DIN EN ISO als "${this.STANDARD_UNITS[cleanUnit]}" geschrieben werden.`,
            suggestion: `In "${this.STANDARD_UNITS[cleanUnit]}" umwandeln.`,
            autoFixable: true,
            fixType: 'fix_unit',
          });
        }

        // Price Checks for Offer Phases (X84 / D84 / X86)
        const up = pos.unitPrice || 0;
        const qty = pos.quantity || 0;
        const total = pos.totalPrice || up * qty;
        totalNetValue += total;

        if (up > 0) {
          filledPrices++;
        } else {
          missingPrices++;
          if (doc.phase === '84' || doc.phase === '86') {
            issues.push({
              id: `err_price_zero_${pos.id}`,
              severity: 'error',
              category: 'missing_price',
              oz: posOz,
              positionId: pos.id,
              message: `Position ${posOz} ("${pos.shortText}") hat keinen Einheitspreis (EP = 0,00 €) im Angebot.`,
              suggestion: 'Einheitspreis erfassen oder als Freiposition / Entfällt kennzeichnen.',
              autoFixable: true,
              fixType: 'fix_price',
            });
          }
        }

        // Math Verification (Qty * UP === TotalPrice)
        const expectedTotal = Math.round(qty * up * 100) / 100;
        const actualTotal = Math.round(total * 100) / 100;
        if (up > 0 && Math.abs(expectedTotal - actualTotal) > 0.02) {
          issues.push({
            id: `warn_calc_${pos.id}`,
            severity: 'warning',
            category: 'calculation',
            oz: posOz,
            positionId: pos.id,
            message: `Rundungsdifferenz in Pos ${posOz}: Menge (${qty}) × EP (${up} €) = ${expectedTotal.toFixed(2)} €, erfasst ist ${actualTotal.toFixed(2)} €.`,
            suggestion: `Gesamtpreis auf ${expectedTotal.toFixed(2)} € synchronisieren.`,
            autoFixable: true,
            fixType: 'recalc_total',
          });
        }

        // Bietertextergänzung Checks (e.g. "Fabrikat:", "Typ:", "Hersteller:", "[.......]")
        const combinedText = `${pos.shortText} ${pos.longText || ''}`;
        const hasBidderPlaceholder = /\[\.{3,}\]|\(Bieterangabe\)|Fabrikat:\s*_{3,}|Typ:\s*_{3,}/i.test(combinedText);
        if (hasBidderPlaceholder) {
          bidderTextsCount++;
          if (doc.phase === '84' && (!pos.longText || pos.longText.includes('[...]') || pos.longText.includes('______'))) {
            issues.push({
              id: `warn_bidder_text_${pos.id}`,
              severity: 'warning',
              category: 'bidder_text',
              oz: posOz,
              positionId: pos.id,
              message: `Position ${posOz} erfordert eine Bietertextergänzung (Fabrikat/Typ), die noch unausgefüllte Platzhalter enthält.`,
              suggestion: 'Hersteller- und Typenbezeichnung im Langtext eintragen.',
              autoFixable: true,
              fixType: 'fix_bidder_text',
            });
          }
        }
      });
    });

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    return {
      isValid: errorCount === 0,
      errorCount,
      warningCount,
      infoCount,
      issues,
      stats: {
        totalSections: doc.sections.length,
        totalPositions,
        filledPricesCount: filledPrices,
        missingPricesCount: missingPrices,
        bidderTextComplementsCount: bidderTextsCount,
        totalNetValue,
      },
    };
  }

  /**
   * Automatically repairs common issues in a GAEB Document
   */
  public static autoFixAll(doc: GaebProjectDoc): GaebProjectDoc {
    const fixedDoc: GaebProjectDoc = JSON.parse(JSON.stringify(doc));

    if (!fixedDoc.projectNumber) fixedDoc.projectNumber = 'PRJ-GAEB-AUTO';

    fixedDoc.sections.forEach((sec, sIdx) => {
      if (!sec.oz) sec.oz = String(sIdx + 1).padStart(2, '0');

      sec.positions.forEach((pos, pIdx) => {
        // Fix OZ
        if (!pos.oz || pos.oz.trim().length === 0) {
          pos.oz = `${sec.oz}.${String((pIdx + 1) * 10).padStart(4, '0')}`;
        }

        // Standardize Unit
        const cleanUnit = (pos.unit || '').trim().toLowerCase();
        if (cleanUnit && this.STANDARD_UNITS[cleanUnit]) {
          pos.unit = this.STANDARD_UNITS[cleanUnit];
        }

        // Recalculate TotalPrice
        if (pos.unitPrice && pos.quantity) {
          pos.totalPrice = Math.round(pos.unitPrice * pos.quantity * 100) / 100;
        }

        // Fix unresolved bidder placeholder
        if (pos.longText && (pos.longText.includes('[...]') || pos.longText.includes('______'))) {
          pos.longText = pos.longText.replace(/\[\.\.\.\]/g, 'Fabrikat: Qualitätshersteller DIN-Geprüft');
        }
      });

      sec.totalPrice = sec.positions.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
    });

    return fixedDoc;
  }
}
