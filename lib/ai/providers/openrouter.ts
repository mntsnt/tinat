import { AIProvider, AIProviderConfig, AIProviderResponse, AIChatMessage } from "./provider";
import { getOpenRouterApiKey } from "../openrouter"; // Assuming this exists

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY_NOT_CONFIGURED");
    }
    this.apiKey = apiKey;
  }

  async chat(messages: AIChatMessage[], config: AIProviderConfig): Promise<AIProviderResponse> {
    const body = {
      model: config.model,
      messages: [
        ...(config.systemPrompt ? [{ role: "system", content: config.systemPrompt }] : []),
        ...messages
      ],
      temperature: config.temperature ?? 0.25,
      max_tokens: config.maxTokens ?? 2500,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://tinat.app",
        "X-Title": "Tinat AI",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    return {
      content: text,
      modelUsed: config.model,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  async generateText(prompt: string, config: AIProviderConfig): Promise<AIProviderResponse> {
    return this.chat([{ role: "user", content: prompt }], config);
  }
}
