/**
 * User Role Constants
 * Centralized role values for access control
 */

export const USER_ROLE = {
    OWNER: 'OWNER',
    VIDEO_EDITOR: 'VIDEO_EDITOR',
    CREATIVE_STRATEGIST: 'CREATIVE_STRATEGIST',
    CREATOR: 'CREATOR',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

/**
 * Role-based permissions helper
 */
export const ROLE_PERMISSIONS = {
    [USER_ROLE.OWNER]: ['*'], // Full access
    [USER_ROLE.VIDEO_EDITOR]: ['batches', 'creatives', 'hooks'],
    [USER_ROLE.CREATIVE_STRATEGIST]: ['batches', 'ads', 'tags', 'formats', 'angles'],
    [USER_ROLE.CREATOR]: ['portal'],
} as const;

export function hasAccess(role: string, resource: string): boolean {
    const permissions = ROLE_PERMISSIONS[role as UserRole];
    if (!permissions) return false;
    return (permissions as readonly string[]).includes('*') || (permissions as readonly string[]).includes(resource);
}
