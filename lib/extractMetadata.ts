// lib/extractMetadata.ts
import exifr from 'exifr';
import { PhotoMetadata, UserInputBatchData } from '@/types/photo';

// Helper to convert seconds (e.g. 0.004) to standard fraction string ("1/250")
function formatShutterSpeed(exposureTime?: number): string | null {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}`;
}

export async function processPhotoBatch(
  files: File[],
  userInput: UserInputBatchData
): Promise<PhotoMetadata[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        // Parse relevant EXIF tags only for performance
        const exif = await exifr.parse(file, [
          'DateTimeOriginal',
          'CreateDate',
          'ISO',
          'ExposureTime',
          'FNumber',
          'FocalLength',
          'Model',
          'LensModel',
          'latitude',
          'longitude',
        ]);

        const rawDate: Date | undefined = exif?.DateTimeOriginal || exif?.CreateDate;
        
        // Prefer EXIF embedded GPS, fallback to user-provided GPS
        const latitude = exif?.latitude ?? userInput.gps?.latitude ?? null;
        const longitude = exif?.longitude ?? userInput.gps?.longitude ?? null;

        const metadata: PhotoMetadata = {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileSize: file.size,
          
          dateTime: rawDate ? rawDate.toISOString() : null,
          dateOnly: rawDate ? rawDate.toISOString().split('T')[0] : null,
          timeOnly: rawDate ? rawDate.toTimeString().split(' ')[0] : null,
          
          iso: exif?.ISO ?? null,
          shutterSpeed: formatShutterSpeed(exif?.ExposureTime),
          shutterSpeedValue: exif?.ExposureTime ?? null,
          aperture: exif?.FNumber ?? null,
          focalLength: exif?.FocalLength ?? null,
          lensModel: exif?.LensModel ?? null,
          cameraModel: exif?.Model ?? null,

          gps: latitude !== null && longitude !== null ? { latitude, longitude } : null,
          category: userInput.category,
          collection: userInput.collection,
          locationName: userInput.locationName?.trim() || null,
          tags: userInput.tags,
        };

        return metadata;
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        // Fallback for files without readable EXIF data
        return {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileSize: file.size,
          dateTime: null,
          dateOnly: null,
          timeOnly: null,
          iso: null,
          shutterSpeed: null,
          shutterSpeedValue: null,
          aperture: null,
          focalLength: null,
          lensModel: null,
          cameraModel: null,
          gps: userInput.gps ?? null,
          category: userInput.category,
          collection: userInput.collection,
          locationName: userInput.locationName?.trim() || null,
          tags: userInput.tags,
        };
      }
    })
  );

  return results;
}
