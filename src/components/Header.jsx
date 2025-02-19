// Header.jsx
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Home, Calendar, User } from "lucide-react";
import LogoutButton from "@/components/Logout";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

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

    return (
        <header className="bg-slate-700 text-white p-4 flex items-center relative">
            <button onClick={toggleDropdown} className="md:hidden">
                {isDropdownOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className="flex justify-between w-full">
                <div className="flex">
                    {isDropdownOpen && (
                        <div className="absolute top-16 left-0 w-auto bg-white shadow-md p-4 md:hidden z-50">
                            <nav>
                                <ul className="space-y-3">
                                    <li onClick={closeDropdown}>
                                        <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <Home className="w-6 h-6" />
                                            <span className="ml-2">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li onClick={closeDropdown}>
                                        <Link href="/attendance" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <Calendar className="w-6 h-6" />
                                            <span className="ml-2">Attendance</span>
                                        </Link>
                                    </li>
                                    <li onClick={closeDropdown}>
                                        <Link href="/employee" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                                            <User className="w-6 h-6" />
                                            <span className="ml-2">Employee</span>
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                    <h1 className="ml-4 text-xl font-bold">My Website</h1>
                </div>
                <div className="h-4 text-md flex items-center space-x-4 relative">
                    <button onClick={toggleAdminDropdown}>
                        <span>Admin</span>
                        <AccountCircleIcon fontSize="large" />
                    </button>
                    {isAdminDropdownOpen && (
                        <div className="absolute top-10 right-0 bg-white shadow-md p-4 w-48 z-50">
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
