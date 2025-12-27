/**
 * Creator Types
 * Centralized type definitions for Creator entities
 */

export interface Demographic {
    id: string;
    name: string;
}

export interface CreatorCreative {
    id: string;
    thumbnailUrl: string | null;
    driveFileId: string | null;
}

export interface Creator {
    id: string;
    name: string;
    country?: string;
    language?: string;
    pricePerVideo?: number;
    demographic?: Demographic | null;
    collabCount: number;
    email?: string;
    phone?: string;
    source?: string;
    messagingPlatform?: string;
    paymentMethod?: string;
    isRecurring: boolean;
    joinedAt: string;
    profileImageUrl?: string;
    creatives?: CreatorCreative[];
    onboardingStep?: string;
    status?: string;
    gender?: string;
    ageGroup?: string;
    activeBatchId?: number;
    offerType?: string;
    offerAmount?: number;
    productLink?: string;
    couponCode?: string;
    orderNumber?: string;
    magicLinkToken?: string;
}

export type CreatorStatus = 'APPLIED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type OnboardingStep = 'OFFER' | 'ORDER' | 'UPLOAD' | 'COMPLETED';
