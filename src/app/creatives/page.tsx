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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [folderIdInput, setFolderIdInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ scannedCount: number } | null>(null);
    const [currentScanJobId, setCurrentScanJobId] = useState<string | null>(null);
    const [scanProgress, setScanProgress] = useState<{ count: number, status: string } | null>(null);


    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 300;

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch when view or search changes
    useEffect(() => {
        // Debounce search slightly if needed but for now direct effect is fine if user hits enter or types
        // Actually, let's just let the effect run.
        const delaySearch = setTimeout(() => {
            // Reset and fetch
            setHasMore(true);
            setPage(1);
            setCreatives([]);
            fetchCreatives(1, true); // Fetch page 1, reset list

            setGroupingMode(true);
        }, 300); // 300ms debounce

        return () => clearTimeout(delaySearch);
    }, [currentView, searchQuery]);

    const fetchCreatives = async (pageToFetch: number, reset = false) => {
        setLoading(true);
        try {
            // Base URL construction
            let baseUrl = `/api/creatives?limit=${LIMIT}&page=${pageToFetch}`;

            // Add Filters based on currentView
            if (currentView === 'videos') baseUrl += '&type=VIDEO';
            if (currentView === 'favorites') baseUrl += '&isFavorite=true';
            if (currentView.startsWith('tag-')) {
                const tag = currentView.replace('tag-', '');
                baseUrl += `&tags=${encodeURIComponent(tag)}`;
            }

            // Add Search
            if (searchQuery) {
                baseUrl += `&q=${encodeURIComponent(searchQuery)}`;
            }

            const res = await fetch(baseUrl);
            const data = await res.json();

            if (data.data) {
                if (reset) {
                    setCreatives(data.data);
                } else {
                    setCreatives(prev => [...prev, ...data.data]);
                }

                // Check if more
                if (data.data.length < LIMIT) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }

        } catch (error) {
            console.error('Failed to fetch creatives', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchCreatives(nextPage, false);
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
        // If searching, filtering by tag (inside folder), or explicitly set to flat mode -> Flat List
        // This ensures when you click a folder (which sets currentView='tag-...'), it renders flat.
        if (!groupingMode || currentView.startsWith('tag-') || searchQuery) {
            return { straight: creatives, groups: {} };
        }

        const groups: Record<string, CreativeWithDetails[]> = {};
        const straight: CreativeWithDetails[] = [];

        creatives.forEach(c => {
            // Priority 1: "CID-" tags
            let groupName = null;

            if (c.tags) {
                const cidTag = c.tags.find(t => t.name.startsWith('CID-'));
                if (cidTag) {
                    groupName = cidTag.name;
                } else {
                    // Priority 2: "L1:" tags
                    const l1Tag = c.tags.find(t => t.name.startsWith('L1:'));
                    if (l1Tag) {
                        groupName = l1Tag.name.replace('L1:', '');
                    }
                }
            }

            if (groupName) {
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push(c);
            } else {
                straight.push(c);
            }
        });

        return { straight, groups };
    }, [creatives, groupingMode, currentView, searchQuery]);

    return (
        <div className="h-[calc(100vh-4rem)] -m-8 flex bg-black text-white overflow-hidden relative">
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

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

                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                {currentView === 'all' && 'All Clips'}
                                {currentView === 'videos' && 'Raw Videos'}
                                {currentView === 'favorites' && 'Favorites'}
                                {currentView.startsWith('tag-') && (
                                    <>
                                        {currentView.replace('tag-', '')}
                                    </>
                                )}
                                {currentView.startsWith('scene-') && currentView.replace('scene-', '')}
                            </h1>
                            <span className="text-zinc-500 text-sm font-normal">({creatives.length} loaded)</span>
                        </div>

                        <div className="h-6 w-px bg-zinc-800 mx-2" />

                        {/* View Mode Toggle */}
                        <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                                title="List View"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                        </div>

                        {/* Grouping Toggle - Visible in GRID mode */}
                        {viewMode === 'grid' && (
                            <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                                <button
                                    onClick={() => {
                                        setGroupingMode(true);
                                        // If we are deep in a folder, clicking "Creative Folders" should probably take us back to root
                                        if (currentView.startsWith('tag-')) {
                                            setCurrentView('all');
                                        }
                                    }}
                                    className={`text-xs px-3 py-1 rounded transition-colors ${groupingMode && !currentView.startsWith('tag-') ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                                >
                                    Creative Folders
                                </button>
                                <button
                                    onClick={() => setGroupingMode(false)}
                                    className={`text-xs px-3 py-1 rounded transition-colors ${!groupingMode || currentView.startsWith('tag-') ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                                >
                                    All Clips
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

                {/* DETAILED FOLDER HEADER */}
                {currentView.startsWith('tag-') && creatives.length > 0 && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-wrap gap-8 items-center">
                            {/* Creator Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg">
                                    {creatives[0]?.creator?.name.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Creator</div>
                                    <div className="text-white font-medium">{creatives[0]?.creator?.name || 'Unknown'}</div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-8 bg-zinc-800" />

                            {/* Date Range */}
                            <div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Date Range</div>
                                <div className="text-white font-medium">
                                    {(() => {
                                        const dates = creatives.map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0).filter(d => d > 0);
                                        if (dates.length === 0) return '-';
                                        const min = new Date(Math.min(...dates));
                                        const max = new Date(Math.max(...dates));
                                        if (min.getTime() === max.getTime()) return min.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        return `${min.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${max.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                                    })()}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-8 bg-zinc-800" />

                            {/* CID Info (if consistent) */}
                            {(() => {
                                const cids = Array.from(new Set(creatives.map(c => c.tags?.find(t => t.name.startsWith('CID-'))?.name.replace('CID-', '')).filter(Boolean)));
                                if (cids.length > 0) {
                                    return (
                                        <>
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">CID</div>
                                                <div className="text-white font-medium flex gap-2">
                                                    {cids.slice(0, 2).map(cid => (
                                                        <span key={cid} className="bg-zinc-800 px-2 py-0.5 rounded text-sm text-zinc-300 font-mono">{cid}</span>
                                                    ))}
                                                    {cids.length > 2 && <span className="text-xs text-zinc-500 self-center">+{cids.length - 2}</span>}
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-zinc-800" />
                                        </>
                                    );
                                }
                                return null;
                            })()}

                            {/* Other Tags */}
                            <div className="flex-1">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Tags</div>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(creatives.flatMap(c => c.tags).filter(t => !t.name.startsWith('CID-') && !t.name.startsWith('L1:') && !t.name.startsWith('BUNCH:')).map(t => t.name)))
                                        .slice(0, 6)
                                        .map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                {tag.replace(/^AI:/, '')}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                    {creatives.length === 0 && loading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="text-zinc-500">Loading assets...</span>
                        </div>
                    ) : creatives.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                            <p>No creatives found.</p>
                            <p className="text-sm mt-2">Try importing from Drive or checking your filters.</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        // LIST VIEW TABLE
                        <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-950/50 text-zinc-500 uppercase tracking-wider text-xs font-medium border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 w-16">Preview</th>
                                        <th className="px-4 py-3">Name / CID</th>
                                        <th className="px-4 py-3">Creator</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Tags</th>
                                        <th className="px-4 py-3 text-right">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {creatives.map((creative) => {
                                        const cidTag = creative.tags?.find(t => t.name.startsWith('CID-'))?.name.replace('CID-', '') || '-';
                                        return (
                                            <tr key={creative.id} className="hover:bg-zinc-800/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="w-12 h-12 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 relative">
                                                        {creative.thumbnailUrl && (
                                                            <img src={creative.thumbnailUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white truncate max-w-[300px]" title={creative.name}>{creative.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{cidTag !== '-' ? `CID: ${cidTag}` : <span className="opacity-30">No CID</span>}</div>
                                                </td>
                                                <td className="px-4 py-3 text-zinc-300">
                                                    {creative.creator?.name || <span className="text-zinc-600 italic">Unknown</span>}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-400 tabular-nums">
                                                    {creative.createdAt ? new Date(creative.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                        {creative.tags && creative.tags.slice(0, 4).map(tag => (
                                                            !tag.name.startsWith('CID-') && !tag.name.startsWith('L1:') && (
                                                                <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                                    {tag.name.replace(/^(BUNCH|AI):/, '')}
                                                                </span>
                                                            )
                                                        ))}
                                                        {creative.tags && creative.tags.length > 5 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500">+{creative.tags.length - 5}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">
                                                    {creative.duration ? `${Math.floor(creative.duration / 60)}:${Math.floor(creative.duration % 60).toString().padStart(2, '0')}` : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <>
                            {/* Only use grouping if we are in 'all' view and have groups */}
                            {groupingMode ? (
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
                                // FLAT GRID VIEW
                                <div className="space-y-8 pb-20">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                                        {creatives.map((creative) => (
                                            <CreativeCard key={creative.id} creative={creative as any} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Load More Trigger (Shared for both views) */}
                            {hasMore && (
                                <div className="flex justify-center pt-12 pb-20">
                                    <button
                                        onClick={loadMore}
                                        disabled={loading}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-3 shadow-lg border border-zinc-700"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : null}
                                        Load More Clips
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* IMPORT MODAL */}
            {
                isImportModalOpen && (
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
                )
            }
            {/* Floating Scan Progress Widget */}
            {
                currentScanJobId && scanProgress && (
                    <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg p-4 w-72 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center bg-zinc-800 rounded-full">
                            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white">Scanning Drive...</h4>
                            <p className="text-xs text-zinc-400 truncate">Found {scanProgress.count} items</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
