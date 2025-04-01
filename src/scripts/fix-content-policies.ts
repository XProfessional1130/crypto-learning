import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Run the content policies fix migration
 */
async function fixContentPolicies() {
  try {
    console.log('Running content policies fix...');
    
    // First, create the exec_sql function
    const execSqlPath = path.join(process.cwd(), 'src/scripts/migrations/create-exec-sql-function.sql');
    const execSql = fs.readFileSync(execSqlPath, 'utf-8');
    
    console.log('Creating exec_sql function...');
    const { error: execSqlError } = await supabaseAdmin.rpc('exec_sql', { query: execSql });
    if (execSqlError) {
      console.warn('Warning: exec_sql function may already exist:', execSqlError);
    }
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'src/scripts/migrations/fix-content-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split the SQL into statements
    const statements = sql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    console.log('Content policies fix completed successfully!');
    return true;
  } catch (error) {
    console.error('Content policies fix failed:', error);
    return false;
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixContentPolicies();
}

export { fixContentPolicies }; 