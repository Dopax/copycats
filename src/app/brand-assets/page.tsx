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
    const { selectedBrand, setSelectedBrand } = useBrand();

    const [brandData, setBrandData] = useState<ExtendedBrand | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({
        logoUrl: "",
        color: "#000000",
        color2: "#ffffff",
        fontUrl: "",
        offerBrief: "",
        breakEvenRoas: "1.00"
    });

    // Asset Upload State (Mock)
    const [newAssetUrl, setNewAssetUrl] = useState("");
    const [newAssetName, setNewAssetName] = useState("");
    const [newAssetType, setNewAssetType] = useState("IMAGE");

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
                    offerBrief: data.offerBrief || "",
                    breakEvenRoas: data.breakEvenRoas ? data.breakEvenRoas.toString() : "1.00"
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

                // Update global context so other pages (like FacebookAds) see the change immediately
                setSelectedBrand({
                    ...selectedBrand,
                    ...updated
                });

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
                    type: newAssetType
                })
            });
            if (res.ok) {
                const asset = await res.json();
                setBrandData(prev => prev ? { ...prev, assets: [asset, ...prev.assets] } : null);
                setNewAssetUrl("");
                setNewAssetName("");
                setNewAssetType("IMAGE");
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
                            <div className="flex justify-between mb-1">
                                <label className="block text-xs font-medium text-zinc-500">Asset URL</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewAssetType('IMAGE')}
                                        className={`text-[10px] px-2 rounded ${newAssetType === 'IMAGE' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        Image
                                    </button>
                                    <button
                                        onClick={() => setNewAssetType('DOCUMENT')}
                                        className={`text-[10px] px-2 rounded ${newAssetType === 'DOCUMENT' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        Link / Doc
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                className="w-full rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm p-2"
                                placeholder={newAssetType === 'IMAGE' ? "Paste image URL..." : "Paste document link..."}
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
                            <div key={asset.id} className="group relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                                {asset.type === 'IMAGE' ? (
                                    <img src={asset.url} alt={asset.name || "Asset"} className="w-full h-full object-cover" />
                                ) : (
                                    <a href={asset.url} target="_blank" className="flex-1 flex flex-col items-center justify-center p-4 text-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                        <svg className="w-10 h-10 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        <span className="text-xs text-indigo-500 font-medium truncate w-full px-2">{asset.name || "Link"}</span>
                                    </a>
                                )}
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
