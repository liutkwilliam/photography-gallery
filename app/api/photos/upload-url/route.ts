// app/api/photos/upload-url/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizePublicDomain(domain: string): string {
  const trimmedDomain = domain
    .trim()
    .replace(/\s+#.*$/, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');
  return /^https?:\/\//i.test(trimmedDomain) ? trimmedDomain : `https://${trimmedDomain}`;
}

function sanitizePathSegment(value: string): string {
  return value.trim().replace(/[\\/]+/g, '-');
}

function encodeObjectKeyForUrl(objectKey: string): string {
  return objectKey.split('/').map(encodeURIComponent).join('/');
}

export async function POST(request: Request) {
  try {
    const { fileName, fileType, collection } = await request.json();
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const accountId = getRequiredEnv('CLOUDFLARE_ACCOUNT_ID');
    const bucketName = getRequiredEnv('R2_BUCKET_NAME');
    const publicDomain = normalizePublicDomain(getRequiredEnv('NEXT_PUBLIC_R2_PUBLIC_DOMAIN'));
    const contentType = typeof fileType === 'string' && fileType ? fileType : 'application/octet-stream';
    const collectionSegment =
      typeof collection === 'string' && collection.trim()
        ? sanitizePathSegment(collection)
        : 'uncategorized';
    const safeFileName = sanitizePathSegment(fileName);
    const objectKey = `photos/${collectionSegment}/${Date.now()}-${safeFileName}`;

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
      },
      // Disable automatic checksum calculation for presigned URLs
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicImageUrl = `${publicDomain}/${encodeObjectKeyForUrl(objectKey)}`;

    return NextResponse.json({ uploadUrl, objectKey, publicImageUrl });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
