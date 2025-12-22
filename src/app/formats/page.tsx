"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBrand } from "@/context/BrandContext";

interface Format {
    id: string;
    name: string;
    description: string | null;
    brandId: string | null;
    _count: {
        ads: number;
        batches: number;
    }
}

export default function FormatsPage() {
    const { selectedBrand } = useBrand();
    const [formats, setFormats] = useState<Format[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFormats = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/formats');
                if (res.ok) {
                    const data = await res.json();
                    setFormats(data);
                }
            } catch (error) {
                console.error("Failed to fetch formats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormats();
    }, []);

    const filteredFormats = selectedBrand
        ? formats.filter(f => !f.brandId || f.brandId === selectedBrand.id)
        : formats;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Ad Formats</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        View and manage ad formats used across your batches and swipe file.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading formats...</div>
                ) : filteredFormats.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">No formats found.</div>
                ) : (
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Format Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Linked Batches</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Linked Competitor Ads</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredFormats.map((format) => (
                                <tr key={format.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/formats/${format.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                                            {format.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-zinc-600 dark:text-zinc-300 max-w-sm truncate">
                                            {format.description || <span className="text-zinc-400 italic">No description</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${format._count.batches > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {format._count.batches} Batches
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${format._count.ads > 0 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {format._count.ads} Ads
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
