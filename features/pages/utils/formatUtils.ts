/**
 * Utility functions for field formatting in the Page Designer and SDUI engine.
 * Supports dates, times, currencies, numbers, booleans, text transformations, and pipe syntax (e.g. {{created_at | date:'DD.MM.YYYY'}}).
 */

export interface FieldFormatOptions {
    formatType?: 'none' | 'date' | 'time' | 'datetime' | 'relative_date' | 'currency' | 'number' | 'boolean' | 'text' | string;
    dateFormat?: string;
    customDateFormat?: string;
    currencyCode?: string;
    currencyDecimals?: number;
    currencyPosition?: 'before' | 'after';
    numberDecimals?: number;
    numberThousandsSeparator?: boolean;
    numberIsPercent?: boolean;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'truncate';
    truncateLength?: number;
    booleanTrueText?: string;
    booleanFalseText?: string;
    prefix?: string;
    suffix?: string;
    emptyFallback?: string;
    locale?: string;
}

const MONTH_NAMES_DE = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const MONTH_NAMES_SHORT_DE = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

const WEEKDAY_NAMES_DE = [
    'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'
];

const WEEKDAY_NAMES_SHORT_DE = [
    'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'
];

/**
 * Parses any date representation (ISO string, timestamp, standard Date string, Date object)
 */
export const parseToDate = (val: any): Date | null => {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
    }
    if (typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === 'string') {
        let trimmed = val.trim();
        if (!trimmed) return null;

        // Clean C# / SQL Server 7-digit subsecond ISO strings (e.g. 2026-02-01T00:00:00.0000000 -> 2026-02-01T00:00:00.000)
        trimmed = trimmed.replace(/(\.\d{3})\d+/, '$1');
        
        // Handle numeric timestamps as strings
        if (/^\d{10,13}$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            const d = new Date(num.toString().length === 10 ? num * 1000 : num);
            if (!isNaN(d.getTime())) return d;
        }

        // Handle DD.MM.YYYY or DD.MM.YYYY HH:mm:ss
        const deDateMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (deDateMatch) {
            const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = deDateMatch;
            const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
            if (!isNaN(d.getTime())) return d;
        }

        // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
        if (isoMatch) {
            const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
            const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
            if (!isNaN(d.getTime())) return d;
        }

        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
};

/**
 * Formats a Date object or date-like value using common pattern tokens or presets.
 * Supported patterns:
 * - 'DD.MM.YYYY' (e.g. 28.08.2026)
 * - 'DD.MM.YYYY HH:mm' (e.g. 28.08.2026 14:30)
 * - 'DD.MM.YYYY HH:mm:ss' (e.g. 28.08.2026 14:30:45)
 * - 'YYYY-MM-DD' (e.g. 2026-08-28)
 * - 'YYYY-MM-DD HH:mm' (e.g. 2026-08-28 14:30)
 * - 'DD/MM/YYYY' (e.g. 28/08/2026)
 * - 'MM/DD/YYYY' (e.g. 08/28/2026)
 * - 'DD. MMMM YYYY' (e.g. 28. August 2026)
 * - 'dddd, DD.MM.YYYY' (e.g. Freitag, 28.08.2026)
 * - 'HH:mm' (e.g. 14:30)
 * - 'HH:mm:ss' (e.g. 14:30:45)
 * - 'relative' (e.g. heute, gestern, vor 3 Tagen, in 2 Tagen)
 */
export const formatDate = (val: any, pattern: string = 'DD.MM.YYYY', locale: string = 'de-DE'): string => {
    const d = parseToDate(val);
    if (!d) return '';

    const p = (pattern || 'DD.MM.YYYY').trim();

    if (p.toLowerCase() === 'relative') {
        return formatRelativeDate(d, locale);
    }

    if (p.toLowerCase() === 'locale_date') {
        return d.toLocaleDateString(locale);
    }

    if (p.toLowerCase() === 'locale_datetime') {
        return d.toLocaleString(locale);
    }

    if (p.toLowerCase() === 'iso') {
        return d.toISOString();
    }

    const pad = (n: number, width: number = 2): string => String(n).padStart(width, '0');

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const dayOfWeek = d.getDay();

    const replacements: Record<string, string> = {
        'YYYY': String(year),
        'YY': String(year).slice(-2),
        'MMMM': MONTH_NAMES_DE[d.getMonth()] || pad(month),
        'MMM': MONTH_NAMES_SHORT_DE[d.getMonth()] || pad(month),
        'MM': pad(month),
        'M': String(month),
        'DD': pad(day),
        'D': String(day),
        'dddd': WEEKDAY_NAMES_DE[dayOfWeek] || '',
        'ddd': WEEKDAY_NAMES_SHORT_DE[dayOfWeek] || '',
        'HH': pad(hours),
        'H': String(hours),
        'hh': pad(hours % 12 || 12),
        'h': String(hours % 12 || 12),
        'mm': pad(minutes),
        'm': String(minutes),
        'ss': pad(seconds),
        's': String(seconds),
    };

    // Replace tokens in order of token length (longest first)
    const tokenRegex = /YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s/g;
    return p.replace(tokenRegex, (match) => replacements[match] !== undefined ? replacements[match] : match);
};

/**
 * Formats a date relative to now (e.g. 'heute', 'gestern', 'vor 2 Tagen', 'vor 3 Stunden')
 */
export const formatRelativeDate = (d: Date, locale: string = 'de-DE'): string => {
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const isGerman = locale.startsWith('de');

    if (Math.abs(diffSec) < 45) {
        return isGerman ? 'gerade eben' : 'just now';
    }

    if (Math.abs(diffMin) < 60) {
        if (diffMin > 0) {
            return isGerman ? `in ${diffMin} Minute${diffMin === 1 ? '' : 'n'}` : `in ${diffMin} min`;
        }
        const m = Math.abs(diffMin);
        return isGerman ? `vor ${m} Minute${m === 1 ? '' : 'n'}` : `${m} min ago`;
    }

    if (Math.abs(diffHour) < 24) {
        if (diffHour > 0) {
            return isGerman ? `in ${diffHour} Stunde${diffHour === 1 ? '' : 'n'}` : `in ${diffHour} hr`;
        }
        const h = Math.abs(diffHour);
        return isGerman ? `vor ${h} Stunde${h === 1 ? '' : 'n'}` : `${h} hr ago`;
    }

    if (diffDay === 0) return isGerman ? 'heute' : 'today';
    if (diffDay === -1) return isGerman ? 'gestern' : 'yesterday';
    if (diffDay === 1) return isGerman ? 'morgen' : 'tomorrow';

    if (diffDay > 0) {
        return isGerman ? `in ${diffDay} Tagen` : `in ${diffDay} days`;
    }
    return isGerman ? `vor ${Math.abs(diffDay)} Tagen` : `${Math.abs(diffDay)} days ago`;
};

/**
 * Formats a numeric value as currency
 */
export const formatCurrency = (
    val: any,
    currencyCode: string = 'EUR',
    decimals: number = 2,
    position: 'before' | 'after' = 'after',
    locale: string = 'de-DE'
): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '.'));
    if (isNaN(num)) return String(val);

    const symbolMap: Record<string, string> = {
        'EUR': '€',
        'USD': '$',
        'CHF': 'CHF',
        'GBP': '£',
        'JPY': '¥',
    };

    const sym = symbolMap[currencyCode.toUpperCase()] || currencyCode;
    const formattedNum = num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    if (position === 'before') {
        return `${sym} ${formattedNum}`;
    }
    return `${formattedNum} ${sym}`;
};

/**
 * Formats a number with decimals and thousand separators
 */
export const formatNumber = (
    val: any,
    decimals: number = 2,
    useGrouping: boolean = true,
    isPercent: boolean = false,
    locale: string = 'de-DE'
): string => {
    if (val === null || val === undefined || val === '') return '';
    let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '.'));
    if (isNaN(num)) return String(val);

    if (isPercent) {
        // If num is already scaled (e.g. 15 for 15%), display as is with %
        const formatted = num.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping,
        });
        return `${formatted} %`;
    }

    return num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
    });
};

/**
 * Formats boolean values with custom true/false labels
 */
export const formatBoolean = (
    val: any,
    trueText: string = 'Ja',
    falseText: string = 'Nein'
): string => {
    if (val === null || val === undefined || val === '') return '';
    const isTrue = val === true || val === 'true' || val === 1 || val === '1' || val === 'yes' || val === 'ja';
    return isTrue ? trueText : falseText;
};

/**
 * Applies text transformation (uppercase, lowercase, capitalize, truncate)
 */
export const formatTextTransform = (
    val: any,
    transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'truncate' = 'none',
    truncateLength: number = 50
): string => {
    const str = String(val ?? '');
    if (!str) return '';

    switch (transform) {
        case 'uppercase':
            return str.toUpperCase();
        case 'lowercase':
            return str.toLowerCase();
        case 'capitalize':
            return str.replace(/\b\w/g, char => char.toUpperCase());
        case 'truncate':
            return str.length > truncateLength ? str.substring(0, truncateLength) + '...' : str;
        default:
            return str;
    }
};

/**
 * Master format function that takes a raw value and format configuration options
 */
export const formatFieldValue = (val: any, options: FieldFormatOptions = {}): string => {
    if (val === null || val === undefined || val === '') {
        return options.emptyFallback ?? '';
    }

    const {
        formatType = 'none',
        dateFormat = 'DD.MM.YYYY',
        customDateFormat,
        currencyCode = 'EUR',
        currencyDecimals = 2,
        currencyPosition = 'after',
        numberDecimals = 2,
        numberThousandsSeparator = true,
        numberIsPercent = false,
        textTransform = 'none',
        truncateLength = 50,
        booleanTrueText = 'Ja',
        booleanFalseText = 'Nein',
        prefix = '',
        suffix = '',
        emptyFallback = '',
        locale = 'de-DE'
    } = options;

    let result = '';

    switch (formatType) {
        case 'date':
        case 'datetime':
        case 'time':
        case 'relative_date': {
            const activePattern = customDateFormat?.trim() || dateFormat || 'DD.MM.YYYY';
            result = formatDate(val, activePattern, locale);
            break;
        }

        case 'currency': {
            result = formatCurrency(val, currencyCode, currencyDecimals, currencyPosition, locale);
            break;
        }

        case 'number': {
            result = formatNumber(val, numberDecimals, numberThousandsSeparator, numberIsPercent, locale);
            break;
        }

        case 'boolean': {
            result = formatBoolean(val, booleanTrueText, booleanFalseText);
            break;
        }

        case 'text': {
            result = formatTextTransform(val, textTransform, truncateLength);
            break;
        }

        case 'none':
        default: {
            result = String(val);
            break;
        }
    }

    if (!result) {
        return emptyFallback;
    }

    return `${prefix}${result}${suffix}`;
};

/**
 * Parses pipe commands in template placeholders.
 * Examples:
 *   'date' -> { pipe: 'date', args: [] }
 *   'date:\'DD.MM.YYYY\'' -> { pipe: 'date', args: ['DD.MM.YYYY'] }
 *   'currency:\'USD\':2' -> { pipe: 'currency', args: ['USD', '2'] }
 *   'truncate:40' -> { pipe: 'truncate', args: ['40'] }
 *   'boolean:\'Aktiv\':\'Inaktiv\'' -> { pipe: 'boolean', args: ['Aktiv', 'Inaktiv'] }
 */
export const parsePipeCommand = (pipeStr: string): { pipe: string; args: string[] } => {
    const trimmed = pipeStr.trim();
    if (!trimmed) return { pipe: '', args: [] };

    // Matches pipeName:arg1:arg2 where args might be enclosed in single/double quotes
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
        return { pipe: trimmed.toLowerCase(), args: [] };
    }

    const pipeName = trimmed.substring(0, colonIdx).trim().toLowerCase();
    const argsStr = trimmed.substring(colonIdx + 1);

    // Split args respecting quotes
    const args: string[] = [];
    let curr = '';
    let inQuote: string | null = null;

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        if ((char === '\'' || char === '"') && (i === 0 || argsStr[i - 1] !== '\\')) {
            if (inQuote === char) {
                inQuote = null;
            } else if (!inQuote) {
                inQuote = char;
            } else {
                curr += char;
            }
        } else if (char === ':' && !inQuote) {
            args.push(curr.trim());
            curr = '';
        } else {
            curr += char;
        }
    }
    if (curr.trim()) {
        args.push(curr.trim());
    }

    return { pipe: pipeName, args };
};

/**
 * Applies a pipe chain (e.g. "date:'DD.MM.YYYY' | prefix:'Erstellt am: '") to a value
 */
export const applyPipeChain = (val: any, pipeChain: string[]): string => {
    let currentVal = val;

    for (const pipeStr of pipeChain) {
        const { pipe, args } = parsePipeCommand(pipeStr);
        if (!pipe) continue;

        switch (pipe) {
            case 'date':
            case 'datum': {
                const pattern = args[0] || 'DD.MM.YYYY';
                currentVal = formatDate(currentVal, pattern);
                break;
            }

            case 'time':
            case 'uhrzeit': {
                const pattern = args[0] || 'HH:mm';
                currentVal = formatDate(currentVal, pattern);
                break;
            }

            case 'relative':
            case 'relativ': {
                currentVal = formatDate(currentVal, 'relative');
                break;
            }

            case 'currency':
            case 'waehrung':
            case 'money': {
                const curr = args[0] || 'EUR';
                const dec = args[1] ? parseInt(args[1], 10) : 2;
                currentVal = formatCurrency(currentVal, curr, isNaN(dec) ? 2 : dec);
                break;
            }

            case 'number':
            case 'zahl': {
                const dec = args[0] ? parseInt(args[0], 10) : 2;
                currentVal = formatNumber(currentVal, isNaN(dec) ? 2 : dec);
                break;
            }

            case 'percent':
            case 'prozent': {
                const dec = args[0] ? parseInt(args[0], 10) : 1;
                currentVal = formatNumber(currentVal, isNaN(dec) ? 1 : dec, true, true);
                break;
            }

            case 'uppercase':
            case 'upper':
            case 'gross': {
                currentVal = String(currentVal ?? '').toUpperCase();
                break;
            }

            case 'lowercase':
            case 'lower':
            case 'klein': {
                currentVal = String(currentVal ?? '').toLowerCase();
                break;
            }

            case 'capitalize':
            case 'cap': {
                currentVal = String(currentVal ?? '').replace(/\b\w/g, c => c.toUpperCase());
                break;
            }

            case 'truncate':
            case 'limit':
            case 'kuerzen': {
                const len = args[0] ? parseInt(args[0], 10) : 50;
                const str = String(currentVal ?? '');
                currentVal = str.length > len ? str.substring(0, len) + '...' : str;
                break;
            }

            case 'boolean':
            case 'bool': {
                const trueText = args[0] || 'Ja';
                const falseText = args[1] || 'Nein';
                currentVal = formatBoolean(currentVal, trueText, falseText);
                break;
            }

            case 'default':
            case 'fallback': {
                if (currentVal === null || currentVal === undefined || currentVal === '') {
                    currentVal = args[0] || '-';
                }
                break;
            }

            case 'prefix': {
                if (currentVal !== null && currentVal !== undefined && currentVal !== '') {
                    currentVal = `${args[0] || ''}${currentVal}`;
                }
                break;
            }

            case 'suffix': {
                if (currentVal !== null && currentVal !== undefined && currentVal !== '') {
                    currentVal = `${currentVal}${args[0] || ''}`;
                }
                break;
            }

            default:
                break;
        }
    }

    return String(currentVal ?? '');
};
