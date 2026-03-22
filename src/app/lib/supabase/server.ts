import { createServerClient } from "@supabase/ssr";

type SupabaseServerEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export function createSupabaseServerClient(
  _request: Request,
  env?: SupabaseServerEnv,
) {
  const url =
    env?.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey =
    env?.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  });
}
