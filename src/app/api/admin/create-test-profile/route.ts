import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Check if profiles exist
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      return NextResponse.json({
        error: 'Failed to check profiles',
        details: countError.message
      }, { status: 500 });
    }
    
    // If profiles already exist, just return
    if (count && count > 0) {
      return NextResponse.json({
        message: 'Profiles already exist',
        count
      });
    }
    
    // Create a test profile
    const userId = uuidv4();
    const email = 'test@example.com';
    
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create test profile',
        details: insertError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Test profile created successfully',
      profile: newProfile
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 