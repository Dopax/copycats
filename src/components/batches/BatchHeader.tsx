'use client';

import React from 'react';
import Link from 'next/link';

const STATUS_FLOW = ["IDEATION", "CREATOR_BRIEFING", "FILMING", "EDITOR_BRIEFING", "EDITING", "REVIEW", "AI_BOOST", "LEARNING", "ARCHIVED"];

interface BatchHeaderProps {
    batch: {
        id: number;
        name: string;
        status: string;
        batchType: string;
        angle: {
            name: string;
            conceptDoc?: string;
        };
    };
    onStatusChange: (newStatus: string) => void;
    onDelete: () => void;
    onViewPersona?: (conceptDoc: string) => void;
}

export function BatchHeader({ batch, onStatusChange, onDelete, onViewPersona }: BatchHeaderProps) {
    return (
        <>
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-4 text-zinc-500 mb-2">
                <Link href="/batches" className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Board
                </Link>
                <span>/</span>
                <span className="text-zinc-900 dark:text-white font-medium truncate">{batch.name}</span>
            </div>

            {/* Top Bar: Status & Meta */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                <span className="font-mono text-zinc-400 mr-2">BATCH{batch.id}:</span>
                                {batch.name}
                            </h1>
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded uppercase">
                                {batch.batchType.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2 mt-1">
                            <span className="font-bold text-zinc-400">Angle:</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{batch.angle.name}</span>
                            {batch.angle.conceptDoc && onViewPersona && (
                                <button
                                    onClick={() => onViewPersona(batch.angle.conceptDoc!)}
                                    className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Persona
                                </button>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onDelete}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Batch"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-zinc-500">Status:</label>
                            <select
                                value={batch.status}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            >
                                {STATUS_FLOW.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BatchHeader;
