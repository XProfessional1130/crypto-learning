import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  
  // Only run on the homepage when there are auth errors in hash
  if (url.pathname === '/' && url.hash.includes('error')) {
    // Extract error from hash
    const hash = url.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const errorDesc = hashParams.get('error_description') || 'Authentication error';
    const errorType = hashParams.get('error') || '';
    
    // Redirect to sign-in with error
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(errorType)}&message=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }
  
  return NextResponse.next();
}

// Only run the middleware on the homepage
export const config = {
  matcher: '/',
}; 