import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { generateAIResponse } from "./ai.server";
import { createSupabaseServerClient } from "./supabase/server";

const SYSTEM_MESSAGE: ResponseInputItem = {
  role: "system",
  content: "You are a compassionate AI counselor.",
};

export type ChatHandlerEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  OPENAI_API_KEY?: string;
  /** OpenAI Responses API のモデル ID（未設定時は process.env.OPENAI_MODEL → gpt-5.4-nano） */
  OPENAI_MODEL?: string;
};

function resolveSupabaseEnv(
  env?: ChatHandlerEnv,
): Pick<ChatHandlerEnv, "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"> {
  return {
    VITE_SUPABASE_URL:
      env?.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      env?.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  };
}

function toInputMessages(
  rows: { role: string; content: string }[],
): ResponseInputItem[] {
  return rows.map((row) => {
    const role = row.role;
    if (role !== "user" && role !== "assistant" && role !== "system") {
      return {
        role: "user" as const,
        content: row.content,
      };
    }
    return {
      role,
      content: row.content,
    };
  });
}

export async function processChatRequest(
  request: Request,
  env?: ChatHandlerEnv,
) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { userId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const content = body.content?.trim();
  if (!userId || !content) {
    return Response.json(
      { error: "userId and content are required" },
      { status: 400 },
    );
  }

  const supabaseEnv = resolveSupabaseEnv(env);
  if (!supabaseEnv.VITE_SUPABASE_URL || !supabaseEnv.VITE_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Missing Supabase configuration" },
      { status: 500 },
    );
  }

  const apiKey = env?.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient(request, supabaseEnv);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase init failed";
    return Response.json({ error: message }, { status: 500 });
  }

  const openaiClient = new OpenAI({ apiKey });

  const { error: insertUserErr } = await supabase.from("messages").insert({
    user_id: userId,
    role: "user",
    content,
  });
  if (insertUserErr) {
    return Response.json({ error: insertUserErr.message }, { status: 500 });
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (fetchErr) {
    return Response.json({ error: fetchErr.message }, { status: 500 });
  }

  const inputMessages: ResponseInputItem[] = [
    SYSTEM_MESSAGE,
    ...toInputMessages(
      (rows ?? []).filter(
        (r) => r.role === "user" || r.role === "assistant",
      ),
    ),
  ];

  let aiText: string;
  try {
    aiText = await generateAIResponse(inputMessages, openaiClient, {
      model: env?.OPENAI_MODEL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return Response.json({ error: message }, { status: 500 });
  }

  const { error: insertAsstErr } = await supabase.from("messages").insert({
    user_id: userId,
    role: "assistant",
    content: aiText,
  });
  if (insertAsstErr) {
    return Response.json({ error: insertAsstErr.message }, { status: 500 });
  }

  return Response.json({ content: aiText });
}
