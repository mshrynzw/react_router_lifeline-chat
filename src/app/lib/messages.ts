import { createSupabaseBrowserClient } from "./supabase/client";

export async function saveMessage(
  userId: string,
  role: string,
  content: string,
) {
  const supabase = createSupabaseBrowserClient();
  return await supabase.from("messages").insert({
    user_id: userId,
    role,
    content,
  });
}

export async function getMessages(userId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data;
}
