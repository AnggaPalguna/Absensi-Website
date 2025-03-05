'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { app } from '../../firebase-config';
import { Lock } from 'lucide-react';

const auth = getAuth(app);

// Set persistence agar user harus login kembali setelah keluar browser
setPersistence(auth, browserSessionPersistence);

export const Form = ({ setLoading }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential) {
                router.push(callbackUrl);
            }
        } catch (err) {
            let errorMessage = "Login gagal. Periksa email atau password!";
            if (err.code === "auth/user-not-found") errorMessage = "Pengguna tidak ditemukan!";
            if (err.code === "auth/wrong-password") errorMessage = "Password salah!";
            if (err.code === "auth/too-many-requests") errorMessage = "Terlalu banyak percobaan. Coba lagi nanti.";
            setError(errorMessage);
            setLoading(false);
        } 
    };

    return (
        <div className="w-full sm:w-[400px] p-8">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && <Alert variant="destructive">{error}</Alert>}
                <div className="mt-2">
                    <Button type="submit" className="w-full py-2" size="lg">
                        <Lock className="mr-2 h-5 w-5" /> Login
                    </Button>
                </div>
            </form>
        </div>
    );
};
