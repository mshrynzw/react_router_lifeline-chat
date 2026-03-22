import { processChatRequest } from "../../src/app/lib/chat-handler.server";

type Env = {
  OPENAI_API_KEY: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  OPENAI_MODEL?: string;
};

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  return processChatRequest(context.request, {
    OPENAI_API_KEY: context.env.OPENAI_API_KEY,
    VITE_SUPABASE_URL: context.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: context.env.VITE_SUPABASE_ANON_KEY,
    OPENAI_MODEL: context.env.OPENAI_MODEL,
  });
}
