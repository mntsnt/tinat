import type { AIResponse } from "./gemini";
import type { OpenRouterResponse } from "./openrouter";
import { FEATURES } from "@/lib/config/features";
import { AVAILABLE_MODELS, UnifiedAnalysisParams, UnifiedChatParams } from "./models";

export async function executeAIAnalysis(
  params: UnifiedAnalysisParams
): Promise<AIResponse | OpenRouterResponse> {
  if (!FEATURES.AI_EXTERNAL_ENABLED) {
    throw new Error(
      "External AI integration is disabled by default (AI_EXTERNAL_ENABLED=false) to protect participant health data under Proclamation 1321/2024."
    );
  }
  const modelId = (params.modelId || "gemini").toLowerCase();

  if (modelId === "gemini") {
    const { generateGeminiResponse } = await import("./gemini");
    return generateGeminiResponse({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      temperature: params.temperature,
    });
  }

  // Find selected model configuration or default to Nemotron
  const selected = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const modelCode = selected?.modelCode || (modelId.includes("/") ? modelId : "nvidia/nemotron-3-ultra-550b-a55b:free");
  const modelName = selected?.name || "AI Research Model";

  const { generateOpenRouterResponse } = await import("./openrouter");
  return generateOpenRouterResponse({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature,
    model: modelCode,
    modelName,
  });
}

export async function executeAIChat(
  params: UnifiedChatParams
): Promise<AIResponse | OpenRouterResponse> {
  if (!FEATURES.AI_EXTERNAL_ENABLED) {
    throw new Error(
      "External AI integration is disabled by default (AI_EXTERNAL_ENABLED=false) to protect participant health data under Proclamation 1321/2024."
    );
  }
  const modelId = (params.modelId || "gemini").toLowerCase();

  if (modelId === "gemini") {
    const { generateGeminiChatResponse } = await import("./gemini");
    return generateGeminiChatResponse({
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      temperature: params.temperature,
    });
  }

  const selected = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const modelCode = selected?.modelCode || (modelId.includes("/") ? modelId : "nvidia/nemotron-3-ultra-550b-a55b:free");
  const modelName = selected?.name || "AI Research Model";

  const { generateOpenRouterChatResponse } = await import("./openrouter");
  return generateOpenRouterChatResponse({
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    temperature: params.temperature,
    model: modelCode,
    modelName,
  });
}
