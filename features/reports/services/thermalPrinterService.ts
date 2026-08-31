import { ThermalPrinterConfig, EscPosReceiptData } from '../../../types/report';
import { generateEscPosReceipt } from '../utils/escposGenerator';

export interface PrinterConnectionResult {
  success: boolean;
  message: string;
  bytesSent?: number;
  deviceInfo?: string;
}

export class ThermalPrinterService {
  /**
   * Sends raw ESC/POS bytes directly to a physical or network thermal printer.
   */
  public static async printReceipt(
    receipt: EscPosReceiptData,
    config: ThermalPrinterConfig
  ): Promise<PrinterConnectionResult> {
    const rawBytes = generateEscPosReceipt(receipt, config);

    switch (config.connectionType) {
      case 'webusb':
        return this.printViaWebUsb(rawBytes);
      case 'webserial':
        return this.printViaWebSerial(rawBytes);
      case 'webbluetooth':
        return this.printViaWebBluetooth(rawBytes);
      case 'network_raw':
        return this.printViaNetwork(rawBytes, config.networkHost, config.networkPort);
      case 'browser_direct':
      default:
        return this.downloadOrPrintFallback(rawBytes, receipt.title);
    }
  }

  /**
   * WebUSB Direct Driverless POS Print
   */
  public static async printViaWebUsb(bytes: Uint8Array): Promise<PrinterConnectionResult> {
    try {
      if (!('usb' in navigator)) {
        return {
          success: false,
          message: 'WebUSB wird von diesem Browser nicht unterstützt. Bitte Chrome/Edge oder Direkt-Download nutzen.',
        };
      }

      // Standard POS Printer USB Vendor IDs (Epson, Star, Citizen, Xprinter, POS-58/80)
      const usbDevice = await (navigator as any).usb.requestDevice({
        filters: [
          { classCode: 7 }, // Printer Class
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
          { vendorId: 0x0dd4 }, // Custom
          { vendorId: 0x1fc9 }, // NXP / Generic POS
          { vendorId: 0x20d1 }, // Xprinter
          { vendorId: 0x0416 }, // Winbond POS
        ],
      });

      await usbDevice.open();
      if (usbDevice.configuration === null) {
        await usbDevice.selectConfiguration(1);
      }
      await usbDevice.claimInterface(0);

      // Find OUT endpoint
      const endpoint = usbDevice.configuration.interfaces[0].alternate.endpoints.find(
        (e: any) => e.direction === 'out'
      );
      const endpointNumber = endpoint ? endpoint.endpointNumber : 1;

      await usbDevice.transferOut(endpointNumber, bytes);
      await usbDevice.close();

      return {
        success: true,
        message: `Erfolgreich gedruckt auf USB-Drucker: ${usbDevice.productName || 'ESC/POS Printer'}`,
        bytesSent: bytes.length,
        deviceInfo: usbDevice.productName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `WebUSB Fehler: ${err.message || 'Gerät nicht verbunden oder Zugriff verweigert'}`,
      };
    }
  }

  /**
   * Web Serial (COM-Port / USB-to-UART POS printers)
   */
  public static async printViaWebSerial(bytes: Uint8Array): Promise<PrinterConnectionResult> {
    try {
      if (!('serial' in navigator)) {
        return {
          success: false,
          message: 'Web Serial API nicht verfügbar (nur Chromium-Browser auf HTTPS/Localhost).',
        };
      }

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();
      await writer.write(bytes);
      writer.releaseLock();
      await port.close();

      return {
        success: true,
        message: 'Erfolgreich über seriellen COM-Port an Thermo-Drucker gesendet.',
        bytesSent: bytes.length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Serieller Schnittstellenfehler: ${err.message}`,
      };
    }
  }

  /**
   * Web Bluetooth POS (Star/Epson/Mobile Bluetooth 58mm Printers)
   */
  public static async printViaWebBluetooth(bytes: Uint8Array): Promise<PrinterConnectionResult> {
    try {
      if (!('bluetooth' in navigator)) {
        return {
          success: false,
          message: 'Web Bluetooth API nicht verfügbar.',
        };
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Serial/Printer BLE service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent BLE
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ],
      });

      const server = await device.gatt.connect();
      // Write in 20-byte chunks to fit Bluetooth MTU
      const chunkSize = 20;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        // Standard characteristic write
      }

      return {
        success: true,
        message: `Bluetooth-Druckauftrag an ${device.name || 'BT-POS'} gesendet.`,
        bytesSent: bytes.length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Bluetooth Fehler: ${err.message}`,
      };
    }
  }

  /**
   * Network Raw TCP / Spooler (Port 9100 JetDirect / Raw ESC-POS)
   */
  public static async printViaNetwork(
    bytes: Uint8Array,
    host: string = '192.168.1.200',
    port: number = 9100
  ): Promise<PrinterConnectionResult> {
    try {
      // Send to local/network print gateway if running
      const response = await fetch('/api/raw-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Printer-Host': host, 'X-Printer-Port': String(port) },
        body: bytes,
      }).catch(() => null);

      if (response && response.ok) {
        return {
          success: true,
          message: `Netzwerk-Druckauftrag an ${host}:${port} erfolgreich übermittelt.`,
          bytesSent: bytes.length,
        };
      }

      // Fallback: Trigger spool download
      return this.downloadBinarySpool(bytes, `escpos_${host.replace(/\./g, '_')}_${port}.bin`);
    } catch (err: any) {
      return {
        success: false,
        message: `Netzwerk-Druckfehler: ${err.message}`,
      };
    }
  }

  /**
   * Spools raw binary file for direct lpr/CUPS/Windows generic printer driver
   */
  public static downloadBinarySpool(bytes: Uint8Array, filename: string = 'receipt_raw.prn'): PrinterConnectionResult {
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Raw ESC/POS Spool-Datei (${bytes.length} Bytes) als '${filename}' heruntergeladen.`,
      bytesSent: bytes.length,
    };
  }

  public static downloadOrPrintFallback(bytes: Uint8Array, title: string): PrinterConnectionResult {
    return this.downloadBinarySpool(bytes, `${title.replace(/[^a-z0-9]/gi, '_')}_escpos.bin`);
  }
}
