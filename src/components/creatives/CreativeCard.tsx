
import React, { useState } from 'react';
// Define local interfaces to decouple from Prisma Client issues
interface Tag { id: string; name: string; }
interface Creator { id: string; name: string; }
interface Creative {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    duration: number | null;
    type: string;
    driveFileId?: string | null;
    driveViewLink?: string | null;
    width?: number | null;
    height?: number | null;
    createdAt?: string | Date;
}

interface CreativeCardProps {
    creative: Creative & { tags: Tag[], creator: Creator | null };
}

export default function CreativeCard({ creative }: CreativeCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Calculate Aspect Ratio
    // We strictly match the video files dimensions.
    const getAspectRatioStyle = () => {
        if (creative.width && creative.height) {
            return { aspectRatio: `${creative.width} / ${creative.height}` };
        }
        // Default fallback to 9/16 standard vertical
        return { aspectRatio: '9 / 16' };
    };

    // Format duration (e.g. 65.5 -> 1:05)
    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Process Tags: Filter L1, Sort (Bunch -> AI -> Creative)
    const displayTags = (creative.tags || [])
        .filter(t => !t.name.startsWith('L1:'))
        .map(t => {
            let type = 'CREATIVE';
            let label = t.name;
            if (t.name.startsWith('BUNCH:')) {
                type = 'BUNCH';
                label = t.name.replace('BUNCH:', '');
            } else if (t.name.startsWith('AI:')) {
                type = 'AI';
                label = t.name.replace('AI:', '');
            }
            return { ...t, type, label };
        })
        .sort((a, b) => {
            // Priority: Bunch > AI > Creative
            const score = (type: string) => type === 'BUNCH' ? 3 : type === 'AI' ? 2 : 1;
            return score(b.type) - score(a.type);
        });

    // Construct Preview URL if not explicitly stored
    // Standard format: https://drive.google.com/file/d/{FILE_ID}/preview
    const getEmbedUrl = () => {
        if (!creative.driveFileId && !creative.driveViewLink) return null;

        let fileId = creative.driveFileId;

        // Try to extract ID from link if FileId is missing
        if (!fileId && creative.driveViewLink) {
            const match = creative.driveViewLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) fileId = match[1];
        }

        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }

        return null;
    };

    const embedUrl = getEmbedUrl();
    const canPlay = creative.type === 'VIDEO' && embedUrl;

    return (
        <>
            <div className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer flex flex-col h-full">
                {/* Thumbnail / Video Preview Area */}
                <div
                    className="relative bg-black w-full overflow-hidden"
                    style={getAspectRatioStyle()}
                >
                    {creative.thumbnailUrl ? (
                        <img
                            src={creative.thumbnailUrl}
                            alt={creative.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <span className="text-xs">No Preview</span>
                        </div>
                    )}

                    {/* Overlay Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Play Button Overlay (On Hover) */}
                    {canPlay && (
                        <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPlaying(true);
                            }}
                        >
                            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform hover:bg-white/20">
                                <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                        </div>
                    )}

                    {/* Duration Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(creative.duration)}
                    </div>
                </div>

                {/* Info Section (Visible on Hover/Bottom) */}
                <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate" title={creative.name}>
                        {creative.name}
                    </h3>

                    <div className="flex items-center justify-between mt-1 mb-2">
                        <p className="text-xs text-zinc-400 truncate">
                            {creative.creator?.name || 'Unknown Creator'}
                        </p>
                        {/* Small badge for Type */}
                        <div className="flex items-center gap-2">
                            {creative.createdAt && (
                                <span className="text-[10px] text-zinc-500">
                                    {new Date(creative.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                                {creative.type.toLowerCase()}
                            </span>
                        </div>
                    </div>

                    {/* 3-Tier Tag System Display */}
                    {displayTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {displayTags.slice(0, 3).map(tag => (
                                <span
                                    key={tag.id}
                                    className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1
                                        ${tag.type === 'BUNCH' ? 'bg-blue-900/40 text-blue-200 border border-blue-800/50' :
                                            tag.type === 'AI' ? 'bg-purple-900/40 text-purple-200 border border-purple-800/50 italic' :
                                                'bg-zinc-800 text-zinc-400'}
                                    `}
                                >
                                    {tag.type === 'BUNCH' && <span className="w-1 h-1 rounded-full bg-blue-400"></span>}
                                    {tag.label}
                                </span>
                            ))}
                            {displayTags.length > 3 && (
                                <span className="text-[10px] text-zinc-500 px-1">
                                    +{displayTags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CINEMA MODE / QUICK VIEW OVERLAY */}
            {isPlaying && embedUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsPlaying(false)}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-6 right-6 z-20 text-white/50 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-white/10"
                        onClick={() => setIsPlaying(false)}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div
                        className="w-full max-w-6xl h-[85vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 grid grid-cols-1 lg:grid-cols-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT COLUMN: DETAILS & TAGS */}
                        <div className="lg:col-span-1 p-8 overflow-y-auto border-r border-zinc-800 flex flex-col gap-6">

                            {/* Header Info */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{creative.name}</h2>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {creative.creator?.name || 'Unknown Creator'}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDuration(creative.duration)}</span>
                                    <span>•</span>
                                    <span className="capitalize">{creative.type.toLowerCase()}</span>
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tags</h3>
                                {creative.tags && creative.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {creative.tags
                                            .filter(t => !t.name.startsWith('L1:'))
                                            .map(tag => {
                                                let style = "bg-zinc-800 text-zinc-300 border-zinc-700";
                                                let label = tag.name;

                                                if (tag.name.startsWith('BUNCH:')) {
                                                    style = "bg-blue-900/30 text-blue-200 border-blue-800/50";
                                                    label = tag.name.replace('BUNCH:', '');
                                                } else if (tag.name.startsWith('AI:')) {
                                                    style = "bg-purple-900/30 text-purple-200 border-purple-800/50 italic";
                                                    label = tag.name.replace('AI:', '');
                                                } else if (tag.name.startsWith('CID-')) {
                                                    style = "bg-green-900/30 text-green-200 border-green-800/50 font-mono";
                                                }

                                                return (
                                                    <span
                                                        key={tag.id}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${style}`}
                                                    >
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <p className="text-zinc-600 italic text-sm">No tags assigned.</p>
                                )}
                            </div>

                            {/* Metadata / Tech Specs (Optional Placeholders) */}
                            <div className="mt-auto pt-6 border-t border-zinc-800">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-zinc-500 block mb-1">Dimensions</span>
                                        <span className="text-zinc-300 font-mono">{creative.width || '?'} x {creative.height || '?'}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block mb-1">Format</span>
                                        <span className="text-zinc-300 uppercase">MP4 / Stream</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: VIDEO PLAYER */}
                        <div className="lg:col-span-2 bg-black flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                            <iframe
                                src={embedUrl}
                                className="w-full h-full border-0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
