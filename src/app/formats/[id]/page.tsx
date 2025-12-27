"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageLoader } from "@/components/LoadingSpinner";

interface LinkedAd {
    id: string;
    headline: string;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
}

interface LinkedBatch {
    id: number;
    name: string;
    status: string;
    createdAt: string;
}

interface FormatDetail {
    id: string;
    name: string;
    description: string | null;
    ads: LinkedAd[];
    batches: LinkedBatch[];
}

function getPlayableUrl(url: string) {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) {
        return url.replace("/view", "/preview");
    }
    return url;
}

export default function FormatDetailPage() {
    const params = useParams();
    const [format, setFormat] = useState<FormatDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFormat = async () => {
            if (!params.id) return;
            setIsLoading(true);
            try {
                const res = await fetch(`/api/formats/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormat(data);
                }
            } catch (error) {
                console.error("Failed to fetch format detail", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormat();
    }, [params.id]);

    if (isLoading) return <PageLoader text="Loading format details..." />;
    if (!format) return <div className="p-12 text-center text-zinc-500">Format not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/formats" className="text-zinc-500 hover:text-zinc-700 transition-colors">
                    ← Back to Formats
                </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{format.name}</h1>
                <p className="text-lg text-zinc-500 dark:text-zinc-400">{format.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Linked Batches */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>🚀</span> Linked Batches ({format.batches.length})
                    </h2>
                    {format.batches.length === 0 ? (
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-sm">
                            No batches strictly assigned to this format yet.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {format.batches.map(batch => (
                                <Link key={batch.id} href={`/batches/${batch.id}`} className="block group">
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                {batch.name}
                                            </div>
                                            <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
                                                {batch.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-zinc-400">
                                            Created: {new Date(batch.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Linked Competitor Ads */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>🕵️</span> Linked Competitor Ads ({format.ads.length})
                    </h2>
                    {format.ads.length === 0 ? (
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-sm">
                            No competitor ads tagged with this format yet.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {format.ads.map(ad => (
                                <Link key={ad.id} href={`/ads/${ad.id}`} className="block group">
                                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex gap-4">
                                        <div className="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {ad.videoUrl || ad.thumbnailUrl ? (
                                                <img src={getPlayableUrl(ad.thumbnailUrl || "")} className="w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No Media</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="font-medium text-sm text-zinc-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">
                                                {ad.headline || "Untitled Ad"}
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                Saved: {new Date(ad.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
