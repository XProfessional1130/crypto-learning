import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Mark route as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

// Create a connection pool using the DATABASE_URL from Supabase
const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// This endpoint executes raw SQL queries directly against the database
export async function POST(req: NextRequest) {
  try {
    // Check for a valid admin API key for security
    const { searchParams } = req.nextUrl;
    const apiKey = searchParams.get('api_key');
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the SQL query from the request body
    const body = await req.json();
    const { sql } = body;
    
    if (!sql) {
      return NextResponse.json({ error: 'Missing SQL query in request body' }, { status: 400 });
    }
    
    // Execute the SQL query directly using pg
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(sql);
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'SQL executed successfully',
        result
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ SQL execution error:', error);
      return NextResponse.json({ 
        error: `SQL execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error in execute-sql endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 