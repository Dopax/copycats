"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdCard from "@/components/AdCard";
import AdQuickView from "@/components/AdQuickView";
import { Ad, AdSnapshot } from "@prisma/client";

interface AdFormat { id: string; name: string; }
interface AdHook { id: string; name: string; }
interface AdTheme { id: string; name: string; }
interface AdAngle { id: string; name: string; }
interface AdAwarenessLevel { id: string; name: string; }

// Extend the Prisma Ad type with relations
interface AdWithSnapshots extends Ad {
    snapshots: AdSnapshot[];
    format?: AdFormat | null;
    hook?: AdHook | null;
    theme?: AdTheme | null;
    angle?: AdAngle | null;
    awarenessLevel?: AdAwarenessLevel | null;
}

export default function SwipeFilePage() {
    const [ads, setAds] = useState<AdWithSnapshots[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Quick View State
    const [quickViewAd, setQuickViewAd] = useState<AdWithSnapshots | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Filters & Sorting
    const [sortBy, setSortBy] = useState("date"); // date, likes, shares
    const [filterBrand, setFilterBrand] = useState("");
    const [filterPriority, setFilterPriority] = useState(""); // "", "1", "2", "3"

    useEffect(() => {
        const fetchData = async () => {
            try {
                const adsRes = await fetch("/api/ads");
                const adsData = await adsRes.json();

                // Filter only archived (saved) ads
                const savedAds = adsData.filter((ad: AdWithSnapshots) => ad.archived);
                setAds(savedAds);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };


        fetchData();
    }, []);

    // Initialize State from URL/LocalStorage
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const stored = localStorage.getItem("swipe_filters");
        const storedFilters = stored ? JSON.parse(stored) : {};

        const getVal = (key: string) => params.get(key) || storedFilters[key] || "";

        if (getVal("sortBy")) setSortBy(getVal("sortBy"));
        if (getVal("filterBrand")) setFilterBrand(getVal("filterBrand"));
        if (getVal("filterPriority")) setFilterPriority(getVal("filterPriority"));

        setIsInitialized(true);
    }, []);

    // Sync State to URL/LocalStorage
    useEffect(() => {
        if (!isInitialized) return;

        const filters = {
            sortBy,
            filterBrand,
            filterPriority
        };

        localStorage.setItem("swipe_filters", JSON.stringify(filters));

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val && val !== "false") params.set(key, String(val));
        });
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [sortBy, filterBrand, filterPriority, isInitialized, router]);

    // Scroll Persistence
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem("swipe_scroll_pos", window.scrollY.toString());
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Restore Scroll after Loading
    useEffect(() => {
        if (!loading) {
            const scrollPos = sessionStorage.getItem("swipe_scroll_pos");
            if (scrollPos) {
                setTimeout(() => window.scrollTo(0, parseInt(scrollPos)), 50);
            }
        }
    }, [loading]);

    const filteredAds = ads
        .filter((ad) => {
            // Brand Logic
            if (filterBrand && ad.brand !== filterBrand) return false;

            // Priority Logic
            if (filterPriority) {
                const p = (ad as any).priority;
                if (filterPriority === "null") {
                    if (p !== null) return false;
                } else {
                    if (String(p) !== filterPriority) return false;
                }
            }

            return true;
        })
        .sort((a, b) => {
            const snapA = a.snapshots[0] || { likes: 0, shares: 0 };
            const snapB = b.snapshots[0] || { likes: 0, shares: 0 };

            if (sortBy === "likes") return snapB.likes - snapA.likes;
            if (sortBy === "shares") return snapB.shares - snapA.shares;
            if (sortBy === "priority") {
                // Sort by priority (1 is highest, then 2, then 3, then null)
                const pA = (a as any).priority || 999;
                const pB = (b as any).priority || 999;
                if (pA !== pB) return pA - pB;
                // Secondary sort by date
                return new Date(b.publishDate || b.lastSeen).getTime() - new Date(a.publishDate || a.lastSeen).getTime();
            }
            // Default date (newest first) - using publishDate (created time)
            return new Date(b.publishDate || b.lastSeen).getTime() - new Date(a.publishDate || a.lastSeen).getTime();
        });

    const brands = Object.entries(
        ads.reduce((acc, ad) => {
            const brand = ad.brand;
            if (brand) {
                acc[brand] = (acc[brand] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>)
    )
        .sort(([, a], [, b]) => b - a)
        .map(([brand]) => brand);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Swipe File</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your saved ads for inspiration</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="priority">Priority</option>
                            <option value="date">Newest</option>
                            <option value="likes">Most Likes</option>
                            <option value="shares">Most Shares</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500 max-w-[200px]"
                        >
                            <option value="">All Priorities</option>
                            <option value="1">High (Red)</option>
                            <option value="2">Medium (Orange)</option>
                            <option value="3">Low (Green)</option>
                            <option value="null">No Priority</option>
                        </select>

                        {/* Brand Filter */}
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500 max-w-[200px]"
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAds.map((ad) => (
                        <AdCard
                            key={ad.id}
                            ad={ad}
                            onQuickView={(ad) => setQuickViewAd(ad)}
                        />
                    ))}
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">No saved ads</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Click the "Save" button on ads to add them to your swipe file.
                        </p>
                    </div>
                )}

                {/* Quick View Sidebar */}
                {quickViewAd && (
                    <AdQuickView
                        ad={quickViewAd}
                        isOpen={!!quickViewAd}
                        onClose={() => setQuickViewAd(null)}
                        onUpdate={(updated) => {
                            // Simple update of the list item
                            setAds(current => current.map(a => a.id === updated.id ? { ...a, ...updated } : a));
                        }}
                    />
                )}
            </div>
        </Suspense>
    );
}
