"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBrand } from "@/context/BrandContext";

interface Batch {
    id: number;
    name: string;
    status: string;
    batchType: string;
    priority: string;
    concept: { name: string };
    format?: { name: string };
    assignee?: string;
    createdtAt: string; // Typo in original fetch? Schema says createdAt.
    updatedAt: string;
    items: { id: string }[];
}

function BatchesListContent() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedBrand, isLoading: isBrandLoading } = useBrand();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isBrandLoading) {
            fetchData();
        }
    }, [selectedBrand, isBrandLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const query = selectedBrand ? `?brandId=${selectedBrand.id}` : '';
            const res = await fetch(`/api/batches${query}`);
            if (res.ok) {
                setBatches(await res.json());
            }
        } catch (error) {
            console.error("Failed to load batches", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            "IDEATION": "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300",
            "CREATOR_BRIEFING": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
            "FILMING": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
            "EDITOR_BRIEFING": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            "EDITING": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
            "REVIEW": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
            "AI_BOOST": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
            "LAUNCHED": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            "ARCHIVED": "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-500",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
                {status.replace(/_/g, " ")}
            </span>
        );
    };

    if (isLoading) return <div className="p-8 text-center text-zinc-500">Loading Batches...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Batches List</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Detailed view of all creative batches.</p>
                </div>
                 <Link
                    href="/batches"
                    className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    Switch to Pipeline
                </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Batch ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Concept</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Updated</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Metrics (Future)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                        {batches.map((batch) => (
                            <tr key={batch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-400">
                                    <Link href={`/batches/${batch.id}`} className="hover:underline">BATCH{batch.id}</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                                    <Link href={`/batches/${batch.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                        {batch.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {getStatusBadge(batch.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                    {batch.concept.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                    {batch.batchType.replace("NET_NEW", "✨ Net New").replace("COPYCAT", "🐱 Copycat").replace("ITERATION", "🔄 Iteration")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        batch.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                        batch.priority === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}>
                                        {batch.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                    {new Date(batch.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 italic">
                                    --
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {batches.length === 0 && (
                    <div className="p-12 text-center text-zinc-500">
                        No batches found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BatchesListPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BatchesListContent />
        </Suspense>
    );
}
