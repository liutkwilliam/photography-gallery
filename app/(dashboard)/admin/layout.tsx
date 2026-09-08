'use client';

import Buttons from "@/components/Buttons";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full px-4 text-zinc-800 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between pt-20">
          <p className="text-2xl font-bold text-zinc-100">Admin Dashboard</p>
          <form action="/api/auth/logout" method="post">
            <Buttons
              type="submit"
            >
              Sign out
            </Buttons>
          </form>
        </div>
        {children}
      </div>
    </>
  );
}
