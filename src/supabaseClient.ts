import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url: string): string => {
  let cleaned = (url || '').trim();
  if (cleaned.includes('supabase.com/dashboard/project/')) {
    const projectRef = cleaned.split('project/')[1]?.split('/')[0]?.split('?')[0];
    if (projectRef) {
      cleaned = `https://${projectRef}.supabase.co`;
    }
  }
  // Eliminar barras diagonales al final
  cleaned = cleaned.replace(/\/+$/, '');
  // Eliminar sufijo /rest/v1 si fue copiado por error
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  return cleaned;
};

export const rawSupabaseUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL || '');
export const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase = (rawSupabaseUrl && rawSupabaseAnonKey) 
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey) 
  : null;
