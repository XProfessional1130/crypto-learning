import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Set response headers to prevent caching
const setCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return setCorsHeaders(
        NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Log attempt to send
    console.log(`Attempting to send magic link to: ${email}`);

    try {
      // Try to generate a link
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (error) {
        console.error('Supabase error generating link:', error);
        return setCorsHeaders(
          NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        );
      }

      // Success! We got a link back from Supabase
      console.log('Magic link generated successfully');
      
      return setCorsHeaders(
        NextResponse.json(
          { success: true, message: 'Magic link sent!' },
          { status: 200 }
        )
      );
    } catch (linkError) {
      console.error('Caught error generating link:', linkError);
      return setCorsHeaders(
        NextResponse.json(
          { error: 'Failed to generate magic link' },
          { status: 500 }
        )
      );
    }
  } catch (e) {
    console.error('General API error:', e);
    return setCorsHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
} 