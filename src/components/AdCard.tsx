import Link from "next/link";
import { useState } from "react";
import { Ad, AdSnapshot } from "@prisma/client";

interface AdWithSnapshots extends Ad {
    snapshots: AdSnapshot[];
}

export default function AdCard({ ad }: { ad: AdWithSnapshots }) {
    const latestSnapshot = ad.snapshots[0] || { likes: 0, shares: 0, comments: 0 };
    const [isPlaying, setIsPlaying] = useState(false);
    const [isArchived, setIsArchived] = useState(ad.archived);
    const [priority, setPriority] = useState<number | null>((ad as any).priority || null);
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);

    const toggleArchive = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch(`/api/ads/${ad.id}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: !isArchived }),
            });
            if (res.ok) {
                setIsArchived(!isArchived);
                if (isArchived) {
                    setPriority(null); // Reset priority when unarchiving
                }
            }
        } catch (error) {
            console.error("Failed to archive:", error);
        }
    };

    const updatePriority = async (e: React.MouseEvent, newPriority: number | null) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            // If not archived, archive it first
            if (!isArchived) {
                const archiveRes = await fetch(`/api/ads/${ad.id}/archive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ archived: true }),
                });
                if (!archiveRes.ok) throw new Error("Failed to archive");
                setIsArchived(true);
            }

            const res = await fetch(`/api/ads/${ad.id}/priority`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });
            if (res.ok) {
                setPriority(newPriority);
                setShowPriorityMenu(false);
            }
        } catch (error) {
            console.error("Failed to update priority:", error);
        }
    };



    // Date Formatting
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const firstSeen = new Date(ad.firstSeen);

    // Domain
    const domain = ad.adLink ? new URL(ad.adLink).hostname.replace('www.', '') : '';

    const getPriorityColor = (p: number | null) => {
        switch (p) {
            case 1: return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300";
            case 2: return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300";
            case 3: return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300";
            default: return "text-zinc-500 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400";
        }
    };

    const getPriorityLabel = (p: number | null) => {
        switch (p) {
            case 1: return "High";
            case 2: return "Medium";
            case 3: return "Low";
            default: return "Priority";
        }
    };

    return (
        <div className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
            {/* Priority Badge (Top Right) */}
            {isArchived && priority && (
                <div className={`absolute top-3 right-3 z-10 px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(priority)}`}>
                    {getPriorityLabel(priority)}
                </div>
            )}

            {/* Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700">
                        {/* Placeholder Logo or Brand Initial */}
                        <span className="text-zinc-500 font-bold text-lg">{ad.brand ? ad.brand.charAt(0).toUpperCase() : 'A'}</span>
                    </div>

                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-tight">
                            {ad.brand || "Page Name"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span>
                                Created: {formatDate(ad.publishDate || ad.firstSeen)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu Dots */}
                <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                </button>
            </div>

            {/* Media (Full Width) */}
            <div className="w-full aspect-square sm:aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                {ad.videoUrl && isPlaying ? (
                    <div
                        className="w-full h-full"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <video
                            src={ad.videoUrl}
                            controls
                            autoPlay
                            muted // Browsers often block unmuted autoplay
                            playsInline
                            className="w-full h-full object-contain bg-black"
                            onClick={(e) => e.stopPropagation()}
                            onLoadedData={() => console.log("Video loaded:", ad.videoUrl)}
                            onError={(e) => {
                                console.error("Video failed to load:", ad.videoUrl, e);
                                setIsPlaying(false);
                            }}
                        />
                    </div>
                ) : (
                    <div
                        className="w-full h-full relative cursor-pointer"
                        onClick={(e) => {
                            if (ad.videoUrl) {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsPlaying(true);
                            }
                        }}
                    >
                        {ad.thumbnailUrl ? (
                            <img
                                src={ad.thumbnailUrl}
                                alt={ad.headline || "Ad"}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-400">No Image</div>
                        )}

                        {/* Play Button Overlay */}
                        {ad.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-3">
                {/* Headline */}
                <h4 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight">
                    {ad.headline || "Ad Headline Goes Here"}
                </h4>

                {/* Description */}
                <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-3 leading-relaxed">
                    {ad.description || "No description available for this ad."}
                </p>

                {/* Link Row */}
                <div className="flex items-center justify-between pt-1">
                    <a
                        href={ad.adLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 text-xs truncate hover:underline max-w-[60%] flex items-center gap-1"
                    >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {ad.adLink || "https://example.com"}
                    </a>

                </div>

                {/* Social Metrics */}
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 2.14-1.18l3.71-8.64c.06-.17.15-.33.15-.51V10z" />
                        </svg>
                        <span className="font-medium">{latestSnapshot.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hover:underline cursor-pointer">{latestSnapshot.comments.toLocaleString()} Comments</span>
                        <span className="hover:underline cursor-pointer">{latestSnapshot.shares.toLocaleString()} Shares</span>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 pt-0 flex gap-3">
                <Link
                    href={`/ads/${ad.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Details
                </Link>

                {ad.facebookLink && (
                    <a
                        href={ad.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View on Facebook"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </a>
                )}

                {isArchived ? (
                    <div className="relative flex-1 flex">
                        <button
                            onClick={toggleArchive}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-l-lg font-semibold text-sm border-y border-l transition-colors ${isArchived
                                ? "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                }`}
                        >
                            <svg className="w-4 h-4" fill={isArchived ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Saved
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowPriorityMenu(!showPriorityMenu); }}
                            className={`px-2 py-2.5 rounded-r-lg border-y border-r border-l-0 transition-colors flex items-center justify-center ${priority
                                ? getPriorityColor(priority)
                                : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>

                        {/* Priority Menu */}
                        {showPriorityMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-20">
                                <button onClick={(e) => updatePriority(e, 1)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-red-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> High
                                </button>
                                <button onClick={(e) => updatePriority(e, 2)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-orange-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Medium
                                </button>
                                <button onClick={(e) => updatePriority(e, 3)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-green-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Low
                                </button>
                                <button onClick={(e) => updatePriority(e, null)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full border border-zinc-300"></span> No Priority
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative flex-1 flex">
                        <button
                            onClick={toggleArchive}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-l-lg font-semibold text-sm border-y border-l bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Save
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowPriorityMenu(!showPriorityMenu); }}
                            className="px-2 py-2.5 rounded-r-lg border bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors border-l-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Priority Menu for Unsaved State */}
                        {showPriorityMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-20">
                                <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-700">
                                    Save as...
                                </div>
                                <button onClick={(e) => updatePriority(e, 1)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-red-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> High
                                </button>
                                <button onClick={(e) => updatePriority(e, 2)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-orange-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Medium
                                </button>
                                <button onClick={(e) => updatePriority(e, 3)} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 text-green-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Low
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
