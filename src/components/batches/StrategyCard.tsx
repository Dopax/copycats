/**
 * StrategyCard Component
 * Displays the batch strategy sentence based on awareness level
 */

'use client';

import type { Batch } from '@/types';

interface StrategyCardProps {
    batch: Batch;
}

export function StrategyCard({ batch }: StrategyCardProps) {
    const demographic = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.demographic.name}</span>;
    const desire = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.desire.name}</span>;
    const theme = <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch.angle.theme.name}</span>;
    const awareness = batch.angle.awarenessLevel?.name || "Unaware";

    const ThemeAddon = () => (
        <span className="text-zinc-400 border-l border-zinc-300 mx-2 pl-2">
            Visual Theme: {theme}
        </span>
    );

    const getContent = () => {
        switch (awareness) {
            case "Problem Unaware":
                return (
                    <>
                        Targeting {demographic} who don't yet see a problem. We connect first by reflecting their identity and emotions, then gradually reveal how {desire} can play a meaningful role in their life. <ThemeAddon />
                    </>
                );
            case "Problem Aware":
                return (
                    <>
                        Speaking to {demographic} who clearly feel the frustration. We dramatize the problem, then position {desire} as the emotional outcome they are really searching for. <ThemeAddon />
                    </>
                );
            case "Solution Aware":
                return (
                    <>
                        For {demographic} who know there are solutions out there. We show why our approach leads to {desire} more clearly, easily, and reliably than what they have tried or considered. <ThemeAddon />
                    </>
                );
            case "Product Aware":
                return (
                    <>
                        Addressing {demographic} who know our products but still hesitate. We remove doubt with specific proof that choosing us truly results in {desire}. <ThemeAddon />
                    </>
                );
            case "Most Aware":
                return (
                    <>
                        Closing {demographic} who already want what we offer. We focus on the offer itself, using {desire} as the final emotional reason to act now. <ThemeAddon />
                    </>
                );
            default:
                return (
                    <>
                        This ad batch should speak to {demographic}, connect directly to their interest in {desire}, and guide them smoothly toward choosing. <ThemeAddon />
                    </>
                );
        }
    };

    return (
        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed text-center">
            {getContent()}
        </p>
    );
}

/**
 * Helper function to get strategy sentence as JSX (for backwards compatibility)
 */
export const getStrategySentence = (batch: Batch) => <StrategyCard batch={batch} />;
