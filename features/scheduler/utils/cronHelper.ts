/**
 * Helper utilities for Cron expression parsing, description, and next run calculation
 */

export interface CronPreset {
  label: string;
  expression: string;
  description: string;
  category: 'frequent' | 'daily' | 'weekly' | 'monthly';
}

export const CRON_PRESETS: CronPreset[] = [
  {
    label: 'Jede Minute',
    expression: '* * * * *',
    description: 'Wird jede Minute ausgeführt (ideal für Tests).',
    category: 'frequent'
  },
  {
    label: 'Alle 15 Minuten',
    expression: '*/15 * * * *',
    description: 'Viertelstündlicher Abgleich von Bestellungen & Postfächern.',
    category: 'frequent'
  },
  {
    label: 'Stündlich zur vollen Stunde',
    expression: '0 * * * *',
    description: 'Zu jeder vollen Stunde (z. B. 08:00, 09:00, 10:00).',
    category: 'frequent'
  },
  {
    label: 'Täglich um 06:00 Uhr (Morgens)',
    expression: '0 6 * * *',
    description: 'Morgendlicher Import von DATANORM-Katalogen und E-Mails.',
    category: 'daily'
  },
  {
    label: 'Täglich um 12:00 Uhr (Mittags)',
    expression: '0 12 * * *',
    description: 'Mittags-Statusbericht & Erinnerungs-Benachrichtigungen.',
    category: 'daily'
  },
  {
    label: 'Täglich um 23:00 Uhr (Nächtlicher Abgleich)',
    expression: '0 23 * * *',
    description: 'Nächtlicher Datenbank-Abgleich, Backup & Bereinigung.',
    category: 'daily'
  },
  {
    label: 'Wöchentlich Montags um 07:00 Uhr',
    expression: '0 7 * * 1',
    description: 'Wöchentliche Projektübersicht & Aufgabenliste an Mitarbeiter.',
    category: 'weekly'
  },
  {
    label: 'Wöchentlich Freitags um 17:00 Uhr',
    expression: '0 17 * * 5',
    description: 'Wochenabschluss, Zeiterfassungs-Export & Berichte.',
    category: 'weekly'
  },
  {
    label: 'Monatlich am 1. des Monats (Rechnungslauf)',
    expression: '0 0 1 * *',
    description: 'Automatischer Monatsabschluss & Erstellung von ZUGFeRD-Rechnungen.',
    category: 'monthly'
  },
  {
    label: 'Monatlich am 15. des Monats (Mahnlauf)',
    expression: '0 9 15 * *',
    description: 'Monatlicher Mahnlauf und Zahlungsabgleich.',
    category: 'monthly'
  }
];

export function describeCronExpression(cron: string): string {
  if (!cron || typeof cron !== 'string') return 'Nicht konfiguriert';
  const trimmed = cron.trim();

  const preset = CRON_PRESETS.find(p => p.expression === trimmed);
  if (preset) return `${preset.label} – ${preset.description}`;

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) return `Benutzerdefiniert (${trimmed})`;

  const [min, hour, dom, mon, dow] = parts;

  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Jede Minute';
  }
  if (min.startsWith('*/') && hour === '*') {
    return `Alle ${min.replace('*/', '')} Minuten`;
  }
  if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Stündlich zur vollen Stunde';
  }
  if (min === '0' && hour.match(/^\d+$/) && dom === '*' && mon === '*' && dow === '*') {
    return `Täglich um ${hour.padStart(2, '0')}:00 Uhr`;
  }
  if (min.match(/^\d+$/) && hour.match(/^\d+$/) && dom === '*' && mon === '*' && dow === '*') {
    return `Täglich um ${hour.padStart(2, '0')}:${min.padStart(2, '0')} Uhr`;
  }
  if (dom === '1' && mon === '*') {
    return `Monatlich am 1. um ${hour.padStart(2, '0')}:${min.padStart(2, '0')} Uhr`;
  }
  if (dow === '1') {
    return `Jeden Montag um ${hour.padStart(2, '0')}:${min.padStart(2, '0')} Uhr`;
  }
  if (dow === '5') {
    return `Jeden Freitag um ${hour.padStart(2, '0')}:${min.padStart(2, '0')} Uhr`;
  }

  return `Geplant (${trimmed})`;
}

export function calculateNextCronRun(cron: string, fromDate: Date = new Date()): { nextDate: Date; humanDiff: string } {
  const parts = (cron || '* * * * *').trim().split(/\s+/);
  const now = new Date(fromDate);
  const next = new Date(now.getTime() + 60000); // at least 1 min in the future

  if (parts.length === 5) {
    const [min, hour, dom, mon, dow] = parts;

    if (min.match(/^\d+$/) && hour.match(/^\d+$/)) {
      const targetHour = parseInt(hour, 10);
      const targetMin = parseInt(min, 10);
      next.setHours(targetHour, targetMin, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (min.match(/^\d+$/) && hour === '*') {
      const targetMin = parseInt(min, 10);
      next.setMinutes(targetMin, 0, 0);
      if (next <= now) {
        next.setHours(next.getHours() + 1);
      }
    } else if (min.startsWith('*/')) {
      const interval = parseInt(min.replace('*/', ''), 10) || 15;
      const currentMin = next.getMinutes();
      const remainder = currentMin % interval;
      const addMin = interval - remainder;
      next.setMinutes(currentMin + addMin, 0, 0);
    }
  }

  const diffMs = next.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let humanDiff = '';
  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    humanDiff = `in ${days} Tag(en)`;
  } else if (diffHours > 0) {
    humanDiff = `in ${diffHours} Std. ${diffMins} Min.`;
  } else {
    humanDiff = `in ${Math.max(1, diffMins)} Min.`;
  }

  return { nextDate: next, humanDiff };
}
