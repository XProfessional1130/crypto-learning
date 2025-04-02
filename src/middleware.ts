import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.next();
  
  // Create a Supabase client specific to this middleware
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Handle auth errors on homepage
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
  
  // Protect admin routes (both UI and API)
  if (url.pathname.startsWith('/admin-platform') || url.pathname.startsWith('/api/admin')) {
    try {
      // Verify the user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not authenticated, redirect to login
        return NextResponse.redirect(
          new URL(`/auth/signin?redirect=${encodeURIComponent(url.pathname)}`, request.url)
        );
      }
      
      // Check if the user has admin role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (error || profile?.role !== 'admin') {
        // User is not an admin, redirect to unauthorized page
        return NextResponse.redirect(
          new URL('/unauthorized', request.url)
        );
      }
    } catch (error) {
      console.error('Error in admin middleware:', error);
      // On error, redirect to error page
      return NextResponse.redirect(
        new URL('/error?message=Authentication%20failed', request.url)
      );
    }
  }
  
  return response;
}

// Update matcher to include all admin routes
export const config = {
  matcher: [
    '/',
    '/admin-platform/:path*',
    '/api/admin/:path*'
  ],
}; 