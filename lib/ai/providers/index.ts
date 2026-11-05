import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini";

export function getProviderForModel(_modelId?: string): AIProvider {
  return new GeminiProvider();
}

export * from "./provider";
export * from "./gemini";
