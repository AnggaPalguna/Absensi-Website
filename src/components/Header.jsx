import { Menu, X, Home, Calendar, User, UserCircle, Timer, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "@/components/Logout";
import Image from 'next/image';

const Header = ({ isCollapsed, toggleCollapse }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const adminDropdownRef = useRef(null);
    const adminButtonRef = useRef(null);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleAdminDropdown = () => {
        setIsAdminDropdownOpen(!isAdminDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    const closeAdminDropdown = () => {
        setIsAdminDropdownOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            // Check if click is outside the mobile menu dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
            
            // Check if click is outside the admin dropdown and not on the admin button
            if (
                isAdminDropdownOpen && 
                adminDropdownRef.current && 
                !adminDropdownRef.current.contains(event.target) &&
                adminButtonRef.current && 
                !adminButtonRef.current.contains(event.target)
            ) {
                closeAdminDropdown();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isAdminDropdownOpen]);

    // Menu items yang sama untuk desktop dan mobile
    const navItems = [
        { href: "/dashboard", icon: <Home className="w-5 h-5" />, text: "Beranda" },
        { href: "/attendance", icon: <Calendar className="w-5 h-5" />, text: "Absensi" },
        { href: "/employee", icon: <User className="w-5 h-5" />, text: "Karyawan" },
        { href: "/Time", icon: <Timer className="w-5 h-5" />, text: "Waktu" }
    ];

    return (
        <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg sticky top-0">
            <div className="mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo dan Hamburger Menu */}
                    <div className="flex items-center">
                        <button 
                            onClick={toggleDropdown} 
                            className="md:hidden mr-3 focus:outline-none focus:ring-2 focus:ring-white rounded-md p-1"
                            aria-expanded={isDropdownOpen}
                            aria-label="Toggle mobile navigation menu"
                        >
                            {isDropdownOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="h-16 md:hidden flex items-center justify-center -mt-1">
                            <div className="flex items-center">
                            <Image 
                                src="/img/logo.png" 
                                alt="Attendance System Logo" 
                                width={32} 
                                height={32} 
                                className="h-6 w-6"
                            />
                            <span className="font-bold mt-1 text-white text-base ml-1">
                                Absensi LPD
                            </span>
                            </div>
                        </div>
                        
                        {/* Hamburger untuk desktop yang mengontrol sidebar */}
                        <button 
                            onClick={toggleCollapse} 
                            className="hidden mr-3 md:flex focus:outline-none focus:ring-2 focus:ring-white rounded-md p-1"
                            aria-label="Toggle sidebar"
                        >
                            {isCollapsed ? <Menu size={24}/> : <ChevronLeft className="w-6 h-6" />}
                        </button>
                        
                    </div>

                    {/* Admin Profile Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={toggleAdminDropdown} 
                            className="flex items-center space-x-2 py-2 px-3 rounded-full hover:bg-blue-700 transition-colors duration-200"
                            aria-expanded={isAdminDropdownOpen}
                            aria-label="Admin menu"
                            ref={adminButtonRef}
                        >
                            <span className="hidden sm:inline">Admin</span>
                            <UserCircle className="w-7 h-7" />
                        </button>
                        
                        {isAdminDropdownOpen && (
                            <div 
                                className="absolute top-14 right-0 bg-white rounded-md shadow-lg py-2 w-48 z-50 animate-fadeIn"
                                ref={adminDropdownRef}
                            >
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-800">Admin</p>
                                    <p className="text-xs text-gray-500">i**@mail.com</p>
                                </div>
                                <div className="mt-2 px-2">
                                    <LogoutButton />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu Mobile Dropdown */}
            {isDropdownOpen && (
                <div 
                    className="md:hidden absolute top-15 rounded-md shadow-lg bg-white border-t border-blue-700" 
                    ref={dropdownRef}
                >
                    <nav className="px-2 pt-2 pb-4">
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.href} onClick={closeDropdown}>
                                    <Link 
                                        href={item.href} 
                                        className="flex items-center space-x-3 px-3 py-3 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                    >
                                        <span className="flex-shrink-0 text-blue-600">{item.icon}</span>
                                        <span className="font-medium">{item.text}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;