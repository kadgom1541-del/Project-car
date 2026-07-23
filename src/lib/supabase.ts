import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env;

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://xkvlylzauvlhorgnivzc.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qH1twnm-jyUxe0TeIaNuSg_BJ313Huh';

// Check if Supabase URL is genuinely valid and not a default placeholder
const isValidSupabaseUrl = (url: string) => {
  if (!url || url.includes('your-supabase-url') || url.includes('example.supabase.co') || url.includes('YOUR_SUPABASE_URL')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = isValidSupabaseUrl(supabaseUrl) && Boolean(supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
