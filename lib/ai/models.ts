import { generateGeminiResponse, generateGeminiChatResponse, AIResponse } from "./gemini";
import {
  generateOpenRouterResponse,
  generateOpenRouterChatResponse,
  OpenRouterResponse,
} from "./openrouter";

export type AIModelId = "gemini" | "nemotron";

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
    id: "nemotron",
    name: "NVIDIA: Nemotron 3 Ultra (free)",
    provider: "OpenRouter",
    badge: "550B MoE • Free",
    description: "High-capacity 550B MoE reasoning model via OpenRouter (powered by TINAT_AI_KEY)",
    modelCode: "nvidia/nemotron-3-ultra-550b-a55b:free",
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
  const model = (params.modelId || "gemini").toLowerCase();

  if (model === "nemotron" || model.includes("nemotron") || model.includes("nvidia")) {
    return generateOpenRouterResponse({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      temperature: params.temperature,
    });
  }

  // Default to Gemini
  return generateGeminiResponse({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature,
  });
}

export async function executeAIChat(
  params: UnifiedChatParams
): Promise<AIResponse | OpenRouterResponse> {
  const model = (params.modelId || "gemini").toLowerCase();

  if (model === "nemotron" || model.includes("nemotron") || model.includes("nvidia")) {
    return generateOpenRouterChatResponse({
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      temperature: params.temperature,
    });
  }

  // Default to Gemini
  return generateGeminiChatResponse({
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    temperature: params.temperature,
  });
}
