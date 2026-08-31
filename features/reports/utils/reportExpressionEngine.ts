/**
 * Access-Grade Report Expression Evaluation Engine
 * Supports standard MS Access aggregate functions and dynamic page/date expressions:
 * - =Summe([Feld]) / =SUM([Feld])
 * - =Mittelwert([Feld]) / =AVG([Feld])
 * - =Anzahl([Feld]) / =COUNT([Feld])
 * - =Min([Feld]) / =Max([Feld])
 * - ="Seite " & [Seite] & " von " & [Seiten] (Page X of Y)
 * - =Datum() / =Jetzt() / =Format(Jetzt(), "DD.MM.YYYY")
 * - =[Menge] * [Einzelpreis]
 */

export interface ExpressionContext {
  pageNumber?: number;
  totalPages?: number;
  currentDate?: Date;
  groupItems?: Record<string, any>[];
  allItems?: Record<string, any>[];
  currentItem?: Record<string, any>;
  currencySymbol?: string;
}

export class ReportExpressionEngine {
  /**
   * Evaluates an expression string against data context
   */
  public static evaluate(expr: string, context: ExpressionContext = {}): string | number {
    if (!expr) return '';
    const trimmed = String(expr).trim();
    if (!trimmed.startsWith('=')) {
      return trimmed;
    }

    const content = trimmed.substring(1).trim();

    // 1. Page Number Expressions: ="Seite " & [Seite] & " von " & [Seiten] or "Page " & [Page]
    if (/\[seite\]|\[seiten\]|\[page\]|\[pages\]/i.test(content)) {
      return this.evaluatePageExpression(content, context);
    }

    // 2. Date / Time Expressions: =Datum() | =Jetzt() | =Date() | =Now()
    if (/^(datum|jetzt|date|now)\(\)/i.test(content)) {
      const now = context.currentDate || new Date();
      return now.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    // 3. Aggregate Functions: =Summe([Feld]), =Mittelwert([Feld]), =Anzahl([Feld]), =Min([Feld]), =Max([Feld])
    const aggMatch = content.match(/^(summe|sum|mittelwert|avg|anzahl|count|min|max)\s*\(\s*\[?([a-zA-Z0-9_.]+)\]?\s*\)/i);
    if (aggMatch) {
      const funcName = aggMatch[1].toLowerCase();
      const fieldName = aggMatch[2];
      const dataSet = context.groupItems || context.allItems || [];
      return this.evaluateAggregate(funcName, fieldName, dataSet, context.currencySymbol);
    }

    // 4. Arithmetic on Current Record: =[Menge] * [Einzelpreis]
    if (context.currentItem && /\[[a-zA-Z0-9_.]+\]/.test(content)) {
      return this.evaluateRecordMath(content, context.currentItem);
    }

    return content;
  }

  private static evaluatePageExpression(expr: string, ctx: ExpressionContext): string {
    const pNum = ctx.pageNumber || 1;
    const tPages = ctx.totalPages || 1;

    let res = expr;
    // Replace [Seite] / [Page]
    res = res.replace(/\[seite\]|\[page\]/gi, String(pNum));
    // Replace [Seiten] / [Pages]
    res = res.replace(/\[seiten\]|\[pages\]/gi, String(tPages));

    // Handle string concatenations with & or +
    const parts = res.split(/\s*&\s*|\s*\+\s*/);
    if (parts.length > 1) {
      return parts
        .map((p) => {
          const stripped = p.trim().replace(/^["']|["']$/g, '');
          return stripped;
        })
        .join('');
    }

    return res.replace(/^["']|["']$/g, '');
  }

  private static evaluateAggregate(
    func: string,
    field: string,
    items: Record<string, any>[],
    currencySymbol?: string
  ): string {
    if (!items || items.length === 0) {
      return func.startsWith('anzahl') || func === 'count' ? '0' : '0,00 €';
    }

    const values = items
      .map((item) => {
        const raw = item[field] !== undefined ? item[field] : this.fuzzyLookup(item, field);
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
        return isNaN(num) ? null : num;
      })
      .filter((v): v is number => v !== null);

    let resultNum = 0;
    const isCount = func === 'anzahl' || func === 'count';

    switch (func) {
      case 'summe':
      case 'sum':
        resultNum = values.reduce((acc, v) => acc + v, 0);
        break;
      case 'mittelwert':
      case 'avg':
        resultNum = values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
        break;
      case 'anzahl':
      case 'count':
        return String(items.length);
      case 'min':
        resultNum = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        resultNum = values.length > 0 ? Math.max(...values) : 0;
        break;
      default:
        resultNum = 0;
    }

    return this.formatGermanCurrency(resultNum, currencySymbol);
  }

  private static evaluateRecordMath(expr: string, item: Record<string, any>): string | number {
    try {
      const sanitized = expr.replace(/\[([a-zA-Z0-9_.]+)\]/g, (_, fieldName) => {
        const val = item[fieldName] !== undefined ? item[fieldName] : this.fuzzyLookup(item, fieldName);
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
        return isNaN(num) ? '0' : String(num);
      });

      // Safe arithmetic evaluator
      if (/^[0-9+\-*/().\s]+$/.test(sanitized)) {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${sanitized});`);
        const res = fn();
        return typeof res === 'number' ? this.formatGermanNumber(res) : res;
      }
    } catch (_) {}

    return expr;
  }

  private static fuzzyLookup(item: Record<string, any>, field: string): any {
    const lField = field.toLowerCase();
    for (const key of Object.keys(item)) {
      if (key.toLowerCase() === lField || key.toLowerCase().endsWith('.' + lField)) {
        return item[key];
      }
    }
    return undefined;
  }

  public static formatGermanNumber(num: number): string {
    return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  public static formatGermanCurrency(num: number, symbol: string = '€'): string {
    return `${this.formatGermanNumber(num)} ${symbol}`;
  }
}
