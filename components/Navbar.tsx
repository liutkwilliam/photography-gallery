"use client";

import { useCallback, useState, useEffect } from "react";
import { BsChevronDown } from "react-icons/bs";
import NavbarItem from "./NavbarItem";
import Image from "next/image";
import { navList } from "@/constant/navList";

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
      <div className="absolute top-8 right-0 p-2 lg:hidden">
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
      if (window.scrollY >= TOP_OFFSET) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };

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
        <Image src="/logo-icon-white.svg" width={50} height={50} alt="Logo" />
        <div className="w-full flex justify-end">
          <DesktopMenu />
          <div
            onClick={toggleMobileMenu}
            className="lg:hidden flex flex-row items-center gap-2 ml-8 cursor-pointer relative text-zinc-100 text-sm font-bold"
          >
            <p>Menu</p>
            <BsChevronDown
              className={`transition ${showMobileMenu ? "rotate-180" : "rotate-0"}`}
            />
            <MobileMenu visible={showMobileMenu} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
