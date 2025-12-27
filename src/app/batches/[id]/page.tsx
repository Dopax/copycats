"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SearchableSelect from '@/components/SearchableSelect';
import { DEFAULT_BRIEF_PROMPT } from "@/lib/constants/prompts";
import type {
    Batch,
    BatchItem,
    Hook,
    AdFormat,
    LinkedFacebookAd,
    Creator
} from "@/types";

// Extracted Components
import { useAutoSave } from '@/hooks/useAutoSave';
import { DebouncedTextarea } from '@/components/DebouncedTextarea';
import { FileUpload } from '@/components/FileUpload';
import { HookLibraryModal } from '@/components/batches/HookLibraryModal';
import { ViewDocModal } from '@/components/batches/ViewDocModal';
import { getStrategySentence } from '@/components/batches/StrategyCard';
import ReferenceAdIntegration from "@/components/ReferenceAdIntegration";
import MessagingAnalysisToolbox from "@/components/MessagingAnalysisToolbox";
import VideoReviewModal from "@/components/batches/VideoReviewModal";
import { PageLoader } from "@/components/LoadingSpinner";
import { CompetitorSourceBreakdown } from "@/components/batches/CompetitorSourceBreakdown";
import { BatchHeader } from "@/components/batches/BatchHeader";

const DEFAULT_EDITOR_BRIEF_PROMPT = `Write a concise and professional Editor Brief for this ad batch.

CONTEXT:
- Brand Name: [BRAND NAME]
- Product: [OFFER BRIEF]
- Target Audience: [DEMOGRAPHIC] ([AUDIENCE])
- Core Desire: [DESIRE] ([DESIRE DESCRIPTION])
- Brain Clicks (Original Copy): [BRAIN CLICKS]
- Awareness Level: [AWARENESS]
- Visual Theme/Tone: [THEME] ([THEME DESCRIPTION])
- Main Messaging Focus: [MAIN MESSAGING]
- Unique Idea/Angle: [IDEA] ({[ANGLE]})
- Format: [FORMAT] ([FORMAT DESCRIPTION])

Brand Info: [BRAND DESCRIPTION]

REFERENCE AD (For Inspiration/Copycat):
- Headline: [REF_HEADLINE]
- Primary Text: [REF_PRIMARY_TEXT]
- Why It Works: [REF_WHY_WORKS]
- Notes: [REF_NOTES]
- Awareness Reason: [REF_AWARENESS_REASON]
- Transcript: [REF_TRANSCRIPT]

INSTRUCTIONS:
1. Pacing & Tone: Describe the required editing pace (fast/snappy or slow/emotional) and overall tone.
2. Visual Style: Instructions on subtitles, fonts, colors (on brand), and any B-roll usage.
3. Music & Audio: Vibe for background music and sound effects.
4. Hook & CTA: Specific visual emphasis for the hook and call to action.
5. Reference Ad: Explain how closely they should mimic the reference ad's editing style.

Be specific and actionable for a video editor.`;

const STATUS_FLOW = ["IDEATION", "CREATOR_BRIEFING", "FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LEARNING", "ARCHIVED"];

const WORKFLOW_STEPS = [
    { id: 'IDEATION', label: '1. Ideation', status: 'IDEATION' },
    { id: 'CREATOR_BRIEFING', label: '2. Creator Brief', status: 'CREATOR_BRIEFING' },
    { id: 'FILMING', label: '3. Filming', status: 'FILMING' },
    { id: 'EDITOR_BRIEFING', label: '4. Editor Brief', status: 'EDITOR_BRIEFING' },
    { id: 'EDITING', label: '5. Editing', status: 'EDITING' },
    { id: 'REVIEW', label: '6. Review', status: 'REVIEW' },
    { id: 'AI_BOOST', label: '7. AI Boost', status: 'AI_BOOST' },
    { id: 'LEARNING', label: '8. Learning', status: 'LEARNING' }
];

// Helper to determine active sections based on status
function getSectionState(section: string, currentStatus: string) {
    const sectionOrder = ["IDEATION", "CREATOR_BRIEFING", "EDITOR_BRIEFING", "REVIEW", "AI_BOOST", "LEARNING"];
    const currentIdx = sectionOrder.indexOf(currentStatus);
    const sectionIdx = sectionOrder.indexOf(section);

    // Special mapping for status -> section
    const statusToSection: Record<string, string> = {
        "IDEATION": "IDEATION",
        "CREATOR_BRIEFING": "CREATOR_BRIEFING",
        "FILMING": "CREATOR_BRIEFING",
        "EDITOR_BRIEFING": "EDITOR_BRIEFING",
        "EDITING": "EDITOR_BRIEFING",
        "REVIEW": "REVIEW",
        "AI_BOOST": "AI_BOOST",
        "LEARNING": "LEARNING",
        "ARCHIVED": "LEARNING"
    };

    const mappedSection = statusToSection[currentStatus] || currentStatus;
    const mappedIdx = sectionOrder.indexOf(mappedSection);

    if (sectionIdx < mappedIdx) return "completed";
    if (sectionIdx === mappedIdx) return "active";
    return "upcoming";
}

const getPlayableUrl = (url: string) => {
    if (!url) return "";
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url;
};

export default function BatchDetailPage() {
    // Constants used in this component
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

    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);

    // Auto-Brief State

    const [isAutoBriefModalOpen, setIsAutoBriefModalOpen] = useState(false);
    const [autoBriefPrompt, setAutoBriefPrompt] = useState(DEFAULT_BRIEF_PROMPT);
    const [autoBriefTarget, setAutoBriefTarget] = useState<'CREATOR' | 'EDITOR'>('CREATOR');
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
    const [availableCreators, setAvailableCreators] = useState<Creator[]>([]);
    const [selectingHookForItem, setSelectingHookForItem] = useState<string | null>(null);
    const [reviewingItem, setReviewingItem] = useState<{ id: string; videoUrl: string; isReadOnly?: boolean } | null>(null);
    const [hooks, setHooks] = useState<Hook[]>([]);

    // Formats State
    const [formats, setFormats] = useState<AdFormat[]>([]);

    useEffect(() => {
        fetchFormats();
    }, []);

    const fetchFormats = async () => {
        try {
            const res = await fetch('/api/formats');
            if (res.ok) setFormats(await res.json());
        } catch (e) {
            console.error("Failed to fetch formats");
        }
    };

    // Strategy Sentence State
    const [strategySentence, setStrategySentence] = useState("");
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

    const generateStrategy = async () => {
        setIsGeneratingStrategy(true);
        try {
            const res = await fetch(`/api/batches/${id}/generate-strategy`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setStrategySentence(data.strategySentence);
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error generating strategy");
        } finally {
            setIsGeneratingStrategy(false);
        }
    };

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

    const [projectFilesUrl, setProjectFilesUrl] = useState("");
    const [isSavingProjectFilesUrl, setIsSavingProjectFilesUrl] = useState(false);

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

    useAutoSave(projectFilesUrl, () => saveProjectFilesUrl());

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
                if (autoBriefTarget === 'CREATOR') {
                    setCreatorBrief(data.content);
                    updateBatch({ creatorBrief: data.content });
                } else {
                    setBrief(data.content);
                    updateBatch({ brief: data.content });
                }
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

                setProjectFilesUrl(data.projectFilesUrl || "");

                setAiForm({
                    adCopy: data.aiAdCopy || "",
                    imagePrompt: data.aiImagePrompt || "",
                    videoPrompt: data.aiVideoPrompt || ""
                });

                // Initial Field Set
                setMainMessaging(data.mainMessaging || "");
                setLearnings(data.learnings || "");
                setStrategySentence(data.strategySentence || "");

                // Fetch Available Creators for this Brand
                const brandId = data.brand?.id || data.angle?.brand?.id;
                if (brandId) {
                    fetch(`/api/creators?brandId=${brandId}`)
                        .then(r => r.json())
                        .then(creators => {
                            if (Array.isArray(creators)) setAvailableCreators(creators);
                        })
                        .catch(e => console.error("Failed to load creators", e));
                }
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
                setBatch({ ...batch, status: newStatus as Batch['status'] });
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

    const assignCreator = async (creatorId: string) => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/batches/${batch.id}/creators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId })
            });
            if (res.ok) {
                const creator = availableCreators.find(c => c.id === creatorId);
                if (creator) {
                    const newAssigned = [...(batch.assignedCreators || []), creator];
                    setBatch({ ...batch, assignedCreators: newAssigned });
                }
            }
        } catch (error) {
            console.error("Failed to assign creator", error);
        }
    };

    const unassignCreator = async (creatorId: string) => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/batches/${batch.id}/creators?creatorId=${creatorId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const newAssigned = (batch.assignedCreators || []).filter(c => c.id !== creatorId);
                setBatch({ ...batch, assignedCreators: newAssigned });
            }
        } catch (error) {
            console.error("Failed to unassign creator", error);
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

    const saveProjectFilesUrl = async () => {
        if (!batch) return;
        if (isMounted.current) setIsSavingProjectFilesUrl(true);
        try {
            await fetch(`/api/batches/${batch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectFilesUrl })
            });
        } catch (error) {
            console.error("Failed to save project files url", error);
        } finally {
            if (isMounted.current) setIsSavingProjectFilesUrl(false);
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
            // Optimistic update for consistency across sections
            setBatch(prev => prev ? { ...prev, mainMessaging } : null);
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
        console.log("[Frontend] updateItem", itemId, data);
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

    if (isLoading) return <PageLoader text="Loading Batch Details..." />;
    if (!batch) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <BatchHeader
                batch={batch as any}
                onStatusChange={updateStatus}
                onDelete={deleteBatch}
                onViewPersona={setViewingDoc}
            />

            {/* Strategy Sentence - Global Context */}
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm mb-6 relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={generateStrategy}
                        disabled={isGeneratingStrategy}
                        className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
                        title="Regenerate Strategy AI"
                    >
                        <svg className={`w-4 h-4 ${isGeneratingStrategy ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>

                {strategySentence ? (
                    <div className="text-center">
                        <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed font-medium">
                            {strategySentence}
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-zinc-400 mb-3 text-sm">No strategy generated yet.</p>
                        <button
                            onClick={generateStrategy}
                            disabled={isGeneratingStrategy}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {isGeneratingStrategy ? "Generating..." : "✨ Generate AI Strategy"}
                        </button>
                        {/* Fallback to old static generated one if needed, or just keep it clean */}
                    </div>
                )}
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

                    <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-zinc-900 rounded-xl shadow-xl border border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        {(() => {
                            const levelName = batch.angle.awarenessLevel?.name || "Problem Unaware";
                            const desireName = batch.angle.desire.name || "the problem";

                            const details: Record<string, { label: string; color: string; desc: React.ReactNode }> = {
                                "Problem Unaware": {
                                    label: "1. Unaware",
                                    color: "text-red-400",
                                    desc: <>The customer is not really thinking much about <strong>{desireName}</strong>. Life feels normal, and they do not connect any frustration or missed opportunity with it yet.</>
                                },
                                "Problem Aware": {
                                    label: "2. Problem Aware",
                                    color: "text-orange-400",
                                    desc: <>The customer starts to feel small annoyances or stress around <strong>{desireName}</strong>. They know something is not ideal, but they have not clearly recognized the specific cause.</>
                                },
                                "Solution Aware": {
                                    label: "3. Solution Aware",
                                    color: "text-amber-400",
                                    desc: <>The customer realizes that improving how they approach <strong>{desireName}</strong> could make things easier or more enjoyable. They begin looking for solutions.</>
                                },
                                "Product Aware": {
                                    label: "4. Product Aware",
                                    color: "text-emerald-400",
                                    desc: <>The customer understands that there are products and services designed to help with <strong>{desireName}</strong>. They compare options, reviews, price, and trust.</>
                                },
                                "Most Aware": {
                                    label: "5. Most Aware",
                                    color: "text-indigo-400",
                                    desc: <>The customer already believes our product is a strong solution for <strong>{desireName}</strong>. They mainly need reassurance about results.</>
                                }
                            };

                            const active = details[levelName] || details["Problem Unaware"];

                            return (
                                <>
                                    <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-700 pb-1">Awareness Stage</div>
                                    <div className="text-zinc-300 leading-relaxed text-xs text-left">
                                        <strong className={`${active.color} block mb-0.5`}>{active.label}</strong>
                                        {active.desc}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

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
                {/* 2. CREATOR BRIEFING */}
                {activeStep === "CREATOR_BRIEFING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>📹</span> Creator Briefing
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                    Define what the creator needs to say and do.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-mono transition-colors ${isSavingCreatorBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingCreatorBrief ? "Saving..." : "Saved"}
                                </span>
                            </div>
                        </div>

                        <div className={`grid gap-8 items-start ${batch.referenceAd ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {/* LEFT COLUMN: Reference & Context (Sticky) - Only when reference ad exists */}
                            {batch.referenceAd && (
                                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center">
                                            <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Visual Reference</h4>
                                        </div>
                                        <div className="p-4">
                                            <ReferenceAdIntegration ad={batch.referenceAd as any} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RIGHT COLUMN: Inputs & Instructions - Takes full width when no reference ad */}
                            <div className={batch.referenceAd ? 'lg:col-span-2 space-y-8' : 'space-y-8'}>
                                {/* Main Inputs Container */}
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-8">
                                    {/* Brief Instructions */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-zinc-900 dark:text-white">Brief & Instructions</label>
                                            <button
                                                onClick={() => {
                                                    setAutoBriefTarget('CREATOR');
                                                    setAutoBriefPrompt(DEFAULT_BRIEF_PROMPT);
                                                    setIsAutoBriefModalOpen(true);
                                                }}
                                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                                            >
                                                <span>✨</span> AI Draft
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                className="w-full h-[300px] p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none font-sans leading-relaxed text-sm"
                                                placeholder="Hello! We'd love for you to create a video that..."
                                                value={creatorBrief}
                                                onChange={(e) => setCreatorBrief(e.target.value)}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(creatorBrief)}
                                                    className="p-2 text-zinc-400 hover:text-indigo-500 bg-white/50 dark:bg-black/20 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                                                    title="Copy Brief"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shotlist Builder */}
                                    <div>
                                        <label className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">Shotlist / Checklist</span>
                                            <span className="text-xs text-zinc-500">
                                                Creators must check off these items to submit.
                                            </span>
                                        </label>

                                        <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                            {(shotlist || "").split('\n').filter(line => line.trim() !== "").map((shot, idx) => (
                                                <div key={idx} className="flex items-center gap-2 group">
                                                    <div className="text-zinc-400 font-mono text-xs select-none w-6 text-right">{idx + 1}.</div>
                                                    <input
                                                        type="text"
                                                        value={shot}
                                                        onChange={(e) => {
                                                            const rawLines = (shotlist || "").split('\n');
                                                            const cleanLines = rawLines.filter(l => l.trim() !== "");
                                                            cleanLines[idx] = e.target.value;
                                                            setShotlist(cleanLines.join('\n'));
                                                        }}
                                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const rawLines = (shotlist || "").split('\n').filter(l => l.trim() !== "");
                                                            rawLines.splice(idx, 1);
                                                            setShotlist(rawLines.join('\n'));
                                                        }}
                                                        className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add New Line */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-6"></div> {/* Spacer */}
                                                <button
                                                    onClick={() => {
                                                        const current = shotlist ? shotlist + "\n" : "";
                                                        setShotlist(current + "New Shot");
                                                    }}
                                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1"
                                                >
                                                    <span>+</span> Add Shot
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COPYCAT SOURCE ANALYSIS (Display only for Copycat) */}
                                {batch.batchType === 'COPYCAT' && batch.referenceAd && (
                                    <CompetitorSourceBreakdown
                                        referenceAd={batch.referenceAd as any}
                                        mainMessaging={mainMessaging}
                                        onMessagingChange={setMainMessaging}
                                        readOnly={true}
                                    />
                                )}

                                {/* Standard Messaging for Non-Copycat */}
                                {batch.batchType !== 'COPYCAT' && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                                            <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Core Messaging Strategy</h4>
                                        </div>
                                        <div className="p-0">
                                            <MessagingAnalysisToolbox
                                                value={mainMessaging}
                                                onChange={(val) => setMainMessaging(val)}
                                                className="border-none shadow-none bg-transparent"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. FILMING */}
                {activeStep === "FILMING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Filming Status</h3>

                            {/* Assigned Creators List */}
                            <div className="mb-6">
                                <h4 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3">Assigned Creators</h4>
                                {batch.assignedCreators && batch.assignedCreators.length > 0 ? (
                                    <div className="flex flex-wrap gap-4">
                                        {batch.assignedCreators.map(creator => (
                                            <div key={creator.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 pr-4 rounded-full">
                                                {creator.profileImageUrl ? (
                                                    <img src={creator.profileImageUrl} alt={creator.name} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                        {creator.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-zinc-900 dark:text-white">{creator.name}</span>
                                                <button
                                                    onClick={() => unassignCreator(creator.id)}
                                                    className="ml-2 text-zinc-400 hover:text-red-500 transition-colors"
                                                    title="Unassign"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">No creators assigned yet.</p>
                                )}
                            </div>

                            {/* Assign New Creator */}
                            <div className="max-w-md">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Assign Creator</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 rounded-lg border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                assignCreator(e.target.value);
                                                e.target.value = ""; // Reset
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select a creator to assign...</option>
                                        {availableCreators
                                            .filter(c => !batch.assignedCreators?.some(ac => ac.id === c.id))
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.status !== 'APPROVED' ? `(${c.status})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <p className="text-xs text-zinc-400 mt-2">
                                    Only showing creators for the current brand ({batch.brand?.name || batch.angle?.brand?.name || "unknown"}).
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. BRIEFING & STRATEGY */}
                {activeStep === "BRIEFING" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Editor Briefing</h3>
                                {batch.format && (
                                    <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 max-w-2xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Chosen Format</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{batch.format.name}</span>
                                        </div>
                                        <p className="text-xs leading-relaxed opacity-80">{batch.format.description}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">

                                <span className={`text-xs font-mono transition-colors ${isSavingBrief ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                    {isSavingBrief ? "Saving Brief..." : "Saved"}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* LEFT COLUMN: Reference & Context (Sticky) */}
                            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                                {/* Reference Ad */}
                                {batch.referenceAd ? (
                                    <ReferenceAdIntegration ad={batch.referenceAd as any} />
                                ) : (
                                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 italic">
                                        No specific reference ad linked.
                                    </div>
                                )}

                                {/* Iteration Context */}
                                {batch.referenceBatch && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full border border-purple-200">
                                                ITERATION V2
                                            </span>
                                            <span className="text-xs text-zinc-500">Based on:</span>
                                        </div>
                                        <Link href={`/batches/${batch.referenceBatch.id}`} target="_blank" className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-purple-600 hover:underline">
                                            {batch.referenceBatch.name} ↗
                                        </Link>
                                    </div>
                                )}


                            </div>

                            {/* RIGHT COLUMN: Instructions & Work */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Editor Instructions */}
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <label className="block text-sm font-bold text-zinc-900 dark:text-white">Editor Instructions</label>
                                            <p className="text-xs text-zinc-500">Provide clear direction on editing style, pacing, and visual effects.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAutoBriefTarget('EDITOR');
                                                setAutoBriefPrompt(DEFAULT_EDITOR_BRIEF_PROMPT);
                                                setIsAutoBriefModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            <span>✨</span> AI Draft
                                        </button>
                                    </div>
                                    <textarea
                                        value={brief}
                                        onChange={(e) => setBrief(e.target.value)}
                                        className="w-full h-64 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-4 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed shadow-inner"
                                        placeholder="Describe the ad concept, visual direction, and key messaging..."
                                        disabled={batch.status !== "EDITOR_BRIEFING"}
                                    />
                                </div>

                                {/* Competitor Source Breakdown (Right Column Below Brief) */}
                                {batch.referenceAd && (
                                    <CompetitorSourceBreakdown
                                        referenceAd={batch.referenceAd as any}
                                        mainMessaging={mainMessaging}
                                        onMessagingChange={setMainMessaging}
                                        readOnly={true}
                                    />
                                )}

                                {/* Production Context */}
                                <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    <details className="group border-b border-zinc-200 dark:border-zinc-700">
                                        <summary className="flex items-center justify-between cursor-pointer list-none p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                                <span>📄</span> Original Creator Brief
                                            </h4>
                                            <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="p-4 pt-0 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/50">
                                            {creatorBrief || "No specific creator brief found."}
                                        </div>
                                    </details>
                                    <details className="group">
                                        <summary className="flex items-center justify-between cursor-pointer list-none p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                                <span>📋</span> Shotlist
                                            </h4>
                                            <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="p-4 pt-0 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/50">
                                            {shotlist || "No shotlist found."}
                                        </div>
                                    </details>
                                </div>

                                {/* Variations List */}
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span>🎬</span> Variations to Produce
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm("This will generate 3 new AI variations. Continue?")) return;

                                                    const btn = e.currentTarget;
                                                    const originalText = btn.innerHTML;
                                                    btn.innerHTML = "✨ Dreaming...";
                                                    btn.disabled = true;

                                                    try {
                                                        const res = await fetch(`/api/batches/${batch.id}/generate-variations`, { method: 'POST' });
                                                        if (res.ok) {
                                                            window.location.reload(); // Simple reload to show new items
                                                        } else {
                                                            alert("Failed to generate.");
                                                        }
                                                    } catch (err) {
                                                        alert("Error generating.");
                                                    } finally {
                                                        btn.innerHTML = originalText;
                                                        btn.disabled = false;
                                                    }
                                                }}
                                                disabled={batch.status !== "EDITOR_BRIEFING"}
                                                className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <span>✨</span> Auto-Vary
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addBatchItem(); }}
                                                disabled={batch.status !== "EDITOR_BRIEFING"}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <span>+</span> Add Variation
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[...batch.items]
                                            .sort((a, b) => (a.variationIndex || 'Z').localeCompare(b.variationIndex || 'Z'))
                                            .map((item, index) => (
                                                <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group">
                                                    <div className="flex flex-col gap-4">


                                                        {/* Header Row */}
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-center gap-4 flex-1">

                                                                <div className="flex-1 flex gap-2">
                                                                    {/* Variation Index Badge */}
                                                                    <div className="h-full flex items-center justify-center">
                                                                        <div className="h-8 w-8 min-w-[2rem] rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 text-sm shadow-sm">
                                                                            {item.variationIndex || index + 1}
                                                                        </div>
                                                                    </div>
                                                                    {/* Hook Selector */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Hook</label>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setSelectingHookForItem(item.id); }}
                                                                                disabled={batch.status !== "EDITOR_BRIEFING"}
                                                                                className={`flex-1 min-w-0 text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${item.hookId
                                                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300"
                                                                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 italic"
                                                                                    }`}
                                                                            >
                                                                                <span className="truncate font-medium">{item.hookId ? (hooks.find(h => h.id === item.hookId)?.name || "Unknown Hook") : "Select a Hook..."}</span>
                                                                                <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                            </button>
                                                                            {item.hookId && batch.status === "EDITOR_BRIEFING" && (
                                                                                <button onClick={() => updateItem(item.id, { hookId: null })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-500 flex-shrink-0">
                                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Format Selector */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Format</label>
                                                                        <div className="relative">
                                                                            <SearchableSelect
                                                                                options={formats.map(f => ({
                                                                                    id: f.id,
                                                                                    name: f.name,
                                                                                    category: f.category || "General",
                                                                                    description: f.description || ""
                                                                                }))}
                                                                                value={item.format?.id || null}
                                                                                onChange={(val) => {
                                                                                    if (!val) {
                                                                                        updateItem(item.id, { formatId: null, format: null });
                                                                                    } else {
                                                                                        const newFormat = formats.find(f => f.id === val);
                                                                                        updateItem(item.id, { formatId: val, format: newFormat });
                                                                                    }
                                                                                }}
                                                                                placeholder="Select Format..."
                                                                                className="w-full"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                disabled={batch.status !== "EDITOR_BRIEFING" || batch.items.length <= 1}
                                                                className={`transition-colors p-2 ${batch.items.length <= 1 ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-300 hover:text-red-500'}`}
                                                                title={batch.items.length <= 1 ? "Cannot delete the last variation" : "Delete Variation"}
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                            {/* Duration Selector */}
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Duration</label>
                                                                <select
                                                                    value={item.requestedDuration || ""}
                                                                    onChange={(e) => updateItem(item.id, { requestedDuration: e.target.value ? parseInt(e.target.value) : null })}
                                                                    className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
                                                                    disabled={batch.status !== "EDITOR_BRIEFING"}
                                                                >
                                                                    <option value="">Any</option>
                                                                    {[10, 15, 20, 30, 45, 60, 90].map(sec => (
                                                                        <option key={sec} value={sec}>{sec}s</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Script & Notes */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Script</label>
                                                                <DebouncedTextarea
                                                                    value={item.script || ""}
                                                                    onCommit={(val: string) => updateItem(item.id, { script: val })}
                                                                    disabled={batch.status !== "EDITOR_BRIEFING"}
                                                                    className="w-full h-24 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-200"
                                                                    placeholder="Script/Voiceover..."
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                    {batch.status === "EDITOR_BRIEFING" ? "Visuals" : "Revisions"}
                                                                </label>
                                                                <DebouncedTextarea
                                                                    value={item.notes || ""}
                                                                    onCommit={(val: string) => updateItem(item.id, { notes: val })}
                                                                    disabled={batch.status !== "EDITOR_BRIEFING" && batch.status !== "EDITING"}
                                                                    className={`w-full h-24 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-200 ${batch.status === "EDITING" ? "border-amber-200 bg-amber-50/50" : ""}`}
                                                                    placeholder={batch.status === "EDITOR_BRIEFING" ? "Visual notes for editor..." : "Enter revision feedback..."}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        {batch.items.length === 0 && (
                                            <div className="text-center py-10 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                                                No variations planned yet. Click "Add Variation" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                                                    "Watermark added",
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

                                                    {/* Revision Alert - Only show if we are effectively in a Revision Cycle (EDITING) */}
                                                    {item.status === 'PENDING' && item.notes && batch.status === 'EDITING' && (
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
                                {/* Project Files Upload (Moved Here) */}
                                <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
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
                                        <textarea value={aiForm.imagePrompt} onChange={(e) => setAiForm({ ...aiForm, imagePrompt: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "upcoming"} className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500" placeholder="Describe image assets..." />
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                                        <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2"><span className="text-lg">🎥</span> Sora Prompts</label>
                                        <textarea value={aiForm.videoPrompt} onChange={(e) => setAiForm({ ...aiForm, videoPrompt: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "upcoming"} className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500" placeholder="Direct prompts for Sora..." />
                                    </div>
                                    <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                                        <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2"><span className="text-lg">📝</span> Final Ad Copy</label>
                                        <textarea value={aiForm.adCopy} onChange={(e) => setAiForm({ ...aiForm, adCopy: e.target.value })} disabled={getSectionState("AI_BOOST", batch.status) === "upcoming"} className="w-full h-40 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500 font-sans" placeholder="Primary Text, Headline..." />
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
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
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
                                                "[MAIN MESSAGING]", "[IDEA]",
                                                "[FORMAT]", "[FORMAT DESCRIPTION]",
                                                "[REF_HEADLINE]", "[REF_PRIMARY_TEXT]",
                                                "[REF_TRANSCRIPT]", "[REF_WHY_WORKS]", "[REF_NOTES]",
                                                "[REF_AWARENESS_REASON]"
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
        </div >
    );
}

