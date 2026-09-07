import { createElement } from "react";
import { IoIosContact, IoIosHome, IoMdPhotos } from "react-icons/io";
import { FaMapLocationDot } from "react-icons/fa6";

export interface NavItem {
  icon?: React.ReactNode;
  label: string;
  href: string;
}

export const navList = [
  { label: "Home", href: "/",  icon: createElement(IoIosHome)},
  { label: "Gallery", href: "/gallery", icon: createElement(IoMdPhotos) },
  { label: "Map", href: "/map", icon: createElement(FaMapLocationDot) },
  { label: "About", href: "/about", icon: createElement(IoIosContact) },
];