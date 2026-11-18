import type { AIResponse } from "./gemini";
import { FEATURES } from "@/lib/config/features";
import { getAIModel, UnifiedAnalysisParams, UnifiedChatParams } from "./models";
import { getProviderForModel } from "./providers";

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

  const model = getAIModel(params.modelId);
  if (!model) {
    throw new Error("The selected AI model is not available.");
  }

  const provider = getProviderForModel(model.id);
  return provider.chat(
    params.messages.map((message) => ({
      role: message.role === "model" ? "assistant" : message.role,
      content: message.content,
    })),
    {
      model: model.modelCode,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
    }
  );
}
