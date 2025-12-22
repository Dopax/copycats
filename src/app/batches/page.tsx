"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrand } from "@/context/BrandContext";

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
    items: { status: string }[];
    _count?: { items: number };
}

interface Concept { id: string; name: string; }
interface Format { id: string; name: string; }
interface Angle { id: string; name: string; }
interface Theme { id: string; name: string; }
interface Demographic { id: string; name: string; }
interface AwarenessLevel { id: string; name: string; }
interface User { id: string; name: string; role: string; email: string; }

const STATUS_COLUMNS = [
    { key: "IDEATION", label: "Ideation", color: "bg-gray-100 dark:bg-zinc-800" },
    { key: "CREATOR_BRIEFING", label: "Creator Briefing", color: "bg-orange-50 dark:bg-orange-900/10" },
    { key: "FILMING", label: "Filming", color: "bg-teal-50 dark:bg-teal-900/10" },
    { key: "EDITOR_BRIEFING", label: "Editor Briefing", color: "bg-blue-50 dark:bg-blue-900/10" },
    { key: "EDITING", label: "Editing", color: "bg-amber-50 dark:bg-amber-900/10" },
    { key: "REVIEW", label: "Review", color: "bg-purple-50 dark:bg-purple-900/10" },
    { key: "AI_BOOST", label: "AI Boost", color: "bg-indigo-50 dark:bg-indigo-900/10" },
    { key: "LAUNCHED", label: "Launched", color: "bg-green-50 dark:bg-green-900/10" },
    { key: "LEARNING", label: "Learning", color: "bg-emerald-50 dark:bg-emerald-900/10" },
];

function BatchesContent() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [angles, setAngles] = useState<Angle[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AwarenessLevel[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { selectedBrand, isLoading: isBrandLoading } = useBrand();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState("");
    const [newBatchType, setNewBatchType] = useState("NET_NEW");
    const [newBatchPriority, setNewBatchPriority] = useState("MEDIUM");
    const [newBatchConcept, setNewBatchConcept] = useState("");
    const [newBatchFormat, setNewBatchFormat] = useState("");
    const [newBatchEditor, setNewBatchEditor] = useState("");
    const [newBatchStrategist, setNewBatchStrategist] = useState("");
    const [newBatchMainMessaging, setNewBatchMainMessaging] = useState("");

    // Iteration State
    const [referenceBatchId, setReferenceBatchId] = useState<string | null>(null);
    const [eligibleBatches, setEligibleBatches] = useState<Batch[]>([]);

    useEffect(() => {
        if (newBatchType === 'ITERATION' && batches.length > 0) {
            // Filter eligible batches (e.g. Launched or Learning?) - For now just show all relevant ones
            setEligibleBatches(batches.filter(b => b.status === "LAUNCHED" || b.status === "LEARNING" || b.status === "ARCHIVED"));
        }
    }, [newBatchType, batches]);

    const [isCreating, setIsCreating] = useState(false);

    // Inline Creation State
    const [isCreatingFormat, setIsCreatingFormat] = useState(false);
    const [newFormatName, setNewFormatName] = useState("");

    const [isCreatingConcept, setIsCreatingConcept] = useState(false);
    const [newConceptForm, setNewConceptForm] = useState({
        angleId: "",
        themeId: "",
        demographicId: "",
        awarenessLevelId: ""
    });

    // Reference Ad State
    const [referenceAdId, setReferenceAdId] = useState<string | null>(null);
    const [referenceAdPostId, setReferenceAdPostId] = useState<string | null>(null);

    // Duplicate Warning State
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [duplicateBatchId, setDuplicateBatchId] = useState<number | null>(null);

    useEffect(() => {
        if (!isBrandLoading) {
            fetchData();
        }
    }, [selectedBrand, isBrandLoading]);

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
                checkForDuplicates(refId, refPostId || undefined);
            }
        }
    }, [searchParams, batches]); // Add batches to dependency to check against loaded data

    const checkForDuplicates = (refId: string, refPostId?: string) => {
        // Simple client-side check against loaded batches
        // Ideally this would be a server check, but client-side is faster for immediate feedback
        const existingBatch = batches.find(b => (b as any).referenceAdId === refId);

        // Fetch strictly to be sure
        fetch(`/api/batches?referenceAdId=${refId}`).then(res => res.json()).then(data => {
            if (data && data.length > 0) {
                const existing = data[0];
                setDuplicateWarning(
                    `You already have a batch for this Ad (${refPostId || 'ID: ' + refId}): "${existing.name}"`
                );
                setDuplicateBatchId(existing.id);
            } else {
                setDuplicateWarning(null);
                setDuplicateBatchId(null);
            }
        }).catch(() => {
            setDuplicateWarning(null);
            setDuplicateBatchId(null);
        });
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const query = selectedBrand ? `?brandId=${selectedBrand.id}` : '';
            const [batchesRes, conceptsRes, formatsRes, anglesRes, themesRes, demosRes, awareRes, usersRes] = await Promise.all([
                fetch(`/api/batches${query}`),
                fetch(`/api/concepts${query}`),
                fetch('/api/formats'),
                fetch('/api/angles'),
                fetch('/api/themes'),
                fetch('/api/demographics'),
                fetch('/api/awareness-levels'),
                fetch(`/api/users${query}`)
            ]);

            if (batchesRes.ok) setBatches(await batchesRes.json());
            if (conceptsRes.ok) setConcepts(await conceptsRes.json());
            if (formatsRes.ok) setFormats(await formatsRes.json());
            if (anglesRes.ok) setAngles(await anglesRes.json());
            if (themesRes.ok) setThemes(await themesRes.json());
            if (demosRes.ok) setDemographics(await demosRes.json());
            if (awareRes.ok) setAwarenessLevels(await awareRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newBatchConcept) {
            alert("Please select a Creative Concept.");
            return;
        }

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
                    referenceAdId: (newBatchType === 'COPYCAT') ? referenceAdId : null,
                    referenceBatchId: (newBatchType === 'ITERATION') ? referenceBatchId : null,
                    brandId: selectedBrand?.id,
                    editorId: newBatchEditor || undefined,
                    strategistId: newBatchStrategist || undefined,
                    mainMessaging: newBatchMainMessaging
                }),
            });

            if (res.ok) {
                const created = await res.json();
                setBatches([created, ...batches]);
                setIsModalOpen(false);
                resetForm();
                setReferenceBatchId(null);

                // If created from URL param flow, clean up URL
                if (searchParams.get("create")) {
                    router.replace('/batches');
                }
            } else {
                const err = await res.json();
                alert(`Failed to create batch: ${err.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error creating batch:", error);
            alert("An unexpected error occurred.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateFormat = async () => {
        if (!newFormatName.trim()) return;
        try {
            const res = await fetch('/api/formats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFormatName, brandId: selectedBrand?.id })
            });
            if (res.ok) {
                const format = await res.json();
                setFormats([...formats, format]);
                setNewBatchFormat(format.id);
                setIsCreatingFormat(false);
                setNewFormatName("");
            }
        } catch (e) {
            console.error("Failed to create format", e);
        }
    };

    const handleCreateConcept = async () => {
        if (!newConceptForm.angleId || !newConceptForm.themeId || !newConceptForm.demographicId) {
            alert("Please select Angle, Theme, and Demographic.");
            return;
        }
        try {
            const res = await fetch('/api/concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId: selectedBrand?.id,
                    ...newConceptForm
                })
            });
            if (res.ok) {
                const concept = await res.json();
                setConcepts([...concepts, concept]);
                setNewBatchConcept(concept.id);
                setIsCreatingConcept(false);
                setNewConceptForm({ angleId: "", themeId: "", demographicId: "", awarenessLevelId: "" });
            }
        } catch (e) {
            console.error("Failed to create concept", e);
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
        setNewBatchEditor("");
        setNewBatchStrategist("");
        setNewBatchMainMessaging("");
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

                                                    {/* Revision Badge */}
                                                    {batch.items?.some(i => i.status === 'PENDING') && (
                                                        <div className="mb-2">
                                                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                Revision Needed
                                                            </span>
                                                        </div>
                                                    )}

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
                                        <p className="text-xs mt-0.5">
                                            {duplicateWarning}
                                            {duplicateBatchId && (
                                                <Link href={`/batches/${duplicateBatchId}`} target="_blank" className="underline font-bold ml-1 hover:text-amber-900">
                                                    View Batch #{duplicateBatchId} →
                                                </Link>
                                            )}
                                        </p>
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

                            {/* Main Messaging - NEW FIELD in Creation */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Main Messaging <span className="text-zinc-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    value={newBatchMainMessaging}
                                    onChange={(e) => setNewBatchMainMessaging(e.target.value)}
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 h-20 resize-none"
                                    placeholder="What does my customer care about? Why should it interest the customer?"
                                />
                            </div>

                            {/* Iteration Linking */}
                            {newBatchType === "ITERATION" && (
                                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                    <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                                        Original Batch to Iterate On
                                    </label>
                                    <select
                                        value={referenceBatchId || ""}
                                        onChange={(e) => setReferenceBatchId(e.target.value || null)}
                                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5"
                                    >
                                        <option value="">Select Original Batch...</option>
                                        {eligibleBatches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.concept.name})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-zinc-500">
                                        Select a launched batch to base this iteration on.
                                    </p>
                                </div>
                            )}

                            {/* Concept (Required) */}
                            {/* Concept (Required) */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Concept</label>

                                {!isCreatingConcept ? (
                                    <div className="flex gap-2">
                                        <select
                                            required
                                            value={newBatchConcept}
                                            onChange={(e) => setNewBatchConcept(e.target.value)}
                                            className="flex-1 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        >
                                            <option value="">Select a Creative Concept...</option>
                                            {concepts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingConcept(true)}
                                            className="px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 rounded-lg text-zinc-600 dark:text-zinc-300 font-bold"
                                            title="Create New Concept"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-indigo-600 uppercase">New Concept</span>
                                            <button type="button" onClick={() => setIsCreatingConcept(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="w-full rounded text-xs p-2 border-zinc-200"
                                                value={newConceptForm.angleId}
                                                onChange={e => setNewConceptForm(prev => ({ ...prev, angleId: e.target.value }))}
                                            >
                                                <option value="">Angle...</option>
                                                {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                            <select
                                                className="w-full rounded text-xs p-2 border-zinc-200"
                                                value={newConceptForm.themeId}
                                                onChange={e => setNewConceptForm(prev => ({ ...prev, themeId: e.target.value }))}
                                            >
                                                <option value="">Theme...</option>
                                                {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <select
                                                className="w-full rounded text-xs p-2 border-zinc-200"
                                                value={newConceptForm.demographicId}
                                                onChange={e => setNewConceptForm(prev => ({ ...prev, demographicId: e.target.value }))}
                                            >
                                                <option value="">Demographic...</option>
                                                {demographics.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                            <select
                                                className="w-full rounded text-xs p-2 border-zinc-200"
                                                value={newConceptForm.awarenessLevelId}
                                                onChange={e => setNewConceptForm(prev => ({ ...prev, awarenessLevelId: e.target.value }))}
                                            >
                                                <option value="">Awareness (Opt)...</option>
                                                {awarenessLevels.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCreateConcept}
                                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded"
                                        >
                                            Create Concept
                                        </button>
                                    </div>
                                )}
                                {concepts.length === 0 && !isCreatingConcept && (
                                    <p className="text-xs text-amber-600 mt-1">No concepts found. Click + to create one.</p>
                                )}
                            </div>

                            {/* Format (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Format</label>
                                {!isCreatingFormat ? (
                                    <div className="flex gap-2">
                                        <select
                                            value={newBatchFormat}
                                            onChange={(e) => setNewBatchFormat(e.target.value)}
                                            className="flex-1 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                        >
                                            <option value="">Select Format (Optional)...</option>
                                            {formats.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingFormat(true)}
                                            className="px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 rounded-lg text-zinc-600 dark:text-zinc-300 font-bold"
                                            title="Create New Format"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 animate-in slide-in-from-left-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded text-sm p-2 border-zinc-300 dark:border-zinc-700"
                                            placeholder="Format Name (e.g. 9:16 UGC)"
                                            value={newFormatName}
                                            onChange={e => setNewFormatName(e.target.value)}
                                            autoFocus
                                        />
                                        <button type="button" onClick={handleCreateFormat} className="px-3 bg-indigo-600 text-white rounded text-xs font-bold">Save</button>
                                        <button type="button" onClick={() => setIsCreatingFormat(false)} className="px-2 text-zinc-500 hover:text-red-500">✕</button>
                                    </div>
                                )}
                            </div>

                            {/* Team Assignment */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Editor</label>
                                    <select
                                        value={newBatchEditor}
                                        onChange={(e) => setNewBatchEditor(e.target.value)}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.filter(u => u.role === 'VIDEO_EDITOR' || u.role === 'OWNER').map(u => (
                                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Strategist</label>
                                    <select
                                        value={newBatchStrategist}
                                        onChange={(e) => setNewBatchStrategist(e.target.value)}
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.filter(u => u.role === 'CREATIVE_STRATEGIST' || u.role === 'OWNER').map(u => (
                                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                        ))}
                                    </select>
                                </div>
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
