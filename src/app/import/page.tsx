"use client";

import { useState } from "react";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [importName, setImportName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            // Auto-suggest name based on filename if name is empty
            if (!importName) {
                const filename = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
                setImportName(filename);
            }
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsLoading(true);
        setMessage("");

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
                setMessage(`Success! ${data.message}`);
                setFile(null);
                setImportName("");
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setMessage("Failed to import.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Import AdSpy HTML</h1>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Import Name (Batch)
                    </label>
                    <input
                        type="text"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="e.g. AdSpy Export Nov 25"
                        className="block w-full text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Upload HTML File
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-500">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                </svg>
                                <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">HTML files only</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" accept=".html,.htm" onChange={handleFileChange} />
                        </label>
                    </div>
                    {file && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Selected: {file.name}</p>
                    )}
                </div>

                <button
                    onClick={handleImport}
                    disabled={isLoading || !file}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                    {isLoading ? "Importing..." : "Import Ad"}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith("Success") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
                    {message}
                </div>
            )}

            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Danger Zone</h2>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Reset Database</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                        This action will permanently delete all ads, snapshots, and import history. This cannot be undone.
                    </p>
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you absolutely sure you want to delete all data? This action cannot be undone.")) {
                                try {
                                    const res = await fetch("/api/reset-db", { method: "POST" });
                                    if (res.ok) {
                                        alert("Database reset successfully.");
                                        window.location.reload();
                                    } else {
                                        alert("Failed to reset database.");
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert("An error occurred.");
                                }
                            }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Reset Database
                    </button>
                </div>
            </div>
        </div>
    );
}
