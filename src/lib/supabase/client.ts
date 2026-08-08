import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return (
    v.includes("your-project.supabase.co") ||
    v === "your-anon-key" ||
    v.startsWith("your-") ||
    v.includes("example.com")
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (isPlaceholder(url) || isPlaceholder(key)) return false;
  return true;
}

/**
 * Browser/client Supabase helper — anon key only.
 * Never import or expose a service-role key here.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
