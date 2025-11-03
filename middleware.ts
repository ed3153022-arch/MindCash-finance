import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/settings'];
    const authRoutes = ['/auth/signin', '/auth/signup'];
    
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );
    
    const isAuthRoute = authRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // If user is authenticated and trying to access auth routes
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};