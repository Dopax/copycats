"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Types
interface Hook { id: string; name: string; }
interface AwarenessLevel { id: string; name: string; }

interface BatchItem {
    id: string;
    hook?: Hook;
    notes?: string;
    script?: string;
    status: string;
}
interface Batch {
    id: number;
    name: string;
    status: string;
    batchType: string;
    priority: string;
    brief?: string;
    concept: {
        name: string;
        angle: { name: string };
        theme: { name: string };
        demographic: { name: string };
    };
    format?: { name: string };
    awarenessLevel?: AwarenessLevel;
    assignee?: string;
    items: BatchItem[];
    referenceAd?: {
        postId: string;
        headline: string;
        description: string;
        videoUrl: string | null;
        thumbnailUrl: string | null;
    };
}

const STATUS_FLOW = ["IDEATION", "BRIEFING", "EDITING", "REVIEW", "LAUNCHING", "COMPLETED", "ARCHIVED"];

export default function BatchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [hooks, setHooks] = useState<Hook[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AwarenessLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form States
    const [brief, setBrief] = useState("");
    const [isSavingBrief, setIsSavingBrief] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [batchRes, hooksRes, awarenessRes] = await Promise.all([
                fetch(`/api/batches/${id}`),
                fetch('/api/hooks'),
                fetch('/api/awareness-levels')
            ]);

            if (batchRes.ok) {
                const data = await batchRes.json();
                setBatch(data);
                setBrief(data.brief || "");
            } else {
                // Batch not found
                router.push('/batches');
            }
            if (hooksRes.ok) setHooks(await hooksRes.json());
            if (awarenessRes.ok) setAwarenessLevels(await awarenessRes.json());

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getVariationLabel = (index: number) => {
        return String.fromCharCode(65 + index); // A, B, C...
    };

    const updateStatus = async (newStatus: string) => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setBatch({ ...batch, status: newStatus });
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const updateAwarenessLevel = async (levelId: string) => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ awarenessLevelId: levelId || null })
            });

            if (res.ok) {
                const selectedLevel = awarenessLevels.find(l => l.id === levelId);
                setBatch({ ...batch, awarenessLevel: selectedLevel });
            }
        } catch (error) {
            console.error("Failed to update awareness level", error);
        }
    };

    const saveBrief = async () => {
        if (!batch) return;
        setIsSavingBrief(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brief })
            });
        } catch (error) {
            console.error("Failed to save brief", error);
        } finally {
            setIsSavingBrief(false);
        }
    };

    const addBatchItem = async () => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/batches/${batch.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PENDING' })
            });
            if (res.ok) {
                const newItem = await res.json();
                setBatch({ ...batch, items: [...batch.items, newItem] });
            }
        } catch (error) {
            console.error("Failed to add item", error);
        }
    };

    const updateItem = async (itemId: string, data: any) => {
        if (!batch) return;
        // Optimistic update
        const updatedItems = batch.items.map(item => item.id === itemId ? { ...item, ...data } : item);
        setBatch({ ...batch, items: updatedItems });

        try {
            await fetch(`/api/batch-items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error("Failed to update item", error);
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!batch || !confirm("Delete this variation?")) return;

        try {
            const res = await fetch(`/api/batch-items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                setBatch({
                    ...batch,
                    items: batch.items.filter(i => i.id !== itemId)
                });
            }
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const createHook = async (name: string) => {
        try {
            const res = await fetch('/api/hooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const newHook = await res.json();
                setHooks([...hooks, newHook]);
                return newHook.id;
            }
        } catch (e) {
            console.error("Failed to create hook", e);
        }
        return null;
    };

    if (isLoading) return <div className="p-10 text-center text-zinc-500">Loading Batch Details...</div>;
    if (!batch) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4 text-zinc-500 mb-2">
                <Link href="/batches" className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Board
                </Link>
                <span>/</span>
                <span className="text-zinc-900 dark:text-white font-medium truncate">{batch.name}</span>
            </div>

            {/* Top Bar: Status & Meta */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                <span className="font-mono text-zinc-400 mr-2">BATCH{batch.id}:</span>
                                {batch.name}
                            </h1>
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded uppercase">
                                {batch.batchType.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2">
                            Concept: <span className="font-medium text-zinc-700 dark:text-zinc-300">{batch.concept.name}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-zinc-500">Status:</label>
                        <select
                            value={batch.status}
                            onChange={(e) => updateStatus(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            {STATUS_FLOW.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Concept Context Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Angle</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{batch.concept.angle.name}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Theme</span>
                        <span className="font-medium text-pink-600 dark:text-pink-400">{batch.concept.theme.name}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Demographic</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{batch.concept.demographic.name}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Format</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{batch.format?.name || "N/A"}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Awareness Level</span>
                        <select
                            value={batch.awarenessLevel?.id || ""}
                            onChange={(e) => updateAwarenessLevel(e.target.value)}
                            className="bg-transparent font-medium text-cyan-600 dark:text-cyan-400 w-full outline-none focus:ring-0 p-0 text-sm cursor-pointer"
                        >
                            <option value="">Select...</option>
                            {awarenessLevels.map(al => (
                                <option key={al.id} value={al.id}>{al.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Brief & Reference */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Brief Editor */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm h-fit">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-zinc-900 dark:text-white">Creative Brief</h3>
                            <button
                                onClick={saveBrief}
                                disabled={isSavingBrief}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                            >
                                {isSavingBrief ? "Saving..." : "Save"}
                            </button>
                        </div>
                        <textarea
                            value={brief}
                            onChange={(e) => setBrief(e.target.value)}
                            className="w-full h-80 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                            placeholder="Describe the ad concept, visual direction, and key messaging..."
                        />
                    </div>

                    {/* Reference Ad (If Any) */}
                    {batch.referenceAd && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    Reference Ad
                                </h3>
                            </div>

                            {/* Media Player */}
                            <div className="aspect-square sm:aspect-[4/5] bg-black relative group">
                                {batch.referenceAd.videoUrl ? (
                                    <video
                                        src={batch.referenceAd.videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={batch.referenceAd.thumbnailUrl || undefined}
                                    />
                                ) : (
                                    <img
                                        src={batch.referenceAd.thumbnailUrl || "/placeholder.png"}
                                        alt="Reference"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="space-y-1">
                                    <p className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-snug">
                                        {batch.referenceAd.headline || "No Headline"}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Post ID: {batch.referenceAd.postId}
                                    </p>
                                </div>

                                {batch.referenceAd.description && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded p-2 text-xs text-zinc-600 dark:text-zinc-300 max-h-32 overflow-y-auto custom-scrollbar">
                                        {batch.referenceAd.description}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <Link
                                        href={`/ads/${batch.referenceAd.postId}`}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-center gap-1 w-full py-1"
                                    >
                                        View Full Analysis
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Ad Variations (Items) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ad Variations</h2>
                        <button
                            onClick={addBatchItem}
                            className="bg-white border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                        >
                            + Add Variation
                        </button>
                    </div>

                    <div className="space-y-4">
                        {batch.items.map((item, index) => (
                            <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${item.status === 'DONE' ? 'border-green-200 dark:border-green-900/50 bg-green-50/20' : 'border-zinc-200 dark:border-zinc-800'} p-5 shadow-sm transition-all`}>
                                <div className="flex items-start gap-4">
                                    {/* Variation ID */}
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 text-lg border border-zinc-200 dark:border-zinc-700">
                                            {getVariationLabel(index)}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-mono">
                                            BATCH{batch.id}{getVariationLabel(index)}
                                        </span>
                                    </div>

                                    {/* Edit Form */}
                                    <div className="flex-1 space-y-4">

                                        {/* Hook Selector */}
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Hook</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={item.hook?.id || ""}
                                                    onChange={(e) => updateItem(item.id, { hookId: e.target.value })}
                                                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select Hook...</option>
                                                    {hooks.map(h => (
                                                        <option key={h.id} value={h.id}>{h.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        const name = prompt("New Hook Name:");
                                                        if (name) {
                                                            const id = await createHook(name);
                                                            if (id) updateItem(item.id, { hookId: id });
                                                        }
                                                    }}
                                                    className="px-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Script */}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Visual Script</label>
                                                <textarea
                                                    value={item.script || ""}
                                                    onChange={(e) => updateItem(item.id, { script: e.target.value })}
                                                    onBlur={(e) => updateItem(item.id, { script: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
                                                    placeholder="Enter the visual script for this variation..."
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Variation Notes</label>
                                                <textarea
                                                    value={item.notes || ""}
                                                    onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                                    onBlur={(e) => updateItem(item.id, { notes: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Any specific notes for the editor..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => updateItem(item.id, { status: item.status === 'DONE' ? 'PENDING' : 'DONE' })}
                                            className={`p-2 rounded-full transition-colors ${item.status === 'DONE' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
                                            title="Toggle Status"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Variation"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {batch.items.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <p className="text-zinc-500 mb-2">No variations added yet.</p>
                                <button onClick={addBatchItem} className="text-indigo-600 hover:underline text-sm">Add your first variation</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
