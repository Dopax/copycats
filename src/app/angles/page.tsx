"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

interface Desire {
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

interface AdAngleData {
    id: string;
    name: string;
    desire: Desire;
    theme: Theme;
    demographic: Demographic;
    awarenessLevel?: { id: string; name: string; };
    batches: { id: number; name: string; status: string; }[];
    conceptDoc?: string;
    personaScenarios?: string;
}

function ViewDocModal({ title, content, onClose, onDelete }: { title: string, content: string, onClose: () => void, onDelete?: () => void }) {
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
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                        {onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
                                        onDelete();
                                    }
                                }}
                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 text-sm font-medium transition-colors"
                            >
                                Delete Doc
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
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
        </div>
    );
}

export default function AnglesPage() {
    const { selectedBrand, isLoading: isBrandLoading } = useBrand();
    const [angles, setAngles] = useState<AdAngleData[]>([]);

    // Dropdown Data
    const [desires, setDesires] = useState<Desire[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<{ id: string; name: string; }[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Doc Generation State
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
    const [generatingScenarioIds, setGeneratingScenarioIds] = useState<Set<string>>(new Set());

    // Doc View State
    const [viewingDoc, setViewingDoc] = useState<{ title: string; content: string; angleId?: string; type?: 'persona' | 'scenarios' } | null>(null);

    // Form State
    const [selectedDesire, setSelectedDesire] = useState<string>("");
    const [selectedTheme, setSelectedTheme] = useState<string>("");
    // const [selectedDemographic, setSelectedDemographic] = useState<string>(""); // Removed direct ID selection
    const [selectedGender, setSelectedGender] = useState<string>("");
    const [selectedAge, setSelectedAge] = useState<string>("");
    const [selectedAwarenessLevel, setSelectedAwarenessLevel] = useState<string>("");
    const [editingAngleId, setEditingAngleId] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedDesire("");
        setSelectedTheme("");
        setSelectedGender("");
        setSelectedAge("");
        setSelectedAwarenessLevel("");
        setEditingAngleId(null);
    };

    const startEditing = (angle: AdAngleData) => {
        setEditingAngleId(angle.id);
        if (angle.desire) { // Check if desire exists
            setSelectedDesire(angle.desire.id);
            setSelectedTheme(angle.theme.id);
            if (angle.demographic?.name) {
                // Heuristic to split "Female 18-24" -> Gender="Female", Age="18-24"
                // Assumes format "[Gender] [Age]"
                const parts = angle.demographic.name.trim().split(' ');
                if (parts.length >= 2) {
                    setSelectedGender(parts[0]);
                    setSelectedAge(parts.slice(1).join(' '));
                } else {
                    setSelectedGender("");
                    setSelectedAge("");
                }
            }
            setSelectedAwarenessLevel(angle.awarenessLevel?.id || "");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Modal States
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showDesireModal, setShowDesireModal] = useState(false);

    // New Item Form Data
    const [newThemeData, setNewThemeData] = useState({ name: "", description: "" });
    const [newDesireData, setNewDesireData] = useState({ name: "", category: "", description: "", brainClicks: "" });

    const handleGenerateDoc = async (id: string, type: 'persona' | 'scenarios') => {
        if (type === 'persona') setGeneratingIds(prev => new Set(prev).add(id));
        else setGeneratingScenarioIds(prev => new Set(prev).add(id));

        const endpoint = type === 'persona' ? `/api/angles/${id}/generate-doc` : `/api/angles/${id}/generate-scenarios`;

        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                setAngles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
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
            const [desiresRes, themesRes, demographicsRes, awarenessRes, anglesRes] = await Promise.all([
                fetch('/api/desires'),
                fetch('/api/themes'),
                fetch('/api/demographics'),
                fetch('/api/awareness-levels'),
                fetch(`/api/angles${query}`)
            ]);

            if (desiresRes.ok) setDesires(await desiresRes.json());
            if (themesRes.ok) setThemes(await themesRes.json());
            if (demographicsRes.ok) setDemographics(await demographicsRes.json());
            if (awarenessRes.ok) setAwarenessLevels(await awarenessRes.json());
            if (anglesRes.ok) setAngles(await anglesRes.json());
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

    const submitNewDesire = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/desires', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newDesireData.name,
                    category: newDesireData.category,
                    description: newDesireData.description,
                    brainClicks: newDesireData.brainClicks,
                    brandId: selectedBrand?.id
                })
            });
            if (res.ok) {
                const newDesire = await res.json();
                setDesires([...desires, newDesire]);
                setSelectedDesire(newDesire.id);
                setShowDesireModal(false);
                setNewDesireData({ name: "", category: "", description: "", brainClicks: "" });
            }
        } catch (error) {
            console.error("Failed to create desire", error);
        }
    };

    const handleSubmitAngle = async (e: React.FormEvent) => {
        e.preventDefault();

        // Resolve Demographic ID
        const demoName = (selectedGender && selectedAge) ? `${selectedGender} ${selectedAge}` : null;
        const selectedDemographicId = demoName ? demographics.find(d => d.name === demoName)?.id : null;

        if (!selectedDesire || !selectedTheme || !selectedDemographicId) {
            alert("Please select all three components (Desire, Theme, Demographic).");
            return;
        }

        setIsCreating(true);
        try {
            const endpoint = editingAngleId ? `/api/angles/${editingAngleId}` : '/api/angles';
            const method = editingAngleId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    desireId: selectedDesire,
                    themeId: selectedTheme,
                    demographicId: selectedDemographicId,
                    awarenessLevelId: selectedAwarenessLevel || undefined,
                    brandId: selectedBrand?.id
                })
            });

            if (res.ok) {
                // Re-fetch all angles to ensure data consistency and order
                await fetchData();
                resetForm();
            } else {
                alert(`Failed to ${editingAngleId ? 'update' : 'create'} angle.`);
            }
        } catch (error) {
            console.error(`Error ${editingAngleId ? 'updating' : 'creating'} angle:`, error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this angle?")) return;

        try {
            const res = await fetch(`/api/angles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAngles(angles.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error("Error deleting concept:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Angles</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Define your winning angles by combining a Desire, a Theme, and a Demographic.
                </p>
            </div>

            {/* Angle Creator Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{editingAngleId ? "Edit Angle" : "New Angle Matrix"}</h2>
                <form onSubmit={handleSubmitAngle} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">


                    {/* Angle */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                            Desire
                            <button
                                type="button"
                                onClick={() => setShowDesireModal(true)}
                                className="text-indigo-600 hover:text-indigo-500 text-[10px]"
                            >
                                + New
                            </button>
                        </label>
                        <select
                            value={selectedDesire}
                            onChange={(e) => setSelectedDesire(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Desire...</option>
                            {desires.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
                    <div className="flex flex-col gap-2">
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 w-full"
                        >
                            {editingAngleId ? "Update Angle" : (isCreating ? "Generating..." : "Generate Angle")}
                        </button>
                        {editingAngleId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 underline text-center"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Concepts Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Active Angles</h3>
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
                                {angles.map((angle) => (
                                    <tr key={angle.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">{angle.name}</div>
                                            <div className="text-xs text-zinc-400 font-mono mt-0.5">{angle.id.split('-')[0]}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800" title="Desire">
                                                        Desire: {angle.desire?.name || "N/A"}
                                                    </span>
                                                    {angle.desire?.brainClicks && <span className="text-[10px] text-zinc-400">🧠 {angle.desire.brainClicks}</span>}
                                                </div>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800" title="Theme">
                                                        Theme: {angle.theme?.name || "N/A"}
                                                    </span>
                                                    {angle.theme?.description && <span className="text-[10px] text-zinc-400 italic max-w-[150px] truncate">{angle.theme.description}</span>}
                                                </div>

                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800" title="Demographic">
                                                    {angle.demographic?.name || "N/A"}
                                                </span>
                                                {angle.awarenessLevel && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-100 dark:border-violet-800" title="Awareness Level">
                                                        {angle.awarenessLevel?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* Buyer Persona */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Persona</span>
                                                    {angle.conceptDoc ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <button
                                                                onClick={() => setViewingDoc({ title: "Buyer Persona", content: angle.conceptDoc!, angleId: angle.id, type: 'persona' })}
                                                                className="text-xs text-indigo-600 hover:text-indigo-900 underline font-medium"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerateDoc(angle.id, 'persona')}
                                                            disabled={generatingIds.has(angle.id)}
                                                            className="text-[10px] text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-200"
                                                        >
                                                            {generatingIds.has(angle.id) ? "Generating..." : "Generate"}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Scenarios */}
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scenarios</span>
                                                    {angle.personaScenarios ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <button
                                                                onClick={() => setViewingDoc({ title: "Persona Scenarios", content: angle.personaScenarios!, angleId: angle.id, type: 'scenarios' })}
                                                                className="text-xs text-indigo-600 hover:text-indigo-900 underline font-medium"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerateDoc(angle.id, 'scenarios')}
                                                            disabled={generatingIds.has(angle.id)}
                                                            className="text-[10px] text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-200"
                                                        >
                                                            {generatingIds.has(angle.id) ? "Generating..." : "Generate"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {angle.batches && angle.batches.length > 0 ? (
                                                    angle.batches.map(batch => (
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
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => startEditing(angle)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(angle.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {angles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                            No angles defined yet. Use the matrix above to create your first angle.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Doc View Modal */}
            {viewingDoc && (
                <ViewDocModal
                    title={viewingDoc.title}
                    content={viewingDoc.content}
                    onClose={() => setViewingDoc(null)}
                    onDelete={async () => {
                        if (viewingDoc.angleId) {
                            try {
                                const body: any = {};
                                // Set the specific field to null
                                if (viewingDoc.type === 'persona') body.conceptDoc = null;
                                if (viewingDoc.type === 'scenarios') body.personaScenarios = null;

                                const res = await fetch(`/api/angles/${viewingDoc.angleId}/update-doc`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body)
                                });

                                if (res.ok) {
                                    const updated = await res.json();
                                    setAngles(prev => prev.map(a => a.id === viewingDoc.angleId ? updated : a));
                                    setViewingDoc(null);
                                } else {
                                    alert("Failed to delete document.");
                                }
                            } catch (error) {
                                console.error("Failed to delete/update doc:", error);
                                alert("An error occurred.");
                            }
                        }
                    }}
                />
            )}

            {/* Theme Modal */}
            {showThemeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Create New Theme</h3>
                        <form onSubmit={submitNewTheme} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Theme Name</label>
                                <input
                                    type="text"
                                    value={newThemeData.name}
                                    onChange={e => setNewThemeData({ ...newThemeData, name: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Description</label>
                                <textarea
                                    value={newThemeData.description}
                                    onChange={e => setNewThemeData({ ...newThemeData, description: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowThemeModal(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Desire Modal */}
            {showDesireModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Create New Desire</h3>
                        <form onSubmit={submitNewDesire} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Desire Name</label>
                                <input
                                    type="text"
                                    value={newDesireData.name}
                                    onChange={e => setNewDesireData({ ...newDesireData, name: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Category</label>
                                <input
                                    type="text"
                                    value={newDesireData.category}
                                    onChange={e => setNewDesireData({ ...newDesireData, category: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    placeholder="e.g. Benefit, Fear..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Description</label>
                                <textarea
                                    value={newDesireData.description}
                                    onChange={e => setNewDesireData({ ...newDesireData, description: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Brain Clicks</label>
                                <input
                                    type="text"
                                    value={newDesireData.brainClicks}
                                    onChange={e => setNewDesireData({ ...newDesireData, brainClicks: e.target.value })}
                                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 dark:text-white"
                                    placeholder="e.g. 'Status, money'"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowDesireModal(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}
