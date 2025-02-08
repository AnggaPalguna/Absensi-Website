"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={isSidebarOpen} />
                <main className="flex-1 p-6 flex flex-col">{children}</main>
            </div>
            <Footer className="mt-auto" />
        </div>
    );
}
