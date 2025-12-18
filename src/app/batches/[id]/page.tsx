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
        awarenessLevel?: { name: string };
        conceptDoc?: string;
    };
    format?: { name: string };
    assignee?: string;
    items: BatchItem[];
    referenceAd?: {
        postId: string;
        headline: string;
        description: string;
        videoUrl: string | null;
        thumbnailUrl: string | null;
    };
    // AI Boost Fields
    aiAdCopy?: string;
    aiImagePrompt?: string;
    aiVideoPrompt?: string;
}

const STATUS_FLOW = ["IDEATION", "BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"];

// Helper to determine active sections based on status
const getSectionState = (section: string, currentStatus: string) => {
    // Define the sequence of major stages
    // PRODUCTION covers both Briefing and Editing
    const sequence = ["PRODUCTION", "REVIEW", "AI_BOOST", "LAUNCHED"];

    // Map status to stage index
    const statusMap: Record<string, number> = {
        "IDEATION": 0, "BRIEFING": 0, "EDITING": 0, // All map to PRODUCTION stage
        "REVIEW": 1,
        "AI_BOOST": 2, // Adjusted indices
        "LAUNCHED": 3, "ARCHIVED": 3
    };

    const currentStageIndex = statusMap[currentStatus] ?? 0;
    const sectionIndex = sequence.indexOf(section);

    if (sectionIndex === currentStageIndex) return "active";
    if (sectionIndex < currentStageIndex) return "past";
    return "future";
};

// Accordion Component
const BatchSection = ({
    title,
    status,
    isOpen,
    onToggle,
    actions,
    children
}: {
    title: string;
    status: 'active' | 'past' | 'future';
    isOpen: boolean;
    onToggle: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) => {
    const isInactive = status === "future";
    const isPast = status === "past";

    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-300 ${status === 'active'
            ? 'border-indigo-200 dark:border-indigo-900 shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20'
            : 'border-zinc-200 dark:border-zinc-800'
            } ${isInactive ? 'opacity-50 grayscale' : ''}`}>

            {/* Header / Trigger */}
            <div
                className={`flex items-center justify-between p-4 cursor-pointer select-none ${!isOpen && status === 'active' ? 'bg-indigo-50/30' : ''}`}
                onClick={!isInactive ? onToggle : undefined}
            >
                <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${status === 'active' ? 'bg-indigo-100 text-indigo-600' :
                        status === 'past' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-zinc-100 text-zinc-400'
                        }`}>
                        {status === 'past' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-indigo-600 animate-pulse' : 'bg-zinc-400'}`} />
                        )}
                    </div>

                    <h2 className={`text-lg font-bold transition-colors ${status === 'active' ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-700 dark:text-zinc-300'
                        }`}>
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Actions (Always visible if expanded, or simplified if needed) */}
                    {/* We stop propagation so clicking action doesn't toggle accordion if unintended, but usually actions are discrete buttons */}
                    <div onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>

                    {/* Chevron */}
                    <svg className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="p-5 pt-0 border-t border-transparent animate-in slide-in-from-top-2 duration-200">
                    <div className="mt-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};


function ViewDocModal({ content, onClose }: { content: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg dark:text-white">Concept Document (Buyer Persona)</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap dark:text-zinc-300">
                    {content}
                </div>
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-800/50">
                    <button
                        onClick={() => navigator.clipboard.writeText(content)}
                        className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
                    >
                        Copy to Clipboard
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BatchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [hooks, setHooks] = useState<Hook[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);

    // Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Form States
    const [brief, setBrief] = useState("");
    const [isSavingBrief, setIsSavingBrief] = useState(false);

    // AI Boost Form States
    const [aiForm, setAiForm] = useState({ adCopy: "", imagePrompt: "", videoPrompt: "" });
    const [isSavingAi, setIsSavingAi] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [batchRes, hooksRes] = await Promise.all([
                fetch(`/api/batches/${id}`),
                fetch('/api/hooks')
            ]);

            if (batchRes.ok) {
                const data = await batchRes.json();
                setBatch(data);
                setBrief(data.brief || "");
                setAiForm({
                    adCopy: data.aiAdCopy || "",
                    imagePrompt: data.aiImagePrompt || "",
                    videoPrompt: data.aiVideoPrompt || ""
                });

                // Initialize Accordion State: Open active section
                const stages = ["PRODUCTION", "REVIEW", "AI_BOOST", "LAUNCHED"];
                const newExpanded: Record<string, boolean> = {};

                // Open the Active one by default
                stages.forEach(s => {
                    if (getSectionState(s, data.status) === 'active') {
                        newExpanded[s] = true;
                    }
                });
                setExpandedSections(newExpanded);

            } else {
                router.push('/batches');
            }
            if (hooksRes.ok) setHooks(await hooksRes.json());


        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
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

    const saveAiBoost = async () => {
        if (!batch) return;
        setIsSavingAi(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiAdCopy: aiForm.adCopy,
                    aiImagePrompt: aiForm.imagePrompt,
                    aiVideoPrompt: aiForm.videoPrompt
                })
            });
            setBatch(prev => prev ? ({
                ...prev,
                aiAdCopy: aiForm.adCopy,
                aiImagePrompt: aiForm.imagePrompt,
                aiVideoPrompt: aiForm.videoPrompt
            }) : null);

        } catch (error) {
            console.error("Failed to save AI Boost", error);
        } finally {
            setIsSavingAi(false);
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

    const deleteBatch = async () => {
        if (!batch) return;
        if (confirm("⚠️ Are you sure you want to delete this batch?\n\nThis action cannot be undone and will remove all associated variations and data.")) {
            try {
                const res = await fetch(`/api/batches/${batch.id}`, { method: 'DELETE' });
                if (res.ok) {
                    router.push('/batches');
                } else {
                    alert("Failed to delete batch");
                }
            } catch (error) {
                console.error("Failed to delete batch", error);
            }
        }
    };

    if (isLoading) return <div className="p-10 text-center text-zinc-500">Loading Batch Details...</div>;
    if (!batch) return null;

    // --- SECTIONS ---

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
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

                    <div className="flex items-center gap-3">
                        <button
                            onClick={deleteBatch}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Batch"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>

                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

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
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Awareness Level</span>
                            <span className="font-medium text-cyan-600 dark:text-cyan-400">{batch.concept.awarenessLevel?.name || "Not set"}</span>
                        </div>
                        {(batch.concept as any).conceptDoc && (
                            <button
                                onClick={() => setViewingDoc((batch.concept as any).conceptDoc)}
                                className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                            >
                                View Persona
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ACCORDION SECTIONS --- */}

            <div className="space-y-4">

                {/* 1. PRODUCTION (Brief & Variations) */}
                <BatchSection
                    title="Brief & Variations"
                    status={getSectionState("PRODUCTION", batch.status)}
                    isOpen={expandedSections["PRODUCTION"] || false}
                    onToggle={() => toggleSection("PRODUCTION")}
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); saveBrief(); }}
                                disabled={isSavingBrief || getSectionState("PRODUCTION", batch.status) === "future"}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                                {isSavingBrief ? "Saving Brief..." : "Save Brief"}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); addBatchItem(); }}
                                disabled={getSectionState("PRODUCTION", batch.status) === "future"}
                                className="text-xs font-medium bg-white border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                + Variation
                            </button>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Brief Column (Left) */}
                        <div className="space-y-6 lg:col-span-1">
                            <textarea
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                                className="w-full h-80 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                                placeholder="Describe the ad concept, visual direction, and key messaging..."
                                disabled={getSectionState("PRODUCTION", batch.status) === "future"}
                            />
                            {batch.referenceAd && (
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase">Reference Ad</h3>
                                    </div>
                                    <div className="aspect-square sm:aspect-[4/5] bg-black relative group">
                                        {batch.referenceAd.videoUrl ? (
                                            <video src={batch.referenceAd.videoUrl} controls className="w-full h-full object-contain" poster={batch.referenceAd.thumbnailUrl || undefined} />
                                        ) : (
                                            <img src={batch.referenceAd.thumbnailUrl || "/placeholder.png"} alt="Reference" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-white line-clamp-2">{batch.referenceAd.headline || "No Headline"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Variations Column (Right - Spans 2) */}
                        <div className="flex flex-col gap-4 lg:col-span-2">
                            <div className="space-y-4">
                                {batch.items.map((item, index) => (
                                    <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${item.status === 'DONE' ? 'border-green-200 dark:border-green-900/50 bg-green-50/20' : 'border-zinc-200 dark:border-zinc-800'} p-5 shadow-sm transition-all`}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                                <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-200 text-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                                                    {getVariationLabel(index)}
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Hook</label>
                                                    <div className="flex gap-2">
                                                        <select value={item.hook?.id || ""} onChange={(e) => updateItem(item.id, { hookId: e.target.value })} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                                            <option value="">Select Hook...</option>
                                                            {hooks.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                        </select>
                                                        <button onClick={async (e) => { e.preventDefault(); const name = prompt("New Hook Name:"); if (name) { const id = await createHook(name); if (id) updateItem(item.id, { hookId: id }); } }} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="px-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors">+</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Visual Script</label>
                                                        <textarea value={item.script || ""} onChange={(e) => updateItem(item.id, { script: e.target.value })} onBlur={(e) => updateItem(item.id, { script: e.target.value })} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed" placeholder="Enter visual script..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Visual Notes</label>
                                                        <textarea value={item.notes || ""} onChange={(e) => updateItem(item.id, { notes: e.target.value })} onBlur={(e) => updateItem(item.id, { notes: e.target.value })} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-indigo-500" placeholder="Notes for editor..." />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <button onClick={() => updateItem(item.id, { status: item.status === 'DONE' ? 'PENDING' : 'DONE' })} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className={`p-2 rounded-full transition-colors ${item.status === 'DONE' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                                                <button onClick={() => deleteItem(item.id)} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {batch.items.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <p className="text-zinc-500 text-sm mb-2">No variations added yet.</p>
                                        <button onClick={addBatchItem} disabled={getSectionState("PRODUCTION", batch.status) === "future"} className="text-indigo-600 hover:underline text-sm font-medium">Add your first variation</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </BatchSection>

                {/* 3. REVIEW DASHBOARD */}
                <BatchSection
                    title="Review Dashboard"
                    status={getSectionState("REVIEW", batch.status)}
                    isOpen={expandedSections["REVIEW"] || false}
                    onToggle={() => toggleSection("REVIEW")}
                    actions={null}
                >
                    <div className="space-y-4">
                        {getSectionState("REVIEW", batch.status) === "active" && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 mb-4">
                                <p><strong>Review Mode:</strong> Please approve variations or add revision notes.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {batch.items.map((item, index) => (
                                <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-zinc-700 w-8 h-8 flex items-center justify-center bg-zinc-100 rounded">{getVariationLabel(index)}</span>
                                            <span className="text-sm font-medium text-zinc-600">{item.hook?.name || "No Hook"}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto">{item.script || "No Script Content"}</div>
                                    {getSectionState("REVIEW", batch.status) === "active" && (
                                        <div className="flex gap-2 mt-auto pt-2">
                                            <button onClick={() => updateItem(item.id, { status: "DONE" })} disabled={item.status === "DONE"} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50">Approve</button>
                                            <button onClick={() => { const note = prompt("Add revision note:", item.notes || ""); if (note !== null) updateItem(item.id, { notes: note, status: "PENDING" }); }} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-1.5 rounded text-xs font-medium transition-colors">Request Revision</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </BatchSection>

                {/* 4. AI BOOST */}
                <BatchSection
                    title="AI Boost Assets"
                    status={getSectionState("AI_BOOST", batch.status)}
                    isOpen={expandedSections["AI_BOOST"] || false}
                    onToggle={() => toggleSection("AI_BOOST")}
                    actions={
                        <button onClick={saveAiBoost} disabled={isSavingAi || getSectionState("AI_BOOST", batch.status) === "future"} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
                            {isSavingAi ? "Saving..." : "Save Assets"}
                        </button>
                    }
                >
                    <div className="space-y-6">
                        {getSectionState("AI_BOOST", batch.status) === "active" && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-200">
                                <p><strong>AI Power-Up:</strong> Generate supporting assets for your launch.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                                <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2"><span className="text-lg">🖼️</span> Image Prompts</label>
                                <textarea value={aiForm.imagePrompt} onChange={(e) => setAiForm({ ...aiForm, imagePrompt: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "future"} className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500" placeholder="Describe image assets..." />
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                                <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2"><span className="text-lg">🎥</span> Sora Prompts</label>
                                <textarea value={aiForm.videoPrompt} onChange={(e) => setAiForm({ ...aiForm, videoPrompt: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "future"} className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500" placeholder="Direct prompts for Sora..." />
                            </div>
                            <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                                <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2"><span className="text-lg">📝</span> Final Ad Copy</label>
                                <textarea value={aiForm.adCopy} onChange={(e) => setAiForm({ ...aiForm, adCopy: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "future"} className="w-full h-40 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500 font-sans" placeholder="Primary Text, Headline..." />
                            </div>
                        </div>
                    </div>
                </BatchSection>

                {/* Doc View Modal */}
                {viewingDoc && <ViewDocModal content={viewingDoc} onClose={() => setViewingDoc(null)} />}
            </div>
        </div>
    );
}
