import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@comuse/shared';

export function createApiClient(url: string, anonKey: string) {
  return createSupabaseClient<Database>(url, anonKey);
}

export type SupabaseClient = ReturnType<typeof createApiClient>;
