"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand, Brand } from "@/context/BrandContext";
import { signOut, useSession } from "next-auth/react";

export default function Home() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { setSelectedBrand } = useBrand();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");

    useEffect(() => {
        console.log("Session Status:", status, session);
        fetchBrands();
    }, [session, status]);

    const fetchBrands = async () => {
        try {
            const res = await fetch("/api/brands");
            if (res.ok) {
                setBrands(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        router.push("/batches");
    };

    const handleCreateBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        // Random pastel color
        const colors = ["#FCA5A5", "#FDBA74", "#FDE047", "#86EFAC", "#67E8F9", "#93C5FD", "#C4B5FD", "#F0ABFC"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        try {
            const res = await fetch("/api/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newBrandName, color: randomColor })
            });

            if (res.ok) {
                const newBrand = await res.json();
                setBrands([...brands, newBrand]);
                setIsCreating(false);
                setNewBrandName("");
                // Optional: Auto select? No, let them click.
            }
        } catch (error) {
            console.error("Failed to create brand", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700">
            <h1 className="text-4xl md:text-5xl font-bold mb-12 text-zinc-100 tracking-tight">Who's working today?</h1>

            {isLoading ? (
                <div className="flex gap-4">
                    <div className="w-32 h-32 rounded-md bg-zinc-800 animate-pulse" />
                    <div className="w-32 h-32 rounded-md bg-zinc-800 animate-pulse" />
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-8">
                    {brands.map((brand) => (
                        <div
                            key={brand.id}
                            className="group flex flex-col items-center gap-4 cursor-pointer"
                            onClick={() => handleSelectBrand(brand)}
                        >
                            <div className="w-32 h-32 rounded-md transition-all duration-300 transform group-hover:scale-110 group-hover:ring-4 ring-zinc-100 overflow-hidden relative flex items-center justify-center text-4xl font-bold text-zinc-800"
                                style={{ backgroundColor: brand.color || "#e4e4e7" }}
                            >
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
                                ) : (
                                    brand.name.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                            <span className="text-zinc-400 text-lg group-hover:text-white transition-colors">{brand.name}</span>
                        </div>
                    ))}

                    {/* Add Profile Button */}
                    <div
                        className="group flex flex-col items-center gap-4 cursor-pointer"
                        onClick={() => setIsCreating(true)}
                    >
                        <div className="w-32 h-32 rounded-full border-2 border-zinc-500 hover:border-zinc-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-zinc-800">
                            <svg className="w-12 h-12 text-zinc-500 group-hover:text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-zinc-500 text-lg group-hover:text-white transition-colors">Add Brand</span>
                    </div>
                </div>
            )}

            <div className="mt-16">
                <button className="px-6 py-2 border border-zinc-600 text-zinc-500 uppercase tracking-widest text-sm hover:border-white hover:text-white transition-colors">
                    Manage Profiles
                </button>
            </div>

            <div className="absolute top-6 right-6 flex flex-col items-end gap-2 text-right">
                 <button 
                    onClick={async () => {
                        // eslint-disable-next-line no-alert
                        if(!confirm("Attempting to sign out. OK?")) return;
                        try {
                            // eslint-disable-next-line no-console
                            console.log("Signing out...");
                            await signOut({ callbackUrl: "/login", redirect: true });
                        } catch(e) {
                            alert("SignOut Error: " + e);
                        }
                    }}
                    className="text-zinc-500 hover:text-white text-sm transition-colors uppercase tracking-wider border border-zinc-700 px-3 py-1 rounded"
                >
                    Sign Out
                </button>
                <div className="text-[10px] text-zinc-600 font-mono">
                    Status: {status}<br/>
                    User: {session?.user?.email || "None"}
                </div>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setIsCreating(false)}>
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-white mb-6">Add Brand Profile</h2>
                        <form onSubmit={handleCreateBrand}>
                            <div className="mb-6">
                                <label className="block text-zinc-400 text-sm mb-2">Brand Name</label>
                                <input
                                    type="text"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-600 rounded p-3 text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Davincified"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white border border-zinc-600 hover:border-white uppercase tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-zinc-200"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
