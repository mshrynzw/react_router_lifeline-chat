import type OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { openai } from "./openai.server";

/** Responses API のモデル ID（例: gpt-5.4-nano） */
const DEFAULT_MODEL = "gpt-5.4-nano";

export type GenerateAIResponseOptions = {
  model?: string;
};

export async function generateAIResponse(
  messages: ResponseInputItem[],
  client: OpenAI = openai,
  options?: GenerateAIResponseOptions,
) {
  const model =
    options?.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    input: messages,
  });

  return response.output_text ?? "";
}
