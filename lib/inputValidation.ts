/**
 * Input validation utilities for security
 */

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate Korean phone number
 */
export function validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    // Remove hyphens and spaces
    const cleaned = phone.replace(/[-\s]/g, '');

    // Korean phone numbers: 010-XXXX-XXXX or 02-XXX-XXXX, etc.
    const phoneRegex = /^(01[016789]|02|0[3-9]\d)\d{3,4}\d{4}$/;
    return phoneRegex.test(cleaned) && cleaned.length >= 9 && cleaned.length <= 11;
}

/**
 * Validate coupon code format
 */
export function validateCouponCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
        return false;
    }

    // Coupon codes: 4-20 characters, alphanumeric and hyphens only
    const couponRegex = /^[A-Z0-9-]{4,20}$/;
    return couponRegex.test(code.toUpperCase());
}

/**
 * Validate string length
 */
export function validateLength(str: string, min: number, max: number): boolean {
    if (!str || typeof str !== 'string') {
        return false;
    }
    return str.length >= min && str.length <= max;
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') {
        return '';
    }

    // Remove null bytes and control characters
    return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validate numeric range
 */
export function validateNumber(value: number, min?: number, max?: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
        return false;
    }

    if (min !== undefined && value < min) {
        return false;
    }

    if (max !== undefined && value > max) {
        return false;
    }

    return true;
}

/**
 * Validate order number format
 */
export function validateOrderNumber(orderNumber: string): boolean {
    if (!orderNumber || typeof orderNumber !== 'string') {
        return false;
    }

    // Order numbers should match the format: ORD-YYYYMMDD-XXXXXX
    const orderRegex = /^ORD-\d{8}-\d{6}$/;
    return orderRegex.test(orderNumber);
}

/**
 * Validate postal code (Korean)
 */
export function validatePostalCode(postalCode: string): boolean {
    if (!postalCode || typeof postalCode !== 'string') {
        return false;
    }

    // Korean postal codes: 5 digits
    const postalRegex = /^\d{5}$/;
    return postalRegex.test(postalCode);
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
