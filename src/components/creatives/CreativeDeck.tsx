
import React from 'react';
interface Tag { id: string; name: string; }
interface Creator { id: string; name: string; }
interface Creative {
    id: string;
    thumbnailUrl: string | null;
    createdAt?: string | Date;
    driveFileId?: string | null;
}

interface CreativeDeckProps {
    title: string;
    count: number;
    creatives: (Creative & { tags: Tag[], creator: Creator | null })[];
    onClick?: () => void;
}

export default function CreativeDeck({ title, count, creatives, onClick }: CreativeDeckProps) {
    // Reverse for rendering order (bottom first)
    const previewItems = creatives.slice(0, 3).reverse();

    // Extract Bunch Tags from the representative item (usually the first valid one)
    // We assume if one item has the bunch tag, the group is tagged.
    // In our API, we tag ALL items.
    const representative = creatives[0];
    const bunchTags = representative?.tags
        .filter(t => t.name.startsWith('BUNCH:'))
        .map(t => t.name.replace('BUNCH:', '')) || [];

    // Find dates
    const dates = creatives.reduce((acc, c) => {
        const date = c.createdAt ? new Date(c.createdAt) : null;
        if (!date) return acc;
        if (!acc.min || date < acc.min) acc.min = date;
        if (!acc.max || date > acc.max) acc.max = date;
        return acc;
    }, { min: null, max: null } as { min: Date | null, max: Date | null });

    const latestDate = dates.max;

    return (
        <div
            className="group cursor-pointer"
            onClick={onClick}
        >
            <div className="relative h-[320px] w-full flex items-end justify-center mb-2">
                {/* Empty Placeholder if 0 */}
                {creatives.length === 0 && (
                    <div className="w-full h-[280px] bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                        Empty
                    </div>
                )}

                {previewItems.map((creative, index) => {
                    const isTop = index === previewItems.length - 1;
                    const offset = (previewItems.length - 1 - index) * 6;
                    const scale = 1 - (previewItems.length - 1 - index) * 0.05;
                    const opacity = 1 - (previewItems.length - 1 - index) * 0.2;

                    // Robust Thumbnail Logic
                    const thumbUrl = creative.driveFileId
                        ? `https://lh3.googleusercontent.com/d/${creative.driveFileId}=s400`
                        : creative.thumbnailUrl;

                    return (
                        <div
                            key={creative.id}
                            className="absolute w-full origin-bottom transition-all duration-300 ease-out group-hover:-translate-y-2"
                            style={{
                                bottom: `${offset}px`,
                                zIndex: index,
                                transform: `scale(${scale})`,
                                opacity: opacity
                            }}
                        >
                            <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 shadow-xl aspect-[9/16] relative">
                                {thumbUrl ? (
                                    <img
                                        src={thumbUrl}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to original thumbnailUrl if LH3 fails, or hide if it WAS the original
                                            if (creative.thumbnailUrl && e.currentTarget.src !== creative.thumbnailUrl) {
                                                e.currentTarget.src = creative.thumbnailUrl;
                                            } else {
                                                e.currentTarget.style.display = 'none';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}

                                {isTop && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Bunch Tags (Top Left) */}
                {bunchTags.length > 0 && (
                    <div className="absolute top-0 left-0 z-50 flex flex-col items-start gap-1 p-2">
                        {bunchTags.map(tag => (
                            <span key={tag} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-blue-400">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Count Badge (Top Right) */}
                <div className="absolute top-2 right-2 z-50 bg-zinc-800 text-zinc-300 border border-zinc-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {count}
                </div>
            </div>

            <div className="text-center">
                <h3 className="text-sm font-medium text-white truncate px-2">{title}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-xs text-zinc-500">{count} clips</p>
                    {latestDate && (
                        <>
                            <span className="text-zinc-700">•</span>
                            <p className="text-xs text-zinc-500">
                                {dates.min && dates.max && dates.min.getTime() !== dates.max.getTime() ? (
                                    <>
                                        {dates.min.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        -
                                        {dates.max.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </>
                                ) : (
                                    latestDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                )}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
