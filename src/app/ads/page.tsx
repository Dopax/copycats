"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdCard from "@/components/AdCard";
import AdQuickView from "@/components/AdQuickView";
import { Ad, AdSnapshot } from "@prisma/client";
import { useBrand } from "@/context/BrandContext";

// Update interface to match API response and AdQuickView expectations
interface AdFormat { id: string; name: string; }
interface AdHook { id: string; name: string; }
interface AdTheme { id: string; name: string; }
interface AdAngle { id: string; name: string; }
interface AdAwarenessLevel { id: string; name: string; }

interface AdWithSnapshots extends Ad {
    snapshots: AdSnapshot[];
    format?: AdFormat | null;
    hook?: AdHook | null;
    theme?: AdTheme | null;
    angle?: AdAngle | null;
    awarenessLevel?: AdAwarenessLevel | null;
}

export default function AdsPage() {
    const [ads, setAds] = useState<AdWithSnapshots[]>([]);
    const [batches, setBatches] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Quick View State
    const [quickViewAd, setQuickViewAd] = useState<AdWithSnapshots | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedBrand } = useBrand();

    // Filters & Sorting
    const [sortBy, setSortBy] = useState("date"); // date, likes, shares
    const [filterBrand, setFilterBrand] = useState("");
    const [filterPriority, setFilterPriority] = useState(""); // "", "1", "2", "3"
    const [filterBatch, setFilterBatch] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [dateFilter, setDateFilter] = useState("all"); // all, week, month, 3months, year, custom
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [adsRes, batchesRes] = await Promise.all([
                    fetch("/api/ads"),
                    fetch("/api/imports")
                ]);

                const adsData = await adsRes.json();
                const batchesData = await batchesRes.json();

                setAds(adsData);
                setBatches(batchesData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };


        fetchData();
    }, []);

    // Initialize State from URL/LocalStorage/Context
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const stored = localStorage.getItem("ads_filters");
        const storedFilters = stored ? JSON.parse(stored) : {};

        const getVal = (key: string) => params.get(key) || storedFilters[key] || "";

        if (getVal("sortBy")) setSortBy(getVal("sortBy"));

        // Use stored or URL filter, defaulting to empty (All Brands)
        if (getVal("filterBrand")) setFilterBrand(getVal("filterBrand"));

        if (getVal("filterPriority")) setFilterPriority(getVal("filterPriority"));
        if (getVal("filterBatch")) setFilterBatch(getVal("filterBatch"));
        if (getVal("showArchived")) setShowArchived(getVal("showArchived") === "true");
        if (getVal("dateFilter")) setDateFilter(getVal("dateFilter"));
        if (getVal("customStartDate")) setCustomStartDate(getVal("customStartDate"));
        if (getVal("customEndDate")) setCustomEndDate(getVal("customEndDate"));

        setIsInitialized(true);
    }, []); // Removed selectedBrand dependency

    // Sync State to URL/LocalStorage
    useEffect(() => {
        if (!isInitialized) return;

        const filters = {
            sortBy,
            filterBrand,
            filterPriority,
            filterBatch,
            showArchived,
            dateFilter,
            customStartDate,
            customEndDate
        };

        localStorage.setItem("ads_filters", JSON.stringify(filters));

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val && val !== "false") params.set(key, String(val));
        });
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [sortBy, filterBrand, filterPriority, filterBatch, showArchived, dateFilter, customStartDate, customEndDate, isInitialized, router]);

    // Scroll Persistence
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem("ads_scroll_pos", window.scrollY.toString());
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Restore Scroll after Loading
    useEffect(() => {
        if (!loading) {
            const scrollPos = sessionStorage.getItem("ads_scroll_pos");
            if (scrollPos) {
                setTimeout(() => window.scrollTo(0, parseInt(scrollPos)), 50);
            }
        }
    }, [loading]);

    // Auto-correction: Clear stored filter if it matches no ads (validating against loaded data)
    useEffect(() => {
        if (!loading && isInitialized && filterBrand && !selectedBrand) {
            const availableBrands = new Set(ads.map(ad => ad.brand).filter(Boolean));
            if (!availableBrands.has(filterBrand)) {
                // Keep stickiness only for valid brands
                setFilterBrand("");
            }
        }
    }, [loading, isInitialized, ads, filterBrand, selectedBrand]);

    const filteredAds = ads
        .filter((ad) => {
            // Archived Logic
            // Archived Logic - Removed to show all ads
            // if (!showArchived && ad.archived) return false;

            // Brand Logic
            // If selectedBrand matches, we are already good, but we filter by exact string match of 'brand' column
            // Note: AdSpy brand names might differ slightly from our Profile names.
            // For now, strict string match.
            if (filterBrand && ad.brand !== filterBrand) return false;

            // Batch Logic
            if (filterBatch) {
                const latestSnapshot = ad.snapshots[0];
                if (latestSnapshot?.importBatchId !== filterBatch) return false;
            }

            // Priority Logic
            if (filterPriority) {
                const p = (ad as any).priority;
                if (filterPriority === "null") {
                    if (p !== null) return false;
                } else {
                    if (String(p) !== filterPriority) return false;
                }
            }

            // Date Filter Logic
            if (dateFilter !== "all") {
                const adDate = new Date(ad.publishDate || ad.firstSeen);

                if (dateFilter === "custom") {
                    if (customStartDate) {
                        const start = new Date(customStartDate);
                        if (adDate < start) return false;
                    }
                    if (customEndDate) {
                        const end = new Date(customEndDate);
                        // Set end date to end of day
                        end.setHours(23, 59, 59, 999);
                        if (adDate > end) return false;
                    }
                } else {
                    const now = new Date();
                    let cutoffDate = new Date(); // Defaults to now, modified below

                    switch (dateFilter) {
                        case "week":
                            cutoffDate.setDate(now.getDate() - 7);
                            break;
                        case "month":
                            cutoffDate.setMonth(now.getMonth() - 1);
                            break;
                        case "3months":
                            cutoffDate.setMonth(now.getMonth() - 3);
                            break;
                        case "year":
                            cutoffDate.setFullYear(now.getFullYear() - 1);
                            break;
                    }
                    if (adDate < cutoffDate) return false;
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
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">All Ads</h1>

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

                        {/* Brand Filter - Hide if context active? Or just allow override? Let's allow override but default to context */}
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

                        {/* Import Batch Filter */}
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500 max-w-[200px]"
                        >
                            <option value="">All Imports</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500 max-w-[200px]"
                            >
                                <option value="all">All Time</option>
                                <option value="week">Last Week</option>
                                <option value="month">Last Month</option>
                                <option value="3months">Last 3 Months</option>
                                <option value="year">Last Year</option>
                                <option value="custom">Custom Range</option>
                            </select>

                            {dateFilter === "custom" && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-5 duration-200">
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Start"
                                    />
                                    <span className="text-zinc-400">-</span>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="End"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Archived Toggle */}
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${showArchived
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}
                        >
                            {showArchived ? "Showing Archived" : "Show Archived"}
                        </button>
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
                    <div className="text-center py-12 text-zinc-500">
                        No ads found matching your filters.
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
