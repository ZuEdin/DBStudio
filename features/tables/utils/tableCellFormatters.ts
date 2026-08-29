import { Field } from '../../../types';
import { evaluateFormFormula } from '../../../utils/formulaEvaluator';

export function formatCurrencyValue(val: any, symbol: string = '€'): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return String(val);
  return `${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function formatPercentageValue(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return String(val);
  return `${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function formatUnitMeasureValue(val: any, unit?: string): string {
  if (val === null || val === undefined || val === '') return '';
  return unit ? `${val} ${unit}` : String(val);
}

export function formatIbanValue(val: any): string {
  if (!val) return '';
  const cleaned = String(val).replace(/\s+/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

export function isValidIban(iban: string): boolean {
  if (!iban) return false;
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{12,30}$/.test(cleaned);
}

export function isValidBic(bic: string): boolean {
  if (!bic) return false;
  const cleaned = bic.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
}

export function computeRowValues(row: Record<string, any>, fields: Field[]): Record<string, any> {
  const computedRow = { ...row };
  const calculatedFields = fields.filter((f) => f.isCalculated || Boolean(f.calculationFormula));

  let changed = true;
  let passes = 0;
  while (changed && passes < 5) {
    changed = false;
    passes++;
    for (const field of calculatedFields) {
      if (field.calculationFormula) {
        const newVal = evaluateFormFormula(field.calculationFormula, computedRow);
        if (computedRow[field.name] !== newVal) {
          computedRow[field.name] = newVal;
          changed = true;
        }
      }
    }
  }

  return computedRow;
}
