import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifySession } from '@/lib/auth';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPhotoId(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/');
  return decodeURIComponent(segments[segments.length - 1] ?? '');
}

function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${getRequiredEnv('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export async function DELETE(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const photoId = getPhotoId(request);
  if (!photoId) {
    return NextResponse.json({ error: 'Photo id is required' }, { status: 400 });
  }

  try {
    const photoRef = doc(db, 'photos', photoId);
    const photoSnapshot = await getDoc(photoRef);

    if (!photoSnapshot.exists()) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photoData = photoSnapshot.data();
    const objectKey = typeof photoData.r2ObjectKey === 'string' ? photoData.r2ObjectKey : null;

    if (objectKey) {
      await createR2Client().send(
        new DeleteObjectCommand({
          Bucket: getRequiredEnv('R2_BUCKET_NAME'),
          Key: objectKey,
        }),
      );
    }

    await deleteDoc(photoRef);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
