/**
 * Batch Types
 * Centralized type definitions for Batch/AdBatch entities
 */

import type { Creator } from './creator';

export interface Hook {
    id: string;
    name: string;
    videoUrl?: string;
    thumbnailUrl?: string;
}

export interface AwarenessLevel {
    id: string;
    name: string;
}

export interface AdFormat {
    id: string;
    name: string;
    description: string | null;
    audioChoice?: string | null;
    category?: string | null;
}

export interface Desire {
    id: string;
    name: string;
    description?: string;
    brainClicks?: string;
}

export interface Theme {
    id: string;
    name: string;
    description?: string;
}

export interface Demographic {
    id: string;
    name: string;
}

export interface Angle {
    id: string;
    name: string;
    desire: Desire;
    theme: Theme;
    demographic: Demographic;
    awarenessLevel: AwarenessLevel;
    conceptDoc?: string;
    personaScenarios?: string;
    brand?: { id: string; name: string };
}

export interface BatchItem {
    id: string;
    hookId?: string;
    hook?: Hook;
    notes?: string;
    script?: string;
    videoUrl?: string;
    videoName?: string;
    requestedDuration?: number;
    variationIndex?: string;
    format?: { id: string; name: string; description: string | null };
    status: string;
}

export interface LinkedFacebookAd {
    id: string;
    name: string;
    status: string;
    spend: number;
    roas: number;
    clicks: number;
    impressions: number;
    batchItemId?: string;
}

export interface ReferenceAd {
    id: string;
    postId: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    transcript?: string;
    facebookLink?: string;
}

export interface Batch {
    id: number;
    name: string;
    status: BatchStatus;
    batchType: BatchType;
    priority?: string;
    brief?: string;
    angle: Angle;
    brand?: { id: string; name: string };
    format?: AdFormat;
    items: BatchItem[];
    referenceAd?: ReferenceAd;
    referenceAdId?: string;
    referenceBatch?: { id: number; name: string };
    creatorBrief?: string;
    shotlist?: string;
    creatorBriefType?: string;
    mainMessaging?: string;
    strategySentence?: string;
    projectFilesUrl?: string;
    learnings?: string;
    launchedAt?: string;
    facebookAds?: LinkedFacebookAd[];
    assignedCreators?: Creator[];
    editor?: { id: string; name: string };
    strategist?: { id: string; name: string };
}

export type BatchStatus =
    | 'IDEATION'
    | 'CREATOR_BRIEFING'
    | 'FILMING'
    | 'EDITOR_BRIEFING'
    | 'EDITING'
    | 'REVIEW'
    | 'AI_BOOST'
    | 'LEARNING'
    | 'ARCHIVED'
    | 'TRASHED';

export type BatchType = 'COPYCAT' | 'NET_NEW' | 'ITERATION';

export type BatchItemStatus = 'PENDING' | 'DONE';
