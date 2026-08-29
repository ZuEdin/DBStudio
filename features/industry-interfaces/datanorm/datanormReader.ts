import { DatanormArticle } from './datanormTypes';

export class DatanormReader {
  /**
   * Reads DATANORM 4.0/5.0 plain text and extracts articles
   */
  public static parseFileContent(content: string): DatanormArticle[] {
    const lines = content.split(/\r?\n/);
    const articles: DatanormArticle[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const recordType = line.charAt(0).toUpperCase();

      if (recordType === 'A' || line.startsWith('A;')) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          articles.push({
            articleNumber: parts[2]?.trim() || '',
            text1: parts[3]?.trim() || '',
            priceGross: parseFloat(parts[4]?.replace(',', '.') || '0') || 0,
            unit: parts[5]?.trim() || 'Stk',
          });
        }
      }
    }

    return articles;
  }
}
