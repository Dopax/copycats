"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Types
interface Hook { id: string; name: string; videoUrl?: string; thumbnailUrl?: string; }
interface AwarenessLevel { id: string; name: string; }

interface BatchItem {
    id: string;
    hook?: Hook;
    hookId?: string;
    notes?: string;
    script?: string;
    videoUrl?: string; // Edit: Added videoUrl
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
        angle: { name: string; description?: string; brainClicks?: string };
        theme: { name: string; description?: string };
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
        transcript?: string;
        facebookLink?: string;
    };
    // AI Boost Fields
    aiAdCopy?: string;
    aiImagePrompt?: string;
    aiVideoPrompt?: string;
    projectFilesUrl?: string;

    // New Fields
    idea?: string;
    creatorBrief?: string;
    shotlist?: string;
    creatorBriefType?: string;
}

function FileUpload({ batchName, type, brandId, batchId, variationLabel, onUploadComplete }:
    { batchName: string, type: 'video' | 'zip', brandId?: string, batchId?: string, variationLabel?: string, onUploadComplete: (url: string, name: string) => void }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batchName', batchName);
        formData.append('type', type);
        if (brandId) formData.append('brandId', brandId);
        if (batchId) formData.append('batchId', batchId);
        if (variationLabel) formData.append('variationLabel', variationLabel);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                onUploadComplete(data.webViewLink, file.name);
            } else {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Upload error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group w-full">
            <input
                type="file"
                accept={type === 'zip' ? ".zip,.rar,.7z" : "video/*"}
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all w-full
                ${uploading
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700"
                }
            `}>
                {uploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">Uploading...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-sm font-medium">Upload {type === 'zip' ? 'Project' : 'Video'}</span>
                    </>
                )}
            </div>
        </div>
    );
}

const STATUS_FLOW = ["IDEATION", "CREATOR_BRIEFING", "FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"];

// Helper to determine active sections based on status
const getSectionState = (section: string, currentStatus: string) => {
    // Define the sequence of major stages
    // BRIEFING: Ideation, Creator Briefing, Filming (Strategist Work)
    // PRODUCTION: Editor Briefing (Handover), Editing (Editor Work)
    const sequence = ["BRIEFING", "PRODUCTION", "REVIEW", "AI_BOOST", "LAUNCHED"];

    // Map status to stage index
    const statusMap: Record<string, number> = {
        "IDEATION": 0, "CREATOR_BRIEFING": 0, "FILMING": 0, "EDITOR_BRIEFING": 0,
        "EDITING": 1,
        "REVIEW": 2,
        "AI_BOOST": 3,
        "LAUNCHED": 4, "ARCHIVED": 4
    };

    const currentStageIndex = statusMap[currentStatus] ?? 0;
    const sectionIndex = sequence.indexOf(section);

    if (sectionIndex === currentStageIndex) return "active";
    if (sectionIndex < currentStageIndex) return "past";
    return "future";
};

// Helper Hook for Auto-Save with Unmount Flush
function useAutoSave<T>(value: T, saveFn: (val: T) => void, delay = 1000) {
    const valueRef = useRef(value);
    const saveFnRef = useRef(saveFn);
    const dirty = useRef(false);
    const first = useRef(true);
    const timer = useRef<any>(null);

    // Keep refs fresh
    useEffect(() => {
        valueRef.current = value;
        saveFnRef.current = saveFn;
    }, [value, saveFn]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    // Debounce logic
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }

        dirty.current = true;

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            saveFnRef.current(value);
            dirty.current = false;
        }, delay);

    }, [value, delay]);

    // Unmount Flush
    useEffect(() => {
        return () => {
            if (dirty.current) {
                saveFnRef.current(valueRef.current);
            }
        };
    }, []);
}

// Debounced Textarea for Mapped Lists
const DebouncedTextarea = ({ value, onCommit, delay = 1000, ...props }: any) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useAutoSave(localValue, (val) => {
        if (val !== value) onCommit(val);
    }, delay);

    return (
        <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            {...props}
        />
    );
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

function HookLibraryModal({ hooks, onClose, onSelect }: { hooks: Hook[], onClose: () => void, onSelect: (hook: Hook) => void }) {
    const [search, setSearch] = useState("");
    const filteredHooks = hooks.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) && h.name !== "Editor Choice");

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg dark:text-white">Hook Library</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <input
                        type="text"
                        placeholder="Search hooks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => onSelect({ id: "", name: "Editor Choice" })}
                            className="text-left bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group flex flex-col items-center justify-center gap-3 h-full min-h-[160px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-zinc-900 dark:text-white">Editor's Choice</div>
                                <div className="text-xs text-zinc-500 mt-1">Let the editor decide</div>
                            </div>
                        </button>

                        {filteredHooks.map(hook => (
                            <button
                                key={hook.id}
                                onClick={() => onSelect(hook)}
                                className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left flex flex-col h-full"
                            >
                                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                                    {hook.videoUrl ? (
                                        <video
                                            src={hook.videoUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            onMouseEnter={e => e.currentTarget.play()}
                                            onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                        </div>
                                    )}
                                    {/* Overlay for Name */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                                        <span className="font-bold text-white text-sm line-clamp-1 shadow-sm">{hook.name}</span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                        {hook.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredHooks.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-zinc-400 dark:text-zinc-500">No hooks found matching "{search}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const getPlayableUrl = (url: string) => {
    if (!url) return "";
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url;
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

import VideoReviewModal from "@/components/batches/VideoReviewModal";

export default function BatchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [hooks, setHooks] = useState<Hook[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);
    const [selectingHookForItem, setSelectingHookForItem] = useState<string | null>(null);
    const [reviewingItem, setReviewingItem] = useState<{ id: string; videoUrl: string; isReadOnly?: boolean } | null>(null);

    // Transcript State
    const [transcribingRef, setTranscribingRef] = useState(false);

    const handleTranscribeRef = async () => {
        if (!batch?.referenceAd?.videoUrl) return;

        // We need the Ad ID. The current type definition has items, but check if we have the reference ad's internal ID
        // The interface info comes from the API include which puts all fields.
        const refAdId = (batch.referenceAd as any).id;
        if (!refAdId) return;

        setTranscribingRef(true);
        try {
            const res = await fetch(`/api/ads/${refAdId}/transcribe`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Transcription failed");

            // Update local state by manually modifying the batch object (shallow copy)
            setBatch(prev => {
                if (!prev || !prev.referenceAd) return prev;
                return {
                    ...prev,
                    referenceAd: {
                        ...prev.referenceAd!,
                        transcript: data.transcript
                    }
                };
            });
            alert("Transcript generated!");
        } catch (error: any) {
            console.error(error);
            alert(`Failed: ${error.message}`);
        } finally {
            setTranscribingRef(false);
        }
    };

    // Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Form States
    const [brief, setBrief] = useState(""); // Editor Brief
    const [isSavingBrief, setIsSavingBrief] = useState(false);

    // New Form States
    const [idea, setIdea] = useState("");
    const [isSavingIdea, setIsSavingIdea] = useState(false);

    const [creatorBrief, setCreatorBrief] = useState("");
    const [shotlist, setShotlist] = useState("");
    const [creatorBriefType, setCreatorBriefType] = useState("GENERAL");
    const [isSavingCreatorBrief, setIsSavingCreatorBrief] = useState(false);

    // AI Boost Form States
    const [aiForm, setAiForm] = useState({ adCopy: "", imagePrompt: "", videoPrompt: "" });
    const [isSavingAi, setIsSavingAi] = useState(false);

    // Auto-Save Refs & Effects
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useAutoSave(idea, () => saveIdea());
    useAutoSave(brief, () => saveBrief());
    useAutoSave(creatorBrief, () => saveCreatorBrief()); // saveCreatorBrief reads shotlist/type from state, which might be stale in closure? 
    // Wait, saveCreatorBrief closes over 'shotlist' and 'creatorBriefType'.
    // useAutoSave captures the closure of saveFn passed to it.
    // If I pass `() => saveCreatorBrief()`, this arrow function captures the scope of the render.
    // `useAutoSave` puts this into `saveFnRef`.
    // So `saveFnRef.current` is the LATEST arrow function.
    // So it sees the LATEST state. Correct.

    // However, I should probably include shotlist/type in the dependencies to trigger the debounce timer?
    // useAutoSave only triggers on 'value' change.
    // If I type in shotlist, 'idea' (passed as value above? No, I need separate calls or composite).

    // I need to use useAutoSave for each group or pass composite object.
    const creatorBriefComposite = useMemo(() => ({ creatorBrief, shotlist, creatorBriefType }), [creatorBrief, shotlist, creatorBriefType]);
    useAutoSave(creatorBriefComposite, () => saveCreatorBrief());

    const aiFormComposite = aiForm;
    useAutoSave(aiFormComposite, () => saveAiBoost());

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

                // Set New Fields
                setIdea(data.idea || "");
                setCreatorBrief(data.creatorBrief || "");
                setShotlist(data.shotlist || "");
                setCreatorBriefType(data.creatorBriefType || "GENERAL");

                setAiForm({
                    adCopy: data.aiAdCopy || "",
                    imagePrompt: data.aiImagePrompt || "",
                    videoPrompt: data.aiVideoPrompt || ""
                });

                // Initialize Accordion State: Open active section
                const stages = ["PRODUCTION", "REVIEW", "AI_BOOST", "LAUNCHED"];
                // We need to map our new granular statuses to these stages or expand logic
                // For now, let's keep the high-level mapping but maybe open relevant ones.
                const newExpanded: Record<string, boolean> = {};

                // Open the Active one by default
                stages.forEach(s => {
                    if (getSectionState(s, data.status) === 'active') {
                        newExpanded[s] = true;
                    }
                });
                // Also force open the specific active status section if we have sections for them
                if (data.status) newExpanded[data.status] = true;

                setExpandedSections(newExpanded);

            } else {
                router.push('/batches');
            }

            if (hooksRes.ok) {
                setHooks(await hooksRes.json());
            }

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

    const saveIdea = async () => {
        if (!batch) return;
        if (isMounted.current) setIsSavingIdea(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea })
            });
        } catch (error) {
            console.error("Failed to save idea", error);
        } finally {
            if (isMounted.current) setIsSavingIdea(false);
        }
    };

    const saveCreatorBrief = async () => {
        if (!batch) return;
        if (isMounted.current) setIsSavingCreatorBrief(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorBrief,
                    shotlist,
                    creatorBriefType
                })
            });
        } catch (error) {
            console.error("Failed to save creator brief", error);
        } finally {
            if (isMounted.current) setIsSavingCreatorBrief(false);
        }
    };

    // Auto-fill templates
    const applyBriefTemplate = (type: string) => {
        setCreatorBriefType(type);
        let template = "";
        if (type === "GENERAL") {
            template = "Hi! We'd like you to create a natural, engaging video talking about our product. Focus on the key benefits: [Benefit 1], [Benefit 2]. Make it feel authentic like you're recommending it to a friend.";
        } else if (type === "SPECIFIC") {
            template = "SCENE 1: Hook (3s) - [Action]\nSCENE 2: Problem (5s) - [Description]\nSCENE 3: Solution (10s) - [Product Demo]\nSCENE 4: CTA (3s) - Link in bio";
        } else if (type === "COPYCAT") {
            template = `Please recreate this video style but with our product: ${batch?.referenceAd?.facebookLink || '[Link]'}. Match the energy and pacing.`;
        }
        setCreatorBrief(template);
    };

    const saveBrief = async () => {
        if (!batch) return;
        if (isMounted.current) setIsSavingBrief(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brief })
            });
        } catch (error) {
            console.error("Failed to save brief", error);
        } finally {
            if (isMounted.current) setIsSavingBrief(false);
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
            if (isMounted.current) setIsSavingAi(false);
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

                {/* Strategy Sentence */}
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm mb-6">
                    <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                        This ad batch should talk to <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.concept.demographic.name}</span>, which are <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.concept.awarenessLevel?.name?.replace('Problem Unaware', 'Unaware') || "Unaware"}</span> of their desire to <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.concept.angle.name}</span>. The overarching theme is <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.concept.theme.name}</span>.
                    </p>
                </div>

                {/* Concept Context Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

                    {/* Angle Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Angle</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{batch.concept.angle.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{batch.concept.angle.name}</h4>
                            {batch.concept.angle.description && <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{batch.concept.angle.description}</p>}
                            {batch.concept.angle.brainClicks && (
                                <div className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-2 rounded border border-amber-100 dark:border-amber-900/50">
                                    <span className="font-bold">Original: </span>{batch.concept.angle.brainClicks}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Theme Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Theme</span>
                        <span className="font-medium text-pink-600 dark:text-pink-400">{batch.concept.theme.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{batch.concept.theme.name}</h4>
                            {batch.concept.theme.description ? (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">{batch.concept.theme.description}</p>
                            ) : (
                                <p className="text-xs text-zinc-400 italic">No description available.</p>
                            )}
                        </div>
                    </div>

                    {/* Demographic Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Demographic</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{batch.concept.demographic.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Target Audience</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{batch.concept.demographic.name}</p>
                        </div>
                    </div>

                    {/* Awareness Level */}
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Awareness</span>
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-cyan-600 dark:text-cyan-400 text-sm whitespace-nowrap">
                                {batch.concept.awarenessLevel?.name?.replace('Problem Unaware', 'Unaware') || "Not set"}
                            </span>
                            {/* Battery Indicator */}
                            <div className="flex gap-0.5 h-3 items-end">
                                {[
                                    'Problem Unaware',
                                    'Problem Aware',
                                    'Solution Aware',
                                    'Product Aware',
                                    'Most Aware'
                                ].map((level, i) => {
                                    const currentLevel = batch.concept.awarenessLevel?.name || '';
                                    const levels = ['Problem Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];
                                    const currentIndex = levels.indexOf(currentLevel);
                                    // Active if index >= i
                                    const isActive = currentIndex >= 0 && currentIndex >= i;

                                    // Height steps: 40%, 55%, 70%, 85%, 100%
                                    const heightClass = ['h-[40%]', 'h-[55%]', 'h-[70%]', 'h-[85%]', 'h-[100%]'][i];

                                    return (
                                        <div
                                            key={level}
                                            className={`w-1.5 rounded-sm transition-all ${isActive ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-zinc-200 dark:bg-zinc-700'} ${heightClass}`}
                                            title={level}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Persona Button (New Dedicated Card) */}
                    {(batch.concept as any).conceptDoc && (
                        <button
                            onClick={() => setViewingDoc((batch.concept as any).conceptDoc)}
                            className="p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="font-bold text-sm">View Persona</span>
                        </button>
                    )}
                </div>

            </div>

            {/* --- ACCORDION SECTIONS --- */}

            {/* --- ACCORDION SECTIONS --- */}

            <div className="space-y-4">

                {/* 1. IDEATION */}
                <BatchSection
                    title="1. Ideation"
                    status={batch.status === "IDEATION" ? "active" : (["CREATOR_BRIEFING", "FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"].includes(batch.status) ? "past" : "future")}
                    isOpen={expandedSections["IDEATION"] || false}
                    onToggle={() => toggleSection("IDEATION")}
                    actions={
                        <span className={`text-xs font-mono transition-colors ${isSavingIdea ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                            {isSavingIdea ? "Saving..." : "Saved"}
                        </span>
                    }
                >
                    <textarea
                        className="w-full h-32 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-y"
                        placeholder="Brainstorm your ad idea here..."
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                    />
                </BatchSection>

                {/* 2. CREATOR BRIEFING */}
                <BatchSection
                    title="2. Creator Briefing"
                    status={batch.status === "CREATOR_BRIEFING" ? "active" : (["FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"].includes(batch.status) ? "past" : (batch.status === "IDEATION" ? "future" : "past"))}
                    isOpen={expandedSections["CREATOR_BRIEFING"] || false}
                    onToggle={() => toggleSection("CREATOR_BRIEFING")}
                    actions={
                        <span className={`text-xs font-mono transition-colors ${isSavingCreatorBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                            {isSavingCreatorBrief ? "Saving..." : "Saved"}
                        </span>
                    }
                >
                    <div className="space-y-6">
                        {/* Templates */}
                        <div className="flex gap-2 mb-4">
                            {['GENERAL', 'SPECIFIC', 'COPYCAT'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => applyBriefTemplate(t)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${creatorBriefType === t
                                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                        }`}
                                >
                                    {t.charAt(0) + t.slice(1).toLowerCase()} Template
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Instructions / Brief</label>
                                <textarea
                                    className="w-full h-64 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-y"
                                    placeholder="Instructions for the creator..."
                                    value={creatorBrief}
                                    onChange={(e) => setCreatorBrief(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Shotlist (Optional)</label>
                                <textarea
                                    className="w-full h-64 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-y font-mono text-sm"
                                    placeholder="- SCENE 1: ...\n- SCENE 2: ..."
                                    value={shotlist}
                                    onChange={(e) => setShotlist(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </BatchSection>

                {/* 3. FILMING */}
                <BatchSection
                    title="3. Filming"
                    status={batch.status === "FILMING" ? "active" : (["EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"].includes(batch.status) ? "past" : "future")}
                    isOpen={expandedSections["FILMING"] || false}
                    onToggle={() => toggleSection("FILMING")}
                >
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Assigned Creators</h4>
                        {/* Logic to show creators. Assuming assignedCreators is on batch but type definition might miss it. 
                            Wait, type def for Batch didn't include assignedCreators explicitly in my update.
                            I should check usage. `assignedCreators` is relation.
                            I'll assume it's not loaded in current `fetchData` unless include is there.
                            Default `/api/batches/[id]` includes `assignedCreators`.
                            Let's check `Batch` type. I didn't add it.
                            I'll create a simple list or just count.
                         */}
                        <p className="text-sm text-zinc-500">Manage assigned creators in the "Creators" tab.</p>
                    </div>
                </BatchSection>

                {/* 4. BRIEFING & STRATEGY */}
                <BatchSection
                    title="4. Editor Briefing"
                    status={batch.status === "EDITOR_BRIEFING" ? "active" : (["EDITING", "REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"].includes(batch.status) ? "past" : "future")}
                    isOpen={expandedSections["BRIEFING"] || false}
                    onToggle={() => toggleSection("BRIEFING")}
                    actions={
                        <span className={`text-xs font-mono transition-colors ${isSavingBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                            {isSavingBrief ? "Saving..." : "Saved"}
                        </span>
                    }
                >



                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* LEFT: Brief & Context */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Editor Brief</label>
                                <textarea
                                    value={brief}
                                    onChange={(e) => setBrief(e.target.value)}
                                    className="w-full h-96 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-4 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed shadow-sm"
                                    placeholder="Describe the ad concept, visual direction, and key messaging..."
                                    disabled={batch.status !== "EDITOR_BRIEFING"}
                                />
                            </div>

                            {/* Reference Ad */}
                            {batch.referenceAd && (
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                        <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Reference Ad</h3>
                                        <div className="flex gap-2">
                                            {batch.referenceAd.facebookLink && (
                                                <a href={batch.referenceAd.facebookLink} target="_blank" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" /></svg>
                                                    View Post
                                                </a>
                                            )}
                                            {batch.referenceAd.videoUrl && (
                                                <button onClick={handleTranscribeRef} disabled={transcribingRef} className="text-xs flex items-center gap-1 text-zinc-500 hover:text-zinc-700">
                                                    {transcribingRef ? <span className="animate-spin">⏳</span> : <span>📝</span>}
                                                    {batch.referenceAd.transcript ? "Re-Transcribe" : "Get Transcript"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex gap-4">
                                        <div className="w-24 h-32 bg-zinc-100 rounded-lg flex-shrink-0 overflow-hidden relative group cursor-pointer border border-zinc-200 dark:border-zinc-700">
                                            {batch.referenceAd.videoUrl ? (
                                                <video src={getPlayableUrl(batch.referenceAd.videoUrl)} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={getPlayableUrl(batch.referenceAd.thumbnailUrl || "")} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div>
                                                <p className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{batch.referenceAd.headline}</p>
                                                <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{batch.referenceAd.description}</p>
                                            </div>
                                            {batch.referenceAd.transcript ? (
                                                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded text-xs text-zinc-600 dark:text-zinc-400 max-h-20 overflow-y-auto whitespace-pre-wrap border border-zinc-100 dark:border-zinc-700">
                                                    {batch.referenceAd.transcript}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-zinc-400 italic">No transcript available.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Variation Planning (Hooks & Scripts) */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>🎬</span> Variations to Produce
                                </h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); addBatchItem(); }}
                                    disabled={batch.status !== "EDITOR_BRIEFING"}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 disabled:opacity-50 disabled:shadow-none"
                                >
                                    <span>+</span> Add Variation
                                </button>
                            </div>

                            <div className="space-y-4">
                                {batch.items.map((item, index) => (
                                    <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm relative group">
                                        <div className="flex flex-col gap-4">
                                            {/* Header Row: Label + Hook Selector + Delete */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {/* Label */}
                                                    <div className="h-12 w-auto min-w-[3rem] px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 text-sm">
                                                        BATCH{batch.id}{getVariationLabel(index)}
                                                    </div>

                                                    {/* Hook Selector */}
                                                    <div className="flex-1 max-w-md">
                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Hook</label>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectingHookForItem(item.id); }}
                                                                disabled={batch.status !== "EDITOR_BRIEFING"}
                                                                className={`flex-1 text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${item.hookId
                                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                                                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 italic"
                                                                    }`}
                                                            >
                                                                <span className="truncate font-medium">{item.hookId ? (hooks.find(h => h.id === item.hookId)?.name || "Unknown Hook") : "Select a Hook..."}</span>
                                                                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                            </button>
                                                            {item.hookId && batch.status === "EDITOR_BRIEFING" && (
                                                                <button onClick={() => updateItem(item.id, { hookId: null })} className="p-2 hover:bg-zinc-100 rounded text-zinc-400 hover:text-red-500">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    disabled={batch.status !== "EDITOR_BRIEFING"}
                                                    className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                                                    title="Delete Variation"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>

                                            {/* Script & Notes */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Script</label>
                                                    <DebouncedTextarea
                                                        value={item.script || ""}
                                                        onCommit={(val: string) => updateItem(item.id, { script: val })}
                                                        disabled={batch.status !== "EDITOR_BRIEFING"}
                                                        className="w-full h-24 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-200"
                                                        placeholder="Script/Voiceover..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Notes</label>
                                                    <DebouncedTextarea
                                                        value={item.notes || ""}
                                                        onCommit={(val: string) => updateItem(item.id, { notes: val })}
                                                        disabled={batch.status !== "EDITOR_BRIEFING"}
                                                        className="w-full h-24 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-200"
                                                        placeholder="Visual notes..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {batch.items.length === 0 && (
                                    <div className="text-center py-6 text-zinc-400 text-xs italic border border-dashed border-zinc-200 rounded-lg">
                                        No variations planned yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Reference Ad (Existing code) */}



                </BatchSection>

                {/* 5. PRODUCTION WORKSPACE */}

                <BatchSection
                    title="5. Editing"
                    status={batch.status === "EDITING" ? "active" : (["REVIEW", "AI_BOOST", "LAUNCHED", "ARCHIVED"].includes(batch.status) ? "past" : "future")}
                    isOpen={expandedSections["PRODUCTION"] || false}
                    onToggle={() => toggleSection("PRODUCTION")}
                    actions={null} // No actions for editor to add items
                >
                    <div className="flex flex-col gap-6">
                        {/* Editor Context & Project Files */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>🛠️</span> Editor Resources
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Read-Only Brief Summary */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Editor Instructions</label>
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm text-zinc-700 dark:text-zinc-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {brief || <span className="text-zinc-400 italic">No specific instructions.</span>}
                                        </div>
                                    </div>
                                    {batch.referenceAd && (
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Reference Ad</label>
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                                                    {batch.referenceAd.thumbnailUrl && <img src={getPlayableUrl(batch.referenceAd.thumbnailUrl)} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{batch.referenceAd.headline}</p>
                                                    <a href={batch.referenceAd.facebookLink || '#'} target="_blank" className="text-xs text-indigo-600 hover:underline">View Link</a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Project Files Upload */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Project Files (Zip)</label>
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                                        {(batch as any).projectFilesUrl ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    <span className="font-bold text-sm">Files Uploaded</span>
                                                </div>
                                                <a href={(batch as any).projectFilesUrl} target="_blank" className="text-sm text-indigo-600 hover:underline truncate block">
                                                    Download Project Files
                                                </a>
                                                <button
                                                    onClick={() => updateStatus('PROJECT_FILES_REMOVED')}
                                                    className="text-xs text-red-500 hover:text-red-600 text-left mt-1"
                                                    disabled={batch.status !== "EDITING"}
                                                >
                                                    Remove / Replace
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <FileUpload
                                                    batchName={batch.name}
                                                    type="zip"
                                                    brandId={(batch as any).brandId || undefined}
                                                    batchId={String(batch.id)}
                                                    onUploadComplete={(url) => {
                                                        const updated = { ...batch, projectFilesUrl: url };
                                                        setBatch(updated as any);
                                                        fetch(`/api/batches/${batch.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ projectFilesUrl: url })
                                                        });
                                                    }}
                                                />
                                                <p className="text-[10px] text-zinc-400 mt-2">Upload project files for the editor (AE/Premiere/etc)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span>📤</span> Upload Deliverables
                            </h3>
                            {batch.items.map((item, index) => (
                                <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${item.status === 'DONE' ? 'border-green-200 dark:border-green-900/50 bg-green-50/20' : 'border-zinc-200 dark:border-zinc-800'} p-5 shadow-sm`}>
                                    <div className="flex flex-col md:flex-row gap-6">

                                        {/* Variation Context (Left) */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-auto min-w-[3rem] px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-sm">
                                                    BATCH{batch.id}{getVariationLabel(index)}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-zinc-400 uppercase">Hook</span>
                                                    <span className="font-medium text-zinc-900 dark:text-white">{hooks.find(h => h.id === item.hookId)?.name || "Editor's Choice / No Hook Selected"}</span>
                                                </div>
                                            </div>

                                            {/* Read Only Script/Notes */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                                                    <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Script</span>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{item.script || "N/A"}</p>
                                                </div>
                                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                                                    <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Notes</span>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{item.notes || "None"}</p>
                                                </div>
                                            </div>

                                            {/* Revision Alert */}
                                            {item.status === 'PENDING' && item.notes && (
                                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 flex justify-between items-center gap-3">
                                                    <div>
                                                        <p className="font-bold mb-1 flex items-center gap-2">
                                                            <span>⚠️</span> Revision Requested
                                                        </p>
                                                        <p>{item.notes}</p>
                                                    </div>
                                                    {(item as any).videoUrl && (
                                                        <button
                                                            onClick={() => setReviewingItem({ id: item.id, videoUrl: (item as any).videoUrl, isReadOnly: true })}
                                                            className="flex-shrink-0 bg-white/50 border border-amber-200 hover:bg-white text-amber-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            Preview
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Section (Right) */}
                                        <div className="w-full md:w-80 flex-shrink-0">
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Final Video</label>
                                            {(item as any).videoUrl ? (
                                                <div className={`w-full rounded-lg border p-3 flex flex-col gap-3 ${item.notes && item.status === 'PENDING' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 flex-shrink-0 rounded flex items-center justify-center ${item.notes && item.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                            <span className="text-lg">✓</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{(item as any).videoName || "Video Uploaded"}</p>
                                                            <p className="text-xs text-zinc-500">Ready for review</p>
                                                        </div>
                                                    </div>

                                                    {(batch.status === "EDITING" || (item.status === 'PENDING' && item.notes)) && (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => updateItem(item.id, { videoUrl: null, videoName: null, clearComments: true } as any)}
                                                                className="w-full bg-white border border-zinc-200 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm"
                                                            >
                                                                Replace
                                                            </button>
                                                            {item.notes && item.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => updateItem(item.id, { notes: "" })}
                                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                                >
                                                                    <span>🚀</span> Resubmit for Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <FileUpload
                                                    batchName={`${batch.name}_${getVariationLabel(index)}`}
                                                    type="video"
                                                    brandId={(batch as any).brandId || undefined}
                                                    batchId={String(batch.id)}
                                                    variationLabel={getVariationLabel(index)}
                                                    onUploadComplete={(url, name) => updateItem(item.id, { videoUrl: url, videoName: name })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {batch.items.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    <p className="text-zinc-500 text-sm mb-2">No variations assigned yet.</p>
                                    <p className="text-xs text-zinc-400">Variations must be added in the Strategy section first.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </BatchSection>


                {/* 3. REVIEW DASHBOARD */}
                <BatchSection
                    title="6. Review"
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
                            {/* ... existing review dashboard code ... */}

                            {batch.items
                                .filter(item => !(item.status === 'PENDING' && item.notes)) // Hide items sent for revision
                                .map((item, index) => (
                                    <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-zinc-700 h-8 px-2 flex items-center justify-center bg-zinc-100 rounded border border-zinc-200">BATCH{batch.id}{getVariationLabel(index)}</span>
                                                <span className="text-sm font-medium text-zinc-600">{item.hook?.name || "No Hook"}</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</div>
                                        </div>

                                        {/* Video Preview in Review Dashboard */}
                                        {(item as any).videoUrl ? (
                                            <div className="my-2">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); setReviewingItem({ id: item.id, videoUrl: (item as any).videoUrl }); }}
                                                    className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded bg-black flex items-center justify-center text-white">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="block text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600">Review Video</span>
                                                            <span className="block text-xs text-zinc-500">Click to open player</span>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400 italic my-2">
                                                No Video Uploaded
                                            </div>
                                        )}
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto">{item.script || "No Script Content"}</div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </BatchSection>

                {/* 4. AI BOOST */}
                <BatchSection
                    title="7. AI Boost"
                    status={getSectionState("AI_BOOST", batch.status)}
                    isOpen={expandedSections["AI_BOOST"] || false}
                    onToggle={() => toggleSection("AI_BOOST")}
                    actions={
                        <span className={`text-xs font-mono transition-colors ${isSavingAi ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                            {isSavingAi ? "Saving..." : "Saved"}
                        </span>
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
                {/* Modals */}
                {
                    viewingDoc && (
                        <ViewDocModal content={viewingDoc} onClose={() => setViewingDoc(null)} />
                    )
                }
                {
                    selectingHookForItem && (
                        <HookLibraryModal
                            hooks={hooks}
                            onClose={() => setSelectingHookForItem(null)}
                            onSelect={(hook) => {
                                updateItem(selectingHookForItem, { hookId: hook.id || null });
                                setSelectingHookForItem(null);
                            }}
                        />
                    )
                }
                {
                    reviewingItem && (
                        <VideoReviewModal
                            videoUrl={reviewingItem.videoUrl}
                            batchItemId={reviewingItem.id}
                            onClose={() => setReviewingItem(null)}
                            brandId={(batch as any).brandId}
                            onStatusChange={reviewingItem.isReadOnly ? undefined : (status, notes) => {
                                if (status && reviewingItem.id) {
                                    const update: any = { status };
                                    if (notes) update.notes = notes;
                                    updateItem(reviewingItem.id, update);
                                }
                            }}
                        />
                    )
                }
            </div>
        </div >
    );
}
