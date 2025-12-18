"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

// Local definition to avoid Prisma client import issues in frontend
interface Brand {
    id: string;
    name: string;
    logoUrl?: string | null;
    color?: string | null;
    color2?: string | null;
    fontUrl?: string | null;
    offerBrief?: string | null;
    googleEmail?: string | null;
}

// Extended brand type including assets
interface BrandAsset {
    id: string;
    url: string;
    name?: string;
    type: string;
}

interface ExtendedBrand extends Brand {
    assets: BrandAsset[];
}

export default function BrandAssetsPage() {
    const { selectedBrand } = useBrand();

    const [brandData, setBrandData] = useState<ExtendedBrand | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({
        logoUrl: "",
        color: "#000000",
        color2: "#ffffff",
        fontUrl: "",
        offerBrief: ""
    });

    // Asset Upload State (Mock)
    const [newAssetUrl, setNewAssetUrl] = useState("");
    const [newAssetName, setNewAssetName] = useState("");

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
                    logoUrl: data.logoUrl || "",
                    color: data.color || "#000000",
                    color2: data.color2 || "#ffffff",
                    fontUrl: data.fontUrl || "",
                    offerBrief: data.offerBrief || ""
                });
            }
        } catch (error) {
            console.error("Failed to load brand assets", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/brands/${selectedBrand?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formState)
            });
            if (res.ok) {
                const updated = await res.json();
                setBrandData(prev => prev ? { ...prev, ...updated } : updated);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update brand", error);
        }
    };

    const handleAddAsset = async () => {
        if (!newAssetUrl) return;
        try {
            const res = await fetch(`/api/brands/${selectedBrand?.id}/assets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: newAssetUrl,
                    name: newAssetName || "Untitled Asset",
                    type: "IMAGE"
                })
            });
            if (res.ok) {
                const asset = await res.json();
                setBrandData(prev => prev ? { ...prev, assets: [asset, ...prev.assets] } : null);
                setNewAssetUrl("");
                setNewAssetName("");
            }
        } catch (error) {
            console.error("Failed to add asset", error);
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!confirm("Delete this asset?")) return;
        try {
            const res = await fetch(`/api/brands/assets/${assetId}`, { method: "DELETE" });
            if (res.ok) {
                setBrandData(prev => prev ? { ...prev, assets: prev.assets.filter(a => a.id !== assetId) } : null);
            }
        } catch (error) {
            console.error("Failed to delete asset", error);
        }
    };

    if (!selectedBrand) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-zinc-500">
                    Please select a brand to manage assets.
                </div>
            </div>
        );
    }

    if (isLoading && !brandData) {
        return (<div className="p-8 text-center text-zinc-500">Loading Brand Assets...</div>);
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Brand Assets: {brandData?.name}</h1>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isEditing
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                        }`}
                >
                    {isEditing ? "Save Changes" : "Edit Details"}
                </button>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Visual Identity */}
                <div className="space-y-6">

                    {/* Google Drive Integration */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.485c2.082 0 3.754.02 5.443.252 4.23.584 6.78 3.553 7.02 7.82.02.327.028.66.028.986 0 4.135-.015 8.27-.087 12.404-.006.335-.07.47-.417.466-2.584-.03-5.168-.016-7.753-.016-.275 0-.39-.078-.396-.367-.024-1.226-.006-2.453-.02-3.68-.003-.227.062-.303.284-.303 1.346.003 2.693-.006 4.04.01.697.01 1.096-.28 1.134-1.002.046-.874.01-1.75.01-2.628v-1.6c0-.28-.08-.4-.366-.41-1.896-.062-3.794-.03-5.69-.036-.318-.002-.455.087-.46 0.42-.012 1.066-.002 2.134-.01 3.2-.003.328.093.454.436.452.88-.006 1.76.01 2.64-.01.27-.006.377.086.375.362-.006.87-.004 1.74-.004 2.608 0 .285-.098.393-.388.395-2.576.012-5.152.003-7.728.006-.328 0-.443-.095-.443-.44.004-3.67.012-7.34-.02-11.008-.005-.623.235-1.07.82-1.28.318-.114.654-.15.986-.17 2.766-.176 5.536-.182 8.303.01.597.042 1.05.343 1.25.92.17.494.12 1.006-.15 1.48-.22.385-.56.592-.99.646-1.742.22-3.493.18-5.244.184-.282 0-.395-.084-.4-.364-.01-1.343.003-2.686-.014-4.03-.008-.65.297-1.065.918-1.206.34-.077.697-.1 1.047-.102 2.138-.012 4.276-.003 6.414-.003.26 0 .373.076.375.347.006 1.06.002 2.12.01 3.18.002.268-.073.364-.344.363-2.584-.006-5.168.007-7.752-.016-.35-.004-.423.11-.42.417.02 2.21.02 4.418.024 6.627v5.524c0 .356.096.474.457.472 2.44-.01 4.88-.004 7.32-.008.31 0 .428-.106.425-.43-.02-1.92.01-3.84-.024-5.76-.013-.71.36-1.163 1.02-1.29.624-.12 1.157.19 1.353.784.06.18.077.373.085.56.04 3.79-.02 7.58.077 11.37.037 1.408-1.127 2.6-2.52 2.72-2.106.182-4.225.215-6.336.215-2.684 0-5.367.043-8.05-.02-1.18-.028-2.12-.663-2.59-1.67-.175-.373-.243-.787-.247-1.2-.027-3.957-.023-7.915-.008-11.872.008-1.956.056-3.913.31-5.856.362-2.76 2.38-4.708 5.12-5.068 1.58-.208 3.183-.246 4.776-.246z" /></svg>
                            Google Drive
                        </h2>

                        <div className="flex flex-col gap-3">
                            <div className="text-sm">
                                {brandData?.googleEmail ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
                                        <div className="font-bold flex items-center gap-1">
                                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Connected
                                        </div>
                                        <div className="text-xs mt-1 text-green-700">Storage: {brandData.googleEmail}</div>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-500 text-xs">
                                        Connect a Google Account to store this brand's assets in a dedicated Brand folder.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => window.location.href = `/api/auth/google/signin?brandId=${selectedBrand!.id}`}
                                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors border ${brandData?.googleEmail
                                    ? "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                                    : "bg-white text-indigo-600 border-zinc-200 hover:bg-indigo-50 hover:border-indigo-200"
                                    }`}
                            >
                                {brandData?.googleEmail ? "Reconnect Account" : "Connect Google Drive"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Visual Identity</h2>

                        <div className="space-y-4">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Logo</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2 mb-2"
                                        placeholder="Logo Image URL..."
                                        value={formState.logoUrl}
                                        onChange={e => setFormState({ ...formState, logoUrl: e.target.value })}
                                    />
                                ) : null}
                                <div className="h-24 w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {formState.logoUrl ? (
                                        <img src={formState.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xs text-zinc-400">No Logo</span>
                                    )}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative h-10 w-16 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                            <input
                                                type="color"
                                                disabled={!isEditing}
                                                value={formState.color}
                                                onChange={e => setFormState({ ...formState, color: e.target.value })}
                                                className="absolute -top-2 -left-2 w-[200%] h-[200%] p-0 m-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formState.color}
                                                onChange={e => setFormState({ ...formState, color: e.target.value })}
                                                className="w-24 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2 font-mono"
                                                placeholder="#000000"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono text-zinc-500">{formState.color}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative h-10 w-16 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                            <input
                                                type="color"
                                                disabled={!isEditing}
                                                value={formState.color2}
                                                onChange={e => setFormState({ ...formState, color2: e.target.value })}
                                                className="absolute -top-2 -left-2 w-[200%] h-[200%] p-0 m-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formState.color2}
                                                onChange={e => setFormState({ ...formState, color2: e.target.value })}
                                                className="w-24 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2 font-mono"
                                                placeholder="#ffffff"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono text-zinc-500">{formState.color2}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Font */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Brand Font</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-2 mb-2"
                                        placeholder="Font Image URL (e.g. screenshot of font)..."
                                        value={formState.fontUrl}
                                        onChange={e => setFormState({ ...formState, fontUrl: e.target.value })}
                                    />
                                ) : null}
                                <div className="h-16 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {formState.fontUrl ? (
                                        <img src={formState.fontUrl} alt="Font" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-zinc-400">No Font Image</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fundamental Data */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm h-full flex flex-col">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Offer Brief (Fundamental Text)</h2>
                        {isEditing ? (
                            <textarea
                                className="w-full flex-1 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm p-4 min-h-[300px] font-mono leading-relaxed resize-none"
                                placeholder="Write your fundamental brand offer/brief here..."
                                value={formState.offerBrief}
                                onChange={e => setFormState({ ...formState, offerBrief: e.target.value })}
                            />
                        ) : (
                            <div className="flex-1 w-full rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm p-4 min-h-[300px] whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                                {formState.offerBrief || <span className="text-zinc-400 italic">No offer brief defined. Click Edit to add one.</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Images & Other Assets */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Image Assets</h2>
                </div>

                {/* Upload Area */}
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Asset URL</label>
                            <input
                                type="text"
                                className="w-full rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm p-2"
                                placeholder="Paste image URL..."
                                value={newAssetUrl}
                                onChange={e => setNewAssetUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Name (Optional)</label>
                            <input
                                type="text"
                                className="w-full rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm p-2"
                                placeholder="e.g. Lifestyle Shot 1"
                                value={newAssetName}
                                onChange={e => setNewAssetName(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleAddAsset}
                            disabled={!newAssetUrl}
                            className="bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Add Asset
                        </button>
                    </div>
                </div>

                {/* Asset Grid */}
                {brandData?.assets && brandData.assets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {brandData.assets.map(asset => (
                            <div key={asset.id} className="group relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                <img src={asset.url} alt={asset.name || "Asset"} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] text-white truncate mb-1">{asset.name || "Untitled"}</p>
                                    <button
                                        onClick={() => handleDeleteAsset(asset.id)}
                                        className="text-[10px] text-red-400 hover:text-red-300 font-bold w-full text-left"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                        No additional assets uploaded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
