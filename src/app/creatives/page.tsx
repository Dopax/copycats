"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/creatives/Sidebar';
import FilterBar from '@/components/creatives/FilterBar';
import CreativeCard from '@/components/creatives/CreativeCard';
import CreativeDeck from '@/components/creatives/CreativeDeck';
import { useBrand } from '@/context/BrandContext';

// Define local interfaces to avoid Prisma import errors if generation failed
interface Tag { id: string; name: string; }
interface Creator { id: string; name: string; profileUrl?: string; }
interface Creative {
    id: string;
    name: string;
    type: string;
    thumbnailUrl?: string;
    duration?: number;
    driveViewLink?: string;
    createdAt?: Date;
    width?: number;
    height?: number;
    folderPath?: string; // Added field
    tags: Tag[];
    creator?: Creator | null;
}

// Extended type matching what the API returns
interface CreativeWithDetails extends Creative {
    tags: Tag[];
    creator: Creator | null;
}

export default function CreativesPage() {
    const { selectedBrand } = useBrand();
    const [currentView, setCurrentView] = useState('all');

    // Use 'any' for creatives array initially to bypass strict type checks if local interfaces don't match perfectly, 
    // but cast to CreativeWithDetails[] when using.
    const [creatives, setCreatives] = useState<CreativeWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupingMode, setGroupingMode] = useState(true); // Default to "Bundled View"

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [folderIdInput, setFolderIdInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ scannedCount: number } | null>(null);
    const [currentScanJobId, setCurrentScanJobId] = useState<string | null>(null);
    const [scanProgress, setScanProgress] = useState<{ count: number, status: string } | null>(null);

    // Fetch when view changes
    useEffect(() => {
        fetchCreatives();

        // If we are drilling down into a specific tag, disable grouping (show items)
        if (currentView.startsWith('tag-')) {
            setGroupingMode(false);
        } else if (currentView === 'all') {
            setGroupingMode(true);
        }
    }, [currentView]);

    // Poll Scan Status
    useEffect(() => {
        if (!currentScanJobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/integrations/google/scan?jobId=${currentScanJobId}`);
                if (res.ok) {
                    const status = await res.json();
                    setScanProgress(status);

                    if (status.status === 'completed' || status.status === 'error') {
                        setCurrentScanJobId(null);
                        setScanProgress(null);
                        fetchCreatives(); // Refresh grid
                        if (status.status === 'completed') alert(`Scan Completed! Found ${status.count} items.`);
                        if (status.status === 'error') alert(`Scan Error: ${status.error}`);
                    }
                }
            } catch (e) {
                console.error("Poll error", e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [currentScanJobId]);

    const fetchCreatives = async () => {
        setLoading(true);
        try {
            const limit = 500;
            let page = 1;
            let allCreatives: CreativeWithDetails[] = [];
            let hasMore = true;

            // Base URL construction
            let baseUrl = `/api/creatives?limit=${limit}`;

            // Add Filters based on currentView
            if (currentView === 'videos') baseUrl += '&type=VIDEO';
            if (currentView === 'favorites') { /* TODO */ }
            if (currentView.startsWith('tag-')) {
                const tag = currentView.replace('tag-', '');
                baseUrl += `&tags=${encodeURIComponent(tag)}`;
            } else if (currentView.startsWith('scene-')) {
                // TODO: Scene logic
            }

            while (hasMore) {
                const res = await fetch(`${baseUrl}&page=${page}`);
                const data = await res.json();

                if (data.data && data.data.length > 0) {
                    allCreatives = [...allCreatives, ...data.data];

                    // Check if we exhausted total
                    if (data.pagination) {
                        const { total } = data.pagination;
                        if (allCreatives.length >= total) hasMore = false;
                    }

                    if (data.data.length < limit) hasMore = false; // Parachute check
                } else {
                    hasMore = false;
                }

                page++;
            }

            setCreatives(allCreatives);

        } catch (error) {
            console.error('Failed to fetch creatives', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        if (!selectedBrand) return alert("No brand selected");
        if (!folderIdInput) return alert("Please enter a Folder ID");

        // Extract ID from URL if full link pasted
        let fid = folderIdInput;
        if (fid.includes('/folders/')) {
            try {
                fid = fid.split('/folders/')[1].split('?')[0];
            } catch (e) {
                // fallback
            }
        }

        setIsScanning(true);
        setScanResult(null);

        try {
            const res = await fetch('/api/integrations/google/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId: selectedBrand.id,
                    folderId: fid
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Scan start failed');
            }

            const data = await res.json(); // { success: true, jobId, message }
            if (data.jobId) {
                setCurrentScanJobId(data.jobId);
                setIsImportModalOpen(false); // Close modal so user can work
                // Toast logic handled by polling effect
            }

        } catch (e: any) {
            alert("Scan failed: " + e.message);
        } finally {
            setIsScanning(false);
        }
    };

    // Grouping Logic
    const groupedCreatives = useMemo(() => {
        const groups: Record<string, CreativeWithDetails[]> = {};
        const straight: CreativeWithDetails[] = [];

        creatives.forEach(c => {
            // Strategy: Look for the special "L1:" tag we inject during scan.
            let level1Name = null;

            if (c.tags) {
                const l1Tag = c.tags.find(t => t.name.startsWith('L1:'));
                if (l1Tag) {
                    level1Name = l1Tag.name.replace('L1:', '');
                }
            }

            // Fallback: Use Folder Path (if schema update worked in future) or First Tag
            if (!level1Name && c.folderPath && c.folderPath.length > 1) {
                try {
                    level1Name = c.folderPath.split('/')[1];
                } catch (e) { }
            }

            if (level1Name) {
                if (!groups[level1Name]) groups[level1Name] = [];
                groups[level1Name].push(c);
            } else if (c.tags && c.tags.length > 0) {
                // Last ditch: Use frequency logic or just first tag?
                // Let's use first tag as fallback
                const fallback = c.tags[0].name;
                if (!groups[fallback]) groups[fallback] = [];
                groups[fallback].push(c);
            } else {
                straight.push(c);
            }
        });

        return { straight, groups };
    }, [creatives]); // Grouping is now always calculated, UI decides how to show it.

    return (
        <div className="h-[calc(100vh-4rem)] -m-8 flex bg-black text-white overflow-hidden relative">
            <Sidebar currentView={currentView} onViewChange={setCurrentView} />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <FilterBar />

                {/* Header / Config Bar */}
                <div className="px-6 pt-6 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-2">
                            {/* Back Button for Tag View */}
                            {currentView.startsWith('tag-') && (
                                <button
                                    onClick={() => setCurrentView('all')}
                                    className="text-sm text-zinc-400 hover:text-white mr-2"
                                >
                                    &larr; Back
                                </button>
                            )}

                            <h1 className="text-2xl font-bold">
                                {currentView === 'all' && 'All Clips'}
                                {currentView === 'videos' && 'Raw Videos'}
                                {currentView === 'favorites' && 'Favorites'}
                                {currentView.startsWith('tag-') && currentView.replace('tag-', '')}
                                {currentView.startsWith('scene-') && currentView.replace('scene-', '')}
                            </h1>
                            <span className="text-zinc-500 text-sm font-normal">({creatives.length})</span>
                        </div>

                        <div className="h-6 w-px bg-zinc-800 mx-2" />

                        {/* Grouping Toggle - Only visible if showing groupings (all view) */}
                        {currentView === 'all' && (
                            <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                                <button
                                    onClick={() => setGroupingMode(true)}
                                    className={`text-xs px-3 py-1 rounded transition-colors ${groupingMode ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setGroupingMode(false)}
                                    className={`text-xs px-3 py-1 rounded transition-colors ${!groupingMode ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                                >
                                    List
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="text-zinc-500">Loading assets...</span>
                        </div>
                    ) : creatives.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                            <p>No creatives found.</p>
                            <p className="text-sm mt-2">Try importing from Drive or checking your filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* Only use grouping if we are in 'all' view and have groups */}
                            {currentView === 'all' ? (
                                groupingMode ? (
                                    // GRID VIEW (Bunches)
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-20">
                                        {Object.entries(groupedCreatives.groups).map(([groupName, items]) => (
                                            <CreativeDeck
                                                key={groupName}
                                                title={groupName}
                                                count={items.length}
                                                creatives={items as any}
                                                onClick={() => setCurrentView(`tag-${groupName}`)}
                                            />
                                        ))}
                                        {groupedCreatives.straight.map((creative) => (
                                            <CreativeCard key={creative.id} creative={creative as any} />
                                        ))}
                                    </div>
                                ) : (
                                    // LIST VIEW (Table of Bunches)
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-sm text-zinc-400">
                                            <thead className="bg-zinc-950 text-zinc-500 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Folder Name</th>
                                                    <th className="px-4 py-3">Clips</th>
                                                    <th className="px-4 py-3">First Clip</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {Object.entries(groupedCreatives.groups).map(([groupName, items]) => (
                                                    <tr
                                                        key={groupName}
                                                        className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                                        onClick={() => setCurrentView(`tag-${groupName}`)}
                                                    >
                                                        <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                                                            {groupName}
                                                        </td>
                                                        <td className="px-4 py-3">{items.length}</td>
                                                        <td className="px-4 py-3 text-xs w-64 truncate">{items[0]?.name}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-blue-400 hover:text-blue-300">Open &rarr;</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Straight items in list view? just listed as rows */}
                                                {groupedCreatives.straight.map((creative) => (
                                                    <tr key={creative.id} className="hover:bg-zinc-800/50">
                                                        <td className="px-4 py-3 text-white flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            {creative.name}
                                                        </td>
                                                        <td className="px-4 py-3">-</td>
                                                        <td className="px-4 py-3">-</td>
                                                        <td className="px-4 py-3 text-right"></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                // IF NOT 'ALL' (Filtered View) -> Show Grid of Items (Flat)
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-20">
                                    {creatives.map((creative) => (
                                        <CreativeCard key={creative.id} creative={creative as any} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* IMPORT MODAL */}
            {isImportModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Import from Google Drive</h2>

                        {!scanResult ? (
                            <>
                                <p className="text-sm text-zinc-400 mb-6">
                                    Paste the ID or Link of your root "Creatives" folder.
                                    We will recursively scan all subfolders and auto-tag contents based on folder names.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Folder Link / ID</label>
                                        <input
                                            type="text"
                                            value={folderIdInput}
                                            onChange={(e) => setFolderIdInput(e.target.value)}
                                            placeholder="https://drive.google.com/drive/folders/..."
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => setIsImportModalOpen(false)}
                                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleScan}
                                            disabled={isScanning}
                                            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isScanning && (
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            )}
                                            {isScanning ? 'Scanning...' : 'Start Import'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
                                <p className="text-zinc-400 mb-8">Successfully scanned and imported <strong className="text-white">{scanResult.scannedCount}</strong> items.</p>

                                <button
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        setScanResult(null);
                                        setFolderIdInput('');
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-lg font-medium transition-colors w-full"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Floating Scan Progress Widget */}
            {currentScanJobId && scanProgress && (
                <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg p-4 w-72 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center bg-zinc-800 rounded-full">
                        <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white">Scanning Drive...</h4>
                        <p className="text-xs text-zinc-400 truncate">Found {scanProgress.count} items</p>
                    </div>
                </div>
            )}
        </div>
    );
}
