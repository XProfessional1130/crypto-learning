import { supabase } from '@/lib/supabase';

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'video' | 'course';
  created_at: string;
  updated_at: string;
}

export interface DashboardMetric {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  timestamp: string;
}

export class DatabaseService {
  static async getResources(): Promise<Resource[]> {
    try {
      console.log('Fetching resources from Supabase...');
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch resources: ${error.message}`);
      }

      console.log('Resources fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getResources:', error);
      throw error;
    }
  }

  static async getDashboardMetrics(userId: string): Promise<DashboardMetric[]> {
    try {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch metrics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      throw error;
    }
  }

  static async updateMetric(metric: Partial<DashboardMetric>): Promise<void> {
    try {
      const { error } = await supabase
        .from('dashboard_metrics')
        .upsert({
          ...metric,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update metric: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateMetric:', error);
      throw error;
    }
  }
} 