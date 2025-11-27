import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    // For now, we'll do client-side auth checking in the admin layout
    // This middleware just ensures the routes exist
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/mypage/:path*'],
};
