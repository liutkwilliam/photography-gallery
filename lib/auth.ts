export type SessionPayload = {
  uid: string;
  email?: string;
  role: 'admin';
  exp: number;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!secret) {
    throw new Error('Missing SESSION_SECRET, JWT_SECRET_KEY, or Firebase configuration');
  }

  return secret;
}

function getFirebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');
  }

  return apiKey;
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes =
    typeof value === 'string'
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signPayload(payload: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );

  return base64UrlEncode(signature);
}

export async function createSession(payload: Omit<SessionPayload, 'exp'>) {
  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySession(cookie: string) {
  const [encodedPayload, signature] = cookie.split('.');

  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.uid || payload.role !== 'admin') return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function verifyFirebaseIdToken(idToken: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${getFirebaseApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = data.users?.[0];

  if (!user?.localId) return null;

  return {
    uid: user.localId,
    email: user.email,
  };
}

export const sessionCookieOptions = {
  name: 'session',
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
