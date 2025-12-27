'use client';

import React from 'react';
import MessagingAnalysisToolbox from '@/components/MessagingAnalysisToolbox';

interface ReferenceAdData {
    awarenessLevel?: { name: string };
    awarenessLevelReason?: string;
    whyItWorks?: string;
    notes?: string;
}

interface CompetitorSourceBreakdownProps {
    referenceAd: ReferenceAdData;
    mainMessaging?: string;
    onMessagingChange?: (value: string) => void;
    readOnly?: boolean;
    variant?: 'full' | 'compact';
}

export function CompetitorSourceBreakdown({
    referenceAd,
    mainMessaging,
    onMessagingChange,
    readOnly = false,
    variant = 'full'
}: CompetitorSourceBreakdownProps) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🦁</span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Competitor Source Breakdown</h3>
            </div>

            {/* Awareness & Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Target Awareness Level</label>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                        {referenceAd.awarenessLevel?.name || "Not specified"}
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Reason</label>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                        {referenceAd.awarenessLevelReason || "No reasoning provided."}
                    </div>
                </div>
            </div>

            {variant === 'full' && (
                <>
                    {/* Why It Works & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Why It Works</label>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {referenceAd.whyItWorks || "No analysis available."}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">General Notes</label>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {referenceAd.notes || "No notes available."}
                            </div>
                        </div>
                    </div>

                    {/* Core Messaging Analysis */}
                    {mainMessaging !== undefined && onMessagingChange && (
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-4">Core Messaging</label>
                            <MessagingAnalysisToolbox
                                value={mainMessaging}
                                onChange={onMessagingChange}
                                className="border-none shadow-none bg-transparent p-0"
                                variant="exploded"
                                readOnly={readOnly}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CompetitorSourceBreakdown;
