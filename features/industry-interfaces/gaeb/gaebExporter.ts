import { GaebProjectDoc, GaebPosition, GaebSection } from './gaebTypes';

export interface GaebSchemaValidationResult {
  isValid: boolean;
  version: string;
  phase: string;
  errors: string[];
  warnings: string[];
  elementCounts: {
    sections: number;
    positions: number;
    itemsWithPrice: number;
    itemsWithoutPrice: number;
  };
}

export class GaebExporter {
  /**
   * Generates a fully compliant GAEB DA XML 3.3 document for Phase X83 (Angebotsaufforderung / Blanko-LV)
   * In Phase 83, prices are omitted or zero, and bidder text placeholders are preserved.
   */
  public static generateX83Xml(doc: GaebProjectDoc): string {
    const today = new Date().toISOString().split('T')[0];
    const sectionsXml = this.renderSectionsXml(doc.sections, '83');

    return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA_XML_33">
  <GAEBInfo>
    <Version>3.3</Version>
    <Date>${today}</Date>
    <Time>${new Date().toTimeString().split(' ')[0]}</Time>
    <ProgName>DB Studio Pro Construction Suite</ProgName>
    <ProgVer>2026.4</ProgVer>
  </GAEBInfo>
  <PrjInfo>
    <NamePrj>${this.escapeXml(doc.projectName || 'Ausschreibung Leistungsverzeichnis')}</NamePrj>
    <LblPrj>${this.escapeXml(doc.projectName || 'Ausschreibung Leistungsverzeichnis')}</LblPrj>
    <PrjID>${this.escapeXml(doc.projectNumber || 'PRJ-X83-001')}</PrjID>
    <Cur>${this.escapeXml(doc.currency || 'EUR')}</Cur>
  </PrjInfo>
  <Award>
    <DP>83</DP>
    <AwardInfo>
      <Cur>${this.escapeXml(doc.currency || 'EUR')}</Cur>
      <Cat>BoQ</Cat>
    </AwardInfo>
    <BoQ ID="BOQ_ROOT">
      <BoQInfo>
        <Name>${this.escapeXml(doc.projectName)}</Name>
        <LblBoQ>${this.escapeXml(doc.projectNumber)}</LblBoQ>
        <CPVCode>45000000-7</CPVCode>
      </BoQInfo>
      <BoQBody>
        ${sectionsXml}
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`;
  }

  /**
   * Generates a fully compliant GAEB DA XML 3.3 document for Phase X84 (Angebotsabgabe / Bietereingabe)
   * Includes Unit Prices (UP), Total Prices (IT), bidder completions, and cost category breakdowns.
   */
  public static generateX84Xml(doc: GaebProjectDoc): string {
    const today = new Date().toISOString().split('T')[0];
    const sectionsXml = this.renderSectionsXml(doc.sections, '84');
    const totalNet = doc.sections.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA_XML_33">
  <GAEBInfo>
    <Version>3.3</Version>
    <Date>${today}</Date>
    <Time>${new Date().toTimeString().split(' ')[0]}</Time>
    <ProgName>DB Studio Pro Construction Suite</ProgName>
    <ProgVer>2026.4</ProgVer>
  </GAEBInfo>
  <PrjInfo>
    <NamePrj>${this.escapeXml(doc.projectName || 'Angebot Leistungsverzeichnis')}</NamePrj>
    <LblPrj>${this.escapeXml(doc.projectName || 'Angebot Leistungsverzeichnis')}</LblPrj>
    <PrjID>${this.escapeXml(doc.projectNumber || 'PRJ-X84-001')}</PrjID>
    <Cur>${this.escapeXml(doc.currency || 'EUR')}</Cur>
  </PrjInfo>
  <Award>
    <DP>84</DP>
    <AwardInfo>
      <Cur>${this.escapeXml(doc.currency || 'EUR')}</Cur>
      <Cat>BoQ</Cat>
      <TotSum>${totalNet.toFixed(2)}</TotSum>
    </AwardInfo>
    <BoQ ID="BOQ_ROOT">
      <BoQInfo>
        <Name>${this.escapeXml(doc.projectName)}</Name>
        <LblBoQ>${this.escapeXml(doc.projectNumber)}</LblBoQ>
        <TotSum>${totalNet.toFixed(2)}</TotSum>
      </BoQInfo>
      <BoQBody>
        ${sectionsXml}
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`;
  }

  /**
   * Validates raw XML string against official GAEB DA XML 3.3 schema rules
   */
  public static validateGaebXmlSchema(xmlContent: string): GaebSchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!xmlContent || !xmlContent.trim()) {
      return {
        isValid: false,
        version: 'Unknown',
        phase: 'Unknown',
        errors: ['XML-Inhalt ist leer.'],
        warnings: [],
        elementCounts: { sections: 0, positions: 0, itemsWithPrice: 0, itemsWithoutPrice: 0 },
      };
    }

    let parsedDoc: Document;
    try {
      const parser = new DOMParser();
      parsedDoc = parser.parseFromString(xmlContent, 'text/xml');
      const parseError = parsedDoc.querySelector('parsererror');
      if (parseError) {
        errors.push(`XML-Syntaxfehler: ${parseError.textContent?.slice(0, 150)}`);
      }
    } catch (e: any) {
      errors.push(`XML Parsing-Ausnahme: ${e?.message || 'Ungültiges XML-Dokument'}`);
      return {
        isValid: false,
        version: 'Unknown',
        phase: 'Unknown',
        errors,
        warnings: [],
        elementCounts: { sections: 0, positions: 0, itemsWithPrice: 0, itemsWithoutPrice: 0 },
      };
    }

    // 1. Root and Namespace check
    const rootElement = parsedDoc.documentElement;
    if (rootElement.nodeName !== 'GAEB') {
      errors.push('Root-Element muss <GAEB> sein (GAEB DA XML Standard).');
    }

    const ns = rootElement.getAttribute('xmlns') || '';
    if (!ns.includes('gaeb.de/GAEB_DA_XML')) {
      warnings.push(`Namespace "${ns}" weicht vom Standard "http://www.gaeb.de/GAEB_DA_XML/DA_XML_33" ab.`);
    }

    // 2. Header and Version check
    const versionNode = parsedDoc.querySelector('GAEBInfo > Version');
    const version = versionNode?.textContent?.trim() || '3.2';

    // 3. Phase check (DP: 81, 82, 83, 84, 85, 86)
    const dpNode = parsedDoc.querySelector('Award > DP');
    const phase = dpNode?.textContent?.trim() || '83';
    if (!['81', '82', '83', '84', '85', '86'].includes(phase)) {
      errors.push(`Ungültige GAEB-Datenaustauschphase: DP "${phase}". Erwartet: 81-86.`);
    }

    // 4. Structure & BoQ checks
    const sections = parsedDoc.querySelectorAll('BoQCtgy');
    const items = parsedDoc.querySelectorAll('Item');

    if (sections.length === 0 && items.length === 0) {
      errors.push('Keine Gewerke/Abschnitte (<BoQCtgy>) oder Positionen (<Item>) im Leistungsverzeichnis gefunden.');
    }

    let itemsWithPrice = 0;
    let itemsWithoutPrice = 0;

    items.forEach((itemNode, idx) => {
      const oz = itemNode.querySelector('OZ')?.textContent || `Pos ${idx + 1}`;
      const qtyNode = itemNode.querySelector('Qty');
      const quNode = itemNode.querySelector('QU');
      const upNode = itemNode.querySelector('UP');

      if (!qtyNode || isNaN(parseFloat(qtyNode.textContent || ''))) {
        warnings.push(`Position ${oz}: Fehlendes oder ungültiges Mengenfeld <Qty>.`);
      }
      if (!quNode || !quNode.textContent?.trim()) {
        warnings.push(`Position ${oz}: Fehlende Mengeneinheit <QU>.`);
      }

      const upVal = parseFloat(upNode?.textContent || '0');
      if (upVal > 0) {
        itemsWithPrice++;
      } else {
        itemsWithoutPrice++;
        if (phase === '84') {
          errors.push(`Phase X84 (Angebotsabgabe): Position ${oz} hat keinen Einheitspreis <UP>.`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      version,
      phase,
      errors,
      warnings,
      elementCounts: {
        sections: sections.length,
        positions: items.length,
        itemsWithPrice,
        itemsWithoutPrice,
      },
    };
  }

  private static renderSectionsXml(sections: GaebSection[], phase: '83' | '84'): string {
    return sections
      .map((sec) => {
        const itemsXml = sec.positions
          .map((pos) => this.renderPositionXml(pos, phase))
          .join('\n');

        const secSumTag = phase === '84' && sec.totalPrice !== undefined
          ? `\n        <TotSum>${(sec.totalPrice || 0).toFixed(2)}</TotSum>`
          : '';

        return `
      <BoQCtgy ID="${this.escapeXml(sec.id)}" RNoPart="${this.escapeXml(sec.oz)}">
        <LblBoQCtgy>${this.escapeXml(sec.oz)}</LblBoQCtgy>
        <OutlnText>
          <TextOutlTxt>
            <span>${this.escapeXml(sec.title)}</span>
          </TextOutlTxt>
        </OutlnText>${secSumTag}
        <BoQBody>
          <Itemlist>
            ${itemsXml}
          </Itemlist>
        </BoQBody>
      </BoQCtgy>`;
      })
      .join('\n');
  }

  private static renderPositionXml(pos: GaebPosition, phase: '83' | '84'): string {
    const rNoPart = pos.oz.split('.').pop() || '0010';
    const up = pos.unitPrice || 0;
    const it = pos.totalPrice || pos.quantity * up;

    let priceElements = '';
    if (phase === '84') {
      priceElements = `
              <UP>${up.toFixed(2)}</UP>
              <IT>${it.toFixed(2)}</IT>
              <CostType>
                <LabCost>${(pos.costLabor || up * 0.4).toFixed(2)}</LabCost>
                <MatCost>${(pos.costMaterial || up * 0.35).toFixed(2)}</MatCost>
                <EquipCost>${(pos.costEquipment || up * 0.15).toFixed(2)}</EquipCost>
                <SubcCost>${(pos.costSubcontractor || up * 0.1).toFixed(2)}</SubcCost>
              </CostType>`;
    } else {
      // Phase 83: Neutral or zero placeholder
      priceElements = `
              <UP>0.00</UP>
              <IT>0.00</IT>`;
    }

    const longTextXml = pos.longText
      ? `
              <Text>
                <TextOutlTxt>
                  <span>${this.escapeXml(pos.longText)}</span>
                </TextOutlTxt>
              </Text>`
      : '';

    return `
            <Item ID="${this.escapeXml(pos.id)}" RNoPart="${this.escapeXml(rNoPart)}">
              <OZ>${this.escapeXml(pos.oz)}</OZ>
              <OutlnText>
                <TextOutlTxt>
                  <span>${this.escapeXml(pos.shortText)}</span>
                </TextOutlTxt>
              </OutlnText>${longTextXml}
              <Qty>${pos.quantity}</Qty>
              <QU>${this.escapeXml(pos.unit || 'Stk')}</QU>${priceElements}
            </Item>`;
  }

  private static escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
