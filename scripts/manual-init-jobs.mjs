/**
 * Simple script to manually trigger job initialization
 * 
 * Run with:
 * node scripts/manual-init-jobs.mjs
 */

import fetch from 'node-fetch';

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'local-dev-only';

// This would normally be called by a Vercel cron job
async function main() {
  try {
    console.log('Triggering job initialization...');
    
    // Trigger the init-jobs API
    const response = await fetch(`${API_URL}/api/cron/init-jobs`, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Job initialization response:', result);
    
    // Wait a moment for the jobs to be set up
    console.log('Waiting a few seconds before triggering job processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now trigger job processing
    console.log('Triggering job processing...');
    const processResponse = await fetch(`${API_URL}/api/cron/process-jobs`, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    if (!processResponse.ok) {
      throw new Error(`API returned ${processResponse.status}: ${processResponse.statusText}`);
    }
    
    const processResult = await processResponse.json();
    console.log('Job processing response:', processResult);
    
    console.log('Job setup and processing complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 