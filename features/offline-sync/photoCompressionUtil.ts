/**
 * Client-Side Photo Compression Utility for Construction Site & Defect Tracking
 * Compresses 12MP+ camera photos to high-clarity, storage-efficient WebP/JPEG formats
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 .. 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; sizeBytes: number; originalSizeBytes: number; width: number; height: number }> {
  const maxWidth = options.maxWidth || 1920;
  const maxHeight = options.maxHeight || 1080;
  const quality = options.quality ?? 0.82;
  const mimeType = options.mimeType || 'image/jpeg';
  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Bilddatei'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Ungültiges Bildformat'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas Context konnte nicht initialisiert werden'));
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        // Estimate byte size from base64
        const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeBytes = Math.round((stringLength * 3) / 4);

        resolve({
          dataUrl,
          sizeBytes,
          originalSizeBytes,
          width,
          height,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
