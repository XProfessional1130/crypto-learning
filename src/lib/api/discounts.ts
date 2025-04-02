import { createAdminClient } from './supabase';

export interface Discount {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export async function getDiscounts(): Promise<{ data: Discount[] | null; error: Error | null }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function getDiscountsByCategory(category: string): Promise<{ data: Discount[] | null; error: Error | null }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function searchDiscounts(searchTerm: string): Promise<{ data: Discount[] | null; error: Error | null }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
} 