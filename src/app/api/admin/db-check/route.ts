import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Skip the user client and just use admin client directly
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Check profiles with admin client
    const { data: adminProfiles, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    
    if (adminError) {
      return NextResponse.json({
        error: 'Admin query error',
        details: adminError.message
      }, { status: 500 });
    }
    
    // Check if we have any profiles at all
    if (!adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({
        message: 'No profiles found in database',
        count: 0
      });
    }
    
    return NextResponse.json({
      message: 'Profiles found using admin client',
      count: adminProfiles.length,
      profiles: adminProfiles.map(p => ({ 
        id: p.id,
        email: p.email,
        role: p.role 
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 