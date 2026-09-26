import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIProviderConfig, AIProviderResponse, AIChatMessage } from "./provider";
import { getGeminiApiKey } from "../gemini"; // Import key resolution from existing file

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
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    const response = await this.client.models.generateContent({
      model: config.model || "gemini-3.6-flash",
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
      modelUsed: config.model || "gemini-3.6-flash",
    };
  }

  async generateText(prompt: string, config: AIProviderConfig): Promise<AIProviderResponse> {
    const response = await this.client.models.generateContent({
      model: config.model || "gemini-3.6-flash",
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
      modelUsed: config.model || "gemini-3.6-flash",
    };
  }
}
