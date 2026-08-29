/**
 * Access / OLEDB Data Transpiler & OLE Container Header Stripping Engine
 * Handles exotic MS Access / Jet / ACE OLEDB Datatypes:
 * - OLE Object Container Headers (Bitmap/JPEG/PNG 78-byte MS Access OLE Header Stripping)
 * - Rich Text Memo Fields (RTF to HTML / PlainText Transpiler)
 * - Access Hyperlink Syntax (Text#URL#SubAddress)
 * - Currency, DateSerial, and Binary BLOB normalization
 */

export interface TranspiledAccessField {
  originalType: 'OLE_OBJECT' | 'MEMO_RTF' | 'HYPERLINK' | 'ATTACHMENT' | 'DECIMAL_CURRENCY' | 'BINARY_BLOB';
  transpiledType: 'image/jpeg' | 'image/png' | 'text/html' | 'text/plain' | 'url_object' | 'number' | 'base64';
  value: any;
  previewText?: string;
  metadata?: Record<string, any>;
}

export class AccessDataTranspiler {
  /**
   * Strips the MS Access 78-byte OLE Package Header from embedded bitmaps/pictures
   * Access stores OLE objects with a 78-byte header (signature \x15\x1C) followed by raw image bytes.
   */
  public static stripOleHeader(binaryOrBase64: Uint8Array | string): { dataUrl: string; format: string } {
    let bytes: Uint8Array;

    if (typeof binaryOrBase64 === 'string') {
      // Decode Base64 if needed
      if (binaryOrBase64.startsWith('data:')) {
        const base64Data = binaryOrBase64.split(',')[1] || '';
        const binaryString = atob(base64Data);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else {
        try {
          const binaryString = atob(binaryOrBase64);
          bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
        } catch {
          bytes = new TextEncoder().encode(binaryOrBase64);
        }
      }
    } else {
      bytes = binaryOrBase64;
    }

    // Check for Access OLE Header signature: 0x15, 0x1C (21, 28)
    let startIndex = 0;
    if (bytes.length > 78 && bytes[0] === 0x15 && bytes[1] === 0x1c) {
      startIndex = 78; // Standard Access OLE wrapper length
    } else {
      // Look for JPEG (FF D8 FF) or PNG (89 50 4E 47) or BMP (42 4D) signature inside the first 200 bytes
      for (let i = 0; i < Math.min(bytes.length - 4, 256); i++) {
        // JPEG Magic: FF D8 FF
        if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
          startIndex = i;
          break;
        }
        // PNG Magic: 89 50 4E 47
        if (bytes[i] === 0x89 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x4e && bytes[i + 3] === 0x47) {
          startIndex = i;
          break;
        }
        // BMP Magic: BM (0x42, 0x4D)
        if (bytes[i] === 0x42 && bytes[i + 1] === 0x4d && i >= 70) {
          startIndex = i;
          break;
        }
      }
    }

    const payload = bytes.subarray(startIndex);
    
    // Detect image type
    let mimeType = 'image/jpeg';
    if (payload.length >= 4 && payload[0] === 0x89 && payload[1] === 0x50 && payload[2] === 0x4e && payload[3] === 0x47) {
      mimeType = 'image/png';
    } else if (payload.length >= 2 && payload[0] === 0x42 && payload[1] === 0x4d) {
      mimeType = 'image/bmp';
    } else if (payload.length >= 4 && payload[0] === 0x47 && payload[1] === 0x49 && payload[2] === 0x46) {
      mimeType = 'image/gif';
    }

    // Convert payload to Base64
    let binary = '';
    const len = payload.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(payload[i]);
    }
    const base64 = btoa(binary);

    return {
      dataUrl: `data:${mimeType};base64,${base64}`,
      format: mimeType,
    };
  }

  /**
   * Transpiles Access RTF (Rich Text Format) Memo strings into clean HTML or PlainText
   */
  public static transpileRtf(rtfString: string): { html: string; plainText: string } {
    if (!rtfString || typeof rtfString !== 'string') {
      return { html: '', plainText: '' };
    }

    const trimmed = rtfString.trim();
    if (!trimmed.startsWith('{\\rtf')) {
      // Already plain text or HTML
      return {
        html: `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`,
        plainText: trimmed,
      };
    }

    // Basic high-fidelity RTF to HTML parser
    let text = trimmed;

    // Remove RTF header groups: fonttbl, colortbl, stylesheet, generator
    text = text.replace(/\{\\\*?\\[a-z0-9]+[\s\S]*?\}/gi, '');
    text = text.replace(/\{\\fonttbl[\s\S]*?\}/gi, '');
    text = text.replace(/\{\\colortbl[\s\S]*?\}/gi, '');

    // Convert RTF formatting to HTML
    text = text.replace(/\\b\s+([\s\S]*?)\\b0/gi, '<strong>$1</strong>');
    text = text.replace(/\\b\s+(.*?)(?=\\b0|\\par|\\b|$)/gi, '<strong>$1</strong>');
    text = text.replace(/\\i\s+([\s\S]*?)\\i0/gi, '<em>$1</em>');
    text = text.replace(/\\ul\s+([\s\S]*?)\\ulnone/gi, '<u>$1</u>');
    text = text.replace(/\\strike\s+([\s\S]*?)\\strike0/gi, '<del>$1</del>');

    // Paragraphs and line breaks
    text = text.replace(/\\par\s*/gi, '<br/>\n');
    text = text.replace(/\\line\s*/gi, '<br/>\n');
    text = text.replace(/\\tab\s*/gi, '&nbsp;&nbsp;&nbsp;&nbsp;');

    // Unicode escapes like \'e4 (ä), \'fc (ü), \u8220?
    text = text.replace(/\\'([0-9a-f]{2})/gi, (_, hex) => {
      try {
        const byte = parseInt(hex, 16);
        return new TextDecoder('windows-1252').decode(new Uint8Array([byte]));
      } catch {
        return '';
      }
    });

    text = text.replace(/\\u([0-9]{3,5})\??/gi, (_, code) => {
      return String.fromCharCode(parseInt(code, 10));
    });

    // Remove remaining backslash controls
    text = text.replace(/\\[a-z0-9-]+/gi, '');
    text = text.replace(/[{}]/g, '');

    const cleanHtml = text.trim();
    const plainText = cleanHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

    return {
      html: cleanHtml,
      plainText,
    };
  }

  /**
   * Transpiles Access Hyperlink Field ("Display Text#URL#SubAddress#ScreenTip")
   */
  public static transpileHyperlink(rawAccessLink: string): { displayText: string; url: string; subAddress?: string } {
    if (!rawAccessLink || !rawAccessLink.includes('#')) {
      return { displayText: rawAccessLink, url: rawAccessLink };
    }

    const parts = rawAccessLink.split('#');
    const displayText = parts[0] || parts[1] || '';
    const url = parts[1] || parts[0] || '';
    const subAddress = parts[2] || undefined;

    return {
      displayText,
      url,
      subAddress,
    };
  }

  /**
   * Normalizes Access Currency / Decimal values
   */
  public static normalizeCurrency(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const clean = String(value).replace(/[^0-9,-.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
}
