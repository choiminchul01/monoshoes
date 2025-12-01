import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only

// URL 보정: https:// 가 없으면 자동으로 추가하고 공백 제거
const rawUrl = supabaseUrl?.trim();
const validSupabaseUrl = rawUrl?.startsWith('http')
    ? rawUrl
    : `https://${rawUrl}`

const validAnonKey = supabaseAnonKey?.trim();

if (!rawUrl) {
    console.error('Supabase URL is missing in environment variables!');
} else {
    // Validate Supabase anon key
    if (!validAnonKey) {
        console.error('Supabase ANON key is missing in environment variables!');
    }
}

if (typeof window === 'undefined') {
    if (!supabaseServiceKey) {
        console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing on server side! Admin operations will fail.');
    } else {
        console.log('✅ SUPABASE_SERVICE_ROLE_KEY loaded successfully.');
    }
}

// Regular client for client-side operations
export const supabase = createClient(validSupabaseUrl, validAnonKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey
    ? createClient(validSupabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : supabase; // Fallback to regular client on client-side

// Helper types for our database
export type Database = {
    products: {
        id: string
        name: string
        brand: string
        price: number
        category: string
        images: string[]
        description: string
        stock: number
        created_at: string
        updated_at: string
    }
    orders: {
        id: string
        order_number: string
        customer_name: string
        customer_email: string
        customer_phone: string
        customer_postal_code: string
        customer_address: string
        customer_address_detail: string
        customer_memo: string
        shipping_same_as_customer: boolean
        shipping_name: string
        shipping_phone: string
        shipping_postal_code: string
        shipping_address: string
        shipping_address_detail: string
        shipping_memo: string
        total_amount: number
        discount_amount: number
        shipping_cost: number
        final_amount: number
        coupon_code: string | null
        payment_status: 'pending' | 'confirmed' | 'cancelled'
        order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
        created_at: string
    }
    order_items: {
        id: string
        order_id: string
        product_id: string
        product_name: string
        product_brand: string
        quantity: number
        price: number
        color: string
        size: string
        image: string
    }
    reviews: {
        id: string
        product_id: string
        user_id: string | null
        order_id: string | null
        author_name: string | null
        rating: number
        content: string | null
        image_url: string | null
        is_admin_created: boolean
        created_at: string
    }
    inquiries: {
        id: string
        user_id: string | null
        type: 'general' | 'request'
        title: string
        content: string
        image_url: string | null
        is_private: boolean
        status: 'pending' | 'answered'
        answer: string | null
        answered_at: string | null
        created_at: string
    }
    notices: {
        id: string
        title: string
        content: string
        is_important: boolean
        view_count: number
        created_at: string
    }
    faqs: {
        id: string
        category: string
        question: string
        answer: string
        display_order: number
        created_at: string
    }
    coupons: {
        id: string
        code: string
        name: string
        description: string | null
        type: 'percentage' | 'fixed'
        discount_value: number
        min_order_amount: number
        max_discount_amount: number | null
        usage_limit: number | null
        usage_per_user: number
        valid_from: string
        valid_until: string | null
        is_active: boolean
        created_at: string
    }
    coupon_usages: {
        id: string
        coupon_id: string
        user_id: string
        order_id: string | null
        discount_amount: number
        used_at: string
    }
    user_coupons: {
        id: string
        user_id: string
        coupon_id: string
        is_used: boolean
        issued_at: string
    }
    user_points: {
        user_id: string
        balance: number
        total_earned: number
        total_used: number
        updated_at: string
    }
    point_transactions: {
        id: string
        user_id: string
        type: 'earn' | 'use' | 'expire' | 'admin'
        amount: number
        balance_after: number
        description: string
        order_id: string | null
        expires_at: string | null
        created_at: string
    }
    product_qna: {
        id: string
        product_id: string
        user_id: string | null
        author_name: string | null
        question: string
        answer: string | null
        is_private: boolean
        is_answered: boolean
        answered_at: string | null
        created_at: string
    }
}
