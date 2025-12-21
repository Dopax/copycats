"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";
import HeatmapGrid from "@/components/dashboard/HeatmapGrid";

interface Distribution {
    name: string;
    count: number;
}

interface Stats {
    kpis: {
        totalBatches: number;
        avgVelocityDays: number;
    };
    distributions: {
        topAngles: Distribution[];
        topThemes: Distribution[];
        topDemographics: Distribution[];
        topAwareness: Distribution[];
    };
}

export default function DashboardPage() {
    const { selectedBrand } = useBrand();
    const [stats, setStats] = useState<Stats | null>(null);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (selectedBrand) {
            fetchStats();
        }
    }, [selectedBrand]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/stats?brandId=${selectedBrand?.id}`);
            if (res.ok) {
                setStats(await res.json());
            }

            // Fetch Heatmap
            const heatRes = await fetch(`/api/analytics/heatmap?brandId=${selectedBrand?.id}`);
            if (heatRes.ok) {
                setHeatmapData(await heatRes.json());
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedBrand) return <div className="p-10 text-center text-zinc-500">Please select a brand.</div>;
    if (isLoading) return <div className="p-10 text-center text-zinc-500">Loading Dashboard...</div>;
    if (!stats) return <div className="p-10 text-center text-zinc-500">Failed to load stats.</div>;

    const StatCard = ({ title, value, subtext }: { title: string, value: string | number, subtext?: string }) => (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">{title}</h3>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{value}</div>
            {subtext && <p className="text-xs text-zinc-400 mt-1">{subtext}</p>}
        </div>
    );

    const DistributionList = ({ title, data, colorClass }: { title: string, data: Distribution[], colorClass: string }) => (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{title}</h3>
            <div className="flex-1 space-y-3">
                {data.length > 0 ? data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-zinc-400 font-mono text-xs w-4">#{i + 1}</span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate" title={item.name}>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full ${colorClass}`} style={{ width: `${(item.count / Math.max(...data.map(d => d.count))) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white min-w-[20px] text-right">{item.count}</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-zinc-400 text-sm italic py-4 text-center">No data available</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard Overview</h1>
                <button onClick={fetchStats} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Batches Created"
                    value={stats.kpis.totalBatches}
                    subtext="All time volume"
                />
                <StatCard
                    title="Avg. Velocity"
                    value={`${stats.kpis.avgVelocityDays} Days`}
                    subtext="Ideation to Launch"
                />
                <StatCard
                    title="Active Concepts"
                    value={stats.distributions.topAngles.length + stats.distributions.topThemes.length} // Rough proxy or get real count
                    subtext="Unique angles & themes tested"
                />
                <StatCard
                    title="Top Performing Angle"
                    value={stats.distributions.topAngles[0]?.name || "N/A"}
                    subtext={stats.distributions.topAngles[0] ? `${stats.distributions.topAngles[0].count} batches` : "No data"}
                />
                <StatCard
                    title="Top Performing Angle"
                    value={stats.distributions.topAngles[0]?.name || "N/A"}
                    subtext={stats.distributions.topAngles[0] ? `${stats.distributions.topAngles[0].count} batches` : "No data"}
                />
            </div>

            {/* Creative Heatmap Section */}
            <div className="h-[500px]">
                <HeatmapGrid
                    title="Creative Performance Matrix"
                    description="Performance heatmap of Ad Angles vs Ad Formats. Color indicates ROAS efficiency."
                    data={heatmapData}
                    breakEvenRoas={selectedBrand?.breakEvenRoas || 1.5}
                />
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DistributionList
                    title="Top Angles Used"
                    data={stats.distributions.topAngles}
                    colorClass="bg-amber-500"
                />
                <DistributionList
                    title="Top Themes Used"
                    data={stats.distributions.topThemes}
                    colorClass="bg-pink-500"
                />
                <DistributionList
                    title="Top Demographics"
                    data={stats.distributions.topDemographics}
                    colorClass="bg-emerald-500"
                />
                <DistributionList
                    title="Top Awareness Levels"
                    data={stats.distributions.topAwareness}
                    colorClass="bg-violet-500"
                />
            </div>
        </div>
    );
}
