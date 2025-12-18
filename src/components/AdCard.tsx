import Link from "next/link";
import { useState, useEffect } from "react";
import { Ad, AdSnapshot } from "@prisma/client";

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

interface AdCardProps {
    ad: AdWithSnapshots;
    onQuickView?: (ad: AdWithSnapshots) => void;
}

export default function AdCard({ ad, onQuickView }: AdCardProps) {
    const [latestSnapshot] = useState(ad.snapshots[0] || { likes: 0, shares: 0, comments: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isArchived, setIsArchived] = useState(ad.archived);
    const [priority, setPriority] = useState<number | null>((ad as any).priority || null);
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);

    // Tags State
    const [formats, setFormats] = useState<AdFormat[]>([]);
    const [hooks, setHooks] = useState<AdHook[]>([]);
    const [themes, setThemes] = useState<AdTheme[]>([]);
    const [angles, setAngles] = useState<AdAngle[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AdAwarenessLevel[]>([]);

    const [selectedFormat, setSelectedFormat] = useState<string | null>(ad.format?.id || null);
    const [selectedHook, setSelectedHook] = useState<string | null>(ad.hook?.id || null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(ad.theme?.id || null);
    const [selectedAngle, setSelectedAngle] = useState<string | null>(ad.angle?.id || null);
    const [selectedAwareness, setSelectedAwareness] = useState<string | null>(ad.awarenessLevel?.id || null);

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

    const [notes, setNotes] = useState(ad.notes || "");
    const [whyItWorks, setWhyItWorks] = useState((ad as any).whyItWorks || "");
    const [showNotesField, setShowNotesField] = useState(!!ad.notes);
    const [showNotes, setShowNotes] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isExtractingHook, setIsExtractingHook] = useState(false);

    // Fetch tags when opening menu
    const loadTags = async () => {
        try {
            const [formatsRes, hooksRes, themesRes, anglesRes, awarenessRes] = await Promise.all([
                fetch('/api/formats'),
                fetch('/api/hooks'),
                fetch('/api/themes'),
                fetch('/api/angles'),
                fetch('/api/awareness-levels')
            ]);
            setFormats(await formatsRes.json());
            setHooks(await hooksRes.json());
            setThemes(await themesRes.json());
            setAngles(await anglesRes.json());
            setAwarenessLevels(await awarenessRes.json());
        } catch (e) {
            console.error("Failed to load tags", e);
        }
    };

    const createFormat = async (name: string) => {
        try {
            const res = await fetch('/api/formats', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newFormat = await res.json();
            setFormats([...formats, newFormat]);
            setSelectedFormat(newFormat.id);
        } catch (e) {
            console.error("Failed to create format", e);
        }
    };

    const createHook = async (name: string) => {
        try {
            const res = await fetch('/api/hooks', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newHook = await res.json();
            setHooks([...hooks, newHook]);
            setSelectedHook(newHook.id);
        } catch (e) {
            console.error("Failed to create hook", e);
        }
    };

    const extractHook = async () => {
        if (!ad.videoUrl) {
            alert("No video available to extract hook from.");
            return;
        }

        const defaultName = `Hook from ${ad.brand || 'Ad'}`;
        const name = prompt("Enter a name for this video hook:", defaultName);
        if (!name) return;

        setIsExtractingHook(true);
        try {
            const res = await fetch('/api/hooks/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl: ad.videoUrl,
                    name,
                    brandId: (ad as any).brandId
                })
            });

            if (res.ok) {
                const newHook = await res.json();
                setHooks([...hooks, newHook]);
                setSelectedHook(newHook.id);
                alert("Hook extracted and saved successfully!");
            } else {
                const err = await res.json();
                alert(`Failed to extract hook: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error("Failed to extract hook", e);
            alert("Error extracting hook");
        } finally {
            setIsExtractingHook(false);
        }
    };

    const createTheme = async (name: string) => {
        try {
            const res = await fetch('/api/themes', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newTheme = await res.json();
            setThemes([...themes, newTheme]);
            setSelectedTheme(newTheme.id);
        } catch (e) {
            console.error("Failed to create theme", e);
        }
    };

    const createAngle = async (name: string) => {
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newAngle = await res.json();
            setAngles([...angles, newAngle]);
            setSelectedAngle(newAngle.id);
        } catch (e) {
            console.error("Failed to create angle", e);
        }
    };

    const createAwarenessLevel = async (name: string) => {
        try {
            const res = await fetch('/api/awareness-levels', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newLevel = await res.json();
            setAwarenessLevels([...awarenessLevels, newLevel]);
            setSelectedAwareness(newLevel.id);
        } catch (e) {
            console.error("Failed to create awareness level", e);
        }
    };

    const saveAll = async () => {
        setIsSavingNotes(true);
        try {
            // Save Notes
            await fetch(`/api/ads/${ad.id}/note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes, whyItWorks }),
            });

            // Save Tags
            await fetch(`/api/ads/${ad.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formatId: selectedFormat,
                    hookId: selectedHook,
                    themeId: selectedTheme,
                    angleId: selectedAngle,
                    awarenessLevelId: selectedAwareness
                }),
            });

            setShowNotes(false);
        } catch (error) {
            console.error("Failed to save details:", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    useEffect(() => {
        if (showNotes && formats.length === 0) {
            loadTags();
        }
    }, [showNotes]);

    return (
        <div className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
            {/* Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Logo */}
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700 flex-shrink-0">
                        <span className="text-zinc-500 font-bold text-lg">{ad.brand ? ad.brand.charAt(0).toUpperCase() : 'A'}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-tight truncate">
                                {ad.brand || "Page Name"}
                            </h3>
                            {isArchived && priority && (
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${getPriorityColor(priority)}`}>
                                    {getPriorityLabel(priority)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span>
                                Created: {formatDate(ad.publishDate || ad.firstSeen)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick View / Edit Action */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        if (onQuickView) {
                            onQuickView(ad);
                        } else {
                            setShowNotes(!showNotes);
                        }
                    }}
                    className={`hover:text-zinc-600 dark:hover:text-zinc-200 ${showNotes ? "text-indigo-500" : "text-zinc-400"}`}
                    title="Quick View / Edit"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                            muted
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

            {showNotes ? (
                <div className="p-4 flex flex-col bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-zinc-900 dark:text-white">Edit Ad Details</h4>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowNotes(false); }}
                            className="text-zinc-400 hover:text-zinc-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Format</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedFormat || ""}
                                onChange={(e) => setSelectedFormat(e.target.value || null)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select Format...</option>
                                {formats.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={(e) => { e.preventDefault(); const name = prompt("New Format Name:"); if (name) createFormat(name); }}
                                className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                title="Add New Format"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Hook</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedHook || ""}
                                onChange={(e) => setSelectedHook(e.target.value || null)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select Hook...</option>
                                {hooks.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                            {ad.videoUrl && (
                                <button
                                    onClick={(e) => { e.preventDefault(); extractHook(); }}
                                    disabled={isExtractingHook}
                                    className="flex-shrink-0 px-3 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                                    title="Extract First 3.5s as Video Hook"
                                >
                                    {isExtractingHook ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm8.486-8.486a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z" /></svg>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.preventDefault(); const name = prompt("New Hook Name:"); if (name) createHook(name); }}
                                className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                title="Add New Hook (Text Only)"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Theme</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedTheme || ""}
                                onChange={(e) => setSelectedTheme(e.target.value || null)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select Theme...</option>
                                {themes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={(e) => { e.preventDefault(); const name = prompt("New Theme Name:"); if (name) createTheme(name); }}
                                className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                title="Add New Theme"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Angle</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedAngle || ""}
                                onChange={(e) => setSelectedAngle(e.target.value || null)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select Angle...</option>
                                {angles.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={(e) => { e.preventDefault(); const name = prompt("New Angle Name:"); if (name) createAngle(name); }}
                                className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                title="Add New Angle"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Awareness Level</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedAwareness || ""}
                                onChange={(e) => setSelectedAwareness(e.target.value || null)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select Awareness Level...</option>
                                {awarenessLevels.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={(e) => { e.preventDefault(); const name = prompt("New Awareness Level Name:"); if (name) createAwarenessLevel(name); }}
                                className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                title="Add New Awareness Level"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <label className="block text-xs font-medium text-zinc-500 mb-1">Why do you think this ad works?</label>
                    <textarea
                        value={whyItWorks}
                        onChange={(e) => setWhyItWorks(e.target.value)}
                        placeholder="Explain your thoughts..."
                        className="flex-1 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4 min-h-[80px]"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    />

                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id={`showNotes-${ad.id}`}
                            checked={showNotesField}
                            onChange={(e) => setShowNotesField(e.target.checked)}
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`showNotes-${ad.id}`} className="text-xs font-medium text-zinc-500 select-none cursor-pointer">
                            Other Notes
                        </label>
                    </div>

                    {showNotesField && (
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your notes here..."
                            className="flex-1 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3 min-h-[80px]"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); saveAll(); }}
                            disabled={isSavingNotes}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                            {isSavingNotes ? "Saving..." : "Save Details"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Content Body */}
                    <div className="p-4 space-y-3">
                        <h4 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight">
                            {ad.headline || "Ad Headline Goes Here"}
                        </h4>

                        <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-3 leading-relaxed">
                            {ad.description || "No description available for this ad."}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                            {ad.adLink ? (
                                <a
                                    href={ad.adLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-500 text-xs truncate hover:underline max-w-[60%] flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    {ad.adLink}
                                </a>
                            ) : (
                                <span className="text-zinc-400 text-xs italic">No Link</span>
                            )}
                        </div>

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

                    <div className="px-4 pb-3 pt-2 flex flex-col gap-2">
                        {(ad.format || ad.hook || ad.theme || ad.angle) && (
                            <div className="flex flex-wrap gap-1.5">
                                {ad.format && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                        {ad.format.name}
                                    </span>
                                )}
                                {ad.hook && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                        {ad.hook.name}
                                    </span>
                                )}
                                {ad.theme && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800">
                                        {ad.theme.name}
                                    </span>
                                )}
                                {ad.angle && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                        {ad.angle.name}
                                    </span>
                                )}
                                {ad.awarenessLevel && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800">
                                        {ad.awarenessLevel.name}
                                    </span>
                                )}
                            </div>
                        )}
                        {ad.notes && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800 line-clamp-2 italic">
                                "{ad.notes}"
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 mt-auto">
                        <div className="flex items-center p-2 gap-2 flex-wrap">

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

                            <Link
                                href={`/batches?create=true&refAdId=${ad.id}&refAdPostId=${ad.postId}`}
                                className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                                title="Create Batch from this Ad"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            </Link>

                            {ad.facebookLink && (
                                <a
                                    href={ad.facebookLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
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
                </>
            )}
        </div>
    );
}
