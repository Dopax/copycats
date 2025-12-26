"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrand } from "@/context/BrandContext";
import SearchableSelect from "@/components/SearchableSelect";
import AwarenessTooltip from "@/components/AwarenessTooltip";


// Types
interface Batch {
    id: number;
    name: string;
    status: string;
    batchType: string;
    priority: string;
    angle: { name: string };
    format?: { name: string };
    assignee?: string;
    updatedAt: string;
    items: { status: string }[];
    _count?: { items: number };
}

interface AdAngle {
    id: string;
    name: string;
    desireId: string;
    themeId: string;
    demographicId: string;
    awarenessLevelId?: string;
}
interface Format { id: string; name: string; }
interface Desire { id: string; name: string; }
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
    { key: "LEARNING", label: "Learning", color: "bg-emerald-50 dark:bg-emerald-900/10" },
];

function BatchesContent() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [angles, setAngles] = useState<AdAngle[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [desires, setDesires] = useState<Desire[]>([]);
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
    const [newBatchAngle, setNewBatchAngle] = useState("");
    const [newBatchFormat, setNewBatchFormat] = useState("");
    const [newBatchEditor, setNewBatchEditor] = useState("");
    const [newBatchStrategist, setNewBatchStrategist] = useState("");
    const [newBatchMainMessaging, setNewBatchMainMessaging] = useState("");
    const [showArchived, setShowArchived] = useState(false);

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

    const [isCreatingAngle, setIsCreatingAngle] = useState(false);
    const [newAngleForm, setNewAngleForm] = useState({
        desireId: "",
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

                // Fetch Ad Details for Main Messaging & Concept Auto-Fill
                fetch(`/api/ads/${refId}`).then(res => res.json()).then((ad: any) => {
                    if (!ad) return;

                    // 1. Messaging
                    if (ad.mainMessaging) {
                        setNewBatchMainMessaging(ad.mainMessaging);
                    }

                    // 2. Format
                    if (ad.formatId) {
                        setNewBatchFormat(ad.formatId);
                    }

                    // 3. Auto-Angle Logic
                    if (ad.desireId && ad.themeId && ad.demographicId) {
                        // Check if an angle with these exact tags already exists
                        const existingAngle = angles.find(a =>
                            a.desireId === ad.desireId &&
                            a.themeId === ad.themeId &&
                            a.demographicId === ad.demographicId &&
                            (ad.awarenessLevelId ? a.awarenessLevelId === ad.awarenessLevelId : true)
                        );

                        if (existingAngle) {
                            setNewBatchAngle(existingAngle.id);
                        } else {
                            // Pre-fill creation form and open it
                            setIsCreatingAngle(true);
                            setNewAngleForm({
                                desireId: ad.desireId,
                                themeId: ad.themeId,
                                demographicId: ad.demographicId,
                                awarenessLevelId: ad.awarenessLevelId || ""
                            });
                        }
                    }
                }).catch(err => console.error("Failed to fetch ad details", err));
            }
        }
    }, [searchParams]); // REMOVED batches dependency to prevent re-opening modal on save

    // Separate effect for duplicate checking that depends on batches
    useEffect(() => {
        if (referenceAdId) {
            checkForDuplicates(referenceAdId, referenceAdPostId || undefined);
        }
    }, [referenceAdId, referenceAdPostId, batches]);

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
            const [batchesRes, anglesRes, formatsRes, desiresRes, themesRes, demosRes, awareRes, usersRes] = await Promise.all([
                fetch(`/api/batches${query}`),
                fetch(`/api/angles${query}`),
                fetch('/api/formats'),
                fetch('/api/desires'),
                fetch('/api/themes'),
                fetch('/api/demographics'),
                fetch('/api/awareness-levels'),
                fetch(`/api/users${query}`)
            ]);

            if (batchesRes.ok) setBatches(await batchesRes.json());
            if (anglesRes.ok) setAngles(await anglesRes.json());
            if (formatsRes.ok) setFormats(await formatsRes.json());
            if (desiresRes.ok) setDesires(await desiresRes.json());
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

        if (!newBatchAngle) {
            alert("Please select an Angle.");
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
                    angleId: newBatchAngle,
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

    const handleCreateAngle = async () => {
        if (!newAngleForm.desireId || !newAngleForm.themeId || !newAngleForm.demographicId) {
            alert("Please select Desire, Theme, and Demographic.");
            return;
        }
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId: selectedBrand?.id,
                    ...newAngleForm
                })
            });
            if (res.ok) {
                const angle = await res.json();
                setAngles([...angles, angle]);
                setNewBatchAngle(angle.id);
                setIsCreatingAngle(false);
                setNewAngleForm({ desireId: "", themeId: "", demographicId: "", awarenessLevelId: "" });
            } else {
                const err = await res.json();
                alert(`Failed to create angle: ${err.error || "Unknown error"}`);
            }
        } catch (e) {
            console.error("Failed to create angle", e);
            alert("An unexpected error occurred while creating the angle.");
        }
    };

    const resetForm = () => {
        setNewBatchName("");
        setNewBatchType("NET_NEW");
        setNewBatchPriority("MEDIUM");
        setNewBatchAngle("");
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
    const [validDropZones, setValidDropZones] = useState<string[]>([]);

    const handleDragStart = (e: React.DragEvent, id: number, currentStatus: string) => {
        setDraggedBatchId(id);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        // Set data for compatibility, though we rely on state
        e.dataTransfer.setData("text/plain", id.toString());

        // Calculate Only Valid Next/Prev Steps
        const currentIndex = STATUS_COLUMNS.findIndex(c => c.key === currentStatus);
        const valid = [];
        if (currentIndex > -1) {
            // Allow move to Prev
            if (currentIndex > 0) valid.push(STATUS_COLUMNS[currentIndex - 1].key);
            // Allow move to Next
            if (currentIndex < STATUS_COLUMNS.length - 1) valid.push(STATUS_COLUMNS[currentIndex + 1].key);
            // Allow stay in same (optional, but good for UX so it doesn't flicker invalid immediately)
            valid.push(currentStatus);
        } else {
            // If dragging from Archived or unknown, maybe allow move to first column? 
            // For now, let's assume we can move back to Ideation if Archived
            if (currentStatus === 'ARCHIVED') valid.push('IDEATION');
        }
        setValidDropZones(valid);
    };

    const handleDragEnd = () => {
        setDraggedBatchId(null);
        setIsDragging(false);
        setValidDropZones([]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();

        if (draggedBatchId === null) return;

        // Validation: Block drop if not in valid zones
        // Exception: Dragging to "ARCHIVED" is not handled by this drop zone code yet (it's a column if showed).
        // Let's assume if 'showArchived' is true and we drop on ARCHIVED, we should allow it?
        // Actually user requirement was "Only relevant section available". 
        // So I will STRICTLY enforce validDropZones.
        if (validDropZones.length > 0 && !validDropZones.includes(newStatus) && newStatus !== 'ARCHIVED') {
            return;
        }

        // Optimistic Update
        const updatedBatches = batches.map(b =>
            b.id === draggedBatchId ? { ...b, status: newStatus } : b
        );
        setBatches(updatedBatches);

        // Clear drag state
        setDraggedBatchId(null);
        setIsDragging(false);
        setValidDropZones([]);

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

    const handleTrashBatch = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Move this batch to Trash?")) return;

        // Optimistic Remove
        setBatches(batches.filter(b => b.id !== id));

        try {
            await fetch(`/api/batches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'TRASHED' })
            });
        } catch (error) {
            console.error("Failed to trash batch", error);
            fetchData(); // Revert on fail
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors border ${showArchived
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700"
                            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            }`}
                    >
                        {showArchived ? "Hide Archived" : "Show Archived"}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Batch
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-6 min-w-max">
                    {(showArchived
                        ? [...STATUS_COLUMNS, { key: "ARCHIVED", label: "Archived", color: "bg-zinc-100 dark:bg-zinc-800" }]
                        : STATUS_COLUMNS
                    ).map(column => {
                        const columnBatches = batches.filter(b => b.status === column.key);

                        // Check if this column is valid drop target
                        const isDropTarget = isDragging && validDropZones.includes(column.key);
                        const isBlocked = isDragging && !isDropTarget && column.key !== 'ARCHIVED'; // Allow Archived? Or strict? 
                        // Strict based on user request "others need to be grayed out"

                        return (
                            <div
                                key={column.key}
                                className={`w-80 flex flex-col h-full rounded-xl transition-all duration-300
                                    ${isDropTarget ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
                                    ${isBlocked ? 'opacity-30 grayscale pointer-events-none' : ''}
                                    ${!isDragging && !isBlocked ? 'bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50' : ''}
                                `}
                                onDragOver={(e) => {
                                    if (isBlocked) return;
                                    handleDragOver(e);
                                }}
                                onDrop={(e) => {
                                    if (isBlocked) return;
                                    handleDrop(e, column.key);
                                }}
                            >
                                {/* Column Header */}
                                <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex justify-between items-center ${isBlocked ? 'bg-gray-200 dark:bg-zinc-800' : column.color}`}>
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
                                            onDragStart={(e) => handleDragStart(e, batch.id, batch.status)}
                                            onDragEnd={handleDragEnd}
                                            className="transform transition-transform active:scale-95"
                                        >
                                            <Link href={`/batches/${batch.id}`} className="block group">
                                                <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing ${draggedBatchId === batch.id ? 'opacity-50' : ''}`}>

                                                    {/* Card Header: Priority & Type */}
                                                    <div className="flex justify-between items-start mb-2 relative">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                                                {getTypeLabel(batch.batchType)}
                                                            </span>
                                                            {getPriorityBadge(batch.priority)}
                                                        </div>

                                                        {/* Trash Action */}
                                                        <button
                                                            onClick={(e) => handleTrashBatch(e, batch.id)}
                                                            className="text-zinc-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 absolute right-0 -top-1"
                                                            title="Move to Trash"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
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
                                                        {/* Angle */}
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                                            <span className="truncate">{batch.angle?.name}</span>
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
            {
                isModalOpen && (
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
                                                    <Link href={`/batches/${duplicateBatchId}`} className="underline font-bold ml-1 hover:text-amber-900">
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
                                                    {b.name} ({b.angle.name})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-zinc-500">
                                            Select a launched batch to base this iteration on.
                                        </p>
                                    </div>
                                )}

                                {/* Angle (Required) */}
                                {/* Angle (Required) */}
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Angle</label>

                                    {!isCreatingAngle ? (
                                        <div className="flex gap-2">
                                            <select
                                                required
                                                value={newBatchAngle}
                                                onChange={(e) => setNewBatchAngle(e.target.value)}
                                                className="flex-1 w-0 min-w-0 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 truncate pr-8"
                                            >
                                                <option value="">Select an Angle...</option>
                                                {angles.map(a => (
                                                    <option key={a.id} value={a.id} className="truncate max-w-[300px]">
                                                        {a.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreatingAngle(true)}
                                                className="px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 rounded-lg text-zinc-600 dark:text-zinc-300 font-bold"
                                                title="Create New Angle"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-indigo-600 uppercase">New Angle</span>
                                                <button type="button" onClick={() => setIsCreatingAngle(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="min-w-0">
                                                    <SearchableSelect
                                                        options={desires}
                                                        value={newAngleForm.desireId}
                                                        onChange={(val) => setNewAngleForm(prev => ({ ...prev, desireId: val || "" }))}
                                                        placeholder="Desire..."
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <SearchableSelect
                                                        options={themes}
                                                        value={newAngleForm.themeId}
                                                        onChange={(val) => setNewAngleForm(prev => ({ ...prev, themeId: val || "" }))}
                                                        placeholder="Theme..."
                                                    />
                                                </div>
                                                <select
                                                    className="w-full rounded text-xs p-2 border-zinc-200"
                                                    value={newAngleForm.demographicId}
                                                    onChange={e => setNewAngleForm(prev => ({ ...prev, demographicId: e.target.value }))}
                                                >
                                                    <option value="">Demographic...</option>
                                                    {demographics.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                                <div className="relative">
                                                    <select
                                                        className="w-full rounded text-xs p-2 border-zinc-200"
                                                        value={newAngleForm.awarenessLevelId}
                                                        onChange={e => setNewAngleForm(prev => ({ ...prev, awarenessLevelId: e.target.value }))}
                                                    >
                                                        <option value="">Awareness...</option>
                                                        {awarenessLevels.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                        <AwarenessTooltip />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleCreateAngle}
                                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                                                >
                                                    Create & Select
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {angles.length === 0 && !isCreatingAngle && (
                                        <p className="text-xs text-amber-600 mt-1">No angles found. Click + to create one.</p>
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
                )
            }
        </div >
    );
}

export default function BatchesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BatchesContent />
        </Suspense>
    );
}
