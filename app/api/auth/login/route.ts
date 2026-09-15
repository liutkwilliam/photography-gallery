import { NextResponse } from "next/server";
import { createSession, sessionCookieOptions, verifyFirebaseIdToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const user = await verifyFirebaseIdToken(idToken);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid ID token" },
        { status: 401 }
      );
    }

    const session = await createSession({
      uid: user.uid,
      email: user.email,
      role: "admin",
    });
    const response = NextResponse.json(
      { success: true, message: "Authenticated successfully" },
      { status: 200 }
    );

    response.cookies.set({
      ...sessionCookieOptions,
      value: session,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
