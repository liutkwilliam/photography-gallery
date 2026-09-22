import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

interface NavbarItemProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
}

const NavbarItem: React.FC<NavbarItemProps> = ({ icon, label, href }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={`group relative flex items-center gap-2 w-max transition ${
          isActive
            ? "text-primary"
            : "text-foreground hover:text-foreground/80"
        }`}
      >
        {icon && <span className="cursor-pointer text-3xl">{icon}</span>}
        <span className="absolute -left-16 lg:-left-2 lg:top-8 scale-0 transition-all rounded p-2 text-sm text-foreground group-hover:scale-100">
          {label}
        </span>
      </div>
    </Link>
  );
};

export default NavbarItem;
