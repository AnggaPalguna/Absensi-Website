// Header.jsx
import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Home, Calendar, User,UserCircle, Timer } from "lucide-react";
import LogoutButton from "@/components/Logout";

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const adminDropdownRef = useRef(null);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleAdminDropdown = () => {
        setIsAdminDropdownOpen(!isAdminDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
        setIsAdminDropdownOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)
            ) {
                closeDropdown();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-slate-700 text-white p-4 flex items-center">
            <button onClick={toggleDropdown} className="md:hidden">
                {isDropdownOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className="flex justify-between w-full">
                <div className="flex" ref={dropdownRef}>
                    {isDropdownOpen && (
                        <div className="absolute top-16 left-0 w-auto bg-white shadow-md p-4 md:hidden z-50">
                            <nav>
                                <ul className="space-y-3">
                                    <li onClick={closeDropdown}>
                                        <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <Home className="w-6 h-6" />
                                            <span className="ml-2">Beranda</span>
                                        </Link>
                                    </li>
                                    <li onClick={closeDropdown}>
                                        <Link href="/attendance" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <Calendar className="w-6 h-6" />
                                            <span className="ml-2">Absensi</span>
                                        </Link>
                                    </li>
                                    <li onClick={closeDropdown}>
                                        <Link href="/employee" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <User className="w-6 h-6" />
                                            <span className="ml-2">Karyawan</span>
                                        </Link>
                                    </li>
                                    <li onClick={closeDropdown}>
                                        <Link href="/Time" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <Timer className="w-6 h-6" />
                                            <span className="ml-2">Waktu</span>
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                    <h1 className="ml-5 text-xl font-bold mt-1">My Website</h1>
                </div>
                <div className="text-md flex items-center space-x-4 relative" ref={adminDropdownRef}>
                    <button onClick={toggleAdminDropdown} className="flex items-center space-x-2 mr-2">
                        <span>Admin</span>
                        <UserCircle className="w-8 h-8" />
                    </button>
                    {isAdminDropdownOpen && (
                        <div className="absolute top-16 right-0 bg-white shadow p-4 w-48 z-50">
                            <ul className="space-y-3">
                                <li onClick={closeDropdown}>
                                    <LogoutButton />
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
