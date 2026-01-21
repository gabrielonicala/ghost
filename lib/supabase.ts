import { createClient } from "@supabase/supabase-js";

// For server-side operations, we'll use the service role key
// For now, we'll use the publishable key but this should be service role for admin ops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Create Supabase client for direct database access
// Don't throw error here - let it fail gracefully if vars aren't set
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: "public",
      },
      auth: {
        persistSession: false,
      },
    })
  : null;

