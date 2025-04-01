import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/api/supabase';

export interface Content {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: 'draft' | 'published' | 'scheduled';
  visibility: 'public' | 'members' | 'paid';
  type: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  og_title: string;
  og_description: string;
  twitter_image: string;
  twitter_title: string;
  twitter_description: string;
  canonical_url: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  view_count: number;
  like_count: number;
  share_count: number;
}

export function useContent(
  page = 1, 
  limit = 9,
  filters?: { 
    searchTerm?: string;
    type?: string;
  }
) {
  return useQuery<{ data: Content[]; count: number; hasMore: boolean }>({
    queryKey: ['content', page, limit, filters?.searchTerm, filters?.type],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('content')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'All') {
        query = query.eq('type', filters.type);
      }

      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,excerpt.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error('Error fetching content:', error);
        throw error;
      }

      return {
        data: data || [],
        count: count || 0,
        hasMore: count ? from + limit < count : false
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useContentByType(type: string) {
  return useQuery<Content[]>({
    queryKey: ['content', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', type)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useContentTypes() {
  return useQuery<string[]>({
    queryKey: ['contentTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('type')
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching content types:', error);
        throw error;
      }

      const types = ['All', ...Array.from(new Set(data?.map(item => item.type) || []))];
      return types;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
} 