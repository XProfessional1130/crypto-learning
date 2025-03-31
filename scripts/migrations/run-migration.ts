import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/api/supabase';

/**
 * Run the content tables migration
 */
async function runMigration() {
  try {
    console.log('Running content tables migration...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'src/scripts/migrations/content-tables.sql');
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
      
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Run directly if the script is called directly
if (require.main === module) {
  runMigration()
    .then(success => {
      if (success) {
        console.log('✅ Migration completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export { runMigration }; 