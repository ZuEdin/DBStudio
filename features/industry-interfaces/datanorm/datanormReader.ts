import {
  DatanormArticle,
  DatanormDiscountTierMatrix,
  DatanormProductGroup,
  DatanormTeuerungsMatrix,
} from './datanormTypes';

export interface DatanormParsedPackage {
  articles: DatanormArticle[];
  discountGroups: DatanormDiscountTierMatrix[];
  productGroups: DatanormProductGroup[];
  teuerungsSurcharges: DatanormTeuerungsMatrix[];
  stats: {
    totalRecords: number;
    articlesCount: number;
    discountGroupsCount: number;
    productGroupsCount: number;
  };
}

export class DatanormReader {
  /**
   * Reads DATANORM 4.0 / 5.0 plain text files and extracts articles, discount matrix & product groups
   */
  public static parseFileContent(content: string): DatanormArticle[] {
    const pkg = this.parseFullPackage(content);
    return pkg.articles;
  }

  /**
   * Comprehensive parser returning articles, 10-tier discount groups, product groups and surcharges
   */
  public static parseFullPackage(content: string): DatanormParsedPackage {
    const lines = content.split(/\r?\n/);
    const articlesMap = new Map<string, DatanormArticle>();
    const discountGroups: DatanormDiscountTierMatrix[] = [];
    const productGroups: DatanormProductGroup[] = [];
    const teuerungsSurcharges: DatanormTeuerungsMatrix[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const delimiter = line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      const recordType = parts[0]?.toUpperCase();

      // Record 'A' / 'ART': Main article record
      if (recordType === 'A' || recordType === 'ART') {
        // Format A;Aktion;Artikelnr;Matchcode/Text1;Text2;Preis;Einheit;Rabattgruppe;Warengruppe
        let artNo = '';
        let text1 = '';
        let text2 = '';
        let price = 0;
        let unit = 'Stk';
        let discountGroup = '01';
        let productGroup = 'WG-01';

        if (parts.length >= 6) {
          artNo = parts[2] || parts[1] || '';
          text1 = parts[3] || '';
          price = parseFloat(parts[4]?.replace(',', '.') || '0') || 0;
          unit = parts[5] || 'Stk';
          discountGroup = parts[6] || '01';
          productGroup = parts[7] || 'WG-01';
        }

        if (artNo) {
          articlesMap.set(artNo, {
            articleNumber: artNo,
            matchcode: text1.slice(0, 15),
            text1: text1 || `Artikel ${artNo}`,
            text2,
            priceGross: price,
            unit,
            discountGroup,
            productGroup,
            teuerungGroup: /cu|kupfer|kabel/i.test(text1) ? 'TZ-CU' : /stahl|träger|bewehr/i.test(text1) ? 'TZ-STAHL' : undefined,
          });
        }
      }

      // Record 'B': Long text extension
      else if (recordType === 'B' || recordType === 'LTX') {
        const artNo = parts[2] || parts[1] || '';
        const longLine = parts[3] || '';
        if (artNo && articlesMap.has(artNo) && longLine) {
          const existing = articlesMap.get(artNo)!;
          existing.text2 = existing.text2 ? `${existing.text2} ${longLine}` : longLine;
        }
      }

      // Record 'P': Price update record
      else if (recordType === 'P' || recordType === 'PRC') {
        const artNo = parts[2] || parts[1] || '';
        const newPrice = parseFloat(parts[3]?.replace(',', '.') || '0') || 0;
        if (artNo && articlesMap.has(artNo)) {
          articlesMap.get(artNo)!.priceGross = newPrice;
        }
      }

      // Record 'RAB' / 'R': 10-tier discount group matrix
      else if (recordType === 'RAB' || recordType === 'R') {
        // Format: RAB;Rabattgruppe;Name;Tier1;Tier2;Tier3;Tier4;Tier5;Tier6;Tier7;Tier8;Tier9;Tier10
        const code = parts[1] || `RAB-${discountGroups.length + 1}`;
        const name = parts[2] || `Rabattgruppe ${code}`;
        const tiers: number[] = [];

        for (let i = 3; i < 13; i++) {
          const tVal = parseFloat(parts[i]?.replace(',', '.') || '0') || 0;
          tiers.push(tVal);
        }

        while (tiers.length < 10) tiers.push(0);

        discountGroups.push({
          groupCode: code,
          groupName: name,
          tiers,
        });
      }

      // Record 'WRG' / 'W': Product Group record
      else if (recordType === 'WRG' || recordType === 'W') {
        const code = parts[1] || `WG-${productGroups.length + 1}`;
        const desc = parts[2] || `Warengruppe ${code}`;
        productGroups.push({
          groupCode: code,
          description: desc,
          defaultDiscountGroup: parts[3] || '01',
        });
      }

      // Record 'S': Escalation / Teuerungszuschlag record
      else if (recordType === 'S' || recordType === 'TZ') {
        const code = parts[1] || `TZ-${teuerungsSurcharges.length + 1}`;
        const name = parts[2] || `Teuerungszuschlag ${code}`;
        const pct = parseFloat(parts[3]?.replace(',', '.') || '0') || 0;
        teuerungsSurcharges.push({
          code,
          name,
          percentage: pct,
        });
      }
    }

    const articles = Array.from(articlesMap.values());

    return {
      articles,
      discountGroups,
      productGroups,
      teuerungsSurcharges,
      stats: {
        totalRecords: lines.length,
        articlesCount: articles.length,
        discountGroupsCount: discountGroups.length,
        productGroupsCount: productGroups.length,
      },
    };
  }
}
