import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
  );
}

/**
 * Browser Supabase client — uses the anon key.
 * Safe to use in frontend components.
 * RLS policies protect data automatically.
 */
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,   // keeps user logged in after page refresh
    autoRefreshToken:  true,   // refreshes token before it expires
    detectSessionInUrl: true,  // handles magic link / OAuth redirects
  },
});

/** Helper: get current session's access token (send to Express) */
export const getAccessToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

/** Helper: get the current logged-in user (from local session) */
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};
