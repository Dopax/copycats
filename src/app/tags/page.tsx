"use client";

import { useState, useEffect } from "react";

// Types
interface LinkedAd {
    id: string;
    postId: string;
    brand: string;
    thumbnailUrl: string | null;
    videoUrl: string | null;
}

interface LinkedBatch {
    id: number;
    name: string;
    status: string;
}

interface Tag {
    id: string;
    name: string;
}

interface FormatTag extends Tag {
    ads?: LinkedAd[];
    batches?: LinkedBatch[];
}

interface Hook extends Tag {
    type?: string;
    content?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
}

// ... (Rest of Hooks code) ...

function FormatCard({ format, onEdit, onDelete }: { format: FormatTag, onEdit: (id: string, name: string) => void, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{format.name}</h3>
                    <span className="text-xs text-zinc-500">FORMAT</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(format.id, format.name)} className="text-zinc-400 hover:text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(format.id)} className="text-zinc-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800 text-sm">

                {/* Linked Batches */}
                <div className="p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Batches ({format.batches?.length || 0})
                    </h4>
                    {format.batches && format.batches.length > 0 ? (
                        <ul className="space-y-2">
                            {format.batches.map(batch => (
                                <li key={batch.id}>
                                    <a href={`/batches/${batch.id}`} className="block bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-mono text-[10px] text-zinc-400 group-hover:text-indigo-500">BATCH{batch.id}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">{batch.status}</span>
                                        </div>
                                        <div className="font-medium text-xs truncate text-zinc-800 dark:text-zinc-200">{batch.name}</div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-400 text-xs italic">No batches attached.</p>
                    )}
                </div>

                {/* Linked Ads */}
                <div className="p-4 space-y-3">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Competitor Ads ({format.ads?.length || 0})
                    </h4>
                    {format.ads && format.ads.length > 0 ? (
                        <div className="space-y-2">
                            {format.ads.map(ad => (
                                <a key={ad.id} href={`/ads/${ad.postId}`} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group">
                                    <div className="w-8 h-8 flex-shrink-0 bg-black rounded overflow-hidden">
                                        {ad.thumbnailUrl || ad.videoUrl ? (
                                            <img src={ad.thumbnailUrl || (ad.videoUrl ? "/placeholder.png" : "")} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-zinc-900 dark:text-white truncate group-hover:text-indigo-600">{ad.brand || "Unknown Brand"}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono">{ad.postId}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-400 text-xs italic">No ads attached.</p>
                    )}
                </div>
            </div>
        </div>
    );
}


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
            <div className="aspect-video bg-black rounded-md overflow-hidden relative group">
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

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
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

export default function TagsPage() {
    const [activeTab, setActiveTab] = useState<"formats" | "hooks" | "themes" | "angles" | "demographics" | "awareness-levels">("formats");
    const [tags, setTags] = useState<Tag[] | Hook[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Simple Tag Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // Hook Modal State
    const [isHookModalOpen, setIsHookModalOpen] = useState(false);
    const [editingHook, setEditingHook] = useState<Hook | null>(null);
    const [hookForm, setHookForm] = useState<Partial<Hook>>({ name: '', type: 'TEXT', content: '', videoUrl: '', thumbnailUrl: '' });


    const fetchTags = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setTags(data);
            }
        } catch (error) {
            console.error("Failed to fetch tags:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [activeTab]);

    // -- Simple Tag Handlers --
    const handleUpdate = async (id: string) => {
        try {
            const res = await fetch(`/api/${activeTab}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
            });

            if (res.ok) {
                setTags(tags.map(t => t.id === id ? { ...t, name: editName } : t));
                setEditingId(null);
                setEditName("");
            }
        } catch (error) {
            console.error("Failed to update tag:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tag?")) return;
        try {
            const res = await fetch(`/api/${activeTab}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTags(tags.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete tag:", error);
        }
    };

    // -- Hook Handlers --
    const openHookModal = (hook?: Hook) => {
        if (hook) {
            setEditingHook(hook);
            setHookForm({ ...hook });
        } else {
            setEditingHook(null);
            setHookForm({ name: '', type: 'TEXT', content: '', videoUrl: '', thumbnailUrl: '' });
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
                body: JSON.stringify(hookForm),
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingHook) {
                    setTags(tags.map(t => t.id === saved.id ? saved : t));
                } else {
                    setTags([...tags, saved]);
                }
                setIsHookModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save hook", error);
        }
    };


    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Manage Tags</h1>

            <div className="flex space-x-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 overflow-x-auto">
                {(["formats", "hooks", "themes", "angles", "demographics", "awareness-levels"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[100px] rounded-lg py-2.5 text-sm font-medium leading-5 transition-all whitespace-nowrap
                            ${activeTab === tab
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-white/[0.12] hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'formats' ? (
                // -- Rich Formats UI --
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => { setEditingId("NEW"); setEditName(""); }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            + New Format
                        </button>
                    </div>

                    {isLoading ? <div className="p-8 text-center">Loading Formats...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {(tags as FormatTag[]).map(format => (
                                <div key={format.id} className="h-full">
                                    {editingId === format.id ? (
                                        // Edit Mode for Format Card Title
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1">Rename Format</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full mb-3 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdate(format.id)} className="text-indigo-600 text-sm font-medium">Save</button>
                                                <button onClick={() => { setEditingId(null); setEditName(""); }} className="text-zinc-500 text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <FormatCard
                                            format={format}
                                            onEdit={(id, name) => { setEditingId(id); setEditName(name); }}
                                            onDelete={handleDelete}
                                        />
                                    )}
                                </div>
                            ))}

                            {/* New Format Input Card */}
                            {editingId === "NEW" && (
                                <div className="bg-dashed border-2 border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-6 flex flex-col justify-center gap-3">
                                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200">New Format</h3>
                                    <input
                                        type="text"
                                        placeholder="Format Name (e.g. UGC Testimonial)"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/formats', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ name: editName })
                                                    });
                                                    if (res.ok) {
                                                        const newFormat = await res.json();
                                                        setTags([...tags, newFormat]);
                                                        setEditingId(null);
                                                        setEditName("");
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(null); setEditName(""); }}
                                            className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {tags.length === 0 && editingId !== "NEW" && (
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
            ) : (
                // -- Simple Table UI for others --
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
        </div>
    );
}
