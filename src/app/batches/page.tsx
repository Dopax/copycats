"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Types
interface Batch {
    id: number;
    name: string;
    status: string;
    batchType: string;
    priority: string;
    concept: { name: string };
    format?: { name: string };
    assignee?: string;
    updatedAt: string;
    _count?: { items: number };
}

interface Concept { id: string; name: string; }
interface Format { id: string; name: string; }

const STATUS_COLUMNS = [
    { key: "IDEATION", label: "Ideation", color: "bg-gray-100 dark:bg-zinc-800" },
    { key: "BRIEFING", label: "Briefing", color: "bg-blue-50 dark:bg-blue-900/10" },
    { key: "EDITING", label: "Editing", color: "bg-amber-50 dark:bg-amber-900/10" },
    { key: "REVIEW", label: "Review", color: "bg-purple-50 dark:bg-purple-900/10" },
    { key: "LAUNCHING", label: "Launching", color: "bg-green-50 dark:bg-green-900/10" },
    { key: "COMPLETED", label: "Completed", color: "bg-zinc-100 dark:bg-zinc-800" },
];

function BatchesContent() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState("");
    const [newBatchType, setNewBatchType] = useState("NET_NEW");
    const [newBatchPriority, setNewBatchPriority] = useState("MEDIUM");
    const [newBatchConcept, setNewBatchConcept] = useState("");
    const [newBatchFormat, setNewBatchFormat] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Reference Ad State
    const [referenceAdId, setReferenceAdId] = useState<string | null>(null);
    const [referenceAdPostId, setReferenceAdPostId] = useState<string | null>(null);

    // Duplicate Warning State
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Effect to check URL params for initial modal state
    useEffect(() => {
        const create = searchParams.get("create");
        const refId = searchParams.get("refAdId");
        const refPostId = searchParams.get("refAdPostId");

        if (create === "true") {
            setIsModalOpen(true);

            // If reference ad is passed
            if (refId) {
                setReferenceAdId(refId);
                setReferenceAdPostId(refPostId || "Unknown");
                setNewBatchType("COPYCAT"); // Default to Copycat if ad provided
                setNewBatchName(refPostId ? `Copycat of ${refPostId}` : "");

                // CHECK FOR DUPLICATES
                checkForDuplicates(refId);
            }
        }
    }, [searchParams, batches]); // Add batches to dependency to check against loaded data

    const checkForDuplicates = (refId: string) => {
        // Simple client-side check against loaded batches
        // Ideally this would be a server check, but client-side is faster for immediate feedback
        const existingBatch = batches.find(b => (b as any).referenceAdId === refId); // Need to expose referenceAdId in Batch type or fetch it

        // Since list endpoint might not return referenceAdId, let's just warn if we see a name match or similar
        // Actually, let's fetch strictly to be sure
        fetch(`/api/batches?referenceAdId=${refId}`).then(res => res.json()).then(data => {
            if (data && data.length > 0) {
                setDuplicateWarning(`Warning: A batch for Ad ${refId} already exists (Batch #${data[0].id}: ${data[0].name}).`);
            } else {
                setDuplicateWarning(null);
            }
        }).catch(() => setDuplicateWarning(null));
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [batchesRes, conceptsRes, formatsRes] = await Promise.all([
                fetch('/api/batches'),
                fetch('/api/concepts'),
                fetch('/api/formats')
            ]);

            if (batchesRes.ok) setBatches(await batchesRes.json());
            if (conceptsRes.ok) setConcepts(await conceptsRes.json());
            if (formatsRes.ok) setFormats(await formatsRes.json());

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch('/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBatchName,
                    batchType: newBatchType,
                    priority: newBatchPriority,
                    conceptId: newBatchConcept,
                    formatId: newBatchFormat || null,
                    referenceAdId: (newBatchType === 'COPYCAT' || newBatchType === 'ITERATION') ? referenceAdId : null
                }),
            });

            if (res.ok) {
                const created = await res.json();
                setBatches([created, ...batches]);
                setIsModalOpen(false);
                resetForm();

                // If created from URL param flow, clean up URL
                if (searchParams.get("create")) {
                    router.replace('/batches');
                }
            } else {
                alert("Failed to create batch");
            }
        } catch (error) {
            console.error("Error creating batch:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setNewBatchName("");
        setNewBatchType("NET_NEW");
        setNewBatchPriority("MEDIUM");
        setNewBatchConcept("");
        setNewBatchFormat("");
        setReferenceAdId(null);
        setReferenceAdPostId(null);
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'HIGH': return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">HIGH</span>;
            case 'LOW': return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">LOW</span>;
            default: return null;
        }
    };

    const getTypeLabel = (t: string) => {
        switch (t) {
            case 'COPYCAT': return '🐱 Copycat';
            case 'NET_NEW': return '✨ Net New';
            case 'ITERATION': return '🔄 Iteration';
            default: return t;
        }
    };

    // Drag and Drop State
    const [draggedBatchId, setDraggedBatchId] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedBatchId(id);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        // Set data for compatibility, though we rely on state
        e.dataTransfer.setData("text/plain", id.toString());
    };

    const handleDragEnd = () => {
        setDraggedBatchId(null);
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();

        if (draggedBatchId === null) return;

        // Optimistic Update
        const updatedBatches = batches.map(b =>
            b.id === draggedBatchId ? { ...b, status: newStatus } : b
        );
        setBatches(updatedBatches);

        // Clear drag state
        setDraggedBatchId(null);
        setIsDragging(false);

        // API Update
        try {
            await fetch(`/api/batches/${draggedBatchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error? For now we assume success or user refresh.
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ad Batches</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage and track your creative production pipeline.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Batch
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-6 min-w-max">
                    {STATUS_COLUMNS.map(column => {
                        const columnBatches = batches.filter(b => b.status === column.key);
                        return (
                            <div
                                key={column.key}
                                className={`w-80 flex flex-col h-full rounded-xl transition-colors ${isDragging ? 'bg-zinc-100/80 dark:bg-zinc-900/80 border-dashed border-2' : 'bg-zinc-50/50 dark:bg-zinc-900/50 border'
                                    } border-zinc-200 dark:border-zinc-800/50`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.key)}
                            >
                                {/* Column Header */}
                                <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex justify-between items-center ${column.color}`}>
                                    <h3 className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">{column.label}</h3>
                                    <span className="bg-white/50 dark:bg-black/20 text-zinc-600 dark:text-zinc-400 text-xs font-mono px-2 py-0.5 rounded-full">
                                        {columnBatches.length}
                                    </span>
                                </div>

                                {/* Column Content */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {columnBatches.map(batch => (
                                        <div
                                            key={batch.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, batch.id)}
                                            onDragEnd={handleDragEnd}
                                            className="transform transition-transform active:scale-95"
                                        >
                                            <Link href={`/batches/${batch.id}`} className="block group">
                                                <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing ${draggedBatchId === batch.id ? 'opacity-50' : ''}`}>

                                                    {/* Card Header: Priority & Type */}
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                                            {getTypeLabel(batch.batchType)}
                                                        </span>
                                                        {getPriorityBadge(batch.priority)}
                                                    </div>

                                                    {/* Batch Name */}
                                                    <h4 className="font-semibold text-zinc-900 dark:text-white text-sm leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                        <span className="font-mono text-xs text-zinc-400 mr-2">BATCH{batch.id}</span>
                                                        {batch.name}
                                                    </h4>

                                                    {/* Meta Info */}
                                                    <div className="space-y-1.5 mt-3">
                                                        {/* Concept */}
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                                            <span className="truncate">{batch.concept?.name}</span>
                                                        </div>

                                                        {/* Format (if assigned) */}
                                                        {batch.format && (
                                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                                <span>{batch.format.name}</span>
                                                            </div>
                                                        )}

                                                        {/* Assignee */}
                                                        {batch.assignee && (
                                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                                                                    {batch.assignee.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span>{batch.assignee}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer: Date */}
                                                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700 flex justify-between items-center">
                                                        <span className="text-[10px] text-zinc-400">
                                                            {new Date(batch.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                    {columnBatches.length === 0 && (
                                        <div className="h-24 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 text-xs text-center p-4">
                                            {isDragging ? 'Drop here' : 'No items'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Create New Ad Batch</h3>
                        <form onSubmit={handleCreateBatch} className="space-y-4">

                            {/* Reference Ad Info - displayed if relevant type selected */}
                            {(newBatchType === 'COPYCAT' || newBatchType === 'ITERATION') && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                                        Reference Ad
                                    </label>
                                    {referenceAdId ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-indigo-700 dark:text-indigo-200">
                                                ID: <strong>{referenceAdPostId || referenceAdId}</strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => { setReferenceAdId(null); setReferenceAdPostId(null); }}
                                                className="text-xs text-red-600 hover:text-red-700 underline"
                                            >
                                                Unlink
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-indigo-600/70 dark:text-indigo-400 flex flex-col gap-1">
                                            <p>No ad selected to copy.</p>
                                            <Link href="/ads?selectMode=true" className="text-indigo-600 hover:underline font-semibold">
                                                Select form Swipe File →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {duplicateWarning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div className="text-sm text-amber-800">
                                        <p className="font-medium">Duplicate Batch</p>
                                        <p className="text-xs mt-0.5">{duplicateWarning}</p>
                                    </div>
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Batch Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., UGC Test - Student Angle"
                                />
                            </div>

                            {/* Type & Priority Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                                    <select
                                        value={newBatchType}
                                        onChange={(e) => setNewBatchType(e.target.value)}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    >
                                        <option value="NET_NEW">✨ Net New</option>
                                        <option value="COPYCAT">🐱 Copycat</option>
                                        <option value="ITERATION">🔄 Iteration</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Priority</label>
                                    <select
                                        value={newBatchPriority}
                                        onChange={(e) => setNewBatchPriority(e.target.value)}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    >
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="LOW">Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Concept (Required) */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Concept</label>
                                <select
                                    required
                                    value={newBatchConcept}
                                    onChange={(e) => setNewBatchConcept(e.target.value)}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                >
                                    <option value="">Select a Creative Concept...</option>
                                    {concepts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {concepts.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No concepts found. Create one in the Concepts tab first.</p>
                                )}
                            </div>

                            {/* Format (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Format</label>
                                <select
                                    value={newBatchFormat}
                                    onChange={(e) => setNewBatchFormat(e.target.value)}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                >
                                    <option value="">Select Format (Optional)...</option>
                                    {formats.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                                >
                                    {isCreating ? "Creating..." : "Create Batch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BatchesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BatchesContent />
        </Suspense>
    );
}
