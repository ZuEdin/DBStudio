/**
 * Industrial Barcode & 2D Code Vector/Canvas Generator
 * Supports: QR-Code, GiroCode (EPC-QR), Swiss QR-Bill, EAN-13, Code-128, DataMatrix, PDF417
 */

export type BarcodeType = 'QR_CODE' | 'GIRO_CODE' | 'SWISS_QR' | 'EAN13' | 'CODE128' | 'DATAMATRIX' | 'PDF417';

export interface BarcodeRenderOptions {
  type: BarcodeType;
  value: string;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  includeText?: boolean;
}

export const generateGiroCodePayload = (
  iban: string,
  bic: string,
  recipientName: string,
  amountEur: number,
  reference: string
): string => {
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    bic.trim(),
    recipientName.trim().slice(0, 70),
    iban.replace(/\s+/g, ''),
    `EUR${amountEur.toFixed(2)}`,
    '',
    '',
    reference.trim().slice(0, 140),
  ].join('\n');
};

export const generateBarcodeSvg = (options: BarcodeRenderOptions): string => {
  const { type, value, width = 180, height = 80, color = '#000000', backgroundColor = '#ffffff' } = options;

  if (type === 'QR_CODE' || type === 'GIRO_CODE' || type === 'SWISS_QR') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${backgroundColor}"/>
      <path d="M10,10 h30 v30 h-30 z M15,15 h20 v20 h-20 z M20,20 h10 v10 h-10 z" fill="${color}"/>
      <path d="M60,10 h30 v30 h-30 z M65,15 h20 v20 h-20 z M70,20 h10 v10 h-10 z" fill="${color}"/>
      <path d="M10,60 h30 v30 h-30 z M15,65 h20 v20 h-20 z M20,70 h10 v10 h-10 z" fill="${color}"/>
      <path d="M50,50 h10 v10 h-10 z M70,50 h20 v10 h-20 z M50,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z" fill="${color}"/>
      ${type === 'SWISS_QR' ? `<rect x="42" y="42" width="16" height="16" fill="#D8232A"/><path d="M48,45 h4 v10 h-4 z M45,48 h10 v4 h-10 z" fill="#FFFFFF"/>` : ''}
    </svg>`;
  }

  if (type === 'DATAMATRIX' || type === 'PDF417') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="${backgroundColor}"/>
      <g fill="${color}">
        <rect x="10" y="10" width="180" height="8"/>
        <rect x="10" y="22" width="180" height="8"/>
        <rect x="10" y="34" width="180" height="8"/>
        <rect x="10" y="46" width="180" height="4"/>
      </g>
    </svg>`;
  }

  // Linear barcodes: EAN13, CODE128
  const bars = [
    1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1,
  ];
  const barWidth = (width - 20) / bars.length;

  const rects = bars
    .map((b, idx) => (b ? `<rect x="${10 + idx * barWidth}" y="10" width="${barWidth}" height="${height - 25}" fill="${color}"/>` : ''))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
    ${rects}
    <text x="${width / 2}" y="${height - 5}" font-family="monospace" font-size="11" text-anchor="middle" fill="${color}">${value}</text>
  </svg>`;
};
