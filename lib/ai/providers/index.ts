import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini";
import { getAIModel } from "../models";
import { getGeminiApiKey } from "../gemini";
import { getNvidiaApiKey, NvidiaProvider } from "./nvidia";

export function getProviderForModel(modelId?: string): AIProvider {
  const model = getAIModel(modelId);
  if (!model) {
    throw new Error("The selected AI model is not available.");
  }
  return model.providerId === "NVIDIA"
    ? new NvidiaProvider()
    : new GeminiProvider();
}

export function isAIModelConfigured(modelId?: string): boolean {
  const model = getAIModel(modelId);
  if (!model) return false;
  return model.providerId === "NVIDIA"
    ? getNvidiaApiKey() !== null
    : getGeminiApiKey() !== null;
}

export * from "./provider";
export * from "./gemini";
export * from "./nvidia";
