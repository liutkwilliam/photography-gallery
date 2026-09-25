import Buttons from "@/components/Buttons";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div className="mx-auto w-full px-4">
        <div className="mb-6 flex items-center justify-between pt-20">
          <p className="text-2xl font-bold">Admin Dashboard</p>
          <form action="/api/auth/logout" method="post">
            <Buttons type="submit" bgColor="bg-error">Sign out</Buttons>
          </form>
        </div>
        {children}
      </div>
    </>
  );
}
