import { GaebProjectDoc, GaebSection, GaebPosition, GaebPhase } from './gaebTypes';
import { GaebCalculationEngine } from './gaebCalculationEngine';

export class GaebParser {
  /**
   * Parses a GAEB XML (DA XML 3.2 / 3.3) string or GAEB 90 text into a standardized GaebProjectDoc
   */
  public static parse(rawContent: string): GaebProjectDoc {
    const trimmed = rawContent.trim();
    let doc: GaebProjectDoc;
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<GAEB')) {
      doc = this.parseXml(trimmed);
    } else {
      doc = this.parseGaeb90Text(trimmed);
    }
    return GaebCalculationEngine.recalculateProjectDoc(doc);
  }

  /**
   * Parses a GAEB XML (DA XML 3.2 / 3.3) document
   */
  public static parseXml(xmlContent: string): GaebProjectDoc {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const projectNode = xmlDoc.querySelector('Project') || xmlDoc.querySelector('PrjInfo');
    const projectName = projectNode?.getAttribute('Name') || projectNode?.querySelector('LblPrj')?.textContent || 'GAEB Leistungsverzeichnis';
    const projectNumber = projectNode?.getAttribute('No') || projectNode?.querySelector('PrjID')?.textContent || 'PRJ-GAEB';
    
    // Detect phase
    const dpNode = xmlDoc.querySelector('DP');
    const phase = (dpNode?.textContent?.trim() as GaebPhase) || '83';

    const sections: GaebSection[] = [];

    // Parse BoQ Categories / Sections
    const catNodes = xmlDoc.querySelectorAll('BoQCtgy');
    if (catNodes.length > 0) {
      catNodes.forEach((catNode, idx) => {
        const oz = catNode.querySelector('LblBoQCtgy')?.textContent || `0${idx + 1}`;
        const title = catNode.querySelector('Text')?.textContent || catNode.querySelector('OutlnText')?.textContent || `Titel ${oz}`;
        const positions: GaebPosition[] = [];

        catNode.querySelectorAll('Item').forEach((itemNode, itemIdx) => {
          const itemOz = itemNode.querySelector('OZ')?.textContent || itemNode.querySelector('LblItem')?.textContent || `${oz}.${String(itemIdx + 1).padStart(4, '0')}`;
          const shortText = itemNode.querySelector('OutlnText')?.textContent || itemNode.querySelector('Text')?.textContent || 'Position';
          const longText = itemNode.querySelector('Text')?.textContent || '';
          const qty = parseFloat(itemNode.querySelector('Qty')?.textContent || '1') || 1;
          const unit = itemNode.querySelector('QU')?.textContent || 'Stk';
          const up = parseFloat(itemNode.querySelector('UP')?.textContent || '0') || 0;
          const total = parseFloat(itemNode.querySelector('IT')?.textContent || itemNode.querySelector('TotalPrice')?.textContent || '0') || qty * up;

          positions.push({
            id: `pos_${oz}_${itemIdx + 1}`,
            oz: itemOz,
            shortText,
            longText,
            quantity: qty,
            unit,
            unitPrice: up,
            totalPrice: total,
            costLabor: up * 0.4,
            costMaterial: up * 0.35,
            costEquipment: up * 0.15,
            costSubcontractor: up * 0.1,
          });
        });

        sections.push({
          id: `sec_${idx + 1}`,
          oz,
          title,
          positions,
          totalPrice: positions.reduce((acc, p) => acc + (p.totalPrice || 0), 0),
        });
      });
    } else {
      // Flat list of items fallback
      const flatPositions: GaebPosition[] = [];
      xmlDoc.querySelectorAll('Item').forEach((itemNode, itemIdx) => {
        const itemOz = itemNode.querySelector('OZ')?.textContent || `01.01.${String(itemIdx + 1).padStart(4, '0')}`;
        const shortText = itemNode.querySelector('OutlnText')?.textContent || itemNode.querySelector('Text')?.textContent || 'Position';
        const qty = parseFloat(itemNode.querySelector('Qty')?.textContent || '1') || 1;
        const unit = itemNode.querySelector('QU')?.textContent || 'm²';
        const up = parseFloat(itemNode.querySelector('UP')?.textContent || '0') || 0;

        flatPositions.push({
          id: `pos_${itemIdx + 1}`,
          oz: itemOz,
          shortText,
          quantity: qty,
          unit,
          unitPrice: up,
          totalPrice: qty * up,
        });
      });

      sections.push({
        id: 'sec_1',
        oz: '01',
        title: 'Hauptgewerk',
        positions: flatPositions,
        totalPrice: flatPositions.reduce((acc, p) => acc + (p.totalPrice || 0), 0),
      });
    }

    return {
      projectNumber,
      projectName,
      phase,
      currency: 'EUR',
      sections,
    };
  }

  /**
   * Fallback parser for GAEB 90 fixed-length text files (D83 / D84)
   */
  public static parseGaeb90Text(text: string): GaebProjectDoc {
    const lines = text.split(/\r?\n/);
    const sections: GaebSection[] = [];
    let currentSection: GaebSection = {
      id: 'sec_1',
      oz: '01',
      title: 'Bauabschnitt 01',
      positions: [],
    };
    sections.push(currentSection);

    let posCounter = 1;
    for (const line of lines) {
      if (line.startsWith('25') || line.startsWith('26')) {
        // Section Header in GAEB 90
        const title = line.substring(9).trim() || `Titel ${posCounter}`;
        currentSection = {
          id: `sec_${sections.length + 1}`,
          oz: String(sections.length + 1).padStart(2, '0'),
          title,
          positions: [],
        };
        sections.push(currentSection);
      } else if (line.startsWith('27') || line.startsWith('28')) {
        // Position line
        const oz = line.substring(2, 11).trim() || `01.${String(posCounter).padStart(4, '0')}`;
        const shortText = line.substring(15, 60).trim() || `Position ${posCounter}`;
        const unit = line.substring(60, 64).trim() || 'Stk';
        const qty = parseFloat(line.substring(64, 75).trim()) || 1;
        const up = parseFloat(line.substring(75, 85).trim()) || 0;

        currentSection.positions.push({
          id: `pos_g90_${posCounter}`,
          oz,
          shortText,
          quantity: qty,
          unit,
          unitPrice: up,
          totalPrice: qty * up,
        });
        posCounter++;
      }
    }

    return {
      projectNumber: 'PRJ-GAEB90',
      projectName: 'Importiertes GAEB 90 Leistungsverzeichnis',
      phase: '83',
      currency: 'EUR',
      sections: sections.filter((s) => s.positions.length > 0),
    };
  }

  /**
   * Generates a GAEB X84 XML file with filled unit prices
   */
  public static generateX84Xml(doc: GaebProjectDoc): string {
    const sectionsXml = doc.sections
      .map(
        (sec) => `
      <BoQCtgy ID="${sec.id}" RNoPart="${sec.oz}">
        <LblBoQCtgy>${sec.oz}</LblBoQCtgy>
        <OutlnText>
          <TextOutlTxt>
            <span>${sec.title}</span>
          </TextOutlTxt>
        </OutlnText>
        <BoQBody>
          <Itemlist>
            ${sec.positions
              .map(
                (pos) => `
            <Item ID="${pos.id}" RNoPart="${pos.oz.split('.').pop() || '0010'}">
              <OZ>${pos.oz}</OZ>
              <OutlnText>
                <TextOutlTxt>
                  <span>${pos.shortText}</span>
                </TextOutlTxt>
              </OutlnText>
              <Qty>${pos.quantity}</Qty>
              <QU>${pos.unit}</QU>
              <UP>${(pos.unitPrice || 0).toFixed(2)}</UP>
              <IT>${(pos.totalPrice || (pos.quantity * (pos.unitPrice || 0))).toFixed(2)}</IT>
            </Item>`
              )
              .join('')}
          </Itemlist>
        </BoQBody>
      </BoQCtgy>`
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/200407">
  <GAEBInfo>
    <Version>3.2</Version>
    <Date>${new Date().toISOString().split('T')[0]}</Date>
    <ProgName>DB Studio Pro</ProgName>
  </GAEBInfo>
  <Award>
    <DP>84</DP>
    <Project Name="${doc.projectName}" No="${doc.projectNumber}">
      <BoQ ID="BOQ_MAIN">
        <BoQBody>
          ${sectionsXml}
        </BoQBody>
      </BoQ>
    </Project>
  </Award>
</GAEB>`;
  }
}

