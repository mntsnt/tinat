export type AIMessageRole = "user" | "assistant" | "system" | "tool";

export interface AIChatMessage {
  role: AIMessageRole;
  content: string;
  // TODO: Add tool_calls and tool_results when implementing Phase 2/3
}

export interface AIProviderConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProviderResponse {
  content: string;
  modelUsed: string;
  tokensUsed?: number;
}

export interface AIProvider {
  /**
   * Generates a response for a multi-turn conversation.
   */
  chat(messages: AIChatMessage[], config: AIProviderConfig): Promise<AIProviderResponse>;
  
  /**
   * Generates a response for a single-turn prompt.
   */
  generateText(prompt: string, config: AIProviderConfig): Promise<AIProviderResponse>;
}
