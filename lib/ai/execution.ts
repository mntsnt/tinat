import type { AIResponse } from "./gemini";
import { FEATURES } from "@/lib/config/features";
import { UnifiedAnalysisParams, UnifiedChatParams } from "./models";

export async function executeAIAnalysis(
  params: UnifiedAnalysisParams
): Promise<AIResponse> {
  if (!FEATURES.AI_EXTERNAL_ENABLED) {
    throw new Error(
      "External AI integration is disabled by default (AI_EXTERNAL_ENABLED=false) to protect participant health data under Proclamation 1321/2024."
    );
  }

  const { generateGeminiResponse } = await import("./gemini");
  return generateGeminiResponse({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature,
    model: "gemini-3.6-flash",
  });
}

export async function executeAIChat(
  params: UnifiedChatParams
): Promise<AIResponse> {
  if (!FEATURES.AI_EXTERNAL_ENABLED) {
    throw new Error(
      "External AI integration is disabled by default (AI_EXTERNAL_ENABLED=false) to protect participant health data under Proclamation 1321/2024."
    );
  }

  const { generateGeminiChatResponse } = await import("./gemini");
  return generateGeminiChatResponse({
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    temperature: params.temperature,
    model: "gemini-3.6-flash",
  });
}
