import { SequenceConfig, Field } from '../types/index';

export interface SequencePreset {
  id: string;
  name: string;
  description: string;
  config: SequenceConfig;
}

export const SEQUENCE_PRESETS: SequencePreset[] = [
  {
    id: 'supplier',
    name: '🚚 Lieferant',
    description: 'LIF-00001, LIF-00010 (5-stellig, Start 10)',
    config: {
      enabled: true,
      prefix: 'LIF-',
      suffix: '',
      padding: 5,
      startValue: 10,
      step: 1,
      includeYear: false,
    },
  },
  {
    id: 'customer',
    name: '👤 Kunde',
    description: 'KD-10001, KD-10002 (5-stellig, Start 10001)',
    config: {
      enabled: true,
      prefix: 'KD-',
      suffix: '',
      padding: 5,
      startValue: 10001,
      step: 1,
      includeYear: false,
    },
  },
  {
    id: 'invoice_year',
    name: '📄 Rechnung (mit Jahr)',
    description: 'RE-2026-00001 (mit aktuellem 4-stelligem Jahr)',
    config: {
      enabled: true,
      prefix: 'RE-',
      suffix: '',
      padding: 5,
      startValue: 1,
      step: 1,
      includeYear: true,
      yearFormat: 'YYYY',
    },
  },
  {
    id: 'article',
    name: '📦 Artikel',
    description: 'ART-0001, ART-0002 (4-stellig)',
    config: {
      enabled: true,
      prefix: 'ART-',
      suffix: '',
      padding: 4,
      startValue: 1,
      step: 1,
      includeYear: false,
    },
  },
  {
    id: 'ticket',
    name: '🎫 Ticket / Vorgang',
    description: 'TICK-00001, TICK-00002 (5-stellig)',
    config: {
      enabled: true,
      prefix: 'TICK-',
      suffix: '',
      padding: 5,
      startValue: 1,
      step: 1,
      includeYear: false,
    },
  },
  {
    id: 'custom_digits',
    name: '🔢 Reiner Zähler',
    description: '00001, 00002, 00003 (5-stellig ohne Präfix)',
    config: {
      enabled: true,
      prefix: '',
      suffix: '',
      padding: 5,
      startValue: 1,
      step: 1,
      includeYear: false,
    },
  },
];

/**
 * Formats a sequence number according to the given SequenceConfig.
 */
export function formatSequenceValue(
  config: SequenceConfig,
  numValue: number,
  date: Date = new Date()
): string {
  if (!config) return String(numValue);

  const prefix = config.prefix || '';
  const suffix = config.suffix || '';
  const padding = Math.max(1, config.padding || 1);
  const numStr = String(Math.max(0, numValue)).padStart(padding, '0');

  if (config.pattern) {
    const yearFull = date.getFullYear().toString();
    const yearShort = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return config.pattern
      .replace('{YYYY}', yearFull)
      .replace('{YY}', yearShort)
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace('{SEQ}', numStr)
      .replace('{NUM}', String(numValue));
  }

  if (config.includeYear) {
    const year =
      config.yearFormat === 'YY'
        ? date.getFullYear().toString().slice(-2)
        : date.getFullYear().toString();
    return `${prefix}${year}-${numStr}${suffix}`;
  }

  return `${prefix}${numStr}${suffix}`;
}

/**
 * Calculates and returns the next formatted sequence value for a table field based on existing records.
 */
export function generateNextSequenceValue(field: Field, data: any[] = []): string {
  const config = field.sequenceConfig;
  if (!config || !config.enabled) {
    return '1';
  }

  const startValue = Number(config.startValue) || 1;
  const step = Number(config.step) || 1;

  if (!data || data.length === 0) {
    return formatSequenceValue(config, startValue);
  }

  let maxNum = 0;
  const prefix = (config.prefix || '').toLowerCase();
  const suffix = (config.suffix || '').toLowerCase();

  for (const row of data) {
    const rawVal = row[field.name];
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;

    const valStr = String(rawVal).trim();

    // Check direct numeric value
    const directNum = parseInt(valStr, 10);
    if (!isNaN(directNum) && String(directNum) === valStr) {
      if (directNum > maxNum) maxNum = directNum;
      continue;
    }

    // Try stripping prefix, suffix, and year
    let clean = valStr.toLowerCase();
    if (prefix && clean.startsWith(prefix)) {
      clean = clean.substring(prefix.length);
    }
    if (suffix && clean.endsWith(suffix)) {
      clean = clean.substring(0, clean.length - suffix.length);
    }

    // Extract all numbers from remaining string
    const matchDigits = clean.match(/(\d+)/g);
    if (matchDigits && matchDigits.length > 0) {
      // Pick the last numeric block (usually the sequence number after year)
      const lastSegment = parseInt(matchDigits[matchDigits.length - 1], 10);
      if (!isNaN(lastSegment) && lastSegment > maxNum) {
        maxNum = lastSegment;
      }
    }
  }

  const nextVal = maxNum > 0 ? maxNum + step : startValue;
  return formatSequenceValue(config, nextVal);
}
