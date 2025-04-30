// Simple pass-through middleware with no redirects or authentication checks
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Just pass through all requests without any redirects or authentication checks
  return NextResponse.next();
}

// Limit middleware to run only on specific routes if needed
export const config = {
  matcher: [
    // Skip all static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.svg).*)',
  ],
};
