"use client";

import { useState, useEffect } from "react";

interface Angle { id: string; name: string; }
interface Theme { id: string; name: string; }
interface Demographic { id: string; name: string; }

interface CreativeConcept {
    id: string;
    name: string;
    angle: Angle;
    theme: Theme;
    demographic: Demographic;
}

export default function ConceptsPage() {
    const [concepts, setConcepts] = useState<CreativeConcept[]>([]);

    // Dropdown Data
    const [angles, setAngles] = useState<Angle[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [demographics, setDemographics] = useState<Demographic[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [selectedAngle, setSelectedAngle] = useState<string>("");
    const [selectedTheme, setSelectedTheme] = useState<string>("");
    const [selectedDemographic, setSelectedDemographic] = useState<string>("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [anglesRes, themesRes, demographicsRes, conceptsRes] = await Promise.all([
                fetch('/api/angles'),
                fetch('/api/themes'),
                fetch('/api/demographics'),
                fetch('/api/concepts')
            ]);

            setAngles(await anglesRes.json());
            setThemes(await themesRes.json());
            setDemographics(await demographicsRes.json());
            setConcepts(await conceptsRes.json());
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDemographic = async () => {
        const name = prompt("Enter new Demographic name:");
        if (!name) return;

        try {
            const res = await fetch('/api/demographics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const newDemographic = await res.json();
                setDemographics([...demographics, newDemographic]);
                setSelectedDemographic(newDemographic.id);
            }
        } catch (error) {
            console.error("Failed to create demographic", error);
        }
    };

    const handleCreateConcept = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    demographicId: selectedDemographic
                })
            });

            if (res.ok) {
                const newConcept = await res.json();
                setConcepts([newConcept, ...concepts]);
                // Reset form
                setSelectedAngle("");
                setSelectedTheme("");
                setSelectedDemographic("");
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
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Creative Concepts</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Define your winning concepts by combining an Angle, a Theme, and a Demographic.
                </p>
            </div>

            {/* Concept Creator Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">New Concept Matrix</h2>
                <form onSubmit={handleCreateConcept} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                    {/* Angle */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Angle</label>
                        <select
                            value={selectedAngle}
                            onChange={(e) => setSelectedAngle(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Angle...</option>
                            {angles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    {/* Theme */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Theme</label>
                        <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Theme...</option>
                            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Demographic */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                            Demographic
                            <button
                                type="button"
                                onClick={handleCreateDemographic}
                                className="text-indigo-600 hover:text-indigo-500 text-[10px]"
                            >
                                + New
                            </button>
                        </label>
                        <select
                            value={selectedDemographic}
                            onChange={(e) => setSelectedDemographic(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Demographic...</option>
                            {demographics.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Concept Name (ID)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Angle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Theme</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Demographic</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {concepts.map((concept) => (
                                <tr key={concept.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">{concept.name}</div>
                                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{concept.id.split('-')[0]}...</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                            {concept.angle.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800">
                                            {concept.theme.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                            {concept.demographic.name}
                                        </span>
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                        No concepts defined yet. Use the matrix above to create your first concept.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
