"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DEFAULT_BRIEF_PROMPT } from "@/lib/constants/prompts";

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
    angle: {
        name: string;
        desire: { name: string; description?: string; brainClicks?: string };
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

    mainMessaging?: string;
    learnings?: string;
    launchedAt?: string;
    facebookAds?: LinkedFacebookAd[];
    referenceBatch?: { id: number; name: string };
}

import ReferenceAdIntegration from "@/components/ReferenceAdIntegration";
import MessagingAnalysisToolbox from "@/components/MessagingAnalysisToolbox";

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

const STATUS_FLOW = ["IDEATION", "CREATOR_BRIEFING", "FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LEARNING", "ARCHIVED"];

const WORKFLOW_STEPS = [
    { id: 'IDEATION', label: '1. Ideation', status: 'IDEATION' },
    { id: 'CREATOR_BRIEFING', label: '2. Creator Brief', status: 'CREATOR_BRIEFING' },
    { id: 'FILMING', label: '3. Filming', status: 'FILMING' },
    { id: 'BRIEFING', label: '4. Editor Brief', status: 'EDITOR_BRIEFING' },
    { id: 'PRODUCTION', label: '5. Editing', status: 'EDITING' },
    { id: 'REVIEW', label: '6. Review', status: 'REVIEW' },
    { id: 'AI_BOOST', label: '7. AI Boost', status: 'AI_BOOST' },
    { id: 'LEARNING', label: '8. Learning', status: 'LEARNING' }
];

interface LinkedFacebookAd {
    id: string;
    name: string;
    status: string;
    spend: number;
    roas: number;
    clicks: number;
    impressions: number;
    batchItemId?: string;
}

// Helper to determine active sections based on status
const getSectionState = (section: string, currentStatus: string) => {
    // Define the sequence of major stages
    // BRIEFING: Ideation, Creator Briefing, Filming (Strategist Work)
    // PRODUCTION: Editor Briefing (Handover), Editing (Editor Work)
    const sequence = ["BRIEFING", "PRODUCTION", "REVIEW", "AI_BOOST", "LEARNING"];

    // Map status to stage index
    const statusMap: Record<string, number> = {
        "IDEATION": 0, "CREATOR_BRIEFING": 0, "FILMING": 0, "EDITOR_BRIEFING": 0,
        "EDITING": 1,
        "REVIEW": 2,
        "AI_BOOST": 3,
        "LEARNING": 4,
        "ARCHIVED": 5
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

const getStrategySentence = (batch: Batch) => {
    const demographic = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.demographic.name}</span>;
    const desire = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.desire.name}</span>;
    const theme = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.theme.name}</span>;
    const awareness = batch.angle.awarenessLevel?.name || "Unaware";
    const awarenessSpan = <span className="font-bold text-indigo-600 dark:text-indigo-400">{awareness}</span>;

    const ThemeAddon = () => (
        <span className="text-zinc-400 border-l border-zinc-300 mx-2 pl-2">
            Visual Theme: {theme}
        </span>
    );

    switch (awareness) {
        case "Problem Unaware":
            // Schwartz: Echo the prospect's image/feelings. Avoid product/price.
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    Targeting {demographic} who are completely {awarenessSpan} of the problem. We must echo their identity/feelings to capture attention, before introducing the need. <ThemeAddon />
                </p>
            );
        case "Problem Aware":
            // Schwartz: Dramatize the problem. Show you understand their pain.
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    Speaking to {demographic} who feel the pain but don't know the fix. We must dramatize the problem and introduce {desire} as the new mechanism. <ThemeAddon />
                </p>
            );
        case "Solution Aware":
            // Schwartz: Knows the Category (e.g. Paint by Numbers), doesn't know YOU.
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    For {demographic} who know the category but not our brand. We must prove why our mechanism ({desire}) is superior to the alternatives they've seen. <ThemeAddon />
                </p>
            );
        case "Product Aware":
            // Schwartz: Knows YOU (Brand), but not convinced.
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    Addressing {demographic} who know our brand but aren't convinced. We must remove doubt using {desire} (proof/claims) to build conviction. <ThemeAddon />
                </p>
            );
        case "Most Aware":
            // Schwartz: The Headline is the Offer. Direct.
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    Closing {demographic} who are {awarenessSpan} and ready. The focus is simply the Offer/Deal, using {desire} as the final nudge. <ThemeAddon />
                </p>
            );
        default:
            // Fallback
            return (
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
                    This ad batch should talk to {demographic}, which are {awarenessSpan} of their desire to {desire}. <ThemeAddon />
                </p>
            );
    }
};

export default function BatchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [hooks, setHooks] = useState<Hook[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);

    // Auto-Brief State
    const [isAutoBriefModalOpen, setIsAutoBriefModalOpen] = useState(false);
    const [autoBriefPrompt, setAutoBriefPrompt] = useState(DEFAULT_BRIEF_PROMPT);
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
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

    // Stepper State
    const [activeStep, setActiveStep] = useState<string>("IDEATION");

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

    // Learning Phase State
    const [mainMessaging, setMainMessaging] = useState("");
    const [learnings, setLearnings] = useState("");
    const [isSavingLearnings, setIsSavingLearnings] = useState(false);
    const [isSavingMainMessaging, setIsSavingMainMessaging] = useState(false);

    // Auto-Save Refs & Effects
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Sync Active Step with Status
    useEffect(() => {
        if (batch?.status) {
            const statusToStep: Record<string, string> = {
                "IDEATION": "IDEATION",
                "CREATOR_BRIEFING": "CREATOR_BRIEFING",
                "FILMING": "FILMING",
                "EDITOR_BRIEFING": "BRIEFING",
                "EDITING": "PRODUCTION",
                "REVIEW": "REVIEW",
                "AI_BOOST": "AI_BOOST",
                "LEARNING": "LEARNING",
                "ARCHIVED": "LEARNING"
            };
            const target = statusToStep[batch.status];
            if (target) {
                setActiveStep(target);
            }
        }
    }, [batch?.status]);

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

    useAutoSave(mainMessaging, () => saveMainMessaging());
    useAutoSave(learnings, () => saveLearnings());



    // --- HELPER: Auto-Serve Brief ---
    const generateAutoBrief = async () => {
        setIsGeneratingBrief(true);
        try {
            const res = await fetch(`/api/batches/${id}/generate-brief`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customPrompt: autoBriefPrompt })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (data.content) {
                setCreatorBrief(data.content);
                updateBatch({ creatorBrief: data.content });
                setIsAutoBriefModalOpen(false);
            }
        } catch (err: any) {
            alert("Failed to generate brief: " + err.message);
        } finally {
            setIsGeneratingBrief(false);
        }
    };

    // --- HELPER: Fetch Data ---




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

                // Initial Field Set
                setMainMessaging(data.mainMessaging || "");
                setLearnings(data.learnings || "");
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

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const updateBatch = async (updates: Partial<Batch>) => {
        if (!batch) return;

        // Optimistic update
        setBatch(prev => prev ? { ...prev, ...updates } : null);

        try {
            const res = await fetch(`/api/batches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) {
                console.error("Failed to update batch");
                // Ideally revert here
            }
        } catch (error) {
            console.error("Error updating batch", error);
        }
    };

    const isStepComplete = (stepId: string) => {
        if (!batch) return false;
        const index = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
        const currentStatusIndex = WORKFLOW_STEPS.findIndex(s => s.status === batch.status);

        // If current status is beyond this step, it's complete
        // Need careful mapping since some statuses map to same step? No, 1:1 mostly.
        // Status flow index check is better.
        const flowIndex = STATUS_FLOW.indexOf(batch.status);
        const stepStatusIndex = STATUS_FLOW.indexOf(WORKFLOW_STEPS.find(s => s.id === stepId)?.status || "");

        return flowIndex > stepStatusIndex;
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

    const saveMainMessaging = async () => {
        if (!batch) return;
        setIsSavingMainMessaging(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mainMessaging })
            });
        } catch (error) { console.error(error); }
        finally { if (isMounted.current) setIsSavingMainMessaging(false); }
    };

    const saveLearnings = async () => {
        if (!batch) return;
        setIsSavingLearnings(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnings })
            });
        } catch (error) { console.error(error); }
        finally { if (isMounted.current) setIsSavingLearnings(false); }
    };

    const linkAdToVariation = async (adId: string, batchItemId: string) => {
        if (!batch) return;
        try {
            const res = await fetch('/api/facebook/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId, batchItemId })
            });
            if (res.ok) {
                // Update local state is tricky because facebookAds is on batch? 
                // We might need to refetch or update manually. 
                // For now, let's just alert or refresh.
                fetchData(); // Simplest way to refresh linked data
            }
        } catch (e) { console.error(e); }
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
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2 mt-1">
                            <span className="font-bold text-zinc-400">Angle:</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{batch.angle.name}</span>
                            {(batch.angle as any).conceptDoc && (
                                <button
                                    onClick={() => setViewingDoc((batch.angle as any).conceptDoc)}
                                    className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    View Persona
                                </button>
                            )}
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

                {/* Strategy Sentence - Global Context */}
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm mb-6">
                    {getStrategySentence(batch)}
                </div>

                {/* Concept Context Grid - Global Context with Hover Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

                    {/* Angle Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Angle</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{batch.angle.desire.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{batch.angle.desire.name}</h4>
                            {batch.angle.desire.description && <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{batch.angle.desire.description}</p>}
                            {batch.angle.desire.brainClicks && (
                                <div className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-2 rounded border border-amber-100 dark:border-amber-900/50">
                                    <span className="font-bold">Original: </span>{batch.angle.desire.brainClicks}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Theme Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md hover:border-pink-200 dark:hover:border-pink-900">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Theme</span>
                        <span className="font-medium text-pink-600 dark:text-pink-400">{batch.angle.theme.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{batch.angle.theme.name}</h4>
                            {batch.angle.theme.description ? (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">{batch.angle.theme.description}</p>
                            ) : (
                                <p className="text-xs text-zinc-400 italic">No description available.</p>
                            )}
                        </div>
                    </div>

                    {/* Demographic Hover Card */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Demographic</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{batch.angle.demographic.name}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Target Audience</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{batch.angle.demographic.name}</p>
                        </div>
                    </div>

                    {/* Awareness Level */}
                    <div className="group relative p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 cursor-help transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-900">
                        <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Awareness</span>
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-cyan-600 dark:text-cyan-400 text-sm whitespace-nowrap">
                                {batch.angle.awarenessLevel?.name || "Not set"}
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
                                    const currentLevel = batch.angle.awarenessLevel?.name || '';
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

                        {/* Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Awareness Context</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                <strong>{batch.angle.awarenessLevel?.name || "Unaware"}</strong> of their desire/problem to <strong>{batch.angle.desire.name}</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ACCORDION SECTIONS --- */}

            {/* --- ACCORDION SECTIONS --- */}

            {/* --- STEPPER NAVIGATION --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar px-1">
                {WORKFLOW_STEPS.map((step) => {
                    // Determine the STRICT step for the current status
                    const statusToStep: Record<string, string> = {
                        "IDEATION": "IDEATION",
                        "CREATOR_BRIEFING": "CREATOR_BRIEFING",
                        "FILMING": "FILMING",
                        "EDITOR_BRIEFING": "BRIEFING",
                        "EDITING": "PRODUCTION",
                        "REVIEW": "REVIEW",
                        "AI_BOOST": "AI_BOOST",
                        "LAUNCHED": "AI_BOOST",
                        "LEARNING": "LEARNING",
                        "ARCHIVED": "LEARNING"
                    };

                    const currentStatusStep = batch?.status ? statusToStep[batch.status] : "IDEATION";
                    const isAllowed = step.id === currentStatusStep;

                    // Force active step to match status if it doesn't (auto-correct view)
                    if (isAllowed && activeStep !== step.id) {
                        // We strictly want to conform to status, but avoid render loop. 
                        // It's better to rely on disabled buttons to prevent leaving.
                        // The initial useEffect handles the initial set.
                    }

                    return (
                        <button
                            key={step.id}
                            onClick={() => isAllowed && setActiveStep(step.id)}
                            disabled={!isAllowed}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border 
                                ${isAllowed
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900'
                                    : 'bg-zinc-100 text-zinc-400 border-zinc-200 opacity-60 cursor-not-allowed grayscale dark:bg-zinc-800 dark:border-zinc-700'
                                }`}
                        >
                            {/* Show lock icon if not allowed */}
                            {!isAllowed && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            )}
                            {step.label}
                        </button>
                    );
                })}
            </div>

            {/* --- ACTIVE STEP CONTENT --- */}
            <div className="mt-4 transition-all duration-300 min-h-[500px]">

                {/* 1. IDEATION */}
                {activeStep === "IDEATION" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ideation Phase</h3>
                                <span className={`text-xs font-mono transition-colors ${isSavingIdea ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingIdea ? "Saving..." : "Saved"}
                                </span>
                            </div>
                            <textarea
                                className="w-full h-32 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-y"
                                placeholder="Brainstorm your ad idea here..."
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* 2. CREATOR BRIEFING */}
                {activeStep === "CREATOR_BRIEFING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Creator Briefing</h3>
                                <span className={`text-xs font-mono transition-colors ${isSavingCreatorBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingCreatorBrief ? "Saving..." : "Saved"}
                                </span>
                            </div>

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

                                {/* Auto-Draft Button */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => setIsAutoBriefModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
                                    >
                                        <span>✨</span> Auto-Draft Brief (AI)
                                    </button>
                                </div>

                                {/* Reference Ad Integration - Show in Copycat Batches */}
                                {batch.referenceAd && (
                                    <div className="mb-6">
                                        <ReferenceAdIntegration ad={batch.referenceAd as any} />
                                    </div>
                                )}

                                {/* Main Messaging Analysis - Editable in Briefing */}
                                <div className="mb-6">
                                    <MessagingAnalysisToolbox
                                        value={batch.mainMessaging}
                                        onChange={(val) => updateBatch({ mainMessaging: val })}
                                        className="transition-shadow hover:shadow-md"
                                    />
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
                        </div>
                    </div>
                )}

                {/* 3. FILMING */}
                {activeStep === "FILMING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Filming Status</h3>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Assigned Creators</h4>
                                <p className="text-sm text-zinc-500">Manage assigned creators in the "Creators" tab.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. BRIEFING & STRATEGY */}
                {activeStep === "BRIEFING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Editor Briefing</h3>
                                <span className={`text-xs font-mono transition-colors ${isSavingBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingBrief ? "Saving..." : "Saved"}
                                </span>
                            </div>



                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* LEFT: Brief & Context */}
                                <div className="space-y-6">
                                    {/* Iteration Link */}
                                    {batch.referenceBatch && (
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full border border-purple-200">
                                                    ITERATION V2
                                                </span>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                                    Iterating on: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{batch.referenceBatch.name}</span>
                                                </span>
                                            </div>
                                            <Link href={`/batches/${batch.referenceBatch.id}`} target="_blank" className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1">
                                                View Original Batch <span className="text-lg">↗</span>
                                            </Link>
                                        </div>
                                    )}

                                    {/* Main Messaging - NEW FIELD */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                        <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                                            <span>🎯</span> Main Messaging
                                        </label>
                                        <textarea
                                            value={mainMessaging}
                                            onChange={(e) => setMainMessaging(e.target.value)}
                                            className="w-full h-24 bg-white dark:bg-zinc-800 border-indigo-200 dark:border-indigo-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-zinc-800 dark:text-zinc-200"
                                            placeholder="What does my customer care about? Why should it interest the customer?"
                                            disabled={batch.status !== "EDITOR_BRIEFING" && batch.status !== "LEARNING"}
                                        />
                                    </div>
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

                                    {/* Reference Ad Integration */}
                                    {batch.referenceAd && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <ReferenceAdIntegration ad={batch.referenceAd as any} />
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



                        </div>
                    </div>
                )}

                {/* 5. PRODUCTION WORKSPACE */}

                {/* 5. PRODUCTION WORKSPACE */}
                {activeStep === "PRODUCTION" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Editing Workspace</h3>
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

                                            {/* Core Messaging for Editor */}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Core Messaging</label>
                                                <MessagingAnalysisToolbox
                                                    value={batch.mainMessaging}
                                                    readOnly
                                                    className="p-3 border text-xs"
                                                />
                                            </div>

                                            {batch.referenceAd && (
                                                <div className="mt-4">
                                                    <ReferenceAdIntegration ad={batch.referenceAd as any} />
                                                </div>
                                            )}
                                        </div>

                                        {/* QA Checklist */}
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">QA Checklist</h4>
                                            <div className="space-y-2">
                                                {[
                                                    "Watermark removed/hidden",
                                                    "All key elements visible in 4:5 crop",
                                                    "Indistinguishable from human content (AI Check)",
                                                    "Voice-over volume balanced with background music",
                                                    "Looks natural in feed (doesn't feel like an ad)"
                                                ].map((item, i) => (
                                                    <label key={i} className="flex items-start gap-2 cursor-pointer group">
                                                        <div className="relative flex items-center">
                                                            <input type="checkbox" className="peer h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800" />
                                                            <svg className="absolute w-4 h-4 pointer-events-none opacity-0 peer-checked:opacity-100 text-indigo-600 dark:text-indigo-500 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </div>
                                                        <span className="text-sm text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors select-none">
                                                            {item}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
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
                        </div>
                    </div>
                )}

                {/* 8. LEARNING & OPTIMIZATION */}
                {activeStep === "LEARNING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>🧠</span> Learning Phase
                                </h3>
                                <div className="text-xs font-mono text-zinc-400">
                                    Launched: {batch.launchedAt ? new Date(batch.launchedAt).toLocaleDateString() : "Pending"}
                                </div>
                            </div>

                            {/* Top Stats / Winner */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Winning Variation Logic */}
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-5">
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                        <span>🏆</span> Winning Variation
                                    </h4>

                                    {(() => {
                                        // Identify winner
                                        if (!batch.facebookAds || batch.facebookAds.length === 0) return <p className="text-sm text-zinc-500 italic">No ads linked yet.</p>;

                                        const winner = batch.facebookAds.reduce((prev, current) => (prev.spend > current.spend) ? prev : current);
                                        if (winner.spend < 200) {
                                            return <p className="text-sm text-zinc-500">Not enough spend yet (Highest: ${winner.spend.toFixed(2)})</p>;
                                        }

                                        // Find linked variation
                                        const winningItem = batch.items.find(i => i.id === winner.batchItemId);

                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-24 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                                        {winningItem && winningItem.videoUrl ? (
                                                            <video src={winningItem.videoUrl} className="w-full h-full object-cover" muted autoPlay loop />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-500">No Video</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg text-emerald-900 dark:text-emerald-300">
                                                            Variation {winningItem ? getVariationLabel(batch.items.indexOf(winningItem)) : "?"}
                                                        </div>
                                                        <div className="text-sm text-emerald-700 dark:text-emerald-500 mb-2">
                                                            {winner.name}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                                                                <span className="block text-zinc-500">Spend</span>
                                                                <span className="font-bold">${winner.spend.toFixed(2)}</span>
                                                            </div>
                                                            <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                                                                <span className="block text-zinc-500">ROAS</span>
                                                                <span className="font-bold">{winner.roas.toFixed(2)}x</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Learnings Input */}
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="font-bold text-zinc-700 dark:text-zinc-300">Learnings & Ideas</label>
                                        <span className={`text-xs font-mono transition-colors ${isSavingLearnings ? 'text-indigo-500' : 'text-zinc-300'}`}>
                                            {isSavingLearnings ? "Saving..." : "Saved"}
                                        </span>
                                    </div>
                                    <textarea
                                        value={learnings}
                                        onChange={(e) => setLearnings(e.target.value)}
                                        className="flex-1 w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="- Why did the winner perform well?&#10;- New angles to test?&#10;- Iteration ideas?"
                                    />
                                </div>
                            </div>

                            {/* Ad Connection Table */}
                            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                                <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Linked Ads</h4>
                                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-medium">
                                            <tr>
                                                <th className="p-3">Ad Name</th>
                                                <th className="p-3">Spend</th>
                                                <th className="p-3">Variation Link</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {batch.facebookAds?.map(ad => (
                                                <tr key={ad.id} className="bg-white dark:bg-zinc-900">
                                                    <td className="p-3 font-medium text-zinc-900 dark:text-zinc-200 max-w-xs truncate" title={ad.name}>
                                                        {ad.name}
                                                    </td>
                                                    <td className="p-3 text-zinc-600 dark:text-zinc-400">${ad.spend.toFixed(2)}</td>
                                                    <td className="p-3">
                                                        <select
                                                            value={ad.batchItemId || ""}
                                                            onChange={(e) => linkAdToVariation(ad.id, e.target.value)}
                                                            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg text-xs py-1.5 px-2 w-full max-w-[200px]"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {batch.items.map((item, idx) => (
                                                                <option key={item.id} value={item.id}>
                                                                    Var {getVariationLabel(idx)} ({hooks.find(h => h.id === item.hookId)?.name || 'No Hook'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!batch.facebookAds || batch.facebookAds.length === 0) && (
                                                <tr>
                                                    <td colSpan={3} className="p-6 text-center text-zinc-400 italic">
                                                        No Facebook Ads linked to this batch yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 6. REVIEW DASHBOARD */}
                {activeStep === "REVIEW" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Review Dashboard</h3>
                            <div className="space-y-4">
                                {getSectionState("REVIEW", batch.status) === "active" && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 mb-4">
                                        <p><strong>Review Mode:</strong> Please approve variations or add revision notes.</p>
                                    </div>
                                )}

                                {/* Reference Messaging for Reviewer */}
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Core Messaging Reference</h4>
                                    <MessagingAnalysisToolbox
                                        value={batch.mainMessaging}
                                        readOnly
                                        className="p-3 border text-xs bg-zinc-50 dark:bg-zinc-800/50"
                                    />
                                </div>

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
                        </div>
                    </div>
                )}

                {/* 7. AI BOOST */}
                {activeStep === "AI_BOOST" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Boost</h3>
                                <span className={`text-xs font-mono transition-colors ${isSavingAi ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingAi ? "Saving..." : "Saved"}
                                </span>
                            </div>
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
                        </div>
                    </div>
                )
                }

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


                {/* Auto-Brief Modal */}
                {
                    isAutoBriefModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span>✨</span> Auto-Draft Brief
                                        </h3>
                                        <div className="flex flex-wrap gap-1 mt-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                            <span className="text-xs text-zinc-500 w-full mb-1 font-semibold uppercase tracking-wider">Click to Insert Variable:</span>
                                            {[
                                                "[BRAND NAME]", "[OFFER BRIEF]", "[BRAND DESCRIPTION]",
                                                "[AUDIENCE]", "[DESIRE]", "[DESIRE DESCRIPTION]",
                                                "[AWARENESS]", "[THEME]", "[THEME DESCRIPTION]",
                                                "[MAIN MESSAGING]", "[IDEA]"
                                            ].map(variable => (
                                                <button
                                                    key={variable}
                                                    onClick={() => {
                                                        const textarea = document.getElementById('autoBriefTextarea') as HTMLTextAreaElement;
                                                        if (textarea) {
                                                            const start = textarea.selectionStart;
                                                            const end = textarea.selectionEnd;
                                                            const text = autoBriefPrompt;
                                                            const newText = text.substring(0, start) + variable + text.substring(end);
                                                            setAutoBriefPrompt(newText);
                                                            // Request animation frame to restore focus and position
                                                            requestAnimationFrame(() => {
                                                                textarea.selectionStart = textarea.selectionEnd = start + variable.length;
                                                                textarea.focus();
                                                            });
                                                        } else {
                                                            setAutoBriefPrompt(prev => prev + variable);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-[10px] font-mono hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-all shadow-sm"
                                                >
                                                    {variable}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAutoBriefModalOpen(false)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors self-start"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="flex-1 p-0 overflow-hidden relative">
                                    <textarea
                                        id="autoBriefTextarea"
                                        value={autoBriefPrompt}
                                        onChange={(e) => setAutoBriefPrompt(e.target.value)}
                                        className="w-full h-full p-6 resize-none focus:outline-none bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono text-sm leading-relaxed"
                                        placeholder="Edit the prompt here..."
                                    />
                                </div>

                                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
                                    <span className="text-xs text-zinc-500">
                                        This will overwrite existing brief content.
                                    </span>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsAutoBriefModalOpen(false)}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={generateAutoBrief}
                                            disabled={isGeneratingBrief}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-70 flex items-center gap-2"
                                        >
                                            {isGeneratingBrief ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <span>⚡</span> Generate Brief
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
