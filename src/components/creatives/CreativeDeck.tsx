
import React from 'react';
import { Creative, Tag, Creator } from '@prisma/client';
import CreativeCard from './CreativeCard';

interface CreativeDeckProps {
    title: string;
    count: number;
    creatives: (Creative & { tags: Tag[], creator: Creator | null })[];
    onClick?: () => void;
}

export default function CreativeDeck({ title, count, creatives, onClick }: CreativeDeckProps) {
    // Take top 3 for the preview stack
    const stack = creatives.slice(0, 3).reverse(); // Render reverse so first is on top? No, HTML order acts as Z order usually, last is top.
    // Actually, standard stacking: absolute positioning.
    // render bottom first.

    // Stacking visual logic:
    // Item 0 (Bottom): TranslateY(-10px), Scale(0.9)
    // Item 1 (Middle): TranslateY(-5px), Scale(0.95)
    // Item 2 (Top): TranslateY(0), Scale(1)

    // Reversed for rendering order
    const previewItems = creatives.slice(0, 3).reverse();

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
                    // Calculate offset based on reverse index
                    // previewItems has max 3 items.
                    // If length is 3:
                    // index 0 (was 3rd item): Bottom cup
                    // index 1 (was 2nd item): Middle cup
                    // index 2 (was 1st item): Top cup

                    const isTop = index === previewItems.length - 1;
                    const offset = (previewItems.length - 1 - index) * 6; // 6px difference
                    const scale = 1 - (previewItems.length - 1 - index) * 0.05; // 0.05 scale diff
                    const opacity = 1 - (previewItems.length - 1 - index) * 0.2; // fade items below

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
                            {/* Reuse Creative Card but strip some details if it's the top one? Or just render simplified card */}
                            <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 shadow-xl aspect-[9/16] relative">
                                {creative.thumbnailUrl ? (
                                    <img src={creative.thumbnailUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800" />
                                )}

                                {/* Overlay on top card only */}
                                {isTop && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Count Badge */}
                <div className="absolute top-2 right-2 z-50 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
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
