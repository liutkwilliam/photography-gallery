import Buttons from "@/components/Buttons";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full px-4 text-zinc-800 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end pt-16">
          <form action="/api/auth/logout" method="post">
            <Buttons
              type="submit"
              additionalClasses="border border-zinc-300 bg-primary text-zinc-700 hover:bg-primary-hover"
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
