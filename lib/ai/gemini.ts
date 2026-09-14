import { GoogleGenAI } from "@google/genai";

/**
 * Resolves the Google Gemini API key from environment variables.
 * Checks GEMINI_API_KEY, GOOGLE_API_KEY, and GOOGLE_GENERATIVE_AI_API_KEY.
 * The key remains strictly server-side and is never exposed to the client.
 */
export function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    null
  );
}

/**
 * Standard AI Generation Options
 */
export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface GenerateChatOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  modelUsed: string;
  tokensUsed?: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

/**
 * Initializes and executes a Gemini generation request.
 */
export async function generateGeminiResponse(options: GenerateOptions): Promise<AIResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const client = new GoogleGenAI({ apiKey });
  const modelToUse = options.model || DEFAULT_MODEL;

  // Try primary model, fallback if needed
  const modelsToTry = [modelToUse, ...FALLBACK_MODELS.filter((m) => m !== modelToUse)];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature ?? 0.2, // Low temperature for factual medical research
          maxOutputTokens: options.maxOutputTokens ?? 2500,
        },
        contents: [options.userPrompt],
      });

      const text = response.text || "";
      if (!text.trim()) {
        throw new Error("Empty response from AI model.");
      }

      return {
        content: text,
        modelUsed: model,
      };
    } catch (err: any) {
      lastError = err;
      // If error is model not found or quota, try fallback model
      const msg = err?.message || String(err);
      const isRecoverableModelError =
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("unsupported") ||
        msg.includes("deprecated");

      if (!isRecoverableModelError) {
        break; // Non-model error (e.g. invalid key or network failure), do not retry
      }
    }
  }

  // If we reach here, format friendly error
  handleGeminiError(lastError);
  throw lastError;
}

/**
 * Multi-turn Conversational Generation for the Research Assistant
 */
export async function generateGeminiChatResponse(options: GenerateChatOptions): Promise<AIResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const client = new GoogleGenAI({ apiKey });
  const modelToUse = options.model || DEFAULT_MODEL;

  // Build message history for Gemini SDK
  // Gemini expects: { role: 'user' | 'model', parts: [{ text }] }
  const formattedContents = options.messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await client.models.generateContent({
      model: modelToUse,
      config: {
        systemInstruction: options.systemPrompt,
        temperature: options.temperature ?? 0.25,
      },
      contents: formattedContents,
    });

    const text = response.text || "";
    if (!text.trim()) {
      throw new Error("Empty response from AI model.");
    }

    return {
      content: text,
      modelUsed: modelToUse,
    };
  } catch (err: any) {
    handleGeminiError(err);
    throw err;
  }
}

/**
 * Maps raw provider errors into safe, readable messages for researchers.
 * Never leaks API keys, secrets, or internal stack traces.
 */
function handleGeminiError(err: any): void {
  const message = (err?.message || "").toLowerCase();

  if (message.includes("api key") || message.includes("unauthorized") || message.includes("401")) {
    const safeError: any = new Error("AI service authentication failed. Please verify the Gemini API configuration.");
    safeError.code = "AUTH_FAILED";
    safeError.statusCode = 401;
    throw safeError;
  }

  if (message.includes("quota") || message.includes("429") || message.includes("rate limit") || message.includes("resource_exhausted")) {
    const safeError: any = new Error("AI request limit reached. Please wait a moment before requesting further analysis.");
    safeError.code = "RATE_LIMITED";
    safeError.statusCode = 429;
    throw safeError;
  }

  if (message.includes("timeout") || message.includes("deadline") || message.includes("network")) {
    const safeError: any = new Error("The AI service timed out while analyzing data. Please try again with a narrower question.");
    safeError.code = "TIMEOUT";
    safeError.statusCode = 504;
    throw safeError;
  }

  const genericError: any = new Error("AI Research Analysis is currently unavailable. Your study data has not been modified.");
  genericError.code = "SERVICE_UNAVAILABLE";
  genericError.statusCode = 503;
  throw genericError;
}
