import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeFirstAdmin(email: string) {
  try {
    // First, get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`No user found with email: ${email}`);
    }

    // Update the user's role in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully made ${email} an admin!`);
    return true;
  } catch (error) {
    console.error('Error making first admin:', error);
    return false;
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument');
  console.error('Usage: npm run create-first-admin your.email@example.com');
  process.exit(1);
}

makeFirstAdmin(email)
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }); 