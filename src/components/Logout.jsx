"use client";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "", icon: Icon, iconClassName = "" }) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth); // Logout dari Firebase
            router.push("/login"); // Redirect ke halaman login
        } catch (error) {
            console.error("Logout gagal:", error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
        >
            {Icon && <Icon className={`${iconClassName}`} />}
            <div className={`ml-2 ${className}`}>
                Logout
            </div>
        </button>
    );
}
