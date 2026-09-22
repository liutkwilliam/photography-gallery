"use client";

import { useCallback, useState, useEffect } from "react";
import { BsChevronDown } from "react-icons/bs";
import NavbarItem from "./NavbarItem";
import Image from "next/image";
import { navList } from "@/constant/navList";
import Link from "next/link";

const TOP_OFFSET = 66;

interface MobileMenuProps {
  visible?: boolean;
}

const Menu = () => {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {navList.map((item) => (
        <NavbarItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
        />
      ))}
    </div>
  );
};

const DesktopMenu = () => {
  return (
    <div className="hidden lg:block">
      <Menu />
    </div>
  );
};

const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  if (!visible) {
    return null;
  } else {
    return (
      <div className="absolute top-8 right-0 px-3 py-4 lg:hidden bg-background rounded-full">
        <Menu />
      </div>
    );
  }
};

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackground(window.scrollY >= TOP_OFFSET);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu((current) => !current);
  }, []);

  return (
    <nav className="w-full fixed z-9999 select-none">
      <div
        className={`px-4 py-6 flex items-center transition duration-500
                ${showBackground ? "bg-background bg-opacity-50" : ""}
                `}
      >
        <Link href="/">
          <Image src="/photo-logo-icon-white.png" width={80} height={60} alt="Logo" />
        </Link>

        <div className="w-full flex justify-end">
          <DesktopMenu />
          <div
            onClick={toggleMobileMenu}
            className="lg:hidden flex flex-row items-center gap-2 ml-8 cursor-pointer relative text-foreground text-sm font-bold"
          >
            <p
              className={`transition ${showMobileMenu ? "font-bold text-primary" : ""}`}
            >
              Menu
            </p>
            <BsChevronDown
              className={`transition ${showMobileMenu ? "rotate-180 text-primary" : "rotate-0"}`}
            />
            <MobileMenu visible={showMobileMenu} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
