"use client";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("isCollapsed") === "true";
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem("isCollapsed", isCollapsed);
    }, [isCollapsed]);

    return (
        <div className="flex flex-col h-screen">
            {/* Header tetap di atas */}
            <Header />

            {/* Wrapper utama: Sidebar + Konten */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar tetap tidak bisa di-scroll */}
                <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />

                {/* Konten yang bisa di-scroll */}
                <div className="flex flex-col flex-1 overflow-y-auto">
                    <main className="flex-1 p-6">{children}</main>
                    {/* Footer tetap di bawah saat konten sedikit & hanya muncul saat scroll mentok */}
                    <Footer/>
                </div>
            </div>
        </div>
    );
}
