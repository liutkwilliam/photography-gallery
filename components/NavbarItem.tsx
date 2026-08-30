import Link from 'next/link';
import React from 'react';

interface NavbarItemProps {
    label: string;
    href: string;
}

const NavbarItem: React.FC<NavbarItemProps> = ({label, href}) => {
    return (
        <div className="text-white cursor-pointer hover:text-zinc-300 transition">
            <Link href={href}>{label}</Link>
        </div>
    )
}

export default NavbarItem;