
import React from 'react';
interface Tag { id: string; name: string; }
interface Creator { id: string; name: string; }
interface Creative {
    id: string;
    thumbnailUrl: string | null;
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
                                {creative.thumbnailUrl ? (
                                    <img src={creative.thumbnailUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800" />
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
                <p className="text-xs text-zinc-500">{count} clips</p>
            </div>
        </div>
    );
}
