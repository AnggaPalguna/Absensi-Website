import Link from "next/link";
import { Home, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
    return (
        <aside className={`hidden md:block inset-y-0 left-0 z-30 bg-gray-800/5 backdrop-blur-sm p-4 ${isCollapsed ? "w-20" : "w-64"} transition-all duration-300`}>

            <button className="mb-4 hidden md:flex items-center justify-center mt-auto p-2 w-full rounded bg-slate-200 hover:bg-slate-300 text-slate-600" onClick={toggleCollapse}>
                {isCollapsed ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>
            <nav className="mt-2">
                <ul className="space-y-3">
                    <li>
                        <Link href="/" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <Home className="w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/attendance" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <Calendar className="w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Attendance</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/employe" className="flex items-center p-2 rounded hover:bg-slate-200 text-slate-600">
                            <User className="w-6 h-6" />
                            <span className={`ml-2 ${isCollapsed ? "hidden" : "block"}`}>Employee</span>
                        </Link>
                    </li>
                </ul>
            </nav>

        </aside>
    );
};

export default Sidebar;