import { CompressedPayload } from './outboxTypes';

export class PayloadCompressionUtil {
  /**
   * Compresses any string, JSON object, or binary data using GZIP / Deflate
   */
  public static async compress(
    input: string | object | Uint8Array,
    algorithm: 'gzip' | 'deflate' = 'gzip'
  ): Promise<CompressedPayload> {
    const startTime = performance.now();
    let uncompressedBytes: Uint8Array;

    if (input instanceof Uint8Array) {
      uncompressedBytes = input;
    } else if (typeof input === 'string') {
      uncompressedBytes = new TextEncoder().encode(input);
    } else {
      uncompressedBytes = new TextEncoder().encode(JSON.stringify(input));
    }

    const originalSizeBytes = uncompressedBytes.byteLength;

    // Use native Web Streams CompressionStream if supported
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new Blob([uncompressedBytes])
          .stream()
          .pipeThrough(new CompressionStream(algorithm));
        
        const response = new Response(stream);
        const compressedBuffer = await response.arrayBuffer();
        const compressedBytes = new Uint8Array(compressedBuffer);
        const compressedSizeBytes = compressedBytes.byteLength;

        const dataBase64 = this.uint8ArrayToBase64(compressedBytes);
        const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
        const compressionRatio =
          originalSizeBytes > 0
            ? Math.round((1 - compressedSizeBytes / originalSizeBytes) * 1000) / 10
            : 0;

        return {
          dataBase64,
          algorithm,
          originalSizeBytes,
          compressedSizeBytes,
          compressionRatio,
          durationMs,
        };
      } catch (err) {
        console.warn('Native CompressionStream failed, fallback to raw', err);
      }
    }

    // Fallback: raw Base64 without stream compression
    const dataBase64 = this.uint8ArrayToBase64(uncompressedBytes);
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      dataBase64,
      algorithm: 'raw',
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      compressionRatio: 0,
      durationMs,
    };
  }

  /**
   * Decompresses a previously compressed payload back to JSON or raw string
   */
  public static async decompress<T = any>(payload: CompressedPayload): Promise<T> {
    const compressedBytes = this.base64ToUint8Array(payload.dataBase64);

    if (payload.algorithm === 'raw' || typeof DecompressionStream === 'undefined') {
      const text = new TextDecoder().decode(compressedBytes);
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }

    try {
      const stream = new Blob([compressedBytes])
        .stream()
        .pipeThrough(new DecompressionStream(payload.algorithm));
      
      const response = new Response(stream);
      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } catch (err) {
      console.error('Decompression error, fallback to raw parse', err);
      const text = new TextDecoder().decode(compressedBytes);
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }
  }

  /**
   * Compresses photo or PDF data URLs to high-density GZIP packages
   */
  public static async compressMediaDataUrl(
    dataUrl: string
  ): Promise<{ compressedPayload: CompressedPayload; savingsSummary: string }> {
    const payload = await this.compress(dataUrl, 'gzip');
    const savingsBytes = Math.max(0, payload.originalSizeBytes - payload.compressedSizeBytes);
    const savingsKB = (savingsBytes / 1024).toFixed(1);
    const summary = `${payload.compressionRatio}% komprimiert (${savingsKB} KB eingespart in ${payload.durationMs}ms)`;
    return { compressedPayload: payload, savingsSummary: summary };
  }

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
