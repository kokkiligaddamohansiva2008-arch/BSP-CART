import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
/**
 * Avoid a TypeError when local Vite env variables are missing.
 * Real Vercel environments with configured credentials keep using the
 * exact same Supabase client; this does not change its configuration.
 */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured for this build. Copy frontend/.env.example " +
      "to frontend/.env.local, check VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY, then restart npm run dev."
    );
  }
  return supabase;
}
