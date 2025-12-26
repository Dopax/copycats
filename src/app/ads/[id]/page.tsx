"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import QuickAddModal, { QuickAddType } from "@/components/QuickAddModal";
import SearchableSelect from "@/components/SearchableSelect";
import AwarenessTooltip from "@/components/AwarenessTooltip";
import MessagingAnalysisToolbox from "@/components/MessagingAnalysisToolbox";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface AdSnapshot {
    id: string;
    likes: number;
    shares: number;
    comments: number;
    capturedAt: string;
}

interface AdFormat { id: string; name: string; }
interface AdHook { id: string; name: string; }
interface AdTheme { id: string; name: string; }
interface AdDesire { id: string; name: string; }
interface AdDemographic { id: string; name: string; }
interface AdAngle { id: string; name: string; }
interface AdAwarenessLevel { id: string; name: string; }

interface Ad {
    id: string;
    postId: string;
    brand: string;
    headline: string;
    description: string;
    adLink: string | null;
    facebookLink?: string;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    publishDate: string;
    firstSeen: string;
    lastSeen: string;
    transcript?: string;
    snapshots: AdSnapshot[];
    notes?: string;
    whyItWorks?: string;
    mainMessaging?: string;
    format?: AdFormat | null;
    hook?: AdHook | null;
    theme?: AdTheme | null;
    desire?: AdDesire | null;
    angle?: AdAngle | null;
    awarenessLevel?: AdAwarenessLevel | null;
    awarenessLevelReason?: string | null;
}

export default function AdDetailPage() {
    const params = useParams();
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const [transcribing, setTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Notes & Tags State (Copied from AdCard logic)
    const [notes, setNotes] = useState("");
    const [whyItWorks, setWhyItWorks] = useState("");
    const [mainMessaging, setMainMessaging] = useState("");
    const [awarenessReason, setAwarenessReason] = useState("");
    const [isGeneratingAwareness, setIsGeneratingAwareness] = useState(false);
    const [showNotesField, setShowNotesField] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isExtractingHook, setIsExtractingHook] = useState(false);
    const [activeQuickAdd, setActiveQuickAdd] = useState<QuickAddType | null>(null);

    // Tags Lists
    const [formats, setFormats] = useState<AdFormat[]>([]);
    const [hooks, setHooks] = useState<AdHook[]>([]);
    const [themes, setThemes] = useState<AdTheme[]>([]);
    const [desires, setDesires] = useState<AdDesire[]>([]);
    const [angles, setAngles] = useState<AdAngle[]>([]);
    const [demographics, setDemographics] = useState<AdDemographic[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AdAwarenessLevel[]>([]);

    // Selected Tags
    const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
    const [selectedHook, setSelectedHook] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedDesire, setSelectedDesire] = useState<string | null>(null);
    const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
    const [selectedAwareness, setSelectedAwareness] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string>("");
    const [selectedAge, setSelectedAge] = useState<string>("");

    // Load available tags
    const loadTags = async () => {
        try {
            const [formatsRes, hooksRes, themesRes, desiresRes, anglesRes, demographicsRes, awarenessRes] = await Promise.all([
                fetch('/api/formats'),
                fetch('/api/hooks'),
                fetch('/api/themes'),
                fetch('/api/desires'),
                fetch('/api/angles'),
                fetch('/api/demographics'),
                fetch('/api/awareness-levels')
            ]);
            setFormats(await formatsRes.json());
            setHooks(await hooksRes.json());
            setThemes(await themesRes.json());
            setDesires(await desiresRes.json());
            setAngles(await anglesRes.json());
            setDemographics(await demographicsRes.json());
            setAwarenessLevels(await awarenessRes.json());
        } catch (e) {
            console.error("Failed to load tags", e);
        }
    };

    // Tag Creation Helpers
    const createTag = async (type: 'formats' | 'hooks' | 'themes' | 'desires' | 'angles' | 'awareness-levels', data: any, setter: any, list: any[]) => {
        try {
            const res = await fetch(`/api/${type}`, { method: 'POST', body: JSON.stringify(data) });
            const newItem = await res.json();
            setter([...list, newItem]);
            return newItem.id;
        } catch (e) {
            console.error(`Failed to create ${type}`, e);
            return null;
        }
    };

    const extractHook = async () => {
        if (!ad || !ad.videoUrl) {
            alert("No video available to extract hook from.");
            return;
        }

        const defaultName = `Hook from ${ad.brand || 'Ad'}`;
        const name = prompt("Enter a name for this video hook:", defaultName);
        if (!name) return;

        setIsExtractingHook(true);
        try {
            const res = await fetch('/api/hooks/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl: ad.videoUrl,
                    name,
                    brandId: (ad as any).brandId // Assuming brandId might be on ad object if needed
                })
            });

            if (res.ok) {
                const newHook = await res.json();
                setHooks([...hooks, newHook]);
                setSelectedHook(newHook.id);
                alert("Hook extracted and saved successfully!");
            } else {
                const err = await res.json();
                alert(`Failed to extract hook: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error("Failed to extract hook", e);
            alert("Error extracting hook");
        } finally {
            setIsExtractingHook(false);
        }
    };

    const generateAwarenessReason = async () => {
        setIsGeneratingAwareness(true);
        try {
            const res = await fetch('/api/ai/awareness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId: ad?.id })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to generate");
            }

            const data = await res.json();
            if (data.awarenessLevelId) setSelectedAwareness(data.awarenessLevelId);
            if (data.reason) setAwarenessReason(data.reason);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsGeneratingAwareness(false);
        }
    };

    const saveDetails = async () => {
        if (!ad) return;
        setIsSavingNotes(true);
        try {
            // Save Notes
            await fetch(`/api/ads/${ad.id}/note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes, whyItWorks, mainMessaging }),
            });

            // Save Tags
            // Calculate Demographic ID (Assuming logic exists)
            // Note: AdDetailPage needs selectedGender and selectedAge state
            const demoName = (selectedGender && selectedAge) ? `${selectedGender} ${selectedAge}` : null;
            const selectedDemographic = demoName ? demographics.find(d => d.name === demoName)?.id : null;

            await fetch(`/api/ads/${ad.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formatId: selectedFormat,
                    hookId: selectedHook,
                    themeId: selectedTheme,
                    desireId: selectedDesire,
                    angleId: selectedAngle,
                    awarenessLevelId: selectedAwareness,
                    awarenessLevelReason: awarenessReason,
                    demographicId: selectedDemographic
                }),
            });
            alert("Details saved successfully!");
        } catch (error) {
            console.error("Failed to save details:", error);
            alert("Failed to save details.");
        } finally {
            setIsSavingNotes(false);
        }
    };

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const res = await fetch(`/api/ads/${params.id}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch ad");
                }
                const data = await res.json();
                setAd(data);

                // Initialize state from fetched ad
                setNotes(data.notes || "");
                setWhyItWorks(data.whyItWorks || "");
                setMainMessaging(data.mainMessaging || "");
                setShowNotesField(!!data.notes);
                setSelectedFormat(data.format?.id || null);
                setSelectedHook(data.hook?.id || null);
                setSelectedTheme(data.theme?.id || null);
                setSelectedDesire(data.desire?.id || null);
                setSelectedAngle(data.angle?.id || null);
                setSelectedAwareness(data.awarenessLevel?.id || null);
                if (data.awarenessLevelReason) setAwarenessReason(data.awarenessLevelReason);

                if (data.demographic?.name) {
                    const parts = data.demographic.name.split(' ');
                    if (parts.length >= 2) {
                        setSelectedGender(parts[0]);
                        setSelectedAge(parts[1]);
                    }
                }

                // Load available tags
                loadTags();
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchAd();
        }
    }, [params.id]);

    const handleTranscribe = async () => {
        if (!ad) return;
        setTranscribing(true);
        try {
            const res = await fetch(`/api/ads/${ad.id}/transcribe`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.details || "Transcription failed");
            }

            setAd(prev => prev ? ({ ...prev, transcript: data.transcript }) : null);
        } catch (error: any) {
            console.error(error);
            alert(`Failed to transcribe video: ${error.message}`);
        } finally {
            setTranscribing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !ad) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Error: {error || "Ad not found"}
            </div>
        );
    }

    const chartData = ad.snapshots.map((s) => ({
        date: format(new Date(s.capturedAt), "MMM d, HH:mm"),
        likes: s.likes,
        shares: s.shares,
        comments: s.comments,
    }));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {ad.brand}
                    </h1>
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Post ID: {ad.postId}</span>
                        <span>•</span>
                        <span>
                            Published: {format(new Date(ad.publishDate), "MMM d, yyyy")}
                        </span>
                        <span>•</span>
                        <span>
                            Last Seen: {format(new Date(ad.lastSeen), "MMM d, yyyy")}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/batches?create=true&refAdId=${ad.id}&refAdPostId=${ad.postId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        Create Copycat Batch
                    </Link>
                    {ad.facebookLink && (
                        <a
                            href={ad.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            View on Facebook
                        </a>
                    )}
                    <a
                        href={`https://app.adspy.com/ads/${ad.postId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View on AdSpy
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Media & Content */}
                <div className="space-y-6">
                    {/* Media Player */}
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative group">
                        {ad.videoUrl ? (
                            <video
                                src={ad.videoUrl}
                                poster={ad.thumbnailUrl || undefined}
                                controls
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <img
                                src={ad.thumbnailUrl || "/placeholder.png"}
                                alt="Ad Thumbnail"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    {/* Ad Text */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                            {ad.headline}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {ad.description}
                        </p>
                    </div>
                </div>

                {/* Transcript Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Video Script
                        </h3>
                        {!ad.transcript && (
                            <button
                                onClick={handleTranscribe}
                                disabled={transcribing || !ad.videoUrl}
                                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {transcribing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                                        Transcribing...
                                    </>
                                ) : (
                                    "Generate Script (AI)"
                                )}
                            </button>
                        )}
                    </div>

                    {ad.transcript ? (
                        <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {ad.transcript}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            {ad.videoUrl ? "No script generated yet." : "No video available to transcribe."}
                        </div>
                    )}
                </div>
                {/* Notes & Tags Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Analysis & Notes</h3>

                    <div className="space-y-4">
                        {/* Format Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Format</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedFormat || ""}
                                    onChange={(e) => setSelectedFormat(e.target.value || null)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                >
                                    <option value="">Select Format...</option>
                                    {formats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setActiveQuickAdd('formats')}
                                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors dark:text-zinc-300"
                                >+</button>
                            </div>
                        </div>

                        {/* Hook Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Hook</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedHook || ""}
                                    onChange={(e) => setSelectedHook(e.target.value || null)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                >
                                    <option value="">Select Hook...</option>
                                    {hooks.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                                {/* Extract Video Button */}
                                {ad.videoUrl && (
                                    <button
                                        onClick={extractHook}
                                        disabled={isExtractingHook}
                                        className="px-3 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                                        title="Extract First 3.5s as Video Hook"
                                    >
                                        {isExtractingHook ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm8.486-8.486a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243z" /></svg>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveQuickAdd('hooks')}
                                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors dark:text-zinc-300"
                                >+</button>
                            </div>
                        </div>

                        {/* Theme Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Theme</label>
                            <SearchableSelect
                                options={themes}
                                value={selectedTheme}
                                onChange={(val) => setSelectedTheme(val)}
                                onAdd={() => setActiveQuickAdd('themes')}
                                placeholder="Select Theme..."
                            />
                        </div>

                        {/* Desire Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Desire</label>
                            <SearchableSelect
                                options={desires}
                                value={selectedDesire}
                                onChange={(val) => setSelectedDesire(val)}
                                onAdd={() => setActiveQuickAdd('desires')}
                                placeholder="Select Desire..."
                            />
                        </div>

                        {/* Angle Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Angle</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedAngle || ""}
                                    onChange={(e) => setSelectedAngle(e.target.value || null)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                >
                                    <option value="">Select Angle...</option>
                                    {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setActiveQuickAdd('angles')}
                                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border hover:bg-zinc-200"
                                >+</button>
                            </div>
                        </div>

                        {/* Awareness Level Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    Awareness Level
                                    <AwarenessTooltip />
                                </div>
                                <button
                                    onClick={generateAwarenessReason}
                                    disabled={isGeneratingAwareness}
                                    className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                                    title="Generate based on transcript"
                                >
                                    {isGeneratingAwareness ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <span>✨ AI Analyze</span>
                                    )}
                                </button>
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedAwareness || ""}
                                    onChange={(e) => setSelectedAwareness(e.target.value || null)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                                >
                                    <option value="">Select Awareness Level...</option>
                                    {awarenessLevels.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setActiveQuickAdd('awareness-levels')}
                                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border hover:bg-zinc-200"
                                >+</button>
                            </div>
                        </div>

                    </div>

                    {/* Demographic (Gender & Age) */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Gender</label>
                            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                <option value="">Select...</option>
                                {["Male", "Female"].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Age Group</label>
                            <select value={selectedAge} onChange={e => setSelectedAge(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                <option value="">Select...</option>
                                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Render Modal */}
                    <QuickAddModal
                        type={activeQuickAdd}
                        isOpen={!!activeQuickAdd}
                        onClose={() => setActiveQuickAdd(null)}
                        onSave={async (data) => {
                            let id;
                            if (activeQuickAdd === 'formats') id = await createTag('formats', data, setFormats, formats);
                            else if (activeQuickAdd === 'hooks') id = await createTag('hooks', data, setHooks, hooks);
                            else if (activeQuickAdd === 'themes') id = await createTag('themes', data, setThemes, themes);
                            else if (activeQuickAdd === 'desires') id = await createTag('desires', data, setDesires, desires);
                            else if (activeQuickAdd === 'angles') id = await createTag('angles', data, setAngles, angles);
                            else if (activeQuickAdd === 'awareness-levels') id = await createTag('awareness-levels', data, setAwarenessLevels, awarenessLevels);

                            if (id) {
                                if (activeQuickAdd === 'formats') setSelectedFormat(id);
                                else if (activeQuickAdd === 'hooks') setSelectedHook(id);
                                else if (activeQuickAdd === 'themes') setSelectedTheme(id);
                                else if (activeQuickAdd === 'desires') setSelectedDesire(id);
                                else if (activeQuickAdd === 'angles') setSelectedAngle(id);
                                else if (activeQuickAdd === 'awareness-levels') setSelectedAwareness(id);
                            }
                        }}
                        themes={themes}
                        desires={desires}
                        demographics={demographics}
                        awarenessLevels={awarenessLevels}
                    />


                    {/* Main Messaging */}
                    <div className="mb-2">
                        <MessagingAnalysisToolbox
                            value={mainMessaging}
                            onChange={setMainMessaging}
                        />
                    </div>

                    {/* Why it works */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Why do you think this ad works?</label>
                        <textarea
                            value={whyItWorks}
                            onChange={(e) => setWhyItWorks(e.target.value)}
                            placeholder="Explain your thoughts..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[80px]"
                        />
                    </div>

                    {/* Other Notes */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="showNotesDetails"
                                checked={showNotesField}
                                onChange={(e) => setShowNotesField(e.target.checked)}
                                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="showNotesDetails" className="text-xs font-medium text-zinc-500 select-none cursor-pointer">
                                Other Notes
                            </label>
                        </div>
                        {showNotesField && (
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes here..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[80px]"
                            />
                        )}
                    </div>

                    <button
                        onClick={saveDetails}
                        disabled={isSavingNotes}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        {isSavingNotes ? "Saving..." : "Save Analysis"}
                    </button>
                </div>
            </div>

            {/* Right Column: Metrics Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
                    Virality History
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                fontSize={12}
                                tickMargin={10}
                            />
                            <YAxis
                                stroke="#6B7280"
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#F3F4F6",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="likes"
                                stroke="#6366F1" // Indigo
                                strokeWidth={2}
                                dot={false}
                                name="Likes"
                            />
                            <Line
                                type="monotone"
                                dataKey="comments"
                                stroke="#EC4899" // Pink
                                strokeWidth={2}
                                dot={false}
                                name="Comments"
                            />
                            <Line
                                type="monotone"
                                dataKey="shares"
                                stroke="#10B981" // Emerald
                                strokeWidth={2}
                                dot={false}
                                name="Shares"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
