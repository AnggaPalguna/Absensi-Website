"use client";
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}