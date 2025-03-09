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
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
      return [];
    }

    return data || [];
  }

  static async getDashboardMetrics(userId: string): Promise<DashboardMetric[]> {
    const { data, error } = await supabase
      .from('dashboard_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }

    return data || [];
  }

  static async updateMetric(metric: Partial<DashboardMetric>): Promise<void> {
    const { error } = await supabase
      .from('dashboard_metrics')
      .upsert({
        ...metric,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating metric:', error);
      throw error;
    }
  }
} 