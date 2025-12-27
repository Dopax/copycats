/**
 * HookLibraryModal Component
 * Modal for selecting hooks from the library
 */

'use client';

import { useState } from 'react';
import type { Hook } from '@/types';

interface HookLibraryModalProps {
    hooks: Hook[];
    onClose: () => void;
    onSelect: (hook: Hook) => void;
}

export function HookLibraryModal({ hooks, onClose, onSelect }: HookLibraryModalProps) {
    const [search, setSearch] = useState("");
    const filteredHooks = hooks.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) && h.name !== "Editor Choice");

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg dark:text-white">Hook Library</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <input
                        type="text"
                        placeholder="Search hooks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => onSelect({ id: "", name: "Editor Choice" })}
                            className="text-left bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group flex flex-col items-center justify-center gap-3 h-full min-h-[160px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-zinc-900 dark:text-white">Editor's Choice</div>
                                <div className="text-xs text-zinc-500 mt-1">Let the editor decide</div>
                            </div>
                        </button>

                        {filteredHooks.map(hook => (
                            <button
                                key={hook.id}
                                onClick={() => onSelect(hook)}
                                className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left flex flex-col h-full"
                            >
                                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                                    {hook.videoUrl ? (
                                        <video
                                            src={hook.videoUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            onMouseEnter={e => e.currentTarget.play()}
                                            onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                        </div>
                                    )}
                                    {/* Overlay for Name */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                                        <span className="font-bold text-white text-sm line-clamp-1 shadow-sm">{hook.name}</span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                        {hook.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredHooks.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-zinc-400 dark:text-zinc-500">No hooks found matching "{search}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
