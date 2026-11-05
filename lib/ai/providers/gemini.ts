import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIProviderConfig, AIProviderResponse, AIChatMessage } from "./provider";
import { getGeminiApiKey } from "../gemini";

const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-flash-lite-latest", "gemini-3.5-flash"];

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async chat(messages: AIChatMessage[], config: AIProviderConfig): Promise<AIProviderResponse> {
    const formattedContents = messages.map((msg) => ({
      role: msg.role === "assistant" || msg.role === "system" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const primaryModel = config.model || "gemini-3.6-flash";
    const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.client.models.generateContent({
          model,
          config: {
            systemInstruction: config.systemPrompt,
            temperature: config.temperature ?? 0.25,
            maxOutputTokens: config.maxTokens ?? 2500,
          },
          contents: formattedContents,
        });

        const text = response.text || "";
        if (!text.trim()) {
          throw new Error("Empty response from Gemini.");
        }

        return {
          content: text,
          modelUsed: model,
        };
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();
        const isRecoverable =
          msg.includes("404") ||
          msg.includes("503") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded") ||
          msg.includes("high demand") ||
          msg.includes("not found") ||
          msg.includes("resource_exhausted") ||
          msg.includes("429");
        if (!isRecoverable) break;
      }
    }

    throw lastError;
  }

  async generateText(prompt: string, config: AIProviderConfig): Promise<AIProviderResponse> {
    const primaryModel = config.model || "gemini-3.6-flash";
    const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.client.models.generateContent({
          model,
          config: {
            systemInstruction: config.systemPrompt,
            temperature: config.temperature ?? 0.2,
            maxOutputTokens: config.maxTokens ?? 2500,
          },
          contents: [prompt],
        });

        const text = response.text || "";
        if (!text.trim()) {
          throw new Error("Empty response from Gemini.");
        }

        return {
          content: text,
          modelUsed: model,
        };
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();
        const isRecoverable =
          msg.includes("404") ||
          msg.includes("503") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded") ||
          msg.includes("high demand") ||
          msg.includes("not found") ||
          msg.includes("resource_exhausted") ||
          msg.includes("429");
        if (!isRecoverable) break;
      }
    }

    throw lastError;
  }
}
