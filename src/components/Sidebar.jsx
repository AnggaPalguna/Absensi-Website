import Link from "next/link";
import { X } from "lucide-react";

const Sidebar = ({ isOpen }) => {
    return (
        <aside
            className={`fixed inset-y-0 left-0 w-50 bg-gray-100 p-4 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
                } transition-transform md:relative md:translate-x-0 md:w-64 md:flex`}
        >
            <div className="flex flex-col h-full">
                {/* Tombol Close di Mobile */}
                <button className="self-end md:hidden">
                    <X size={24} />
                </button>

                {/* Navigasi */}
                <nav className="mt-6">
                    <ul className="space-y-3">
                        <li>
                            <Link href="/" className="block p-2 rounded hover:bg-slate-200 text-slate-600">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/attendance" className="block p-2 rounded hover:bg-slate-200 text-slate-600">
                                Attendance
                            </Link>
                        </li>
                        <li>
                            <Link href="/employe" className="block p-2 rounded hover:bg-slate-200 text-slate-600">
                                Employe
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
