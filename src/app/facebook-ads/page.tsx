"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";
import Link from "next/link";

interface FacebookAd {
    id: string;
    name: string;
    status: string;
    spend: number;
    roas: number;
    ctr: number;
    cpm: number;
    batchId?: number;
    batchName?: string;
}

interface BatchOption {
    id: number;
    name: string;
}

export default function FacebookAdsPage() {
    const { selectedBrand } = useBrand();
    const [ads, setAds] = useState<FacebookAd[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(true); // Assume true initially
    
    const [linkingAdId, setLinkingAdId] = useState<string | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Account Selection
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [switchingAccount, setSwitchingAccount] = useState(false);

    useEffect(() => {
        // Check for error param
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        if (error) {
            setErrorMessage(error === "missing_params" ? "Authentication failed: Missing parameters." : error);
            setTimeout(() => setErrorMessage(null), 5000);
        }

        if (selectedBrand) {
            fetchData();
            fetchBatches();
            fetchAdAccounts();
        }
    }, [selectedBrand]);

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
                // Refresh Page Data
                window.location.reload(); // Simple reload to re-fetch everything with new context
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update account");
        } finally {
            setSwitchingAccount(false);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        if (!selectedBrand) return;

        try {
            const res = await fetch(`/api/facebook/ads?brandId=${selectedBrand.id}`);
            if (res.status === 404) {
                setIsConnected(false);
                setIsLoading(false);
                return;
            }
            if (res.ok) {
                setAds(await res.json());
                setIsConnected(true);
            }
        } catch (error) {
            console.error("Failed to load ads", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('/api/batches'); // Fetches simplified list
            if (res.ok) setBatches(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleLink = async (ad: FacebookAd) => {
        if (!selectedBatchId) return;
        
        const batchName = batches.find(b => b.id.toString() === selectedBatchId)?.name;
        
        // Optimistic Update
        setAds(prev => prev.map(a => a.id === ad.id ? { ...a, batchId: parseInt(selectedBatchId), batchName } : a));
        setLinkingAdId(null);
        setSelectedBatchId("");

        // Call API
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
            console.error(e);
            alert("Failed to link");
        }
    };

    if (!isConnected && !isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
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
            <div className="flex justify-between items-center mb-6">
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
                <div className="flex gap-2">
                    {switchingAccount && <span className="text-sm text-zinc-500 animate-pulse">Switching...</span>}
                    <button onClick={fetchData} className="text-zinc-500 hover:text-zinc-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>
            
            {errorMessage && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errorMessage}
                </div>
            )}
            
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Ad Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Spend</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">ROAS (Est)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Linked Batch</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div></td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            ))
                        ) : (
                            ads.map(ad => (
                                <tr key={ad.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-white line-clamp-2 max-w-md">{ad.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono mt-1">ID: {ad.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                            ad.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-500'
                                        }`}>
                                            {ad.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300 font-mono">
                                        ${ad.spend?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                                        {ad.roas?.toFixed(2)}x
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {ad.batchId ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                {ad.batchName || `Batch #${ad.batchId}`}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 italic">Unlinked</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {linkingAdId === ad.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    autoFocus
                                                    className="text-xs border rounded p-1 max-w-[150px]"
                                                    value={selectedBatchId}
                                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                                >
                                                    <option value="">Select Batch...</option>
                                                    {batches.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleLink(ad)} className="text-green-600 hover:text-green-700 font-bold bg-green-50 rounded p-1">✓</button>
                                                <button onClick={() => setLinkingAdId(null)} className="text-red-500 hover:text-red-600 font-bold bg-red-50 rounded p-1">✕</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setLinkingAdId(ad.id)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                            >
                                                {ad.batchId ? "Edit" : "Link"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                 {isConnected && ads.length === 0 && !isLoading && (
                    <div className="p-12 text-center text-zinc-500">
                        No ads found in the connected ad account.
                    </div>
                )}
            </div>
        </div>
    );
}
