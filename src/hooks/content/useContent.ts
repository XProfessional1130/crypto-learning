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
    type?: string;  // We'll use this for category filtering
  }
) {
  return useQuery<{ data: Content[]; count: number; hasMore: boolean }>({
    queryKey: ['content', page, limit, filters?.searchTerm, filters?.type],
    queryFn: async () => {
      console.log(`Fetching content for page ${page}, limit ${limit}, type ${filters?.type}`);
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('content')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'All') {
        // Instead of filtering by type, filter by category
        // First get the category ID by name
        const { data: categoryData, error: categoryError } = await supabase
          .from('content_categories')
          .select('id')
          .eq('name', filters.type)
          .single();

        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          throw categoryError;
        }

        if (categoryData) {
          // Then get content IDs from the junction table
          const { data: contentRelations, error: relationsError } = await supabase
            .from('content_to_categories')
            .select('content_id')
            .eq('category_id', categoryData.id);

          if (relationsError) {
            console.error('Error fetching content relations:', relationsError);
            throw relationsError;
          }

          if (contentRelations && contentRelations.length > 0) {
            // Extract content IDs and filter the main query by these IDs
            const contentIds = contentRelations.map(item => item.content_id);
            query = query.in('id', contentIds);
          } else {
            // No content with this category, return empty result early
            return {
              data: [],
              count: 0,
              hasMore: false
            };
          }
        }
      }

      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,excerpt.ilike.%${filters.searchTerm}%`);
      }

      // Execute the query with improved error handling
      try {
        console.log(`Executing query for page ${page}, range ${from}-${to}`);
        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error('Error fetching content:', error);
          throw error;
        }

        // Log the results for debugging
        console.log(`Fetched ${data?.length || 0} resources, total count: ${count || 0}`);

        return {
          data: data || [],
          count: count || 0,
          hasMore: count ? from + limit < count : false
        };
      } catch (error) {
        console.error('Unexpected error in content fetch:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false,       // Don't refetch when component mounts if data exists
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
      // Fetch categories from the content_categories table
      const { data, error } = await supabase
        .from('content_categories')
        .select('name')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // Extract category names from the results
      const categories = data?.map(category => category.name) || [];
      
      // If no categories exist in the database, provide default ones
      if (categories.length === 0) {
        return ['All', 'tutorial', 'guide', 'course', 'article'];
      }
      
      // Add 'All' as the first option
      return ['All', ...categories];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
} 