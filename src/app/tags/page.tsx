"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

// Types
interface LinkedAd {
    id: string;
    postId: string;
    brand: string;
    thumbnailUrl: string | null;
    videoUrl: string | null;
}

interface LinkedVariation {
    id: string;
    variationIndex: string | null;
    batch: {
        id: number;
        name: string;
        status: string;
    };
}

interface Tag {
    id: string;
    name: string;
}

interface FormatTag extends Tag {
    description?: string;
    audioChoice?: string;
    ads?: LinkedAd[];
    batchItems?: LinkedVariation[];
}

interface Hook extends Tag {
    type?: string;
    content?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    brand?: { name: string } | null;
    _count?: { ads: number; batchItems: number; }; // Usage counts
    ads?: { id: string; postId: string; headline: string | null; thumbnailUrl: string | null }[];
    batchItems?: { id: string; batch: { id: number; name: string; status: string } }[];
}

interface ThemeTag extends Tag {
    description?: string;
}

interface DesireTag extends Tag {
    category?: string;
    description?: string;
    brainClicks?: string;
    notes?: string;
}

function FormatCard({ format, onEdit, onDelete }: { format: FormatTag, onEdit: (f: FormatTag) => void, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">{format.name}</h3>
                        {format.audioChoice && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                🎵 {format.audioChoice}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(format)} className="text-zinc-400 hover:text-indigo-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => onDelete(format.id)} className="text-zinc-400 hover:text-red-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
                {format.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2" title={format.description}>
                        {format.description}
                    </p>
                )}
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800 text-sm">
                {/* Linked Variations */}
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                        Variations ({format.batchItems?.length || 0})
                    </h4>
                    {format.batchItems && format.batchItems.length > 0 ? (
                        <ul className="space-y-2">
                            {format.batchItems.slice(0, 3).map(item => (
                                <li key={item.id}>
                                    <a href={`/batches/${item.batch.id}`} className="block bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-mono text-[10px] text-zinc-400 group-hover:text-indigo-500">#{item.batch.id} {item.variationIndex ? `(${item.variationIndex})` : ''}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">{item.batch.status}</span>
                                        </div>
                                        <div className="font-medium text-xs truncate text-zinc-800 dark:text-zinc-200">{item.batch.name}</div>
                                    </a>
                                </li>
                            ))}
                            {format.batchItems.length > 3 && <li className="text-[10px] text-zinc-400 pl-1">+{format.batchItems.length - 3} more...</li>}
                        </ul>
                    ) : (
                        <p className="text-zinc-400 text-[10px] italic">No variations.</p>
                    )}
                </div>

                {/* Linked Ads */}
                <div className="p-3">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                        Ads ({format.ads?.length || 0})
                    </h4>
                    {format.ads && format.ads.length > 0 ? (
                        <div className="space-y-2">
                            {format.ads.slice(0, 3).map(ad => (
                                <a key={ad.id} href={`/ads/${ad.postId}`} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group">
                                    <div className="w-6 h-6 flex-shrink-0 bg-black rounded overflow-hidden">
                                        {ad.thumbnailUrl || ad.videoUrl ? (
                                            <img src={ad.thumbnailUrl || (ad.videoUrl ? "/placeholder.png" : "")} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-zinc-900 dark:text-white truncate group-hover:text-indigo-600">{ad.brand || "Unknown"}</p>
                                    </div>
                                </a>
                            ))}
                            {format.ads.length > 3 && <p className="text-[10px] text-zinc-400 pl-1">+{format.ads.length - 3} more...</p>}
                        </div>
                    ) : (
                        <p className="text-zinc-400 text-[10px] italic">No ads.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

const AUDIO_CHOICES = ["Text Only", "Music Only", "Voice Over", "Person Talking"];


const HOOK_TYPES = [
    "FLOATING_ELEMENTS",
    "FB_COMMENT",
    "TIKTOK_COMMENT",
    "TEXT",
    "VFX",
    "FRAME_SELECTION",
    "AUDIO"
];

function HookCard({ hook, onEdit, onDelete }: { hook: Hook, onEdit: (h: Hook) => void, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col gap-3">
            {/* Media Area */}
            <div className="aspect-[9/16] bg-black rounded-md overflow-hidden relative group">
                {hook.videoUrl ? (
                    <video
                        src={hook.videoUrl}
                        className="w-full h-full object-cover"
                        poster={hook.thumbnailUrl}
                        controls
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs">
                        {hook.thumbnailUrl ? (
                            <img src={hook.thumbnailUrl} className="w-full h-full object-cover" alt="thumbnail" />
                        ) : (
                            "No Media"
                        )}
                    </div>
                )}
                {/* Type Badge */}
                {hook.type && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase">
                        {hook.type.replace('_', ' ')}
                    </div>
                )}
                {/* Source Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase flex items-center gap-1">
                    {(hook._count?.ads || 0) > 0 ? (
                        <>
                            <span className="text-purple-400">⚡</span> Competitor
                        </>
                    ) : (
                        <>
                            <span className="text-emerald-400">✨</span> Our Hook
                        </>
                    )}
                </div>

                {/* Brand Badge */}
                {hook.brand && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium rounded flex items-center gap-1 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {hook.brand.name}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{hook.name}</h3>
                {(hook.type === 'FB_COMMENT' || hook.type === 'TIKTOK_COMMENT' || hook.type === 'TEXT') && hook.content && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded border border-zinc-100 dark:border-zinc-700">
                        "{hook.content}"
                    </p>
                )}
            </div>

            {/* Linked Items */}
            <div className="space-y-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {/* Batches */}
                {hook.batchItems && hook.batchItems.length > 0 && (
                    <div>
                        <span className="text-zinc-400 font-bold mb-1 block uppercase text-[9px]">Used in Batches:</span>
                        <div className="flex flex-wrap gap-1">
                            {hook.batchItems.slice(0, 3).map(item => (
                                <a key={item.id} href={`/batches/${item.batch.id}`} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 hover:border-indigo-300">
                                    BATCH{item.batch.id}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                {/* Ads */}
                {hook.ads && hook.ads.length > 0 && (
                    <div>
                        <span className="text-zinc-400 font-bold mb-1 block uppercase text-[9px]">Found in Ads:</span>
                        <div className="flex flex-wrap gap-1">
                            {hook.ads.slice(0, 3).map(ad => (
                                <a key={ad.id} href={`/ads/${ad.postId}`} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded text-[10px] text-purple-700 dark:text-purple-300 hover:bg-purple-100 truncate max-w-[150px]">
                                    {ad.headline ? (ad.headline.length > 15 ? ad.headline.substring(0, 15) + '...' : ad.headline) : ad.postId}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => onEdit(hook)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(hook.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function ThemeCard({ theme, onEdit, onDelete }: { theme: ThemeTag, onEdit: (t: ThemeTag) => void, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col gap-2 relative group hover:shadow-md transition-shadow">
            <h3 className="font-bold text-zinc-900 dark:text-white">{theme.name}</h3>
            {theme.description ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{theme.description}</p>
            ) : (
                <p className="text-sm text-zinc-400 italic">No description</p>
            )}

            <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(theme)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(theme.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function DesireCard({ desire, onEdit, onDelete }: { desire: DesireTag, onEdit: (a: DesireTag) => void, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col gap-2 relative group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-zinc-900 dark:text-white">{desire.name}</h3>
                {desire.category && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {desire.category}
                    </span>
                )}
            </div>

            {desire.brainClicks && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded border border-indigo-100 dark:border-indigo-800">
                    <span className="mr-1">🧠</span> {desire.brainClicks}
                </div>
            )}

            {desire.description ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{desire.description}</p>
            ) : (
                <p className="text-sm text-zinc-400 italic">No description</p>
            )}

            {desire.notes && (
                <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                    <span className="font-semibold block mb-0.5">Strategy Notes:</span>
                    {desire.notes}
                </div>
            )}

            <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(desire)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(desire.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default function TagsPage() {
    const [activeTab, setActiveTab] = useState<"formats" | "hooks" | "themes" | "desires" | "demographics" | "awareness-levels">("formats");
    const [tags, setTags] = useState<Tag[] | Hook[] | ThemeTag[] | DesireTag[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Simple Tag Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // Format Modal State
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingFormat, setEditingFormat] = useState<FormatTag | null>(null);
    const [formatForm, setFormatForm] = useState<Partial<FormatTag>>({ name: '', description: '', audioChoice: 'Text Only' });

    // Hook Modal State
    const [isHookModalOpen, setIsHookModalOpen] = useState(false);
    const [editingHook, setEditingHook] = useState<Hook | null>(null);
    const [hookForm, setHookForm] = useState<Partial<Hook>>({ name: '', type: 'TEXT', content: '' });

    // Theme Modal State
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<ThemeTag | null>(null);
    const [themeForm, setThemeForm] = useState<Partial<ThemeTag>>({ name: '', description: '' });

    // Desire Modal State
    const [isDesireModalOpen, setIsDesireModalOpen] = useState(false);
    const [editingDesire, setEditingDesire] = useState<DesireTag | null>(null);
    const [desireForm, setDesireForm] = useState<Partial<DesireTag>>({ name: '', category: '', description: '', brainClicks: '', notes: '' });


    const { selectedBrand, isLoading: isBrandLoading } = useBrand();

    useEffect(() => {
        if (!isBrandLoading) {
            fetchData();
        }
    }, [activeTab, selectedBrand, isBrandLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let endpoint = activeTab;
            if (activeTab === 'awareness-levels') endpoint = 'awareness-levels';

            const query = selectedBrand ? `?brandId=${selectedBrand.id}` : '';
            const res = await fetch(`/api/${endpoint}${query}`);
            if (res.ok) {
                setTags(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch tags", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tag?")) return;
        try {
            let endpoint = activeTab;
            if (activeTab === 'awareness-levels') endpoint = 'awareness-levels';

            const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTags((prev: any[]) => prev.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete tag", error);
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            let endpoint = activeTab;
            if (activeTab === 'awareness-levels') endpoint = 'awareness-levels';

            const res = await fetch(`/api/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });

            if (res.ok) {
                const updated = await res.json();
                setTags((prev: any[]) => prev.map(t => t.id === id ? updated : t));
                setEditingId(null);
                setEditName("");
            }
        } catch (error) {
            console.error("Failed to update tag", error);
        }
    };

    // --- Modal Handlers ---

    const openFormatModal = (format?: FormatTag) => {
        if (format) {
            setEditingFormat(format);
            setFormatForm({ ...format });
        } else {
            setEditingFormat(null);
            setFormatForm({ name: '', description: '', audioChoice: 'Text Only' });
        }
        setIsFormatModalOpen(true);
    };

    const saveFormat = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingFormat ? 'PUT' : 'POST';
        const url = editingFormat ? `/api/formats/${editingFormat.id}` : '/api/formats';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formatForm, brandId: selectedBrand?.id }),
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingFormat) {
                    setTags((prev: any[]) => prev.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTags((prev: any[]) => [saved, ...prev]);
                }
                setIsFormatModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save format", error);
        }
    };

    const openHookModal = (hook?: Hook) => {
        if (hook) {
            setEditingHook(hook);
            setHookForm({ ...hook });
        } else {
            setEditingHook(null);
            setHookForm({ name: '', type: 'TEXT', content: '' });
        }
        setIsHookModalOpen(true);
    };

    const saveHook = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingHook ? 'PUT' : 'POST';
        const url = editingHook ? `/api/hooks/${editingHook.id}` : '/api/hooks';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...hookForm, brandId: selectedBrand?.id }),
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingHook) {
                    setTags((prev: any[]) => prev.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTags((prev: any[]) => [saved, ...prev]);
                }
                setIsHookModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save hook", error);
        }
    };

    const openThemeModal = (theme?: ThemeTag) => {
        if (theme) {
            setEditingTheme(theme);
            setThemeForm({ ...theme });
        } else {
            setEditingTheme(null);
            setThemeForm({ name: '', description: '' });
        }
        setIsThemeModalOpen(true);
    };

    const saveTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingTheme ? 'PUT' : 'POST';
        const url = editingTheme ? `/api/themes/${editingTheme.id}` : '/api/themes';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...themeForm, brandId: selectedBrand?.id }),
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingTheme) {
                    setTags((prev: any[]) => prev.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTags((prev: any[]) => [saved, ...prev]); // Might need sort order update
                }
                setIsThemeModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    };

    const openDesireModal = (desire?: DesireTag) => {
        if (desire) {
            setEditingDesire(desire);
            setDesireForm({ ...desire });
        } else {
            setEditingDesire(null);
            setDesireForm({ name: '', category: '', description: '', brainClicks: '', notes: '' });
        }
        setIsDesireModalOpen(true);
    };

    const saveDesire = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingDesire ? 'PUT' : 'POST';
        const url = editingDesire ? `/api/desires/${editingDesire.id}` : '/api/desires';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...desireForm, brandId: selectedBrand?.id }),
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingDesire) {
                    setTags((prev: any[]) => prev.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTags((prev: any[]) => [saved, ...prev]);
                }
                setIsDesireModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save desire", error);
        }
    };


    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Manage Tags</h1>

            <div className="flex space-x-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 overflow-x-auto">
                {(["formats", "hooks", "themes", "desires", "demographics", "awareness-levels"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[100px] rounded-lg py-2.5 text-sm font-medium leading-5 transition-all whitespace-nowrap
                            ${activeTab === tab
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-white/[0.12] hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        {tab === 'awareness-levels' ? 'Awareness Lvl' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'formats' ? (
                // -- Rich Formats UI --
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openFormatModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            + New Format
                        </button>
                    </div>

                    {isLoading ? <div className="p-8 text-center">Loading Formats...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {(tags as FormatTag[]).map(format => (
                                <div key={format.id} className="h-full">
                                    <FormatCard
                                        format={format}
                                        onEdit={openFormatModal}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))}

                            {tags.length === 0 && (
                                <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    No formats found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : activeTab === 'hooks' ? (
                // -- Rich Hooks UI --
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openHookModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            + New Hook
                        </button>
                    </div>

                    {isLoading ? <div className="p-8 text-center">Loading Hooks...</div> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(tags as Hook[]).map(hook => (
                                <HookCard
                                    key={hook.id}
                                    hook={hook}
                                    onEdit={openHookModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {tags.length === 0 && (
                                <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    No hooks found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : activeTab === 'themes' ? (
                // -- Rich Themes UI (Table View) --
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openThemeModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            + New Theme
                        </button>
                    </div>

                    {isLoading ? <div className="p-8 text-center">Loading Themes...</div> : (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-1/4">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {(tags as ThemeTag[]).map((theme) => (
                                        <tr key={theme.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white align-top">
                                                {theme.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 align-top">
                                                {theme.description || <span className="italic text-zinc-400">No description</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => openThemeModal(theme)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(theme.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tags.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                                No themes found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : activeTab === 'desires' ? (
                // -- Rich Desires UI (Table View) --
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openDesireModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            + New Desire
                        </button>
                    </div>

                    {isLoading ? <div className="p-8 text-center">Loading Desires...</div> : (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-1/5">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-1/6">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-1/6">Brain Clicks</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {(tags as DesireTag[]).map((desire) => (
                                        <tr key={desire.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white align-top">
                                                {desire.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 align-top">
                                                {desire.category ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                                        {desire.category}
                                                    </span>
                                                ) : <span className="text-zinc-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 align-top">
                                                {desire.brainClicks ? (
                                                    <div className="flex items-start gap-1">
                                                        <span className="text-indigo-500 mt-0.5">🧠</span>
                                                        <span>{desire.brainClicks}</span>
                                                    </div>
                                                ) : <span className="text-zinc-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 align-top">
                                                {desire.description || <span className="italic text-zinc-400">No description</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => openDesireModal(desire)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(desire.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tags.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                                No desires found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                // -- Simple Table UI for others (Demographics, Awareness Levels) --
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-zinc-500">Loading...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {tags.map((tag) => (
                                    <tr key={tag.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                                            {editingId === tag.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                tag.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingId === tag.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(tag.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingId(null); setEditName(""); }}
                                                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tag.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {tags.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                            No tags found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Hook Modal */}
            {isHookModalOpen && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsHookModalOpen(false); }}>
                    <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                            {editingHook ? "Edit Hook" : "Create New Hook"}
                        </h3>
                        <form onSubmit={saveHook} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={hookForm.name}
                                    onChange={(e) => setHookForm({ ...hookForm, name: e.target.value })}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    placeholder="e.g. Floating Text Intro"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                                <select
                                    value={hookForm.type || 'TEXT'}
                                    onChange={(e) => setHookForm({ ...hookForm, type: e.target.value })}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                >
                                    {HOOK_TYPES.map(t => (
                                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Content Field - Conditional */}
                            {(hookForm.type === 'FB_COMMENT' || hookForm.type === 'TIKTOK_COMMENT' || hookForm.type === 'TEXT') && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Content / Text
                                    </label>
                                    <textarea
                                        value={hookForm.content || ''}
                                        onChange={(e) => setHookForm({ ...hookForm, content: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 min-h-[80px]"
                                        placeholder="Enter the displayed text..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Video/Media URL</label>
                                <input
                                    type="text"
                                    value={hookForm.videoUrl || ''}
                                    onChange={(e) => setHookForm({ ...hookForm, videoUrl: e.target.value })}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    placeholder="https://..."
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Thumbnail URL (Optional)</label>
                                <input
                                    type="text"
                                    value={hookForm.thumbnailUrl || ''}
                                    onChange={(e) => setHookForm({ ...hookForm, thumbnailUrl: e.target.value })}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                <button
                                    type="button"
                                    onClick={() => setIsHookModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                >
                                    Save Hook
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Format Modal */}
            {
                isFormatModalOpen && (
                    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsFormatModalOpen(false); }}>
                        <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                                {editingFormat ? "Edit Format" : "Create New Format"}
                            </h3>
                            <form onSubmit={saveFormat} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formatForm.name}
                                        onChange={(e) => setFormatForm({ ...formatForm, name: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        placeholder="e.g. Unboxing Video"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Audio Choice</label>
                                    <select
                                        value={formatForm.audioChoice || "Text Only"}
                                        onChange={(e) => setFormatForm({ ...formatForm, audioChoice: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    >
                                        {AUDIO_CHOICES.map(choice => (
                                            <option key={choice} value={choice}>{choice}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                    <textarea
                                        value={formatForm.description || ''}
                                        onChange={(e) => setFormatForm({ ...formatForm, description: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 min-h-[100px]"
                                        placeholder="Describe the format details..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                    >
                                        Save Format
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Theme Modal */}
            {
                isThemeModalOpen && (
                    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsThemeModalOpen(false); }}>
                        <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                                {editingTheme ? "Edit Theme" : "Create New Theme"}
                            </h3>
                            <form onSubmit={saveTheme} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={themeForm.name}
                                        onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        placeholder="e.g. Seasonal Sale"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                    <textarea
                                        value={themeForm.description || ''}
                                        onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 min-h-[100px]"
                                        placeholder="Describe the theme..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsThemeModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                    >
                                        Save Theme
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Desire Modal */}
            {
                isDesireModalOpen && (
                    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsDesireModalOpen(false); }}>
                        <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                                {editingDesire ? "Edit Desire" : "Create New Desire"}
                            </h3>
                            <form onSubmit={saveDesire} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={desireForm.name}
                                        onChange={(e) => setDesireForm({ ...desireForm, name: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        placeholder="e.g. Fear of Missing Out"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={desireForm.category || ''}
                                        onChange={(e) => setDesireForm({ ...desireForm, category: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        placeholder="e.g. Emotional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Brain Clicks</label>
                                    <input
                                        type="text"
                                        value={desireForm.brainClicks || ''}
                                        onChange={(e) => setDesireForm({ ...desireForm, brainClicks: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        placeholder="e.g. Scarcity, Urgency"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                    <textarea
                                        value={desireForm.description || ''}
                                        onChange={(e) => setDesireForm({ ...desireForm, description: e.target.value })}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 min-h-[100px]"
                                        placeholder="Describe the desire..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsDesireModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                    >
                                        Save Desire
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
