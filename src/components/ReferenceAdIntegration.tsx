
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
    const [isCopyOpen, setIsCopyOpen] = useState(false);

    return (
        <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm ${className}`}>

            {/* 1. Header with Metadata */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                        REFERENCE
                    </span>
                    {ad.facebookLink && (
                        <a
                            href={ad.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
                        >
                            View Original
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    )}
                </div>
            </div>

            {/* 2. Main Media (Video/Image) - Priority */}
            <div className="bg-black relative group min-h-[400px] flex items-center justify-center">
                {ad.videoUrl ? (
                    <video
                        src={ad.videoUrl}
                        controls
                        className="w-full max-h-[600px] object-contain"
                        playsInline
                        poster={ad.thumbnailUrl || undefined}
                    />
                ) : (
                    <div className="text-zinc-500 text-sm flex flex-col items-center gap-2 py-20">
                        <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>No visual media available</span>
                    </div>
                )}
            </div>

            {/* 3. Ad Copy & Context (Collapsible/Concise) */}
            <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">

                {/* Headline */}
                {ad.headline && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Headline</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-gray-100">{ad.headline}</p>
                    </div>
                )}

                {/* Primary Text (Collapsible) */}
                {ad.description && (
                    <div className="p-3">
                        <div
                            className="flex items-center justify-between cursor-pointer select-none"
                            onClick={() => setIsCopyOpen(!isCopyOpen)}
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Primary Text</span>
                            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isCopyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {(isCopyOpen || ad.description.length < 150) && (
                            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {ad.description}
                            </div>
                        )}
                        {!isCopyOpen && ad.description.length >= 150 && (
                            <p className="mt-1 text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                                {ad.description}
                            </p>
                        )}
                    </div>
                )}

                {/* Transcript (Collapsible) */}
                {ad.transcript && (
                    <div className="p-3">
                        <div
                            className="flex items-center justify-between cursor-pointer select-none"
                            onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Transcript</span>
                            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isTranscriptOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {isTranscriptOpen && (
                            <div className="mt-2 p-3 bg-zinc-50 dark:bg-black/20 rounded border border-zinc-100 dark:border-zinc-800/50 text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                                {ad.transcript}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
