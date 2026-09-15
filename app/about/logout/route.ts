import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.set({
    ...sessionCookieOptions,
    value: '',
    maxAge: 0,
  });

  return response;
}
