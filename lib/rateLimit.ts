/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production, consider using Redis (Upstash) for distributed rate limiting
 */

interface RateLimitEntry {
    timestamps: number[];
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    for (const [key, entry] of rateLimitStore.entries()) {
        entry.timestamps = entry.timestamps.filter(t => t > tenMinutesAgo);
        if (entry.timestamps.length === 0) {
            rateLimitStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
}

export interface RateLimitOptions {
    /**
     * Maximum number of requests allowed in the time window
     */
    limit?: number;

    /**
     * Time window in milliseconds
     */
    windowMs?: number;

    /**
     * Custom identifier (defaults to IP address)
     */
    identifier?: string;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
    // Try to get real IP from various headers (for proxies/CDNs)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to a default (not ideal, but works for basic rate limiting)
    return 'unknown';
}

/**
 * Rate limit a request
 * @param request - The incoming request
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export async function rateLimit(
    request: Request,
    options: RateLimitOptions = {}
): Promise<RateLimitResult> {
    const {
        limit = 10,
        windowMs = 60 * 1000, // 1 minute default
        identifier
    } = options;

    // Get identifier (IP address or custom)
    const key = identifier || getClientIP(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        rateLimitStore.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Check if limit exceeded
    if (entry.timestamps.length >= limit) {
        const oldestTimestamp = entry.timestamps[0];
        const resetTime = oldestTimestamp + windowMs;

        return {
            success: false,
            limit,
            remaining: 0,
            resetTime
        };
    }

    // Add current timestamp
    entry.timestamps.push(now);

    return {
        success: true,
        limit,
        remaining: limit - entry.timestamps.length,
        resetTime: now + windowMs
    };
}

/**
 * Preset rate limiters for common use cases
 */
export const RateLimitPresets = {
    /**
     * Strict rate limit for sensitive operations (e.g., login, password reset)
     * 5 requests per minute
     */
    strict: (request: Request, identifier?: string) =>
        rateLimit(request, { limit: 5, windowMs: 60 * 1000, identifier }),

    /**
     * Moderate rate limit for API calls
     * 30 requests per minute
     */
    moderate: (request: Request, identifier?: string) =>
        rateLimit(request, { limit: 30, windowMs: 60 * 1000, identifier }),

    /**
     * Lenient rate limit for public endpoints
     * 60 requests per minute
     */
    lenient: (request: Request, identifier?: string) =>
        rateLimit(request, { limit: 60, windowMs: 60 * 1000, identifier }),

    /**
     * Email sending rate limit
     * 3 emails per 5 minutes
     */
    email: (request: Request, identifier?: string) =>
        rateLimit(request, { limit: 3, windowMs: 5 * 60 * 1000, identifier }),
};
