import React from 'react';

export default function AwarenessTooltip() {
    return (
        <div className="relative inline-block ml-1 group">
            <span className="cursor-help text-zinc-400 opacity-70 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </span>
            <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-72 opacity-0 group-hover:opacity-100 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs p-3 rounded-xl shadow-xl transition-opacity duration-200">
                <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-700 pb-1">5 Stages of Awareness</div>
                <ul className="space-y-2 text-zinc-300">
                    <li>
                        <strong className="text-red-400">1. Unaware:</strong> Doesn't know they have a problem.
                    </li>
                    <li>
                        <strong className="text-orange-400">2. Problem Aware:</strong> Knows the problem, but not the solution.
                    </li>
                    <li>
                        <strong className="text-amber-400">3. Solution Aware:</strong> Knows solutions exist, but not yours.
                    </li>
                    <li>
                        <strong className="text-emerald-400">4. Product Aware:</strong> Knows your product, but isn't sold yet.
                    </li>
                    <li>
                        <strong className="text-indigo-400">5. Most Aware:</strong> Ready to buy, just needs an offer.
                    </li>
                </ul>
                <div className="absolute top-full left-2 border-6 border-transparent border-t-zinc-900"></div>
            </div>
        </div>
    );
}
