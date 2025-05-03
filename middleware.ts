import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ['/idea', '/training', '/summary', '/map', '/insight'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client specific to middleware
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // --- Route Protection Logic ---

  // 1. If user is not logged in and trying to access a protected route
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Redirect them to the login page
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // You can add a query param to redirect back after login if needed
    // redirectUrl.searchParams.set(`redirectedFrom`, pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. If user is logged in and trying to access the login page
  if (session && pathname === '/login') {
    // Redirect them to the default authenticated page (e.g., /idea)
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/idea';
    return NextResponse.redirect(redirectUrl);
  }

  // --- End of Route Protection Logic ---

  // If none of the above conditions met, allow the request to proceed
  return res;
}

// Configure the middleware to run on specific paths
// This prevents it from running on API routes, static files, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 