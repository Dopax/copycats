/**
 * Status Constants
 * Centralized status values to avoid magic strings
 */

export const BATCH_STATUS = {
    IDEATION: 'IDEATION',
    CREATOR_BRIEFING: 'CREATOR_BRIEFING',
    FILMING: 'FILMING',
    EDITOR_BRIEFING: 'EDITOR_BRIEFING',
    EDITING: 'EDITING',
    REVIEW: 'REVIEW',
    AI_BOOST: 'AI_BOOST',
    LEARNING: 'LEARNING',
    ARCHIVED: 'ARCHIVED',
    TRASHED: 'TRASHED',
} as const;

export const BATCH_STATUS_FLOW = [
    BATCH_STATUS.IDEATION,
    BATCH_STATUS.CREATOR_BRIEFING,
    BATCH_STATUS.FILMING,
    BATCH_STATUS.EDITOR_BRIEFING,
    BATCH_STATUS.EDITING,
    BATCH_STATUS.REVIEW,
    BATCH_STATUS.AI_BOOST,
    BATCH_STATUS.LEARNING,
    BATCH_STATUS.ARCHIVED,
] as const;

export const BATCH_TYPE = {
    COPYCAT: 'COPYCAT',
    NET_NEW: 'NET_NEW',
    ITERATION: 'ITERATION',
} as const;

export const BATCH_ITEM_STATUS = {
    PENDING: 'PENDING',
    DONE: 'DONE',
} as const;

export const CREATOR_STATUS = {
    APPLIED: 'APPLIED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ARCHIVED: 'ARCHIVED',
} as const;

export const ONBOARDING_STEP = {
    OFFER: 'OFFER',
    ORDER: 'ORDER',
    UPLOAD: 'UPLOAD',
    COMPLETED: 'COMPLETED',
} as const;

export const AD_PRIORITY = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
} as const;
