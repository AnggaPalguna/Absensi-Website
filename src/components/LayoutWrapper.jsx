"use client";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Ambil dari localStorage saat pertama kali render
        if (typeof window !== "undefined") {
            return localStorage.getItem("isCollapsed") === "true";
        }
        return false;
    });

    // Simpan status ke localStorage setiap kali berubah
    useEffect(() => {
        localStorage.setItem("isCollapsed", isCollapsed);
    }, [isCollapsed]);

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
