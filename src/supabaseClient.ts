import { createClient } from '@supabase/supabase-js';

export const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase = (rawSupabaseUrl && rawSupabaseAnonKey) 
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey) 
  : null;
