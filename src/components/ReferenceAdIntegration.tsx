
import { useState } from "react";
import MessagingAnalysisToolbox from "./MessagingAnalysisToolbox";

interface AdSnapshot {
    id: string;
    url: string;
    type: string;
}

interface ReferenceAd {
    id: string;
    postId: string;
    headline: string;
    description: string;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    transcript?: string;
    facebookLink?: string;
    mainMessaging?: string;
    whyItWorks?: string;
    notes?: string;
    snapshots?: AdSnapshot[];
}

interface ReferenceAdIntegrationProps {
    ad: ReferenceAd;
    className?: string;
}

export default function ReferenceAdIntegration({ ad, className = "" }: ReferenceAdIntegrationProps) {
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

    // Prefer videoUrl, fallback to first snapshot if video type? 
    // Actually our Ad model has videoUrl directly.

    return (
        <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200">
                        REFERENCE CONTENT
                    </span>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        Competitor Ad Analysis
                    </h3>
                </div>
                {ad.facebookLink && (
                    <a
                        href={ad.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                        View Original
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-zinc-200 dark:border-zinc-800">
                {/* Media Column */}
                <div className="p-4 bg-zinc-900 flex flex-col justify-center items-center min-h-[300px] lg:col-span-1">
                    {ad.videoUrl ? (
                        <video
                            src={ad.videoUrl}
                            controls
                            className="max-h-[400px] w-full rounded-lg shadow-lg bg-black"
                            playsInline
                        />
                    ) : (
                        <div className="text-zinc-500 text-sm flex flex-col items-center gap-2">
                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            <span>No video available</span>
                        </div>
                    )}
                </div>

                {/* Analysis & Context Column */}
                <div className="p-0 lg:col-span-2 flex flex-col h-full bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex-1 overflow-y-auto max-h-[500px]">

                        {/* Main Messaging - Highlighted */}
                        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <MessagingAnalysisToolbox
                                value={ad.mainMessaging}
                                readOnly
                                className="border-0 shadow-none rounded-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800">

                            {/* Why It Works */}
                            <div className="p-5 bg-white dark:bg-zinc-900">
                                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase">Why It Works</label>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {ad.whyItWorks || "No analysis provided."}
                                </p>
                            </div>

                            {/* Notes & Transcript Toggle */}
                            <div className="p-5 bg-white dark:bg-zinc-900 flex flex-col">
                                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase">Notes</label>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap mb-4 flex-1">
                                    {ad.notes || "No notes available."}
                                </p>

                                {ad.transcript && (
                                    <button
                                        onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                                        className="mt-auto w-full flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                            <svg className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            View Transcript
                                        </div>
                                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isTranscriptOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Transcript Drawer */}
                        {isTranscriptOpen && ad.transcript && (
                            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 animate-in slide-in-from-top-2 duration-200">
                                <h5 className="text-xs font-bold text-zinc-500 mb-3 uppercase">Transcript</h5>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto p-4 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                                    {ad.transcript}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
