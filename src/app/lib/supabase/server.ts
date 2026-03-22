import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient(_request: Request) {
  return createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    },
  );
}
