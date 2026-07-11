import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// env 미설정 시 null — 앱은 localStorage 프로토타입 모드로 동작한다.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
