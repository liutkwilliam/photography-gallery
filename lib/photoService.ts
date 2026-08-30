// lib/photoService.ts
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PhotoMetadata } from '@/types/photo';

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
}

export async function uploadPhotoBatch(
  file: File,
  metadata: PhotoMetadata
) {
  // 1. Get Presigned Upload URL for Cloudflare R2
  const urlRes = await fetch('/api/photos/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      collection: metadata.collection,
    }),
  });

  if (!urlRes.ok) {
    const errorBody = await urlRes.json().catch(() => null);
    throw new Error(errorBody?.error ?? 'Failed to fetch presigned URL');
  }
  const { uploadUrl, objectKey, publicImageUrl } = await urlRes.json();

  // 2. Upload file binary DIRECTLY from browser to Cloudflare R2
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed for file: ${file.name} (${uploadRes.status})`);
  }

  // 3. Prepare Firestore document schema
  const photoDoc: Record<string, unknown> = removeUndefinedFields({
    fileName: metadata.fileName,
    fileSize: metadata.fileSize,
    imageUrl: publicImageUrl,
    r2ObjectKey: objectKey,
    
    dateTime: metadata.dateTime ? new Date(metadata.dateTime) : null,
    dateOnly: metadata.dateOnly,
    timeOnly: metadata.timeOnly,
    
    iso: metadata.iso,
    shutterSpeed: metadata.shutterSpeed,
    shutterSpeedValue: metadata.shutterSpeedValue,
    aperture: metadata.aperture,
    focalLength: metadata.focalLength,
    cameraModel: metadata.cameraModel,
    lensModel: metadata.lensModel,

    category: metadata.category,
    collectionName: metadata.collection,
    locationName: metadata.locationName,
    tags: metadata.tags ?? [],
    createdAt: serverTimestamp(),
  });

  // Convert GPS coordinates into native Firestore GeoPoint
  if (metadata.gps?.latitude != null && metadata.gps?.longitude != null) {
    photoDoc.location = new GeoPoint(metadata.gps.latitude, metadata.gps.longitude);
  }

  // 4. Save metadata document in Firestore 'photos' collection
  const docRef = await addDoc(collection(db, 'photos'), photoDoc);

  return { id: docRef.id, ...photoDoc, imageUrl: publicImageUrl };
}
