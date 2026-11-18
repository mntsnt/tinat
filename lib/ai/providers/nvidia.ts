import {
  AIProviderError,
  type AIChatMessage,
  type AIProvider,
  type AIProviderConfig,
  type AIProviderResponse,
} from "./provider";

const NVIDIA_CHAT_COMPLETIONS_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";

export function getNvidiaApiKey(): string | null {
  const key = process.env.NVIDIA_API_KEY?.trim();
  return key || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class NvidiaProvider implements AIProvider {
  async chat(
    messages: AIChatMessage[],
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    const apiKey = getNvidiaApiKey();
    if (!apiKey) {
      throw new AIProviderError(
        "NVIDIA models are not configured. Add NVIDIA_API_KEY to the server environment.",
        "NVIDIA_API_KEY_NOT_CONFIGURED",
        503
      );
    }

    const requestMessages = [
      ...(config.systemPrompt?.trim()
        ? [{ role: "system" as const, content: config.systemPrompt }]
        : []),
      ...messages.map((message) => ({
        role:
          message.role === "assistant"
            ? ("assistant" as const)
            : message.role === "system"
              ? ("system" as const)
              : ("user" as const),
        content: message.content,
      })),
    ];

    let response: Response;
    try {
      response = await fetch(NVIDIA_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: requestMessages,
          temperature: config.temperature ?? 0.25,
          max_tokens: config.maxTokens ?? 2500,
          stream: false,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(90000),
      });
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      throw new AIProviderError(
        timedOut
          ? "NVIDIA took too long to respond. Please try again."
          : "Could not connect to NVIDIA AI. Please try again later.",
        timedOut ? "NVIDIA_TIMEOUT" : "NVIDIA_UNAVAILABLE",
        timedOut ? 504 : 503
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AIProviderError(
          "NVIDIA rejected the configured API key. Check NVIDIA_API_KEY on the server.",
          "NVIDIA_AUTH_FAILED",
          502
        );
      }
      if (response.status === 429) {
        throw new AIProviderError(
          "NVIDIA request limit reached. Please wait before trying again.",
          "NVIDIA_RATE_LIMITED",
          429
        );
      }
      if (response.status === 202) {
        throw new AIProviderError(
          "NVIDIA is still processing this request. Please try again shortly.",
          "NVIDIA_REQUEST_PENDING",
          503
        );
      }
      throw new AIProviderError(
        "NVIDIA could not complete the request. Please try again later.",
        "NVIDIA_REQUEST_FAILED",
        502
      );
    }

    const payload: unknown = await response.json().catch(() => null);
    const choices =
      isRecord(payload) && Array.isArray(payload.choices) ? payload.choices : null;
    const firstChoice = choices?.[0];
    const message =
      isRecord(firstChoice) && isRecord(firstChoice.message)
        ? firstChoice.message
        : null;
    const content = message && typeof message.content === "string"
      ? message.content.trim()
      : "";

    if (!content) {
      throw new AIProviderError(
        "NVIDIA returned an empty response. Please try again.",
        "NVIDIA_EMPTY_RESPONSE",
        502
      );
    }

    const usage = isRecord(payload) && isRecord(payload.usage) ? payload.usage : null;
    const modelUsed =
      isRecord(payload) && typeof payload.model === "string"
        ? payload.model
        : config.model;

    return {
      content,
      modelUsed,
      tokensUsed:
        usage && typeof usage.total_tokens === "number"
          ? usage.total_tokens
          : undefined,
    };
  }

  async generateText(
    prompt: string,
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    return this.chat([{ role: "user", content: prompt }], config);
  }
}
