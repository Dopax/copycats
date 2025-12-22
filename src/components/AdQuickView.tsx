import { useState, useEffect } from "react";
import { Ad, AdSnapshot } from "@prisma/client";
import Link from "next/link";

interface AdFormat { id: string; name: string; }
interface AdHook { id: string; name: string; }
interface AdTheme { id: string; name: string; }
interface AdAngle { id: string; name: string; }
interface AdAwarenessLevel { id: string; name: string; }
interface AdDemographic { id: string; name: string; }

export interface AdWithSnapshots extends Ad {
    snapshots: AdSnapshot[];
    format?: AdFormat | null;
    hook?: AdHook | null;
    theme?: AdTheme | null;
    angle?: AdAngle | null;
    awarenessLevel?: AdAwarenessLevel | null;
    demographic?: AdDemographic | null;

}

interface AdQuickViewProps {
    ad: AdWithSnapshots;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (updatedAd: AdWithSnapshots) => void;
}

export default function AdQuickView({ ad, isOpen, onClose, onUpdate }: AdQuickViewProps) {
    const [notes, setNotes] = useState(ad.notes || "");
    const [whyItWorks, setWhyItWorks] = useState((ad as any).whyItWorks || "");
    const [mainMessaging, setMainMessaging] = useState((ad as any).mainMessaging || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isExtractingHook, setIsExtractingHook] = useState(false);

    // Tags State
    const [formats, setFormats] = useState<AdFormat[]>([]);
    const [hooks, setHooks] = useState<AdHook[]>([]);
    const [themes, setThemes] = useState<AdTheme[]>([]);
    const [angles, setAngles] = useState<AdAngle[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AdAwarenessLevel[]>([]);
    const [demographics, setDemographics] = useState<AdDemographic[]>([]);

    const [selectedFormat, setSelectedFormat] = useState<string | null>(ad.format?.id || null);
    const [selectedHook, setSelectedHook] = useState<string | null>(ad.hook?.id || null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(ad.theme?.id || null);
    const [selectedAngle, setSelectedAngle] = useState<string | null>(ad.angle?.id || null);
    const [selectedAwareness, setSelectedAwareness] = useState<string | null>(ad.awarenessLevel?.id || null);

    // Demographic State (Split for UI)
    const [selectedGender, setSelectedGender] = useState<string>("");
    const [selectedAge, setSelectedAge] = useState<string>("");

    // Transcript State
    const [transcript, setTranscript] = useState<string>((ad as any).transcript || "");
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Update local state when ad changes
    useEffect(() => {
        setNotes(ad.notes || "");
        setWhyItWorks((ad as any).whyItWorks || "");
        setMainMessaging((ad as any).mainMessaging || "");
        setTranscript((ad as any).transcript || "");
        setSelectedFormat(ad.format?.id || null);
        setSelectedHook(ad.hook?.id || null);
        setSelectedTheme(ad.theme?.id || null);
        setSelectedAngle(ad.angle?.id || null);
        setSelectedAwareness(ad.awarenessLevel?.id || null);

        // Parse Demographic
        if (ad.demographic?.name) {
            const parts = ad.demographic.name.split(' ');
            if (parts.length >= 2) {
                setSelectedGender(parts[0]);
                setSelectedAge(parts[1]);
            }
        } else {
            setSelectedGender("");
            setSelectedAge("");
        }
    }, [ad]);

    useEffect(() => {
        if (isOpen) {
            loadTags();
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Stop video
            const video = document.getElementById('quickview-video') as HTMLVideoElement;
            if (video) video.pause();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const loadTags = async () => {
        try {
            const [formatsRes, hooksRes, themesRes, anglesRes, awarenessRes, demosRes] = await Promise.all([
                fetch('/api/formats'),
                fetch('/api/hooks'),
                fetch('/api/themes'),
                fetch('/api/angles'),
                fetch('/api/awareness-levels'),
                fetch('/api/demographics')
            ]);
            setFormats(await formatsRes.json());
            setHooks(await hooksRes.json());
            setThemes(await themesRes.json());
            setAngles(await anglesRes.json());
            setAwarenessLevels(await awarenessRes.json());
            setDemographics(await demosRes.json());
        } catch (e) {
            console.error("Failed to load tags", e);
        }
    };

    const generateTranscript = async () => {
        if (!ad.videoUrl) return;
        setIsTranscribing(true);
        try {
            const res = await fetch(`/api/ads/${ad.id}/transcribe`, { method: 'POST' });
            if (!res.ok) throw new Error("Transcription failed");
            const data = await res.json();
            setTranscript(data.transcript);

            // Immediate update to parent
            if (onUpdate) {
                onUpdate({
                    ...ad,
                    transcript: data.transcript
                } as any);
            }
        } catch (error) {
            console.error("Transcription error:", error);
            alert("Failed to generate transcript.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const saveDetails = async () => {
        setIsSaving(true);
        try {
            // Save Notes & Transcript
            await fetch(`/api/ads/${ad.id}/note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes, whyItWorks, mainMessaging, transcript }),
            });

            // Save Tags
            // Calculate Demographic ID
            const demoName = (selectedGender && selectedAge) ? `${selectedGender} ${selectedAge}` : null;
            const demographicId = demoName ? demographics.find(d => d.name === demoName)?.id : null;

            await fetch(`/api/ads/${ad.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formatId: selectedFormat,
                    hookId: selectedHook,
                    themeId: selectedTheme,
                    angleId: selectedAngle,
                    awarenessLevelId: selectedAwareness,
                    demographicId
                }),
            });

            if (onUpdate) {
                // Update parent with ALL modified fields to keep UI in sync
                onUpdate({
                    ...ad,
                    notes,
                    whyItWorks,
                    mainMessaging,
                    transcript,
                    format: formats.find(f => f.id === selectedFormat) || null,
                    hook: hooks.find(h => h.id === selectedHook) || null,
                    theme: themes.find(t => t.id === selectedTheme) || null,
                    angle: angles.find(a => a.id === selectedAngle) || null,
                    awarenessLevel: awarenessLevels.find(a => a.id === selectedAwareness) || null,
                    demographic: (selectedGender && selectedAge) ? { id: 'temp', name: `${selectedGender} ${selectedAge}` } : null, // Optimistic update
                } as any);
            }
        } catch (error) {
            console.error("Failed to save details:", error);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper creators
    const createTag = async (endpoint: string, name: string, setter: Function, currentList: any[], selector: Function) => {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newTag = await res.json();
            setter([...currentList, newTag]);
            selector(newTag.id);
        } catch (e) {
            console.error(`Failed to create tag at ${endpoint}`, e);
        }
    };

    const extractHook = async () => {
        if (!ad.videoUrl) return;
        const name = prompt("Enter a name for this video hook:", `Hook from ${ad.brand || 'Ad'}`);
        if (!name) return;

        setIsExtractingHook(true);
        try {
            const res = await fetch('/api/hooks/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: ad.videoUrl, name, brandId: (ad as any).brandId })
            });
            if (res.ok) {
                const newHook = await res.json();
                setHooks([...hooks, newHook]);
                setSelectedHook(newHook.id);
            } else {
                alert("Failed to extract hook");
            }
        } finally {
            setIsExtractingHook(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header (Top Bar) */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900 flex-shrink-0">
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Quick View</h2>
                        <p className="text-xs text-zinc-500">{ad.brand} - {ad.headline || 'Ad Details'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Main Content Area (Split Grid) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden min-h-0">

                    {/* Left Column: Details (Scrollable) */}
                    <div className="flex flex-col h-full overflow-hidden border-r border-zinc-200 dark:border-zinc-800 min-h-0 bg-white dark:bg-zinc-900">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">

                            {/* Links & Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href={`/batches?create=true&refAdId=${ad.id}&refAdPostId=${ad.postId}`}
                                    className="col-span-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-center text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                    Create Copycat Batch
                                </Link>
                                <Link
                                    href={`/ads/${ad.id}`}
                                    className="py-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-center text-sm font-semibold hover:bg-indigo-100 transition-colors"
                                >
                                    Full Details
                                </Link>
                                {ad.facebookLink ? (
                                    <a
                                        href={ad.facebookLink}
                                        target="_blank"
                                        className="py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-semibold"
                                        title="View on Facebook"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        Facebook
                                    </a>
                                ) : (
                                    <div className="py-2 bg-zinc-50 text-zinc-400 rounded-lg flex items-center justify-center text-sm cursor-not-allowed">
                                        No Link
                                    </div>
                                )}
                            </div>

                            {/* Analysis Form */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-zinc-900 dark:text-white pb-2 border-b border-zinc-100 dark:border-zinc-800">Analysis Tags</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Format */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Format</label>
                                        <div className="flex gap-2">
                                            <select value={selectedFormat || ""} onChange={e => setSelectedFormat(e.target.value || null)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select Format...</option>
                                                {formats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                            <button onClick={() => { const n = prompt("New Format:"); if (n) createTag('/api/formats', n, setFormats, formats, setSelectedFormat); }} className="px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200">+</button>
                                        </div>
                                    </div>

                                    {/* Hook */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Hook</label>
                                        <div className="flex gap-2">
                                            <select value={selectedHook || ""} onChange={e => setSelectedHook(e.target.value || null)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select Hook...</option>
                                                {hooks.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                            </select>
                                            {ad.videoUrl && (
                                                <button onClick={extractHook} disabled={isExtractingHook} className="px-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-xs font-bold disabled:opacity-50" title="Extract as new hook">
                                                    {isExtractingHook ? '...' : 'Ext'}
                                                </button>
                                            )}
                                            <button onClick={() => { const n = prompt("New Hook:"); if (n) createTag('/api/hooks', n, setHooks, hooks, setSelectedHook); }} className="px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200">+</button>
                                        </div>
                                    </div>

                                    {/* Theme */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Theme</label>
                                        <div className="flex gap-2">
                                            <select value={selectedTheme || ""} onChange={e => setSelectedTheme(e.target.value || null)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select Theme...</option>
                                                {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => { const n = prompt("New Theme:"); if (n) createTag('/api/themes', n, setThemes, themes, setSelectedTheme); }} className="px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200">+</button>
                                        </div>
                                    </div>

                                    {/* Angle */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Angle</label>
                                        <div className="flex gap-2">
                                            <select value={selectedAngle || ""} onChange={e => setSelectedAngle(e.target.value || null)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select Angle...</option>
                                                {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                            <button onClick={() => { const n = prompt("New Angle:"); if (n) createTag('/api/angles', n, setAngles, angles, setSelectedAngle); }} className="px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200">+</button>
                                        </div>
                                    </div>

                                    {/* Awareness Level */}
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Awareness Level</label>
                                        <div className="flex gap-2">
                                            <select value={selectedAwareness || ""} onChange={e => setSelectedAwareness(e.target.value || null)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select Awareness...</option>
                                                {awarenessLevels.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Demographic (Gender & Age) */}
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Gender</label>
                                            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select...</option>
                                                {["Male", "Female"].map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Age Group</label>
                                            <select value={selectedAge} onChange={e => setSelectedAge(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm">
                                                <option value="">Select...</option>
                                                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-zinc-900 dark:text-white pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">Transcript</h3>
                                <div>
                                    {(!transcript && !isTranscribing) ? (
                                        <button
                                            onClick={generateTranscript}
                                            disabled={isTranscribing || !ad.videoUrl}
                                            className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isTranscribing ? (
                                                <>
                                                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    <span className="text-sm font-medium">Generating Transcript...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                    <span className="text-sm font-medium">Generate Video Transcript</span>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="relative">
                                            {isTranscribing && (
                                                <div className="absolute inset-x-0 -top-10 text-center text-xs text-indigo-500 animate-pulse font-medium">
                                                    Generating transcript...
                                                </div>
                                            )}
                                            <textarea
                                                value={transcript}
                                                onChange={(e) => setTranscript(e.target.value)}
                                                className="w-full h-48 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder={isTranscribing ? "Transcribing..." : "Transcript text..."}
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button
                                                    onClick={generateTranscript}
                                                    disabled={isTranscribing || !ad.videoUrl}
                                                    className="p-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 hover:text-indigo-600 shadow-sm"
                                                    title="Regenerate"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(transcript || ''); alert("Copied!"); }}
                                                    className="p-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 hover:text-indigo-600 shadow-sm"
                                                    title="Copy to Clipboard"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 20h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-semibold text-zinc-900 dark:text-white pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">Notes & Analysis</h3>


                                {/* Main Messaging */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Main Messaging</label>
                                    <textarea
                                        value={mainMessaging}
                                        onChange={e => setMainMessaging(e.target.value)}
                                        className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="What does my customer care about? Why should it interest the customer?"
                                    />
                                </div>

                                {/* Why it works */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Why do you think this ad works?</label>
                                    <textarea
                                        value={whyItWorks}
                                        onChange={e => setWhyItWorks(e.target.value)}
                                        className="w-full h-32 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="Analyze the hook, structure, or psychological triggers..."
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">General Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full h-24 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="Any other observations..."
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Footer (Left Column) */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 mt-auto flex-shrink-0">
                            <button
                                onClick={saveDetails}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20"
                            >
                                {isSaving ? "Saving Analysis..." : "Save Analysis"}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Video & Media */}
                    <div className="h-full bg-black flex items-center justify-center relative bg-pattern-grid border-l border-zinc-800 max-h-full overflow-hidden">
                        {ad.videoUrl ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <video
                                    id="quickview-video"
                                    src={ad.videoUrl}
                                    controls
                                    className="max-w-full max-h-full object-contain"
                                    autoPlay
                                    loop
                                    playsInline
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                <img
                                    src={ad.thumbnailUrl || ''}
                                    className="max-w-full max-h-full object-contain opacity-50"
                                />
                                <span className="mt-4">No Video Available</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
