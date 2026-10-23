/*
| Supabase client — the single connection to the backend.
| Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env
| (Supabase Dashboard → Project Settings → API). The anon key is safe in the
| browser: every table is protected by Row Level Security (see supabase/schema.sql).
*/
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url || "http://localhost:54321",
  anonKey || "missing-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

export const errMsg = (e) => e?.message || "Something went wrong";
