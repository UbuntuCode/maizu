const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

/**
 * Supabase ADMIN client — service role key.
 * This bypasses RLS. Use ONLY in the backend.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabaseAdmin };
