import { sessionCookieOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set({
    ...sessionCookieOptions,
    value: "",
    maxAge: 0,
  });

  return response;
}
