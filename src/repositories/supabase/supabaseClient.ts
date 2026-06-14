import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

type ViteImportMeta = ImportMeta & {
  env: Record<string, string | undefined>;
};

const getRequiredEnv = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') => {
  const value = (import.meta as ViteImportMeta).env[key];
  if (!value) {
    throw new Error(`Missing ${key}. Copy .env.example to .env.local and set the Supabase client value before using the Supabase repository.`);
  }
  return value;
};

export const getSupabaseClient = () => {
  if (!cachedClient) {
    cachedClient = createClient(
      getRequiredEnv('VITE_SUPABASE_URL'),
      getRequiredEnv('VITE_SUPABASE_ANON_KEY'),
    );
  }

  return cachedClient;
};
