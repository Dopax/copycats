
import React from 'react';

export default function FilterBar() {
    return (
        <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center px-4 gap-3 sticky top-0 z-10 w-full">
            {/* Dropdown Filters */}
            {['Creator', 'Product', 'Audio Type', 'Actor Type'].map((filter) => (
                <button
                    key={filter}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                >
                    {filter}
                    <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            ))}

            <div className="flex-1" />

            <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                All Filters
            </button>
        </div>
    );
}
