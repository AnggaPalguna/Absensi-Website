import { Menu } from "lucide-react";

const Header = ({ toggleSidebar }) => {
    return (
        <header className="bg-slate-700 text-white p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">My Website</h1>
            <button onClick={toggleSidebar} className="md:hidden">
                <Menu size={28} />
            </button>
        </header>
    );
};

export default Header;
