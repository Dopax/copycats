/**
 * Centralized Type Exports
 * Import from '@/types' for all shared type definitions
 */

// Creator Types
export type {
    Creator,
    CreatorCreative,
    CreatorStatus,
    OnboardingStep,
    Demographic as CreatorDemographic,
} from './creator';

// Batch Types
export type {
    Batch,
    BatchItem,
    BatchStatus,
    BatchType,
    BatchItemStatus,
    Hook,
    AdFormat,
    Angle,
    Desire,
    Theme,
    AwarenessLevel,
    LinkedFacebookAd,
    ReferenceAd,
} from './batch';

// Ad Types
export type {
    Ad,
    AdPriority,
    AdHook,
    AdTheme,
    AdDesire,
    AdAwarenessLevel,
    AdDemographic,
} from './ad';
