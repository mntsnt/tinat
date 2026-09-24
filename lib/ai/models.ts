import type { AIResponse } from "./gemini";
import type { OpenRouterResponse } from "./openrouter";

export type AIModelId =
  | "gemini"
  | "ling-sante"
  | "nemotron"
  | "gemma-31b"
  | "nemotron-lightning"
  | "qwen-27b";

export interface AIModelInfo {
  id: AIModelId;
  name: string;
  provider: string;
  badge: string;
  description: string;
  modelCode: string;
}

export const AVAILABLE_MODELS: AIModelInfo[] = [
  {
    id: "gemini",
    name: "Google Gemini 3.6 Flash",
    provider: "Google Cloud",
    badge: "Recommended",
    description: "Fast, highly grounded clinical research synthesis and descriptive statistics",
    modelCode: "gemini-3.6-flash",
  },
  {
    id: "ling-sante",
    name: "InclusionAI: Ling 3.0 Flash Santé (free)",
    provider: "OpenRouter",
    badge: "Healthcare MoE • Free",
    description: "Specialized medicine and health-focused MoE model with 256k context window",
    modelCode: "inclusionai/ling-3.0-flash-sante:free",
  },
  {
    id: "nemotron",
    name: "NVIDIA: Nemotron 3 Ultra (free)",
    provider: "OpenRouter",
    badge: "550B MoE • Free",
    description: "High-capacity 550B MoE frontier reasoning model with 1M context window",
    modelCode: "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
  {
    id: "gemma-31b",
    name: "Google: Gemma 4 31B (free)",
    provider: "OpenRouter",
    badge: "Google DeepMind • Free",
    description: "High-precision open dense instruction-tuned model from Google DeepMind",
    modelCode: "google/gemma-4-31b-it:free",
  },
  {
    id: "nemotron-lightning",
    name: "NVIDIA: Nemotron 3.5 Lightning (free)",
    provider: "OpenRouter",
    badge: "Ultra-Fast • Free",
    description: "Low-latency 1M context MoE model from NVIDIA for rapid cohort interrogation",
    modelCode: "nvidia/nemotron-3.5-lightning:free",
  },
  {
    id: "qwen-27b",
    name: "Qwen: Qwen3.8 27B (free)",
    provider: "OpenRouter",
    badge: "Quantitative • Free",
    description: "Dense 27B model tailored for quantitative research, data patterns, and coding",
    modelCode: "qwen/qwen3.8-27b:free",
  },
];

export interface UnifiedAnalysisParams {
  modelId?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface UnifiedChatParams {
  modelId?: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "model" | "assistant"; content: string }>;
  temperature?: number;
}

export async function executeAIAnalysis(
  params: UnifiedAnalysisParams
): Promise<AIResponse | OpenRouterResponse> {
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
