import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client (uses anon key + user session via localStorage).
// Safe to import in Client Components.
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
