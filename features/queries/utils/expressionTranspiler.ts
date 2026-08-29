/**
 * Access to ANSI SQL Expression & Function Transpiler
 * Supports Access formulas like Nz(), IIf(), DateDiff(), Format() and Construction-specific formulas
 */

export const transpileExpression = (expr: string, dialect: 'SQLITE' | 'POSTGRES' | 'MYSQL' | 'MSSQL' = 'SQLITE'): string => {
  if (!expr || !expr.trim()) return '';

  let res = expr;

  // 1. Convert Nz(field, fallback) -> COALESCE(field, fallback)
  res = res.replace(/\bNz\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi, 'COALESCE($1, $2)');
  res = res.replace(/\bNz\s*\(\s*([^)]+?)\s*\)/gi, "COALESCE($1, '')");

  // 2. Convert IIf(cond, trueVal, falseVal) -> CASE WHEN cond THEN trueVal ELSE falseVal END
  res = res.replace(/\bIIf\s*\(\s*(.*?)\s*,\s*(.*?)\s*,\s*(.*?)\s*\)/gi, (_match, p1, p2, p3) => {
    return `CASE WHEN ${p1.trim()} THEN ${p2.trim()} ELSE ${p3.trim()} END`;
  });

  // 3. Convert ROUND_CURRENCY(val) -> ROUND(val, 2)
  res = res.replace(/\bROUND_CURRENCY\s*\(\s*(.*?)\s*\)/gi, 'ROUND($1, 2)');

  // 4. Convert SUM_CURRENCY(val) -> ROUND(SUM(val), 2)
  res = res.replace(/\bSUM_CURRENCY\s*\(\s*(.*?)\s*\)/gi, 'ROUND(SUM($1), 2)');

  // 5. DateDiff('d', Start, Ende) -> dialect specific
  res = res.replace(/\bDateDiff\s*\(\s*['"]d['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (_match, start, end) => {
    if (dialect === 'POSTGRES') {
      return `DATE_PART('day', ${end.trim()} - ${start.trim()})`;
    } else if (dialect === 'MSSQL') {
      return `DATEDIFF(day, ${start.trim()}, ${end.trim()})`;
    } else if (dialect === 'MYSQL') {
      return `DATEDIFF(${end.trim()}, ${start.trim()})`;
    }
    // SQLite: julianday(end) - julianday(start)
    return `(julianday(${end.trim()}) - julianday(${start.trim()}))`;
  });

  // 6. Format(date, 'yyyy-mm-dd')
  res = res.replace(/\bFormat\s*\(\s*([^,]+)\s*,\s*['"]yyyy-mm-dd['"]\s*\)/gi, (_match, dt) => {
    if (dialect === 'POSTGRES') return `TO_CHAR(${dt.trim()}, 'YYYY-MM-DD')`;
    if (dialect === 'MSSQL') return `FORMAT(${dt.trim()}, 'yyyy-MM-dd')`;
    if (dialect === 'MYSQL') return `DATE_FORMAT(${dt.trim()}, '%Y-%m-%d')`;
    return `STRFTIME('%Y-%m-%d', ${dt.trim()})`;
  });

  return res;
};

/**
 * Common Construction & Calculation Formulas Catalog
 */
export interface FormulaTemplate {
  name: string;
  category: 'Bau & Kalkulation' | 'Finanzen & Rechnungen' | 'Access-Migration' | 'Analytik & Fenster';
  template: string;
  description: string;
}

export const FORMULA_TEMPLATES: FormulaTemplate[] = [
  {
    name: 'Gesamtpreis Netto (Menge * EP)',
    category: 'Bau & Kalkulation',
    template: '"Tabelle"."Menge" * "Tabelle"."Einzelpreis"',
    description: 'Berechnet den Netto-Gesamtpreis einer LV-Position.',
  },
  {
    name: 'Gesamtpreis Brutto (Netto inkl. 19% MwSt)',
    category: 'Bau & Kalkulation',
    template: 'ROUND_CURRENCY("Tabelle"."GesamtpreisNetto" * 1.19)',
    description: 'Kaufmännisch gerundeter Bruttobetrag mit Standard-Mehrwertsteuersatz.',
  },
  {
    name: 'Deckungsbeitrag / Marge',
    category: 'Bau & Kalkulation',
    template: '"Tabelle"."Verkaufspreis" - ("Tabelle"."Kosten_Lohn" + "Tabelle"."Kosten_Material" + "Tabelle"."Kosten_Geraete")',
    description: 'Rohgewinn aus Verkaufspreis abzüglich Einzelkosten der Teilleistungen.',
  },
  {
    name: 'Marge in %',
    category: 'Bau & Kalkulation',
    template: 'ROUND_CURRENCY((("Tabelle"."Verkaufspreis" - "Tabelle"."KostenGesamt") / NULLIF("Tabelle"."Verkaufspreis", 0)) * 100)',
    description: 'Prozentuale Gewinnmarge mit Schutz vor Division durch 0.',
  },
  {
    name: 'Access Nz() Fallback',
    category: 'Access-Migration',
    template: 'Nz("Tabelle"."SkontoSatz", 0)',
    description: 'Wandelt NULL-Werte automatisch in den Standardwert um (Transpiliert zu COALESCE).',
  },
  {
    name: 'Access IIf() Bedingung',
    category: 'Access-Migration',
    template: 'IIf("Tabelle"."Menge" > 100, "Tabelle"."Grosskundenpreis", "Tabelle"."Normalpreis")',
    description: 'Bedingte Zuweisung (Transpiliert zu CASE WHEN ... THEN ... ELSE ... END).',
  },
  {
    name: 'Fortlaufende Positionsnummer (Window Function)',
    category: 'Analytik & Fenster',
    template: 'ROW_NUMBER() OVER (PARTITION BY "Tabelle"."ProjektId" ORDER BY "Tabelle"."Ordnungszahl")',
    description: 'Automatische sequentielle Durchnummerierung je Projekt.',
  },
  {
    name: 'Kumulierter Rechnungsstand (Running Total)',
    category: 'Analytik & Fenster',
    template: 'SUM("Tabelle"."Rechnungsbetrag") OVER (PARTITION BY "Tabelle"."ProjektId" ORDER BY "Tabelle"."Rechnungsdatum")',
    description: 'Fortlaufende Zwischensumme des Zahlungsstandes.',
  },
  {
    name: 'Preishistorie Vormonat (LAG)',
    category: 'Analytik & Fenster',
    template: 'LAG("Tabelle"."Einkaufspreis", 1) OVER (PARTITION BY "Tabelle"."ArtikelId" ORDER BY "Tabelle"."GueltigAb")',
    description: 'Zugriff auf den vorherigen Einkaufspreis zur Teuerungsanalyse.',
  },
];
