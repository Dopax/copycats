
"use client";

import { useState, useEffect } from "react";

interface TrashedBatch {
    id: number;
    name: string;
    batchType: string;
    angle: { name: string };
    updatedAt: string;
}

export default function TrashBin() {
    const [trashedBatches, setTrashedBatches] = useState<TrashedBatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTrashedBatches();
    }, []);

    const fetchTrashedBatches = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/batches?status=TRASHED');
            if (res.ok) {
                setTrashedBatches(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch trash", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await fetch(`/api/batches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'IDEATION' })
            });
            setTrashedBatches(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error("Failed to restore", error);
            alert("Failed to restore batch");
        }
    };

    const handleDeleteForever = async (id: number) => {
        if (!confirm("Are you sure? This is permanent.")) return;
        try {
            await fetch(`/api/batches/${id}`, {
                method: 'DELETE'
            });
            setTrashedBatches(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete batch");
        }
    };

    if (isLoading) return <div className="text-sm text-zinc-500">Loading trash...</div>;

    if (trashedBatches.length === 0) {
        return (
            <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                <p className="text-zinc-500 text-sm">Trash bin is empty.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-3">Batch Name</th>
                            <th className="px-6 py-3">Angle</th>
                            <th className="px-6 py-3">Deleted Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trashedBatches.map((batch) => (
                            <tr key={batch.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                    {batch.name}
                                    <span className="ml-2 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                        {batch.batchType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">{batch.angle?.name}</td>
                                <td className="px-6 py-4 text-zinc-500">
                                    {new Date(batch.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleRestore(batch.id)}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                                    >
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForever(batch.id)}
                                        className="text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Delete Forever
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
