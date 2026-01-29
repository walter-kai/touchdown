import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define valid route patterns
  const validRoutes = [
    '/',
    '/games',
    '/nfl',
    '/nba',
    '/nfl/dashboard',
    '/nba/dashboard',
    '/auth/google/callback',
  ];
  
  // Check if it's a valid static route
  if (validRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check if it's a valid dynamic route pattern
  if (
    pathname.match(/^\/nfl\/game\/[^/]+$/) ||
    pathname.match(/^\/nba\/game\/[^/]+$/) ||
    pathname.match(/^\/nfl\/team\/[^/]+$/) ||
    pathname.match(/^\/nba\/team\/[^/]+$/) ||
    pathname.match(/^\/nfl\/player\/[^/]+$/) ||
    pathname.match(/^\/nba\/player\/[^/]+$/) ||
    pathname.match(/^\/user\/[^/]+$/)
  ) {
    return NextResponse.next();
  }
  
  // Redirect all other routes to home
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
