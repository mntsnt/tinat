import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";
import { AVAILABLE_MODELS } from "../models";

export function getProviderForModel(modelId: string): AIProvider {
  const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
  
  if (modelInfo.provider.toLowerCase().includes("google")) {
    return new GeminiProvider();
  }
  
  if (modelInfo.provider.toLowerCase().includes("openrouter")) {
    return new OpenRouterProvider();
  }
  
  // Default fallback
  return new GeminiProvider();
}

export * from "./provider";
export * from "./gemini";
export * from "./openrouter";
