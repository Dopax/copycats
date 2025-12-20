"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/"); // Middleware will redirect based on role if needed
                router.refresh(); // Refresh to update session in components
            }
        } catch (err) {
            setError("Something went wrong");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            <div className="bg-zinc-900 p-8 rounded-lg border border-zinc-800 w-full max-w-sm shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center">Brand OS Login</h1>
                
                {error && (
                    <div className="bg-red-900/50 text-red-200 text-sm p-3 rounded mb-4 border border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm focus:border-white focus:outline-none"
                            placeholder="user@copycatz.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm focus:border-white focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-white text-black font-medium py-2 rounded text-sm hover:bg-zinc-200 transition-colors"
                    >
                        Sign In
                    </button>
                    
                    <div className="mt-4 text-xs text-zinc-500 text-center">
                        <p>Demo Credentials:</p>
                        <p>owner@copycatz.com / password123</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
