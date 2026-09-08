import Link from "next/link";
import React from "react";

interface SocialButtonProps {
  href: string;
  icon: React.ReactNode;
  ariaLabel?: string;
  content?: string;
}

export default function SocialButton({
  href,
  icon,
  content,
}: SocialButtonProps) {
  return (
    <>
      <Link href={href} className="text-xl hover:text-blue-500" target="_blank">
        <div className="flex items-center gap-4">
          {icon} {content}
        </div>
      </Link>
    </>
  );
}
