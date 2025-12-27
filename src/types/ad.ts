/**
 * Ad Types
 * Centralized type definitions for Ad entities (from Swipe File / AdSpy)
 */

import type { AdSnapshot } from '@prisma/client';

export interface AdFormat {
    id: string;
    name: string;
}

export interface AdHook {
    id: string;
    name: string;
}

export interface AdTheme {
    id: string;
    name: string;
}

export interface AdDesire {
    id: string;
    name: string;
}

export interface AdAwarenessLevel {
    id: string;
    name: string;
}

export interface AdDemographic {
    id: string;
    name: string;
}

export interface Ad {
    id: string;
    postId: string;
    brand?: string;
    description?: string;
    headline?: string;
    adLink?: string;
    facebookLink?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    firstSeen: string;
    lastSeen: string;
    publishDate?: string;
    archived: boolean;
    priority?: number | null;
    notes?: string;
    whyItWorks?: string;
    transcript?: string;
    mainMessaging?: string;

    // Relations
    formatId?: string;
    format?: AdFormat | null;
    hookId?: string;
    hook?: AdHook | null;
    themeId?: string;
    theme?: AdTheme | null;
    desireId?: string;
    desire?: AdDesire | null;
    awarenessLevelId?: string;
    awarenessLevel?: AdAwarenessLevel | null;
    demographicId?: string;
    demographic?: AdDemographic | null;

    snapshots?: AdSnapshot[];
    referencedInBatches?: { id: number; name: string; status: string }[];
}

export type AdPriority = 1 | 2 | 3 | null; // 1=High, 2=Medium, 3=Low
