"use client"

import { useCallback, useState, useEffect } from 'react';
import { BsChevronDown} from 'react-icons/bs'
import NavbarItem from "./NavbarItem";
import MobileMenu from "./MobileMenu";
import Image from 'next/image';
import { navList } from '@/constant/navList';

const TOP_OFFSET = 66;

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
        }

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setShowMobileMenu((current) => !current);
    }, []);

    return (
        <nav className="w-full fixed z-9999">
            <div className={`
                px-4
                md:px-16
                py-6
                flex
                flex-row
                items-center
                transition
                duration-500
                ${showBackground ? 'bg-background bg-opacity-50' : ''}
                `}
            >
                <Image src="/logo-icon-white.svg" width={40} height={40} alt="Logo" />
                <div className="flex-row ml-8 gap-7 hidden lg:flex">
                    {navList.map((item) => (
                        <NavbarItem key={item.label} label={item.label} href={item.href} />
                    ))}
                </div>
                <div onClick={toggleMobileMenu} className="lg:hidden flex flex-row items-center gap-2 ml-8 cursor-pointer relative">
                    <p className="text-white text-sm">Menu</p>
                    <BsChevronDown className={`text-white transition ${showMobileMenu ? 'rotate-180' : 'rotate-0'}`} />
                    <MobileMenu visible={showMobileMenu} />
                </div>
            </div>
        </nav>
    )
}

export default Navbar;