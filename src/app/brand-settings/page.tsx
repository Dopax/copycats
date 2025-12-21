"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

// Brand Interface
interface Brand {
    id: string;
    name: string;
    googleEmail?: string | null;
    breakEvenRoas?: number | string;
}

export default function BrandSettingsPage() {
    const { selectedBrand, setSelectedBrand } = useBrand();
    const [isLoading, setIsLoading] = useState(false);
    const [brandData, setBrandData] = useState<Brand | null>(null);

    // Edit State for General Settings
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({
        breakEvenRoas: "1.00"
    });

    // Import State
    const [file, setFile] = useState<File | null>(null);
    const [importName, setImportName] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");

    useEffect(() => {
        if (selectedBrand) {
            fetchBrandDetails();
        }
    }, [selectedBrand]);

    const fetchBrandDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/brands/${selectedBrand?.id}`);
            if (res.ok) {
                const data = await res.json();
                setBrandData(data);
                setFormState({
                    breakEvenRoas: data.breakEvenRoas ? data.breakEvenRoas.toString() : "1.00"
                });
            }
        } catch (error) {
            console.error("Failed to load brand settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveGeneral = async () => {
        try {
            const res = await fetch(`/api/brands/${selectedBrand?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formState)
            });
            if (res.ok) {
                const updated = await res.json();
                setBrandData(prev => prev ? { ...prev, ...updated } : updated);
                setSelectedBrand({ ...selectedBrand, ...updated });
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update brand", error);
        }
    };

    // --- Import Logic ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!importName) {
                const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
                setImportName(filename);
            }
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsImporting(true);
        setImportMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("importName", importName);

            const res = await fetch("/api/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setImportMessage(`Success! ${data.message}`);
                setFile(null);
                setImportName("");
            } else {
                setImportMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setImportMessage("Failed to import.");
        } finally {
            setIsImporting(false);
        }
    };

    if (!selectedBrand) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-zinc-500">
                    Please select a brand to manage settings.
                </div>
            </div>
        );
    }

    if (isLoading && !brandData) {
        return (<div className="p-8 text-center text-zinc-500">Loading Settings...</div>);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 p-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Brand Settings</h1>
                <p className="text-zinc-500 mt-1">Configure integrations, benchmarks, and data management for {brandData?.name}.</p>
            </div>

            {/* 1. Integrations Section */}
            <section>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Integrations
                </h2>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-8 h-8 text-zinc-600 dark:text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.01 1.485c2.082 0 3.754.02 5.443.252 4.23.584 6.78 3.553 7.02 7.82.02.327.028.66.028.986 0 4.135-.015 8.27-.087 12.404-.006.335-.07.47-.417.466-2.584-.03-5.168-.016-7.753-.016-.275 0-.39-.078-.396-.367-.024-1.226-.006-2.453-.02-3.68-.003-.227.062-.303.284-.303 1.346.003 2.693-.006 4.04.01.697.01 1.096-.28 1.134-1.002.046-.874.01-1.75.01-2.628v-1.6c0-.28-.08-.4-.366-.41-1.896-.062-3.794-.03-5.69-.036-.318-.002-.455.087-.46 0.42-.012 1.066-.002 2.134-.01 3.2-.003.328.093.454.436.452.88-.006 1.76.01 2.64-.01.27-.006.377.086.375.362-.006.87-.004 1.74-.004 2.608 0 .285-.098.393-.388.395-2.576.012-5.152.003-7.728.006-.328 0-.443-.095-.443-.44.004-3.67.012-7.34-.02-11.008-.005-.623.235-1.07.82-1.28.318-.114.654-.15.986-.17 2.766-.176 5.536-.182 8.303.01.597.042 1.05.343 1.25.92.17.494.12 1.006-.15 1.48-.22.385-.56.592-.99.646-1.742.22-3.493.18-5.244.184-.282 0-.395-.084-.4-.364-.01-1.343.003-2.686-.014-4.03-.008-.65.297-1.065.918-1.206.34-.077.697-.1 1.047-.102 2.138-.012 4.276-.003 6.414-.003.26 0 .373.076.375.347.006 1.06.002 2.12.01 3.18.002.268-.073.364-.344.363-2.584-.006-5.168.007-7.752-.016-.35-.004-.423.11-.42.417.02 2.21.02 4.418.024 6.627v5.524c0 .356.096.474.457.472 2.44-.01 4.88-.004 7.32-.008.31 0 .428-.106.425-.43-.02-1.92.01-3.84-.024-5.76-.013-.71.36-1.163 1.02-1.29.624-.12 1.157.19 1.353.784.06.18.077.373.085.56.04 3.79-.02 7.58.077 11.37.037 1.408-1.127 2.6-2.52 2.72-2.106.182-4.225.215-6.336.215-2.684 0-5.367.043-8.05-.02-1.18-.028-2.12-.663-2.59-1.67-.175-.373-.243-.787-.247-1.2-.027-3.957-.023-7.915-.008-11.872.008-1.956.056-3.913.31-5.856.362-2.76 2.38-4.708 5.12-5.068 1.58-.208 3.183-.246 4.776-.246z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-white">Google Drive</h3>
                                <p className="text-sm text-zinc-500 mb-2">Connect to store creative assets and allow creators to upload files.</p>
                                {brandData?.googleEmail ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        Connected: {brandData.googleEmail}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded w-fit">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                                        Not Connected
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = `/api/auth/google/signin?brandId=${selectedBrand!.id}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${brandData?.googleEmail
                                ? "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-indigo-400 dark:hover:bg-zinc-700"
                                }`}
                        >
                            {brandData?.googleEmail ? "Reconnect" : "Connect"}
                        </button>
                    </div>
                </div>
            </section>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* 2. General Settings Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        General Configuration
                    </h2>
                    <button
                        onClick={() => isEditing ? handleSaveGeneral() : setIsEditing(true)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isEditing
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            }`}
                    >
                        {isEditing ? "Save Changes" : "Edit Config"}
                    </button>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Break-Even ROAS</label>
                            <div className="flex items-center gap-4">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-32 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. 1.0"
                                        value={formState.breakEvenRoas}
                                        onChange={e => setFormState({ ...formState, breakEvenRoas: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-xl font-mono font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 inline-block">
                                        {formState.breakEvenRoas || "1.00"}
                                    </div>
                                )}
                                <p className="text-sm text-zinc-500 flex-1">
                                    Ads with ROAS above this value will be highlighted in green across the dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* 3. Data Management Section */}
            <section>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    Data Management
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Import */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Import AdSpy Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Batch Name</label>
                                <input
                                    type="text"
                                    value={importName}
                                    onChange={(e) => setImportName(e.target.value)}
                                    placeholder="e.g. AdSpy Export November"
                                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2"
                                />
                            </div>

                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-6 h-6 mb-2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <p className="text-xs text-zinc-500">{file ? file.name : "Click to upload HTML"}</p>
                                </div>
                                <input type="file" className="hidden" accept=".html,.htm" onChange={handleFileChange} />
                            </label>

                            {importMessage && (
                                <div className={`text-xs p-2 rounded ${importMessage.startsWith("Success") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                    {importMessage}
                                </div>
                            )}

                            <button
                                onClick={handleImport}
                                disabled={isImporting || !file}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {isImporting ? "Importing..." : "Process Import"}
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
                        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Danger Zone</h3>
                        <p className="text-sm text-red-800 dark:text-red-400 mb-6">
                            Actions here can cause permanent data loss. Proceed with caution.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={async () => {
                                    if (window.confirm("Are you absolutely sure you want to delete ALL application data? This action cannot be undone.")) {
                                        try {
                                            const res = await fetch("/api/reset-db", { method: "POST" });
                                            if (res.ok) {
                                                alert("Database reset successfully.");
                                                window.location.reload();
                                            } else {
                                                alert("Failed to reset database.");
                                            }
                                        } catch (e) {
                                            alert("An error occurred.");
                                        }
                                    }
                                }}
                                className="w-full px-4 py-2 bg-white dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                            >
                                Reset Database
                            </button>
                            <p className="text-xs text-red-600/70 text-center">
                                Deletes all batches, creators, ads, and assets.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
