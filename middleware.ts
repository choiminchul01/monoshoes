import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const res = NextResponse.next()

    // /admin 경로만 보호
    if (request.nextUrl.pathname.startsWith('/admin')) {
        try {
            const supabase = createMiddlewareClient({ req: request, res })

            // 세션 확인
            const { data: { session } } = await supabase.auth.getSession()

            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            if (!session) {
                console.log('[Middleware] No session, redirecting to /admin-login')
                return NextResponse.redirect(new URL('/admin-login', request.url))
            }

            // 관리자 권한 확인
            const { data: adminRole, error } = await supabase
                .from('admin_roles')
                .select('role, permissions')
                .eq('user_id', session.user.id)
                .single()

            // 관리자가 아닌 경우 홈으로 리다이렉트
            if (error || !adminRole) {
                console.log('[Middleware] No admin role found, redirecting to /')
                return NextResponse.redirect(new URL('/', request.url))
            }

            // dashboard 권한 확인 (기본 관리자 페이지 접근 권한)
            const hasAccess = adminRole.role === 'master' || adminRole.permissions?.dashboard === true

            if (!hasAccess) {
                console.log('[Middleware] No dashboard permission, redirecting to /')
                return NextResponse.redirect(new URL('/', request.url))
            }

            console.log(`[Middleware] Admin access granted for user: ${session.user.email}`)

        } catch (error) {
            console.error('[Middleware] Error checking auth:', error)
            // 에러 발생 시 안전하게 로그인 페이지로 리다이렉트
            return NextResponse.redirect(new URL('/admin-login', request.url))
        }
    }

    return res
}

// 미들웨어가 적용될 경로 설정
export const config = {
    matcher: [
        // /admin으로 시작하는 모든 경로 (admin-login 제외)
        '/admin/:path*',
    ]
}
