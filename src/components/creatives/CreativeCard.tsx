
import React from 'react';
import { Creative, Tag, Creator } from '@prisma/client';

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

                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-zinc-400 truncate">
                        {creative.creator?.name || 'Unknown Creator'}
                    </p>
                    {/* Small badge for Type */}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                        {creative.type.toLowerCase()}
                    </span>
                </div>

                {/* Tags (optional, mainly for detail view but good for debug) */}
                {creative.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {creative.tags.slice(0, 2).map(tag => (
                            <span key={tag.id} className="text-[10px] text-zinc-500 bg-zinc-800/50 px-1 rounded">
                                #{tag.name}
                            </span>
                        ))}
                        {creative.tags.length > 2 && (
                            <span className="text-[10px] text-zinc-500 bg-zinc-800/50 px-1 rounded">
                                +{creative.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
