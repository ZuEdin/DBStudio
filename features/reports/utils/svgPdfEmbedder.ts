import jsPDF from 'jspdf';

/**
 * Utility for parsing and embedding pure Scalable Vector Graphics (SVG)
 * into a jsPDF document without raster pixelation or JPEG compression artifacts.
 */
export interface SvgEmbedOptions {
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
  preserveAspectRatio?: boolean;
}

export class SvgPdfEmbedder {
  /**
   * Embeds SVG markup into jsPDF using vector drawing primitives.
   */
  public static embedSvg(
    doc: jsPDF,
    svgString: string,
    options: SvgEmbedOptions
  ): void {
    if (!svgString || !doc) return;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = xmlDoc.querySelector('svg');
      if (!svgElement) return;

      // Extract viewBox or default width/height
      const viewBoxAttr = svgElement.getAttribute('viewBox');
      let vbX = 0, vbY = 0, vbW = 100, vbH = 100;

      if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && !parts.some(isNaN)) {
          [vbX, vbY, vbW, vbH] = parts;
        }
      } else {
        const wAttr = parseFloat(svgElement.getAttribute('width') || '100');
        const hAttr = parseFloat(svgElement.getAttribute('height') || '100');
        if (!isNaN(wAttr)) vbW = wAttr;
        if (!isNaN(hAttr)) vbH = hAttr;
      }

      const scaleX = options.width / (vbW || 1);
      const scaleY = options.height / (vbH || 1);

      // Helper to transform SVG coords (px) to jsPDF coords (mm)
      const mapX = (px: number) => options.x + (px - vbX) * scaleX;
      const mapY = (py: number) => options.y + (py - vbY) * scaleY;
      const mapW = (pw: number) => pw * scaleX;
      const mapH = (ph: number) => ph * scaleY;

      // Parse and draw shapes
      const elements = svgElement.querySelectorAll('rect, circle, ellipse, line, polyline, polygon, path, text');

      elements.forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        const strokeWidth = parseFloat(el.getAttribute('stroke-width') || '1');

        this.applyColors(doc, fill, stroke, strokeWidth * Math.min(scaleX, scaleY));

        const hasFill = fill && fill !== 'none';
        const hasStroke = stroke && stroke !== 'none';
        const style = hasFill && hasStroke ? 'FD' : hasFill ? 'F' : hasStroke ? 'S' : null;

        if (tagName === 'rect') {
          const rx = parseFloat(el.getAttribute('x') || '0');
          const ry = parseFloat(el.getAttribute('y') || '0');
          const rw = parseFloat(el.getAttribute('width') || '0');
          const rh = parseFloat(el.getAttribute('height') || '0');
          const cornerR = parseFloat(el.getAttribute('rx') || '0');

          if (style && rw > 0 && rh > 0) {
            if (cornerR > 0) {
              doc.roundedRect(mapX(rx), mapY(ry), mapW(rw), mapH(rh), mapW(cornerR), mapH(cornerR), style);
            } else {
              doc.rect(mapX(rx), mapY(ry), mapW(rw), mapH(rh), style);
            }
          }
        } else if (tagName === 'circle') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const r = parseFloat(el.getAttribute('r') || '0');
          if (style && r > 0) {
            doc.circle(mapX(cx), mapY(cy), mapW(r), style);
          }
        } else if (tagName === 'line') {
          const x1 = parseFloat(el.getAttribute('x1') || '0');
          const y1 = parseFloat(el.getAttribute('y1') || '0');
          const x2 = parseFloat(el.getAttribute('x2') || '0');
          const y2 = parseFloat(el.getAttribute('y2') || '0');
          doc.line(mapX(x1), mapY(y1), mapX(x2), mapY(y2));
        } else if (tagName === 'polyline' || tagName === 'polygon') {
          const pointsAttr = el.getAttribute('points') || '';
          const pts = pointsAttr.trim().split(/[\s,]+/).map(Number);
          if (pts.length >= 4) {
            const pdfPoints: { x: number; y: number }[] = [];
            for (let i = 0; i < pts.length; i += 2) {
              if (!isNaN(pts[i]) && !isNaN(pts[i + 1])) {
                pdfPoints.push({ x: mapX(pts[i]), y: mapY(pts[i + 1]) });
              }
            }
            if (pdfPoints.length > 1) {
              // Draw lines between points
              for (let i = 0; i < pdfPoints.length - 1; i++) {
                doc.line(pdfPoints[i].x, pdfPoints[i].y, pdfPoints[i + 1].x, pdfPoints[i + 1].y);
              }
              if (tagName === 'polygon' && pdfPoints.length > 2) {
                doc.line(pdfPoints[pdfPoints.length - 1].x, pdfPoints[pdfPoints.length - 1].y, pdfPoints[0].x, pdfPoints[0].y);
              }
            }
          }
        } else if (tagName === 'text') {
          const tx = parseFloat(el.getAttribute('x') || '0');
          const ty = parseFloat(el.getAttribute('y') || '0');
          const textContent = el.textContent || '';
          const fontSize = parseFloat(el.getAttribute('font-size') || '12');
          const fontWeight = el.getAttribute('font-weight') || 'normal';

          doc.setFontSize(Math.max(6, fontSize * scaleY * 2.5));
          doc.setFont('helvetica', fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? 'bold' : 'normal');
          doc.text(textContent, mapX(tx), mapY(ty));
        } else if (tagName === 'path') {
          const d = el.getAttribute('d');
          if (d) {
            this.renderSimplePath(doc, d, mapX, mapY, style);
          }
        }
      });
    } catch (err) {
      console.warn('SVG Vector Embedding fallback:', err);
    }
  }

  private static applyColors(doc: jsPDF, fill: string | null, stroke: string | null, strokeWidth: number): void {
    if (fill && fill !== 'none') {
      const rgb = this.parseColorToRgb(fill);
      if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
    }
    if (stroke && stroke !== 'none') {
      const rgb = this.parseColorToRgb(stroke);
      if (rgb) doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(Math.max(0.1, strokeWidth));
    }
  }

  private static parseColorToRgb(colorStr: string): { r: number; g: number; b: number } | null {
    if (!colorStr) return null;
    const str = colorStr.trim().toLowerCase();

    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    } else if (str.startsWith('rgb')) {
      const match = str.match(/\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map((p) => parseInt(p.trim()));
        if (parts.length >= 3) {
          return { r: parts[0], g: parts[1], b: parts[2] };
        }
      }
    } else {
      // Named CSS colors
      const named: Record<string, [number, number, number]> = {
        black: [0, 0, 0],
        white: [255, 255, 255],
        red: [239, 68, 68],
        blue: [37, 99, 235],
        green: [16, 185, 129],
        emerald: [5, 150, 105],
        amber: [217, 119, 6],
        indigo: [79, 70, 229],
        slate: [71, 85, 105],
      };
      if (named[str]) {
        return { r: named[str][0], g: named[str][1], b: named[str][2] };
      }
    }
    return null;
  }

  private static renderSimplePath(
    doc: jsPDF,
    d: string,
    mapX: (x: number) => number,
    mapY: (y: number) => number,
    style: string | null
  ): void {
    // Basic SVG path segment parser for straight segments M, L, H, V, Z
    const commands = d.match(/[a-df-z]|[\d.-]+/gi);
    if (!commands) return;

    let curX = 0;
    let curY = 0;
    let startX = 0;
    let startY = 0;
    let cmd = '';

    for (let i = 0; i < commands.length; i++) {
      const token = commands[i];
      if (/^[a-df-z]$/i.test(token)) {
        cmd = token;
        continue;
      }

      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(token);
        const y = parseFloat(commands[++i]);
        curX = cmd === 'M' ? x : curX + x;
        curY = cmd === 'M' ? y : curY + y;
        startX = curX;
        startY = curY;
        cmd = cmd === 'M' ? 'L' : 'l';
      } else if (cmd === 'L' || cmd === 'l') {
        const x = parseFloat(token);
        const y = parseFloat(commands[++i]);
        const nextX = cmd === 'L' ? x : curX + x;
        const nextY = cmd === 'L' ? y : curY + y;
        doc.line(mapX(curX), mapY(curY), mapX(nextX), mapY(nextY));
        curX = nextX;
        curY = nextY;
      } else if (cmd === 'H' || cmd === 'h') {
        const x = parseFloat(token);
        const nextX = cmd === 'H' ? x : curX + x;
        doc.line(mapX(curX), mapY(curY), mapX(nextX), mapY(curY));
        curX = nextX;
      } else if (cmd === 'V' || cmd === 'v') {
        const y = parseFloat(token);
        const nextY = cmd === 'V' ? y : curY + y;
        doc.line(mapX(curX), mapY(curY), mapX(curX), mapY(nextY));
        curY = nextY;
      } else if (cmd === 'Z' || cmd === 'z') {
        doc.line(mapX(curX), mapY(curY), mapX(startX), mapY(startY));
        curX = startX;
        curY = startY;
      }
    }
  }

  /**
   * Generates a pristine Scalable Vector Company Logo SVG
   */
  public static getSampleCompanyLogoSvg(companyName: string = 'MUSTERBAU'): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect x="5" y="5" width="70" height="70" rx="12" fill="#1e3a8a" stroke="#3b82f6" stroke-width="2"/>
  <polygon points="40,15 65,45 15,45" fill="#38bdf8"/>
  <rect x="25" y="45" width="30" height="22" fill="#ffffff"/>
  <text x="90" y="42" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" fill="#0f172a">${companyName}</text>
  <text x="90" y="62" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="600" fill="#64748b">HOCH- &amp; TIEFBAU GMBH • DIN EN ISO 9001</text>
</svg>`;
  }

  /**
   * Generates a high-precision Vector Audit / Signature Stamp SVG
   */
  public static getSampleVectorSignatureSvg(
    signer: string = 'Dipl.-Ing. M. Mustermann',
    role: string = 'Projektleiter / Bauüberwachung (VOB/B)'
  ): string {
    const dateStr = new Date().toLocaleDateString('de-DE');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 90" width="280" height="90">
  <rect x="2" y="2" width="276" height="86" rx="6" fill="#f8fafc" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="2" y1="28" x2="278" y2="28" stroke="#0284c7" stroke-width="1"/>
  <text x="10" y="19" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#0369a1">✓ GEPRÜFT &amp; FREIGEGEBEN GEMÄSS VOB/B</text>
  <text x="10" y="46" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">${signer}</text>
  <text x="10" y="62" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#475569">${role}</text>
  <text x="10" y="78" font-family="Arial, Helvetica, sans-serif" font-size="9" fill="#0284c7">Datum: ${dateStr} • Digital geprüft (ID: SIG-2026-VOB)</text>
  <circle cx="240" cy="55" r="18" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="228" y="58" font-family="Arial" font-size="8" font-weight="bold" fill="#0284c7">VOB</text>
</svg>`;
  }
}
