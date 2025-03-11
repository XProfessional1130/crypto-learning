import { CacheService } from './cache-service';
import { createServiceClient } from '@/lib/supabase';

// Job types
export enum JobType {
  CACHE_CLEANUP = 'cache_cleanup',
  UPDATE_TOP_COINS = 'update_top_coins',
  UPDATE_GLOBAL_DATA = 'update_global_data',
  UPDATE_NEWS = 'update_news'
}

// Job status
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Job record interface
export interface Job {
  id: string;
  job_type: string;
  status: string;
  data?: any;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
  scheduled_for: string;
  completed_at?: string;
}

/**
 * Service to schedule and execute background jobs
 */
export class JobScheduler {
  /**
   * Schedule a job to run at a specified time
   */
  static async scheduleJob(
    jobType: JobType, 
    data: any = {}, 
    scheduledFor: Date = new Date()
  ): Promise<string | null> {
    try {
      const adminClient = createServiceClient();
      
      const { data: job, error } = await adminClient
        .from('background_jobs')
        .insert({
          job_type: jobType,
          status: JobStatus.PENDING,
          data,
          scheduled_for: scheduledFor.toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      return job.id;
    } catch (error) {
      console.error(`Error scheduling job (${jobType}):`, error);
      return null;
    }
  }
  
  /**
   * Get and process pending jobs
   * This should be called by a serverless function on a schedule
   */
  static async processPendingJobs(): Promise<number> {
    try {
      const adminClient = createServiceClient();
      
      // Get pending jobs that are due
      const { data: jobs, error } = await adminClient
        .from('background_jobs')
        .select('*')
        .eq('status', JobStatus.PENDING)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(10); // Process in batches
      
      if (error) {
        throw error;
      }
      
      if (!jobs || jobs.length === 0) {
        return 0;
      }
      
      // Process each job
      const processPromises = jobs.map(job => this.processJob(job));
      await Promise.all(processPromises);
      
      return jobs.length;
    } catch (error) {
      console.error('Error processing pending jobs:', error);
      return 0;
    }
  }
  
  /**
   * Process a single job
   */
  private static async processJob(job: Job): Promise<void> {
    const adminClient = createServiceClient();
    
    try {
      // Mark job as running
      await adminClient
        .from('background_jobs')
        .update({ status: JobStatus.RUNNING })
        .eq('id', job.id);
      
      let result: any = null;
      
      // Execute job based on type
      switch (job.job_type) {
        case JobType.CACHE_CLEANUP:
          result = await CacheService.cleanupExpiredEntries();
          break;
          
        case JobType.UPDATE_TOP_COINS:
          result = await this.updateTopCoins();
          break;
          
        case JobType.UPDATE_GLOBAL_DATA:
          result = await this.updateGlobalData();
          break;
          
        case JobType.UPDATE_NEWS:
          result = await this.updateNews();
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }
      
      // Mark job as completed
      await adminClient
        .from('background_jobs')
        .update({
          status: JobStatus.COMPLETED,
          result,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      // Schedule next run for recurring jobs
      await this.scheduleNextRun(job);
      
    } catch (error) {
      console.error(`Error processing job ${job.id} (${job.job_type}):`, error);
      
      // Mark job as failed
      await adminClient
        .from('background_jobs')
        .update({
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
        
      // Still schedule next run even if failed
      await this.scheduleNextRun(job);
    }
  }
  
  /**
   * Schedule the next run for recurring jobs
   */
  private static async scheduleNextRun(job: Job): Promise<void> {
    const nextRun = new Date();
    
    // Determine next run schedule based on job type
    switch (job.job_type) {
      case JobType.CACHE_CLEANUP:
        // Run every hour
        nextRun.setHours(nextRun.getHours() + 1);
        break;
        
      case JobType.UPDATE_TOP_COINS:
        // Run every 30 minutes
        nextRun.setMinutes(nextRun.getMinutes() + 30);
        break;
        
      case JobType.UPDATE_GLOBAL_DATA:
        // Run every hour
        nextRun.setHours(nextRun.getHours() + 1);
        break;
        
      case JobType.UPDATE_NEWS:
        // Run every 15 minutes
        nextRun.setMinutes(nextRun.getMinutes() + 15);
        break;
        
      default:
        // Not a recurring job
        return;
    }
    
    // Schedule next run
    await this.scheduleJob(job.job_type as JobType, job.data, nextRun);
  }
  
  /**
   * Update top coins via API
   */
  private static async updateTopCoins(): Promise<any> {
    try {
      // We're simulating the API call processing here
      // In a real implementation, you would call the actual CoinMarketCap API
      // or whatever external API is used
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/coin-list?limit=200`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update top coins');
      }
      
      return { count: result.data?.length || 0 };
    } catch (error) {
      console.error('Error updating top coins:', error);
      throw error;
    }
  }
  
  /**
   * Update global market data
   */
  private static async updateGlobalData(): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/global-data`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update global data');
      }
      
      return { updated: true };
    } catch (error) {
      console.error('Error updating global data:', error);
      throw error;
    }
  }
  
  /**
   * Update crypto news
   */
  private static async updateNews(): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/crypto-news`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      return { count: result.newsItems?.length || 0 };
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
  }
} 