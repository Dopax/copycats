"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

interface Angle {
    id: string;
    name: string;
    category?: string;
    description?: string;
    brainClicks?: string;
}

interface Theme {
    id: string;
    name: string;
    description?: string;
}

interface Demographic { id: string; name: string; }

interface CreativeConcept {
    id: string;
    name: string;
    angle: Angle;
    theme: Theme;
    demographic: Demographic;
    awarenessLevel?: { id: string; name: string; };
    batches: { id: number; name: string; status: string; }[];
    conceptDoc?: string;
    personaScenarios?: string;
}

function ViewDocModal({ title, content, onClose }: { title: string, content: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg dark:text-white">{title}</h3>
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

export default function ConceptsPage() {
    const { selectedBrand, isLoading: isBrandLoading } = useBrand();
    const [concepts, setConcepts] = useState<CreativeConcept[]>([]);

    // Dropdown Data
    const [angles, setAngles] = useState<Angle[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<{ id: string; name: string; }[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Doc Generation State
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
    const [generatingScenarioIds, setGeneratingScenarioIds] = useState<Set<string>>(new Set());

    // Doc View State
    const [viewingDoc, setViewingDoc] = useState<{ title: string, content: string } | null>(null);

    // Form State
    const [selectedAngle, setSelectedAngle] = useState<string>("");
    const [selectedTheme, setSelectedTheme] = useState<string>("");
    // const [selectedDemographic, setSelectedDemographic] = useState<string>(""); // Removed direct ID selection
    const [selectedGender, setSelectedGender] = useState<string>("");
    const [selectedAge, setSelectedAge] = useState<string>("");
    const [selectedAwarenessLevel, setSelectedAwarenessLevel] = useState<string>("");

    // Modal States
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showAngleModal, setShowAngleModal] = useState(false);

    // New Item Form Data
    const [newThemeData, setNewThemeData] = useState({ name: "", description: "" });
    const [newAngleData, setNewAngleData] = useState({ name: "", category: "", description: "", brainClicks: "" });

    const handleGenerateDoc = async (id: string, type: 'persona' | 'scenarios') => {
        if (type === 'persona') setGeneratingIds(prev => new Set(prev).add(id));
        else setGeneratingScenarioIds(prev => new Set(prev).add(id));

        const endpoint = type === 'persona' ? `/api/concepts/${id}/generate-doc` : `/api/concepts/${id}/generate-scenarios`;

        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                setConcepts(prev => prev.map(c => c.id === id ? updated : c));
            } else {
                const err = await res.json();
                console.error("Geneartion error response:", err);
                alert(`Failed to generate ${type}: ${err.details || err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Failed to generate ${type}`, error);
            alert(`Error creating ${type}.`);
        } finally {
            if (type === 'persona') {
                setGeneratingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } else {
                setGeneratingScenarioIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }
    };

    useEffect(() => {
        if (!isBrandLoading) {
            fetchData();
        }
    }, [selectedBrand, isBrandLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const query = selectedBrand ? `?brandId=${selectedBrand.id}` : '';
            const [anglesRes, themesRes, demographicsRes, awarenessRes, conceptsRes] = await Promise.all([
                fetch('/api/angles'),
                fetch('/api/themes'),
                fetch('/api/demographics'),
                fetch('/api/awareness-levels'),
                fetch(`/api/concepts${query}`)
            ]);

            if (anglesRes.ok) setAngles(await anglesRes.json());
            if (themesRes.ok) setThemes(await themesRes.json());
            if (demographicsRes.ok) setDemographics(await demographicsRes.json());
            if (awarenessRes.ok) setAwarenessLevels(await awarenessRes.json());
            if (conceptsRes.ok) setConcepts(await conceptsRes.json());
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Removed handleCreateDemographic as per user request (Not editable)

    const handleCreateAwarenessLevel = async () => {
        const name = prompt("Enter new Awareness Level name:");
        if (!name) return;

        try {
            const res = await fetch('/api/awareness-levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const newLvl = await res.json();
                setAwarenessLevels([...awarenessLevels, newLvl]);
                setSelectedAwarenessLevel(newLvl.id);
            }
        } catch (error) {
            console.error("Failed to create awareness level", error);
        }
    };

    const submitNewTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newThemeData.name,
                    description: newThemeData.description,
                    brandId: selectedBrand?.id
                })
            });
            if (res.ok) {
                const newTheme = await res.json();
                setThemes([...themes, newTheme]);
                setSelectedTheme(newTheme.id);
                setShowThemeModal(false);
                setNewThemeData({ name: "", description: "" });
            }
        } catch (error) {
            console.error("Failed to create theme", error);
        }
    };

    const submitNewAngle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAngleData.name,
                    category: newAngleData.category,
                    description: newAngleData.description,
                    brainClicks: newAngleData.brainClicks,
                    brandId: selectedBrand?.id
                })
            });
            if (res.ok) {
                const newAngle = await res.json();
                setAngles([...angles, newAngle]);
                setSelectedAngle(newAngle.id);
                setShowAngleModal(false);
                setNewAngleData({ name: "", category: "", description: "", brainClicks: "" });
            }
        } catch (error) {
            console.error("Failed to create angle", error);
        }
    };

    const handleCreateConcept = async (e: React.FormEvent) => {
        e.preventDefault();

        // Resolve Demographic ID
        const demoName = (selectedGender && selectedAge) ? `${selectedGender} ${selectedAge}` : null;
        const selectedDemographic = demoName ? demographics.find(d => d.name === demoName)?.id : null;

        if (!selectedAngle || !selectedTheme || !selectedDemographic) {
            alert("Please select all three components (Angle, Theme, Demographic).");
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch('/api/concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    angleId: selectedAngle,
                    themeId: selectedTheme,
                    demographicId: selectedDemographic,
                    awarenessLevelId: selectedAwarenessLevel || undefined,
                    brandId: selectedBrand?.id
                })
            });

            if (res.ok) {
                const newConcept = await res.json();
                setConcepts([newConcept, ...concepts]);
                // Reset form
                // Reset form
                setSelectedAngle("");
                setSelectedTheme("");
                setSelectedGender("");
                setSelectedAge("");
                setSelectedAwarenessLevel("");
            } else {
                alert("Failed to create concept.");
            }
        } catch (error) {
            console.error("Error creating concept:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this concept?")) return;

        try {
            const res = await fetch(`/api/concepts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConcepts(concepts.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Error deleting concept:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Creative Concepts</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Define your winning concepts by combining an Angle, a Theme, and a Demographic.
                </p>
            </div>

            {/* Concept Creator Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">New Concept Matrix</h2>
                <form onSubmit={handleCreateConcept} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">


                    {/* Angle */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                            Angle
                            <button
                                type="button"
                                onClick={() => setShowAngleModal(true)}
                                className="text-indigo-600 hover:text-indigo-500 text-[10px]"
                            >
                                + New
                            </button>
                        </label>
                        <select
                            value={selectedAngle}
                            onChange={(e) => setSelectedAngle(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Angle...</option>
                            {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    {/* Demographic */}
                    <div className="space-y-1 col-span-1 md:col-span-2 grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1 block">Gender</label>
                            <select
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select...</option>
                                {["Male", "Female"].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1 block">Age Group</label>
                            <select
                                value={selectedAge}
                                onChange={(e) => setSelectedAge(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select...</option>
                                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                            Theme
                            <button
                                type="button"
                                onClick={() => setShowThemeModal(true)}
                                className="text-indigo-600 hover:text-indigo-500 text-[10px]"
                            >
                                + New
                            </button>
                        </label>
                        <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Theme...</option>
                            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Awareness Level */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                            Awareness
                        </label>
                        <select
                            value={selectedAwarenessLevel}
                            onChange={(e) => setSelectedAwarenessLevel(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Awareness...</option>
                            {awarenessLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        {isCreating ? "Generating..." : "Generate Concept"}
                    </button>
                </form>
            </div>

            {/* Concepts Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Active Concepts</h3>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-zinc-500">Loading concepts...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Concept Name (ID)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Matrix</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Persona & Scenarios</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Batches</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {concepts.map((concept) => (
                                    <tr key={concept.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">{concept.name}</div>
                                            <div className="text-xs text-zinc-400 font-mono mt-0.5">{concept.id.split('-')[0]}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800" title="Angle">
                                                        Angle: {concept.angle.name}
                                                    </span>
                                                    {concept.angle.brainClicks && <span className="text-[10px] text-zinc-400">🧠 {concept.angle.brainClicks}</span>}
                                                </div>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800" title="Theme">
                                                        Theme: {concept.theme.name}
                                                    </span>
                                                    {concept.theme.description && <span className="text-[10px] text-zinc-400 italic max-w-[150px] truncate">{concept.theme.description}</span>}
                                                </div>

                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800" title="Demographic">
                                                    {concept.demographic.name}
                                                </span>
                                                {concept.awarenessLevel && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-100 dark:border-violet-800" title="Awareness Level">
                                                        {concept.awarenessLevel.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* Buyer Persona */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Persona</span>
                                                    {concept.conceptDoc ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <button
                                                                onClick={() => setViewingDoc({ title: "Buyer Persona", content: concept.conceptDoc! })}
                                                                className="text-xs text-indigo-600 hover:text-indigo-900 underline font-medium"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerateDoc(concept.id, 'persona')}
                                                            disabled={generatingIds.has(concept.id)}
                                                            className="text-[10px] text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-200"
                                                        >
                                                            {generatingIds.has(concept.id) ? "Generating..." : "Generate Persona"}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Scenarios */}
                                                <div className="flex flex-col gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-4">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scenarios</span>
                                                    {concept.personaScenarios ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <button
                                                                onClick={() => setViewingDoc({ title: "Persona Scenarios", content: concept.personaScenarios! })}
                                                                className="text-xs text-indigo-600 hover:text-indigo-900 underline font-medium"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerateDoc(concept.id, 'scenarios')}
                                                            disabled={!concept.conceptDoc || generatingScenarioIds.has(concept.id)}
                                                            className="text-[10px] text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-200 disabled:opacity-50"
                                                            title={!concept.conceptDoc ? "Generate Persona first" : ""}
                                                        >
                                                            {generatingScenarioIds.has(concept.id) ? "Generating..." : "Generate Scenarios"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {concept.batches && concept.batches.length > 0 ? (
                                                    concept.batches.map(batch => (
                                                        <a key={batch.id} href={`/batches/${batch.id}`} className="text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded text-[10px] text-indigo-700 dark:text-indigo-300">BATCH{batch.id}</span>
                                                            <span className="truncate max-w-[150px]">{batch.name}</span>
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">No batches yet</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleDelete(concept.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {concepts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                            No concepts defined yet. Use the matrix above to create your first concept.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Doc View Modal */}
            {viewingDoc && <ViewDocModal title={viewingDoc.title} content={viewingDoc.content} onClose={() => setViewingDoc(null)} />}

            {/* Theme Modal */}
            {showThemeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Theme</h2>
                        <form onSubmit={submitNewTheme} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme Name</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    value={newThemeData.name}
                                    onChange={e => setNewThemeData({ ...newThemeData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    rows={3}
                                    value={newThemeData.description}
                                    onChange={e => setNewThemeData({ ...newThemeData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowThemeModal(false)}
                                    className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                >
                                    Create Theme
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Angle Modal */}
            {showAngleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Angle</h2>
                        <form onSubmit={submitNewAngle} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Angle Name</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    value={newAngleData.name}
                                    onChange={e => setNewAngleData({ ...newAngleData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    placeholder="e.g. Benefit, Fear, Logic..."
                                    value={newAngleData.category}
                                    onChange={e => setNewAngleData({ ...newAngleData, category: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    rows={3}
                                    value={newAngleData.description}
                                    onChange={e => setNewAngleData({ ...newAngleData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Brain Clicks</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 p-2.5 text-sm"
                                    placeholder="What psychological trigger does this hit?"
                                    value={newAngleData.brainClicks}
                                    onChange={e => setNewAngleData({ ...newAngleData, brainClicks: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAngleModal(false)}
                                    className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                >
                                    Create Angle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
