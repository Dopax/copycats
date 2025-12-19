
import React from 'react';

// Icons like Folder, Star, Video, Users (using text/svg placeholders for now or lucide if available in project - sticking to SVG for safety)
// Assuming lucide-react might not be installed, using raw SVGs for standard look.

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {

    const navItems = [
        { id: 'all', label: 'All Clips', icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
        { id: 'videos', label: 'Raw Videos', icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
        { id: 'favorites', label: 'Favorites', icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
    ];

    const categories = [
        'Shoots', 'Foods', 'Recipes', 'Unboxing', 'Testimonials'
    ];

    const scenes = [
        'B-Roll', 'CTA', 'Competitor Knives', 'Cooking', 'Deals', 'Demo', 'Durability', 'End Cards', 'Hook', 'Product Intro'
    ];

    return (
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-full flex flex-col overflow-y-auto flex-shrink-0">
            {/* Search Placeholder */}
            <div className="p-4 border-b border-zinc-900">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-zinc-900 text-zinc-300 text-sm rounded px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                    <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="p-2 space-y-1">
                <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Asset Views</h3>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${currentView === item.id
                            ? 'bg-blue-600/10 text-blue-400'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="p-2 mt-4 space-y-1 border-t border-zinc-900">
                <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Scenes / Categories</h3>
                {scenes.map((scene) => (
                    <button
                        key={scene}
                        onClick={() => onViewChange(`scene-${scene}`)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors ${currentView === `scene-${scene}` ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                            }`}
                    >
                        <span className="truncate">{scene}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
