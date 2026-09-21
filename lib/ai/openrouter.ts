/**
 * OpenRouter AI Client for NVIDIA Nemotron models.
 * Uses native fetch without adding any third-party npm dependencies.
 * The API key is resolved from TINAT_AI_KEY or OPENROUTER_API_KEY.
 */

export interface OpenRouterGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface OpenRouterChatMessage {
  role: "user" | "model" | "assistant" | "system";
  content: string;
}

export interface OpenRouterChatOptions {
  systemPrompt: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  model?: string;
}

export interface OpenRouterResponse {
  content: string;
  modelUsed: string;
  tokensUsed?: number;
}

export const NEMOTRON_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const NEMOTRON_FALLBACK_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

/**
 * Resolves OpenRouter API key from environment variables.
 * Prioritizes the user-specified TINAT_AI_KEY.
 */
export function getOpenRouterApiKey(): string | null {
  const direct =
    process.env.TINAT_AI_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.NVIDIA_API_KEY;

  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  // Scan process.env for any key with TINAT_AI or OPENROUTER
  for (const [key, val] of Object.entries(process.env)) {
    if (val && typeof val === "string" && val.trim().length > 10) {
      const upper = key.toUpperCase();
      if (
        upper.includes("TINAT_AI") ||
        upper.includes("OPENROUTER") ||
        upper === "NEMOTRON_KEY" ||
        upper === "NVIDIA_KEY"
      ) {
        return val.trim();
      }
    }
  }

  return null;
}

/**
 * Generates single-turn analysis using NVIDIA Nemotron 3 Ultra via OpenRouter.
 */
export async function generateOpenRouterResponse(
  options: OpenRouterGenerateOptions
): Promise<OpenRouterResponse> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    const error: any = new Error(
      "TINAT_AI_KEY is not configured in environment variables. Please add your OpenRouter API key as TINAT_AI_KEY."
    );
    error.code = "TINAT_AI_KEY_NOT_CONFIGURED";
    error.statusCode = 400;
    throw error;
  }

  const modelToUse = options.model || NEMOTRON_MODEL;
  const modelsToTry = [modelToUse, ...NEMOTRON_FALLBACK_MODELS.filter((m) => m !== modelToUse)];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tinat.app",
          "X-Title": "Tinat Health & Medical Research Platform",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxOutputTokens ?? 3000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data?.error?.message || `OpenRouter API returned HTTP ${res.status}`;
        const error: any = new Error(errorMsg);
        error.statusCode = res.status;
        error.rawError = data?.error;
        throw error;
      }

      const content = data?.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        throw new Error("Empty response from NVIDIA Nemotron model.");
      }

      return {
        content,
        modelUsed: "NVIDIA: Nemotron 3 Ultra",
        tokensUsed: data?.usage?.total_tokens,
      };
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || "").toLowerCase();
      // If error is related to model unavailable / overloaded / rate limit, try fallback
      if (
        msg.includes("not found") ||
        msg.includes("overloaded") ||
        msg.includes("rate limit") ||
        msg.includes("busy") ||
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("502") ||
        err?.statusCode === 429 ||
        err?.statusCode === 503 ||
        err?.statusCode === 502
      ) {
        continue;
      }
      break;
    }
  }

  handleOpenRouterError(lastError);
  throw lastError;
}

/**
 * Multi-turn conversational research assistant using NVIDIA Nemotron 3 Ultra via OpenRouter.
 */
export async function generateOpenRouterChatResponse(
  options: OpenRouterChatOptions
): Promise<OpenRouterResponse> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    const error: any = new Error(
      "TINAT_AI_KEY is not configured in environment variables. Please add your OpenRouter API key as TINAT_AI_KEY."
    );
    error.code = "TINAT_AI_KEY_NOT_CONFIGURED";
    error.statusCode = 400;
    throw error;
  }

  const modelToUse = options.model || NEMOTRON_MODEL;
  const modelsToTry = [modelToUse, ...NEMOTRON_FALLBACK_MODELS.filter((m) => m !== modelToUse)];
  let lastError: any = null;

  const formattedMessages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tinat.app",
          "X-Title": "Tinat Health & Medical Research Platform",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: options.temperature ?? 0.25,
          max_tokens: 3000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data?.error?.message || `OpenRouter API returned HTTP ${res.status}`;
        const error: any = new Error(errorMsg);
        error.statusCode = res.status;
        error.rawError = data?.error;
        throw error;
      }

      const content = data?.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        throw new Error("Empty response from NVIDIA Nemotron model.");
      }

      return {
        content,
        modelUsed: "NVIDIA: Nemotron 3 Ultra",
        tokensUsed: data?.usage?.total_tokens,
      };
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || "").toLowerCase();
      if (
        msg.includes("not found") ||
        msg.includes("overloaded") ||
        msg.includes("rate limit") ||
        msg.includes("busy") ||
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("502") ||
        err?.statusCode === 429 ||
        err?.statusCode === 503 ||
        err?.statusCode === 502
      ) {
        continue;
      }
      break;
    }
  }

  handleOpenRouterError(lastError);
  throw lastError;
}

/**
 * Maps raw provider errors into safe, highly informative messages for researchers.
 * Never leaks API keys or internal stack traces.
 */
function handleOpenRouterError(err: any): void {
  const rawMsg = err?.message || "";
  const message = rawMsg.toLowerCase();
  const statusCode = err?.statusCode;

  // 1. Authentication errors (Invalid key, missing bearer, 401, 403)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("bearer") ||
    message.includes("401") ||
    message.includes("tinat_ai_key")
  ) {
    const safeError: any = new Error(
      `OpenRouter authentication failed: ${rawMsg}. Please check that TINAT_AI_KEY in your deployment environment variables is a valid OpenRouter API key (starting with sk-or-v1-).`
    );
    safeError.code = "AUTH_FAILED";
    safeError.statusCode = 401;
    throw safeError;
  }

  // 2. OpenRouter Free Model Privacy / Data Collection Policy
  if (
    message.includes("data policy") ||
    message.includes("data collection") ||
    message.includes("privacy") ||
    message.includes("terms")
  ) {
    const safeError: any = new Error(
      "OpenRouter requires enabling data collection for free models. Please log into OpenRouter at https://openrouter.ai/settings/privacy and enable 'Allow prompt training / data collection'."
    );
    safeError.code = "POLICY_REQUIRED";
    safeError.statusCode = 403;
    throw safeError;
  }

  // 3. Rate limiting / Quota exhaustion
  if (
    statusCode === 429 ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("credits")
  ) {
    const safeError: any = new Error(
      `NVIDIA Nemotron rate limit reached on OpenRouter (${rawMsg}). Free tier models are limited per minute and per day. Please wait a moment or switch to Google Gemini.`
    );
    safeError.code = "RATE_LIMITED";
    safeError.statusCode = 429;
    throw safeError;
  }

  // 4. Timeout
  if (
    statusCode === 504 ||
    message.includes("timeout") ||
    message.includes("deadline")
  ) {
    const safeError: any = new Error(
      "NVIDIA Nemotron timed out while analyzing data. The model took too long to compute reasoning tokens. Please try again or switch to Google Gemini."
    );
    safeError.code = "TIMEOUT";
    safeError.statusCode = 504;
    throw safeError;
  }

  // 5. Provider capacity / offline / 503 / 502
  if (
    statusCode === 503 ||
    statusCode === 502 ||
    message.includes("no endpoints") ||
    message.includes("overloaded") ||
    message.includes("busy") ||
    message.includes("offline")
  ) {
    const safeError: any = new Error(
      `NVIDIA Nemotron 3 Ultra free tier is currently overloaded on OpenRouter (${rawMsg}). The NVIDIA free compute cluster is at peak capacity worldwide. Please try again in a few minutes or switch to Google Gemini.`
    );
    safeError.code = "SERVICE_UNAVAILABLE";
    safeError.statusCode = 503;
    throw safeError;
  }

  // 6. Generic with exact diagnostic detail
  const genericError: any = new Error(
    `NVIDIA Nemotron unavailable: ${rawMsg || "Service temporarily offline"}. Please switch to Google Gemini or try again shortly.`
  );
  genericError.code = "SERVICE_UNAVAILABLE";
  genericError.statusCode = statusCode || 503;
  throw genericError;
}
