/**
 * API Utilities
 * Standardized helpers for API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error response
 */
export function apiError(message: string, status = 500) {
    console.error(`[API Error] ${message}`);
    return NextResponse.json({ error: message }, { status });
}

/**
 * Validation error response (from Zod)
 */
export function validationError(error: ZodError) {
    return NextResponse.json(
        {
            error: 'Validation failed',
            details: error.flatten().fieldErrors
        },
        { status: 400 }
    );
}

/**
 * Not found response
 */
export function notFound(resource = 'Resource') {
    return NextResponse.json(
        { error: `${resource} not found` },
        { status: 404 }
    );
}

/**
 * Success response
 */
export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

/**
 * Parse and validate request body with Zod
 */
export async function parseBody<T>(
    request: Request,
    schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } }
): Promise<{ data: T } | { error: NextResponse }> {
    try {
        const rawData = await request.json();
        const parsed = schema.safeParse(rawData);

        if (!parsed.success) {
            return { error: validationError(parsed.error!) };
        }

        return { data: parsed.data as T };
    } catch (e) {
        return { error: apiError('Invalid JSON body', 400) };
    }
}
