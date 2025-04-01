import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

export async function GET() {
  try {
    // Insert a sample content record
    const { data, error } = await supabase
      .from('content')
      .insert({
        title: 'Sample Content for Testing',
        slug: 'sample-content-testing',
        content: '<h2>This is a sample content</h2><p>This is used for testing the content editor.</p><ul><li>List item 1</li><li>List item 2</li></ul>',
        type: 'article',
        status: 'draft',
        visibility: 'public',
        excerpt: 'A sample content for testing purposes',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting sample content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
}