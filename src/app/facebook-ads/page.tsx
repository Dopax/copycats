"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";
import Link from "next/link";

interface FacebookAd {
    id: string;
    name: string;
    campaignName?: string;
    adsetName?: string;
    status: string;
    spend: number;
    roas: number;
    revenue: number;
    cpa: number;
    purchases: number;
    ctr: number;
    cpm: number;
    batchId?: number;
    batchName?: string;
}

interface BatchOption {
    id: number;
    name: string;
}

type SortKey = 'name' | 'status' | 'spend' | 'roas' | 'cpa';
type SortDirection = 'asc' | 'desc';

export default function FacebookAdsPage() {
    const { selectedBrand } = useBrand();
    const [ads, setAds] = useState<FacebookAd[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    // Filtering State
    const [datePreset, setDatePreset] = useState<string>("maximum");
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'spend', direction: 'desc' });

    // Legacy single-link state & Selection
    const [linkingAdId, setLinkingAdId] = useState<string | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Account Selection
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [switchingAccount, setSwitchingAccount] = useState(false);

    // --- Hierarchical View State ---
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
    const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
    const [selectedAdIds, setSelectedAdIds] = useState<Set<string>>(new Set());

    // Helper: Roas Color
    const getRoasColor = (roas: number) => {
        const breakEven = selectedBrand?.breakEvenRoas || 2.0;

        // Super profitable (2x break even)
        if (roas >= breakEven * 2) return "text-emerald-600 dark:text-emerald-400 font-bold";

        // Profitable (Above break even)
        if (roas >= breakEven) return "text-green-600 dark:text-green-400";

        // Near Break Even (Within 20%)
        if (roas >= breakEven * 0.8) return "text-yellow-600 dark:text-yellow-400";

        // Unprofitable
        return "text-red-600 dark:text-red-400";
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
        <span className={`ml-1 text-[10px] ${active ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-300 dark:text-zinc-700'}`}>
            {active && direction === 'asc' ? '▲' : '▼'}
        </span>
    );

    // Computed Tree Structure
    interface TreeStructure {
        [campaignName: string]: {
            stats: {
                spend: number;
                purchases: number;
                revenue: number;
                roas: number;
                cpa: number;
                count: number;
            };
            adSets: {
                [adSetName: string]: {
                    stats: {
                        spend: number;
                        purchases: number;
                        revenue: number;
                        roas: number;
                        cpa: number;
                        count: number;
                    };
                    ads: FacebookAd[];
                };
            };
        };
    }

    // 1. Build Data
    const rawTreeData = ads.reduce<TreeStructure>((acc, ad) => {
        const camp = ad.campaignName || "Unknown Campaign";
        const adset = ad.adsetName || "Unknown Ad Set";

        if (!acc[camp]) acc[camp] = { adSets: {}, stats: { spend: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0, count: 0 } };
        if (!acc[camp].adSets[adset]) acc[camp].adSets[adset] = { ads: [], stats: { spend: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0, count: 0 } };

        acc[camp].adSets[adset].ads.push(ad);

        const addToStats = (stats: any, item: FacebookAd) => {
            stats.spend += item.spend;
            stats.purchases += item.purchases || 0;
            stats.revenue += item.revenue || 0;
            stats.count++;
        };

        addToStats(acc[camp].stats, ad);
        addToStats(acc[camp].adSets[adset].stats, ad);

        return acc;
    }, {});

    // 2. Compute Aggregated Metrics
    Object.values(rawTreeData).forEach(camp => {
        camp.stats.roas = camp.stats.spend > 0 ? camp.stats.revenue / camp.stats.spend : 0;
        camp.stats.cpa = camp.stats.purchases > 0 ? camp.stats.spend / camp.stats.purchases : 0;

        Object.values(camp.adSets).forEach(adSet => {
            adSet.stats.roas = adSet.stats.spend > 0 ? adSet.stats.revenue / adSet.stats.spend : 0;
            adSet.stats.cpa = adSet.stats.purchases > 0 ? adSet.stats.spend / adSet.stats.purchases : 0;
        });
    });

    // 3. Sort Function
    const sorter = (a: any, b: any, key: SortKey, direction: SortDirection) => {
        let valA = a[key] ?? 0;
        let valB = b[key] ?? 0;

        if (key === 'name') {
            valA = (a.key || a.name || "").toLowerCase();
            valB = (b.key || b.name || "").toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    };

    // 4. Flatten and Sort
    const sortedCampaigns = Object.entries(rawTreeData).map(([name, data]) => ({
        key: name,
        type: 'campaign',
        ...data.stats,
        data,
        name // for sorter
    })).sort((a, b) => sorter(a, b, sortConfig.key, sortConfig.direction));

    // Handlers
    const toggleCampaign = (campName: string) => {
        const newSet = new Set(expandedCampaigns);
        if (newSet.has(campName)) newSet.delete(campName);
        else newSet.add(campName);
        setExpandedCampaigns(newSet);
    };

    const toggleAdSet = (adSetName: string) => {
        const newSet = new Set(expandedAdSets);
        if (newSet.has(adSetName)) newSet.delete(adSetName);
        else newSet.add(adSetName);
        setExpandedAdSets(newSet);
    };

    const handleCheckAd = (adId: string, checked: boolean) => {
        const newSet = new Set(selectedAdIds);
        if (checked) newSet.add(adId);
        else newSet.delete(adId);
        setSelectedAdIds(newSet);
    };

    const handleCheckAdSet = (campaignName: string, adSetName: string, checked: boolean) => {
        const newSet = new Set(selectedAdIds);
        const adsInSet = rawTreeData[campaignName].adSets[adSetName].ads;
        adsInSet.forEach(ad => {
            if (checked) newSet.add(ad.id);
            else newSet.delete(ad.id);
        });
        setSelectedAdIds(newSet);
    };

    const handleCheckCampaign = (campaignName: string, checked: boolean) => {
        const newSet = new Set(selectedAdIds);
        Object.values(rawTreeData[campaignName].adSets).forEach(adSet => {
            adSet.ads.forEach(ad => {
                if (checked) newSet.add(ad.id);
                else newSet.delete(ad.id);
            });
        });
        setSelectedAdIds(newSet);
    };

    const handleBulkLink = async () => {
        if (!selectedBatchId || selectedAdIds.size === 0) return;

        const adsToUpdate = ads.filter(a => selectedAdIds.has(a.id));

        setAds(prev => prev.map(a => selectedAdIds.has(a.id) ? { ...a, batchId: parseInt(selectedBatchId), batchName: batches.find(b => b.id.toString() === selectedBatchId)?.name } : a));
        setSelectedAdIds(new Set());
        setSelectedBatchId("");

        for (const ad of adsToUpdate) {
            try {
                await fetch('/api/facebook/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        adId: ad.id,
                        batchId: selectedBatchId,
                        name: ad.name,
                        status: ad.status,
                        spend: ad.spend,
                        roas: ad.roas,
                        cpm: ad.cpm,
                        ctr: ad.ctr
                    })
                });
            } catch (e) {
                console.error("Failed to link ad", ad.id);
            }
        }
    };

    // --- Loading & Cache Logic ---

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        if (error) {
            setErrorMessage(error === "missing_params" ? "Authentication failed: Missing parameters." : error);
            setTimeout(() => setErrorMessage(null), 5000);
        }

        if (selectedBrand) {
            // Try to load from cache immediately
            const cacheKey = `fb_ads_${selectedBrand.id}_${datePreset}`;
            const cached = localStorage.getItem(cacheKey);
            let hasCachedData = false;

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Simple expiry check logic could be added here
                    if (Array.isArray(parsed)) {
                        setAds(parsed);
                        hasCachedData = true;
                        setIsLoading(false); // We have data, so stop "loading"
                    }
                } catch (e) { console.error("Cache parse error", e); }
            }

            const cachedTime = localStorage.getItem(cacheKey + '_time');
            if (cachedTime) {
                setLastFetched(new Date(cachedTime));
            } else {
                setLastFetched(null);
            }

            // No automatic fetch - user must refresh manually
            // We just stop the loading spinner
            setIsLoading(false);

            // If we didn't find cached data, we should probably clear the view so it doesn't show ghost data from previous view
            if (!hasCachedData) {
                setAds([]);
            }

            fetchBatches();
            fetchAdAccounts();
        }
    }, [selectedBrand, datePreset]);

    const fetchAdAccounts = async () => {
        if (!selectedBrand) return;
        try {
            const res = await fetch(`/api/facebook/accounts?brandId=${selectedBrand.id}`);
            if (res.ok) {
                setAdAccounts(await res.json());
            }
        } catch (e) { console.error("Failed to fetch accounts", e); }
    };

    const handleAccountChange = async (newAccountId: string) => {
        if (!selectedBrand) return;
        setSwitchingAccount(true);
        try {
            const res = await fetch(`/api/brands/${selectedBrand.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adAccountId: newAccountId })
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update account");
        } finally {
            setSwitchingAccount(false);
        }
    };

    const fetchData = async (backgroundUpdate = false) => {
        if (!selectedBrand) return;

        // If we don't have existing data/cache, we show full loading.
        // If we do, we just show refetching indicator.
        if (!backgroundUpdate) setIsLoading(true);
        else setIsRefetching(true);

        setErrorMessage(null); // Clear previous errors

        try {
            const res = await fetch(`/api/facebook/ads?brandId=${selectedBrand.id}&datePreset=${datePreset}`);
            if (res.status === 404) {
                setIsConnected(false);
                setIsLoading(false);
                setIsRefetching(false);
                return;
            }
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `API Error: ${res.status}`);
            }

            const data = await res.json();
            setAds(data);
            setIsConnected(true);

            // Cache successful result
            localStorage.setItem(`fb_ads_${selectedBrand.id}_${datePreset}`, JSON.stringify(data));
            const now = new Date();
            setLastFetched(now);
            localStorage.setItem(`fb_ads_${selectedBrand.id}_${datePreset}_time`, now.toISOString());

        } catch (error: any) {
            console.error("Failed to load ads", error);
            // Only show error banner if we don't have any data showed to user?
            // Actually user wants "old data shown", so we keep old data in `ads` state.
            // But we display the error message.
            setErrorMessage(error.message || "Failed to load ads");
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('/api/batches');
            if (res.ok) setBatches(await res.json());
        } catch (e) { console.error(e); }
    };

    if (!isConnected && !isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Connect Facebook Ads</h2>
                <p className="text-zinc-500 mb-8 max-w-md">
                    Link your Facebook Ad Account to track performance and attribute results to your creative batches.
                </p>
                {selectedBrand ? (
                    <Link
                        href={`/api/auth/facebook/connect?brandId=${selectedBrand.id}`}
                        className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                        Connect Facebook
                    </Link>
                ) : (
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg">
                        Please select a brand from the sidebar to connect.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Facebook Ads</h1>
                    {isConnected && adAccounts.length > 0 && (
                        <select
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedBrand?.adAccountId || ""}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            disabled={switchingAccount}
                        >
                            {adAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.id})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-2 items-center">

                    <button
                        onClick={() => fetchData(true)}
                        disabled={isLoading || isRefetching}
                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <svg className={`w-5 h-5 ${isLoading || isRefetching ? 'animate-spin text-indigo-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {lastFetched && (
                        <span className="text-xs text-zinc-400 mr-2">
                            {lastFetched.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}

                    <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <span className="px-3 text-xs font-medium text-zinc-500 uppercase">Per:</span>
                        <select
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1.5 px-2 text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
                            value={datePreset}
                            onChange={(e) => setDatePreset(e.target.value)}
                        >
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="today">Today</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="yesterday">Yesterday</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="last_7d">Last 7 Days</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="last_14d">Last 14 Days</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="last_30d">Last 30 Days</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="last_month">Last Month</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="this_month">This Month</option>
                            <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="maximum">Maximum</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

                    {selectedAdIds.size > 0 ? (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-right-4 duration-200">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">{selectedAdIds.size} selected</span>
                            <select
                                className="text-sm border rounded p-1 max-w-[150px]"
                                value={selectedBatchId}
                                onChange={(e) => setSelectedBatchId(e.target.value)}
                            >
                                <option value="">Select Batch...</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleBulkLink}
                                disabled={!selectedBatchId}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Link
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => fetchData(false)} className="hidden p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                            {/* Hidden refresh link in favor of top button */}
                        </button>
                    )}
                </div>
            </div>

            {errorMessage && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errorMessage}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden text-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-500 uppercase text-xs">
                    <div className="col-span-4 pl-2 cursor-pointer hover:text-zinc-800 flex items-center" onClick={() => handleSort('name')}>
                        Name <SortIcon active={sortConfig.key === 'name'} direction={sortConfig.direction} />
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-zinc-800 flex items-center" onClick={() => handleSort('status')}>
                        Status <SortIcon active={sortConfig.key === 'status'} direction={sortConfig.direction} />
                    </div>
                    <div className="col-span-2 cursor-pointer hover:text-zinc-800 flex items-center" onClick={() => handleSort('spend')}>
                        Spend <SortIcon active={sortConfig.key === 'spend'} direction={sortConfig.direction} />
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-zinc-800 flex items-center" onClick={() => handleSort('roas')}>
                        ROAS <SortIcon active={sortConfig.key === 'roas'} direction={sortConfig.direction} />
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-zinc-800 flex items-center" onClick={() => handleSort('cpa')}>
                        CPA <SortIcon active={sortConfig.key === 'cpa'} direction={sortConfig.direction} />
                    </div>
                    <div className="col-span-2">Linked Batch</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {isLoading && ads.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <div className="text-zinc-500">Loading your complete ad history... This can take a moment.</div>
                    </div>
                ) : (
                    <div className={isRefetching ? "opacity-60 transition-opacity pointer-events-none" : ""}>
                        {sortedCampaigns.map((camp) => {
                            const campName = camp.key;

                            // Sort Ad Sets
                            const sortedAdSets = Object.entries(camp.data.adSets).map(([name, data]) => ({
                                key: name,
                                type: 'adSet',
                                ...data.stats,
                                data
                            })).sort((a, b) => sorter(a, b, sortConfig.key, sortConfig.direction));

                            return (
                                <div key={campName} className="border-b border-zinc-100 dark:border-zinc-800/50">
                                    {/* Campaign Row */}
                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 items-center group">
                                        <div className="col-span-4 flex items-center gap-2">
                                            <button onClick={() => toggleCampaign(campName)} className="p-1 hover:bg-zinc-200 rounded">
                                                {expandedCampaigns.has(campName) ? "▼" : "▶"}
                                            </button>
                                            <input
                                                type="checkbox"
                                                className="rounded border-zinc-300"
                                                checked={Object.values(camp.data.adSets).every(as => as.ads.every(a => selectedAdIds.has(a.id)))}
                                                ref={input => {
                                                    if (input) {
                                                        const allAds = Object.values(camp.data.adSets).flatMap(as => as.ads);
                                                        const someSelected = allAds.some(a => selectedAdIds.has(a.id));
                                                        const allSelected = allAds.every(a => selectedAdIds.has(a.id));
                                                        input.indeterminate = someSelected && !allSelected;
                                                    }
                                                }}
                                                onChange={(e) => handleCheckCampaign(campName, e.target.checked)}
                                            />
                                            <span className="font-semibold text-zinc-900 dark:text-white truncate" title={campName}>{campName}</span>
                                            <span className="text-xs text-zinc-400">({camp.count})</span>
                                        </div>
                                        <div className="col-span-1 text-xs text-zinc-400">Campaign</div>
                                        <div className="col-span-2 font-mono text-zinc-700">{formatCurrency(camp.spend)}</div>
                                        <div className={`col-span-1 font-mono ${getRoasColor(camp.roas)}`}>{camp.roas > 0 ? camp.roas.toFixed(2) + 'x' : '-'}</div>
                                        <div className="col-span-1 font-mono text-zinc-700">{formatCurrency(camp.cpa)}</div>
                                        <div className="col-span-3"></div>
                                    </div>

                                    {/* Ad Sets */}
                                    {expandedCampaigns.has(campName) && sortedAdSets.map((adSet) => {
                                        const adSetName = adSet.key;

                                        // Sort Ads
                                        const sortedAds = [...adSet.data.ads].sort((a, b) => sorter(a, b, sortConfig.key, sortConfig.direction));

                                        return (
                                            <div key={adSetName}>
                                                <div className="grid grid-cols-12 gap-4 px-6 py-2 content-center items-center bg-white dark:bg-zinc-900 hover:bg-zinc-50 border-t border-zinc-100 dark:border-zinc-800/30 pl-16">
                                                    <div className="col-span-4 flex items-center gap-2">
                                                        <button onClick={() => toggleAdSet(adSetName)} className="p-1 hover:bg-zinc-200 rounded text-xs text-zinc-400">
                                                            {expandedAdSets.has(adSetName) ? "▼" : "▶"}
                                                        </button>
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-zinc-300"
                                                            checked={adSet.data.ads.every(a => selectedAdIds.has(a.id))}
                                                            ref={input => {
                                                                if (input) {
                                                                    const someSelected = adSet.data.ads.some(a => selectedAdIds.has(a.id));
                                                                    const allSelected = adSet.data.ads.every(a => selectedAdIds.has(a.id));
                                                                    input.indeterminate = someSelected && !allSelected;
                                                                }
                                                            }}
                                                            onChange={(e) => handleCheckAdSet(campName, adSetName, e.target.checked)}
                                                        />
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate text-sm" title={adSetName}>{adSetName}</span>
                                                    </div>
                                                    <div className="col-span-1 text-xs text-zinc-400">Ad Set</div>
                                                    <div className="col-span-2 font-mono text-xs text-zinc-500">{formatCurrency(adSet.spend)}</div>
                                                    <div className={`col-span-1 font-mono text-xs ${getRoasColor(adSet.roas)}`}>{adSet.roas > 0 ? adSet.roas.toFixed(2) + 'x' : '-'}</div>
                                                    <div className="col-span-1 font-mono text-xs text-zinc-500">{formatCurrency(adSet.cpa)}</div>
                                                    <div className="col-span-3"></div>
                                                </div>

                                                {/* Ads */}
                                                {expandedAdSets.has(adSetName) && sortedAds.map(ad => (
                                                    <div key={ad.id} className="grid grid-cols-12 gap-4 px-6 py-2 items-center bg-zinc-50/30 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-t border-zinc-50 dark:border-zinc-800/20 pl-24 text-xs">
                                                        <div className="col-span-4 flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-zinc-300"
                                                                checked={selectedAdIds.has(ad.id)}
                                                                onChange={(e) => handleCheckAd(ad.id, e.target.checked)}
                                                            />
                                                            <div className="truncate text-zinc-600 dark:text-zinc-400" title={ad.name}>{ad.name}</div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-500'
                                                                }`}>{ad.status}</span>
                                                        </div>
                                                        <div className="col-span-2 font-mono text-zinc-700 dark:text-zinc-300">{formatCurrency(ad.spend)}</div>
                                                        <div className={`col-span-1 font-mono font-bold ${getRoasColor(ad.roas)}`}>{ad.roas.toFixed(2)}x</div>
                                                        <div className="col-span-1 font-mono text-zinc-600 dark:text-zinc-400">{formatCurrency(ad.cpa)}</div>
                                                        <div className="col-span-2">
                                                            {ad.batchId ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                    {ad.batchName || `#${ad.batchId}`}
                                                                </span>
                                                            ) : <span className="text-zinc-300 italic">-</span>}
                                                        </div>
                                                        <div className="col-span-1 text-right">
                                                            {linkingAdId === ad.id ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button onClick={() => setLinkingAdId(null)} className="text-red-500 hover:text-red-700">✕</button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (ad.batchId) {
                                                                            setSelectedAdIds(new Set([ad.id]));
                                                                        } else {
                                                                            setSelectedAdIds(new Set([ad.id]));
                                                                        }
                                                                    }}
                                                                    className="text-indigo-600 hover:underline"
                                                                >
                                                                    Select
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Empty/No ads state */}
                        {!isLoading && ads.length === 0 && (
                            <div className="p-12 text-center text-zinc-500">
                                No ads found for the selected time period ({datePreset.replace('_', ' ')}).
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
