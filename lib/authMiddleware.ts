import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const ADMIN_EMAIL = 'master@essentia.com';

/**
 * Verify if request is from authenticated admin
 * Use this in API routes to protect sensitive operations
 */
export async function verifyAdmin(request: NextRequest): Promise<{
    isValid: boolean;
    user?: any;
    error?: string;
}> {
    try {
        // Get auth token from request headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return { isValid: false, error: 'No authentication token provided' };
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return { isValid: false, error: 'Invalid or expired token' };
        }

        // Check if user is admin
        if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return { isValid: false, error: 'Unauthorized: Admin access required' };
        }

        return { isValid: true, user };

    } catch (error) {
        console.error('Auth verification error:', error);
        return { isValid: false, error: 'Authentication failed' };
    }
}

/**
 * Check if user has specific admin permission
 */
export async function checkAdminPermission(
    userId: string,
    permission: string
): Promise<boolean> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
            .from('admin_roles')
            .select('role, permissions')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return false;
        }

        // Master has all permissions
        if (data.role === 'master') {
            return true;
        }

        // Check specific permission
        return data.permissions?.[permission] === true;

    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(message: string = 'Forbidden') {
    return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    });
}
