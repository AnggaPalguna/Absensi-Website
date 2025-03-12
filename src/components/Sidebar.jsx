import Link from "next/link";
import { Home, Calendar, User, ChevronLeft, Menu, Timer } from "lucide-react";

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
    return (
        <aside className={`hidden md:block inset-y-0 left-0 z-30 bg-gray-800/5 backdrop-blur-sm p-4 ${isCollapsed ? "w-20" : "w-52"} transition-all duration-300`}>
            
            <button 
                className="mb-4 hidden md:flex items-center justify-center mt-auto p-2 w-full rounded hover:bg-slate-300 text-slate-600"
                onClick={toggleCollapse}
            >
                {isCollapsed ? <Menu className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6 ml-auto" />}
            </button>
            
            <nav className="mt-6">
                <ul className="space-y-6">
                    <li>
                        <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <Home className="ml-1 w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Beranda</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/attendance" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <Calendar className="ml-1 w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Absensi</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/employee" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <User className="ml-1 w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Karyawan</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/Time" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <Timer className="ml-1 w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Waktu</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
