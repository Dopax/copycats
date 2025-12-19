
import React from 'react';
// Define local interfaces to decouple from Prisma Client issues
interface Tag { id: string; name: string; }
interface Creator { id: string; name: string; }
interface Creative {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    duration: number | null;
    type: string;
}

interface CreativeCardProps {
    creative: Creative & { tags: Tag[], creator: Creator | null };
}

export default function CreativeCard({ creative }: CreativeCardProps) {
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

    return (
        <div className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer">
            {/* Thumbnail / Video Preview Area */}
            <div className="aspect-[9/16] relative bg-black">
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                        {creative.type.toLowerCase()}
                    </span>
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
    );
}
