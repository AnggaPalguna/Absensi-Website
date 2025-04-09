import Link from "next/link";
import { Home, Calendar, User, Timer } from "lucide-react";
import Image from 'next/image';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
    // Menu items yang sama dengan yang ada di Header
    const navItems = [
        { href: "/dashboard", icon: <Home className="w-6 h-6" />, text: "Beranda" },
        { href: "/attendance", icon: <Calendar className="w-6 h-6" />, text: "Absensi" },
        { href: "/employee", icon: <User className="w-6 h-6" />, text: "Karyawan" },
        { href: "/Time", icon: <Timer className="w-6 h-6" />, text: "Waktu" }
    ];

    return (
        <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-48"}`}>
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                <div className="flex items-center">
                <Image 
                    src="/img/logo.png" 
                    alt="Attendance System Logo" 
                    width={32} 
                    height={32} 
                    className="h-8 w-8 "
                />
                    {!isCollapsed && (
                        <span className="font-bold text-blue-700 text-xl ml-2">
                            Absensi LPD
                        </span>
                    )}
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-grow py-4 px-3">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link 
                                href={item.href} 
                                className={`flex items-center rounded-lg p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                                    isCollapsed ? "justify-center" : "justify-start"
                                }`}
                            >
                                <div className={`${isCollapsed ? "" : "mr-3"} text-blue-600`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && <span className="font-medium">{item.text}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            
            {/* Collapse Button */}
            {/* <div className="p-4 border-t border-gray-200">
                <button 
                    onClick={toggleCollapse}
                    className={`w-full flex items-center p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors ${
                        isCollapsed ? "justify-center" : "justify-between"
                    }`}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {!isCollapsed && <span className="font-medium">Collapse</span>}
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div> */}
        </aside>
    );
};

export default Sidebar;