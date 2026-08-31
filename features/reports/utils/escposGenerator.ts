import { EscPosReceiptData, ThermalPrinterConfig } from '../../../types/report';

export class EscPosBuilder {
  private buffer: number[] = [];
  private widthChars: number = 48; // 80mm = 48 chars (Font A) or 42 chars; 58mm = 32 chars

  constructor(paperWidth: '58mm' | '80mm' = '80mm') {
    this.widthChars = paperWidth === '58mm' ? 32 : 48;
    this.init();
  }

  public init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @ (Initialize printer)
    return this;
  }

  public setCodePage(codePage: 'CP437' | 'CP850' | 'CP1252' | 'UTF-8' = 'CP850'): this {
    // ESC t n (Select character code table)
    // 0: CP437, 2: CP850 (Multilingual/German), 16: CP1252 (Windows Latin-1)
    let n = 2;
    if (codePage === 'CP437') n = 0;
    if (codePage === 'CP1252') n = 16;
    this.buffer.push(0x1b, 0x74, n);
    return this;
  }

  public align(alignment: 'left' | 'center' | 'right'): this {
    // ESC a n (0: Left, 1: Center, 2: Right)
    const n = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  public bold(enable: boolean = true): this {
    // ESC E n (1: On, 0: Off)
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  public underline(enable: boolean = true): this {
    // ESC - n (1: 1-dot, 0: Off)
    this.buffer.push(0x1b, 0x2d, enable ? 1 : 0);
    return this;
  }

  public invert(enable: boolean = true): this {
    // GS B n (Reverse white/black printing)
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0);
    return this;
  }

  public setTextSize(widthMulti: number = 1, heightMulti: number = 1): this {
    // GS ! n (Select character size: bit 0-3 height, bit 4-7 width)
    const w = Math.max(0, Math.min(7, widthMulti - 1));
    const h = Math.max(0, Math.min(7, heightMulti - 1));
    const n = (w << 4) | h;
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  public feed(lines: number = 1): this {
    // ESC d n (Print and feed n lines)
    this.buffer.push(0x1b, 0x64, Math.max(1, lines));
    return this;
  }

  public text(str: string): this {
    const encoded = this.encodeString(str);
    for (let i = 0; i < encoded.length; i++) {
      this.buffer.push(encoded[i]);
    }
    return this;
  }

  public textLine(str: string): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  public horizontalRule(char: string = '-'): this {
    const line = char.repeat(this.widthChars);
    return this.textLine(line);
  }

  public doubleRule(): this {
    return this.horizontalRule('=');
  }

  public twoColumns(left: string, right: string): this {
    const available = this.widthChars;
    const rightLen = right.length;
    const leftMax = Math.max(1, available - rightLen - 1);

    const truncatedLeft = left.length > leftMax ? left.substring(0, leftMax - 1) + '.' : left;
    const spacesCount = Math.max(1, available - truncatedLeft.length - rightLen);
    const line = truncatedLeft + ' '.repeat(spacesCount) + right;
    return this.textLine(line);
  }

  public tableRow(col1: string, col2: string, col3: string): this {
    // Format item with qty, price, total
    if (this.widthChars === 32) {
      // 58mm: 14 chars col1, 6 chars col2, 10 chars col3 + spaces
      const c1 = col1.padEnd(14).substring(0, 14);
      const c2 = col2.padStart(6).substring(0, 6);
      const c3 = col3.padStart(10).substring(0, 10);
      return this.textLine(`${c1} ${c2} ${c3}`);
    } else {
      // 80mm: 24 chars col1, 10 chars col2, 12 chars col3
      const c1 = col1.padEnd(24).substring(0, 24);
      const c2 = col2.padStart(10).substring(0, 10);
      const c3 = col3.padStart(12).substring(0, 12);
      return this.textLine(`${c1} ${c2} ${c3}`);
    }
  }

  public qrCode(content: string, size: number = 6): this {
    // Standard ESC/POS QR Code command sequence (Model 2)
    const len = content.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Model select (Model 2)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Module size (1-16 dots)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.max(1, Math.min(16, size)));
    // 3. Error correction (Level M = 49, Q = 50, H = 51)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Store data
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < content.length; i++) {
      this.buffer.push(content.charCodeAt(i));
    }
    // 5. Print QR
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    this.feed(1);
    return this;
  }

  public barcode128(content: string, heightDots: number = 60): this {
    // GS h (Set barcode height)
    this.buffer.push(0x1d, 0x68, Math.min(255, Math.max(20, heightDots)));
    // GS w (Set barcode module width 2)
    this.buffer.push(0x1d, 0x77, 0x02);
    // GS H (Set HRI text position 2: below)
    this.buffer.push(0x1d, 0x48, 0x02);
    // GS k (Print CODE128)
    const len = content.length;
    this.buffer.push(0x1d, 0x6b, 0x49, len);
    for (let i = 0; i < len; i++) {
      this.buffer.push(content.charCodeAt(i));
    }
    this.feed(1);
    return this;
  }

  public openCashDrawer(): this {
    // ESC p m t1 t2 (Generate pulse: pin 2, 50ms on, 200ms off)
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  public cut(partial: boolean = false): this {
    this.feed(3);
    // GS V m (66: Partial cut with feed, 65: Full cut)
    this.buffer.push(0x1d, 0x56, partial ? 0x42 : 0x41, 0x00);
    return this;
  }

  public buildUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  public buildBlob(): Blob {
    return new Blob([this.buildUint8Array()], { type: 'application/octet-stream' });
  }

  public toHexString(): string {
    return Array.from(this.buildUint8Array())
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  private encodeString(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      // Map German Umlauts & Euro sign to CP850 / CP1252
      switch (char) {
        case 'ä': bytes.push(0x84); break; // CP850 ä
        case 'ö': bytes.push(0x94); break; // CP850 ö
        case 'ü': bytes.push(0x81); break; // CP850 ü
        case 'Ä': bytes.push(0x8e); break; // CP850 Ä
        case 'Ö': bytes.push(0x99); break; // CP850 Ö
        case 'Ü': bytes.push(0x9a); break; // CP850 Ü
        case 'ß': bytes.push(0xe1); break; // CP850 ß
        case '€': bytes.push(0xd5); break; // CP850 €
        case '°': bytes.push(0xf8); break; // Degree symbol
        default:
          const code = char.charCodeAt(0);
          bytes.push(code < 128 ? code : 0x3f); // '?' for unmapped
          break;
      }
    }
    return bytes;
  }
}

/**
 * Creates a fully formatted enterprise POS receipt from structured data.
 */
export function generateEscPosReceipt(
  receipt: EscPosReceiptData,
  config: Partial<ThermalPrinterConfig> = {}
): Uint8Array {
  const paperWidth = config.paperWidth || '80mm';
  const builder = new EscPosBuilder(paperWidth);

  builder.setCodePage(config.characterSet || 'CP850');

  // 1. Header & Logo
  builder.align('center');
  builder.bold(true);
  builder.setTextSize(2, 2);
  builder.textLine(receipt.title);
  builder.setTextSize(1, 1);
  builder.bold(false);

  if (receipt.subtitle) {
    builder.textLine(receipt.subtitle);
  }
  if (config.receiptHeader) {
    builder.textLine(config.receiptHeader);
  }

  builder.feed(1);
  builder.doubleRule();

  // 2. Metadata (Date, Kassierer, Beleg-Nr.)
  builder.align('left');
  receipt.meta.forEach((m) => {
    builder.twoColumns(m.label + ':', m.value);
  });

  builder.horizontalRule();

  // 3. Table Header
  builder.bold(true);
  builder.tableRow('Position', 'Menge', 'Betrag (EUR)');
  builder.bold(false);
  builder.horizontalRule();

  // 4. Line Items
  receipt.items.forEach((item) => {
    const qtyPrice = `${item.qty} x ${item.unitPrice.toFixed(2)}`;
    const totalStr = item.total.toFixed(2);
    builder.tableRow(item.name, qtyPrice, totalStr);
  });

  builder.horizontalRule();

  // 5. Totals & Tax Matrix
  builder.twoColumns('Netto-Summe:', `${receipt.netTotal.toFixed(2)} EUR`);
  if (receipt.vatRates && receipt.vatRates.length > 0) {
    receipt.vatRates.forEach((v) => {
      builder.twoColumns(`USt ${v.rate}% (auf ${v.net.toFixed(2)}):`, `${v.tax.toFixed(2)} EUR`);
    });
  } else {
    builder.twoColumns('MwSt. 19%:', `${receipt.taxTotal.toFixed(2)} EUR`);
  }

  builder.feed(1);
  builder.bold(true);
  builder.setTextSize(2, 2);
  builder.twoColumns('GESAMT:', `${receipt.grossTotal.toFixed(2)} EUR`);
  builder.setTextSize(1, 1);
  builder.bold(false);
  builder.feed(1);

  if (receipt.paymentMethod) {
    builder.twoColumns('Zahlart:', receipt.paymentMethod);
  }
  if (receipt.cashGiven !== undefined && receipt.cashReturn !== undefined) {
    builder.twoColumns('Gegeben:', `${receipt.cashGiven.toFixed(2)} EUR`);
    builder.twoColumns('Rückgeld:', `${receipt.cashReturn.toFixed(2)} EUR`);
  }

  builder.doubleRule();

  // 6. QR-Code & Barcode
  if (receipt.qrCodeData || config.barcodeContent) {
    builder.align('center');
    builder.textLine('--- TSE / Fiskalbeleg QR-Code ---');
    const qrPayload = receipt.qrCodeData || config.barcodeContent || 'MUSTERBAU-TSE-SIG-2026';
    builder.qrCode(qrPayload, paperWidth === '58mm' ? 4 : 6);
  }

  if (receipt.barcodeData || (config.printBarcode && config.barcodeContent)) {
    builder.align('center');
    const barcode = receipt.barcodeData || config.barcodeContent || 'ART-2026-9912';
    builder.barcode128(barcode, 50);
  }

  // 7. Footer Notes
  builder.align('center');
  if (receipt.footerNotes) {
    builder.textLine(receipt.footerNotes);
  }
  if (config.receiptFooter) {
    builder.textLine(config.receiptFooter);
  }
  builder.textLine('Vielen Dank für Ihren Auftrag!');
  builder.textLine('*** Beleg aufbewahren ***');

  // 8. Cash Drawer & Cut
  if (config.openCashDrawer) {
    builder.openCashDrawer();
  }

  if (config.autoCut !== false) {
    builder.cut(false);
  } else {
    builder.feed(config.feedLines || 3);
  }

  return builder.buildUint8Array();
}
