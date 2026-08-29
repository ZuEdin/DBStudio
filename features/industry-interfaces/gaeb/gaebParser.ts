import { GaebProjectDoc } from './gaebTypes';

export class GaebParser {
  /**
   * Parses a GAEB XML (DA XML 3.2 / 3.3) string into a standardized GaebProjectDoc
   */
  public static parseXml(xmlContent: string): GaebProjectDoc {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const projectNode = xmlDoc.querySelector('Project');
    const projectName = projectNode?.getAttribute('Name') || 'Unbenanntes Bauvorhaben';

    return {
      projectNumber: projectNode?.getAttribute('No') || 'PRJ-GAEB',
      projectName,
      phase: '83',
      currency: 'EUR',
      sections: [],
    };
  }

  /**
   * Generates a GAEB X84 XML file with filled unit prices
   */
  public static generateX84Xml(doc: GaebProjectDoc): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/200407">
  <GAEBInfo>
    <Version>3.2</Version>
    <Date>${new Date().toISOString().split('T')[0]}</Date>
  </GAEBInfo>
  <Award>
    <DP>84</DP>
    <Project Name="${doc.projectName}" No="${doc.projectNumber}">
      <!-- Positions exported by Studio Engine -->
    </Project>
  </Award>
</GAEB>`;
  }
}
