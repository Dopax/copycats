"use client";

import { useMemo } from "react";

interface HeatmapDataPoint {
    x: string; // e.g. "UGC Video"
    y: string; // e.g. "Social Ad"
    spend: number;
    roas: number;
    count: number;
}

interface HeatmapGridProps {
    title: string;
    data: HeatmapDataPoint[];
    breakEvenRoas: number;
    description?: string;
}

export default function HeatmapGrid({ title, data, breakEvenRoas, description }: HeatmapGridProps) {

    // 1. Extract Unique Labels
    const xLabels = useMemo(() => Array.from(new Set(data.map(d => d.x))).sort(), [data]);
    const yLabels = useMemo(() => Array.from(new Set(data.map(d => d.y))).sort(), [data]);

    // 2. Lookup Map for ease of rendering
    const lookup = useMemo(() => {
        const map = new Map<string, HeatmapDataPoint>();
        data.forEach(d => map.set(`${d.x}::${d.y}`, d));
        return map;
    }, [data]);

    // 3. Color Logic
    const getCellColor = (roas: number) => {
        // Simple Gradient Logic or Thresholds
        if (roas >= breakEvenRoas * 2) return "bg-emerald-500 text-white"; // Super Green
        if (roas >= breakEvenRoas * 1.2) return "bg-green-500 text-white"; // Good Green
        if (roas >= breakEvenRoas) return "bg-green-400 text-white"; // Profitable
        if (roas >= breakEvenRoas * 0.8) return "bg-yellow-400 text-zinc-900"; // Warning
        if (roas > 0) return "bg-red-400 text-white"; // Loss
        return "bg-zinc-100 dark:bg-zinc-800"; // No Data / Zero
    };

    // 4. Formatting
    const fmtCurrency = (val: number) => `$${Math.round(val).toLocaleString()}`;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
                {description && <p className="text-sm text-zinc-500">{description}</p>}
            </div>

            <div className="overflow-x-auto pb-2 custom-scrollbar">
                {/* Grid Container */}
                <div className="inline-block min-w-full">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {/* Corner (Empty) */}
                                <th className="p-2 border-b border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 min-w-[120px]">
                                    <span className="text-xs font-mono text-zinc-400 uppercase">Angle \ Format</span>
                                </th>
                                {/* X-Axis Headers */}
                                {xLabels.map(x => (
                                    <th key={x} className="p-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[100px]">
                                        {x}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Rows */}
                            {yLabels.map(y => (
                                <tr key={y}>
                                    {/* Y-Axis Label */}
                                    <td className="p-2 border-r border-zinc-100 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 whitespace-nowrap">
                                        {y}
                                    </td>
                                    {/* Cells */}
                                    {xLabels.map(x => {
                                        const point = lookup.get(`${x}::${y}`);
                                        if (!point) {
                                            return <td key={x} className="p-2 border border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900"></td>;
                                        }

                                        return (
                                            <td key={x} className="p-1 border border-white dark:border-zinc-900">
                                                <div
                                                    className={`w-full h-full rounded-md p-2 flex flex-col items-center justify-center gap-0.5 min-h-[70px] transition-transform hover:scale-105 cursor-default group relative ${getCellColor(point.roas)}`}
                                                >
                                                    <span className="text-xs font-bold">{point.roas.toFixed(2)}x</span>
                                                    <span className="text-[10px] opacity-80">{fmtCurrency(point.spend)}</span>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs rounded-lg py-2 px-3 w-40 z-20 hidden group-hover:block shadow-xl pointer-events-none">
                                                        <div className="font-bold mb-1 border-b border-zinc-700 pb-1">{y} + {x}</div>
                                                        <div className="flex justify-between"><span>Spend:</span> <span>{fmtCurrency(point.spend)}</span></div>
                                                        <div className="flex justify-between"><span>ROAS:</span> <span>{point.roas.toFixed(2)}x</span></div>
                                                        <div className="flex justify-between"><span>Batches:</span> <span>{point.count}</span></div>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {data.length === 0 && (
                        <div className="p-8 text-center text-zinc-400 italic text-sm bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mt-4">
                            No performance data available to generate vector map.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
