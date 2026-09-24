/**
 * OpenRouter AI Client for Free Frontier and Healthcare Models.
 * Implements direct DNS-over-HTTPS (DoH) resolution and SNI tunneling
 * to bypass container DNS search domain interception and wildcard proxy traps.
 * Zero external npm dependencies.
 */

export interface OpenRouterGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  modelName?: string;
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
  modelName?: string;
}

export interface OpenRouterResponse {
  content: string;
  modelUsed: string;
  tokensUsed?: number;
}

export const NEMOTRON_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const DEFAULT_FREE_FALLBACK_MODELS = [
  "inclusionai/ling-3.0-flash-sante:free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

// In-memory DNS cache to avoid resolving DoH on every single request
const DNS_CACHE = new Map<string, { ips: string[]; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sanitizes input string to prevent invalid character errors in HTTP headers.
 */
function sanitizeHeaderString(val: string): string {
  return val
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim();
}

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
    return sanitizeHeaderString(direct).replace(/^Bearer\s+/i, "").trim();
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
        return sanitizeHeaderString(val).replace(/^Bearer\s+/i, "").trim();
      }
    }
  }

  return null;
}

/**
 * Queries a DNS-over-HTTPS endpoint by direct IP (requires no local DNS lookup).
 */
async function queryDoH(
  resolverIp: string,
  queryPath: string,
  servername: string
): Promise<string[]> {
  const https = await import("node:https");
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: resolverIp,
        port: 443,
        path: queryPath,
        method: "GET",
        headers: {
          Accept: "application/dns-json",
          Host: servername,
        },
        servername,
        timeout: 3500,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const ips = (parsed.Answer || [])
              .filter((a: any) => a.type === 1 && typeof a.data === "string")
              .map((a: any) => a.data.trim());
            resolve(ips);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("DoH resolution timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}

/**
 * Resolves a hostname to IP addresses using external public DNS-over-HTTPS (DoH).
 * Completely bypasses /etc/resolv.conf search domains and container wildcard traps.
 */
async function resolveDirectDomain(domain: string): Promise<string[]> {
  const cached = DNS_CACHE.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.ips.length > 0) {
    return cached.ips;
  }

  // 1. Cloudflare DNS-over-HTTPS (1.1.1.1) - direct IP request, zero DNS needed
  try {
    const ips = await queryDoH(
      "1.1.1.1",
      "/dns-query?name=" + encodeURIComponent(domain) + "&type=A",
      "cloudflare-dns.com"
    );
    if (ips && ips.length > 0) {
      DNS_CACHE.set(domain, { ips, timestamp: Date.now() });
      return ips;
    }
  } catch {}

  // 2. Google DNS-over-HTTPS (8.8.8.8) - direct IP request
  try {
    const ips = await queryDoH(
      "8.8.8.8",
      "/resolve?name=" + encodeURIComponent(domain) + "&type=A",
      "dns.google"
    );
    if (ips && ips.length > 0) {
      DNS_CACHE.set(domain, { ips, timestamp: Date.now() });
      return ips;
    }
  } catch {}

  // 3. Direct Node UDP resolver against 8.8.8.8
  try {
    const { Resolver } = await import("node:dns/promises");
    const resolver = new Resolver({ timeout: 2500 });
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    const ips = await resolver.resolve4(domain);
    if (ips && ips.length > 0) {
      DNS_CACHE.set(domain, { ips, timestamp: Date.now() });
      return ips;
    }
  } catch {}

  // 4. Known global anycast edge IPs for OpenRouter & NVIDIA
  if (domain === "openrouter.ai") {
    return ["104.18.2.115", "104.18.3.115"];
  }
  if (domain === "integrate.api.nvidia.com") {
    return ["75.2.113.119", "99.83.136.103"];
  }

  return [];
}

/**
 * Dispatches an HTTPS POST request to the AI provider endpoint.
 * Connects directly to verified edge IPs while preserving TLS SNI and Host headers,
 * neutralizing any hosting environment DNS poisoning or wildcard certificate mismatches.
 */
async function postToAiProvider(
  urlStr: string,
  payload: any,
  headers: Record<string, string>,
  timeoutMs = 90000
): Promise<{ statusCode: number; data: any }> {
  const https = await import("node:https");
  const zlib = await import("node:zlib");

  const url = new URL(urlStr);
  const hostname = url.hostname;
  const candidateIps = await resolveDirectDomain(hostname);
  const targets = candidateIps.length > 0 ? candidateIps : [hostname];

  const bodyBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  let lastError: any = null;

  for (const target of targets) {
    try {
      const reqHeaders: Record<string, string> = {
        ...headers,
        Host: hostname,
        "Content-Type": "application/json",
        "Content-Length": String(bodyBuffer.length),
        "Accept-Encoding": "identity",
        "User-Agent": "Tinat-Health-Platform/1.0",
      };

      const options = {
        host: target,
        port: url.port ? parseInt(url.port, 10) : 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: reqHeaders,
        servername: hostname, // Critical: SNI verifies against target domain's SSL certificate
        timeout: timeoutMs,
      };

      const response = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
        const req = https.request(options, (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            let buffer = Buffer.concat(chunks);
            const encoding = res.headers["content-encoding"];
            if (encoding === "gzip") {
              try {
                buffer = zlib.gunzipSync(buffer);
              } catch {}
            }
            const bodyText = buffer.toString("utf8");
            let data: any = null;
            try {
              data = JSON.parse(bodyText);
            } catch {
              data = { rawText: bodyText };
            }
            resolve({ statusCode: res.statusCode || 500, data });
          });
        });

        req.on("timeout", () => {
          req.destroy(new Error(`AI provider request timed out after ${timeoutMs}ms (target: ${target})`));
        });
        req.on("error", reject);
        req.write(bodyBuffer);
        req.end();
      });

      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Connection attempt to ${target} (${hostname}) failed:`, err?.message);
    }
  }

  throw lastError || new Error(`Unable to establish connection to ${hostname}`);
}

/**
 * Generates single-turn analysis using chosen free model via OpenRouter.
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
  const modelsToTry = [modelToUse, ...DEFAULT_FREE_FALLBACK_MODELS.filter((m) => m !== modelToUse)];
  let lastError: any = null;

  const isNvidiaDirect = apiKey.startsWith("nvapi-");
  const endpoint = isNvidiaDirect
    ? "https://integrate.api.nvidia.com/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (!isNvidiaDirect) {
    const rawReferer = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tinat.app";
    const referer = sanitizeHeaderString(rawReferer);
    if (referer) {
      headers["HTTP-Referer"] = referer;
    }
    headers["X-Title"] = "Tinat Health & Medical Research Platform";
  }

  for (const model of modelsToTry) {
    try {
      const res = await postToAiProvider(
        endpoint,
        {
          model,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxOutputTokens ?? 3000,
        },
        headers
      );

      const data = res.data;

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errorMsg =
          data?.error?.message || `OpenRouter API returned HTTP ${res.statusCode}`;
        const error: any = new Error(errorMsg);
        error.statusCode = res.statusCode;
        error.rawError = data?.error;
        throw error;
      }

      const content = data?.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        throw new Error(`Empty response from ${options.modelName || model}.`);
      }

      return {
        content,
        modelUsed: options.modelName || "OpenRouter Free Model",
        tokensUsed: data?.usage?.total_tokens,
      };
    } catch (err: any) {
      lastError = err;
      const cause = err?.cause?.message || err?.cause?.code || "";
      console.error(`AI Model attempt failed for ${model}:`, err?.message, cause);
      const msg = `${err?.message || ""} ${cause}`.toLowerCase();
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
 * Multi-turn conversational research assistant using chosen free model via OpenRouter.
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
  const modelsToTry = [modelToUse, ...DEFAULT_FREE_FALLBACK_MODELS.filter((m) => m !== modelToUse)];
  let lastError: any = null;

  const formattedMessages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const isNvidiaDirect = apiKey.startsWith("nvapi-");
  const endpoint = isNvidiaDirect
    ? "https://integrate.api.nvidia.com/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (!isNvidiaDirect) {
    const rawReferer = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tinat.app";
    const referer = sanitizeHeaderString(rawReferer);
    if (referer) {
      headers["HTTP-Referer"] = referer;
    }
    headers["X-Title"] = "Tinat Health & Medical Research Platform";
  }

  for (const model of modelsToTry) {
    try {
      const res = await postToAiProvider(
        endpoint,
        {
          model,
          messages: formattedMessages,
          temperature: options.temperature ?? 0.25,
          max_tokens: 3000,
        },
        headers
      );

      const data = res.data;

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errorMsg =
          data?.error?.message || `OpenRouter API returned HTTP ${res.statusCode}`;
        const error: any = new Error(errorMsg);
        error.statusCode = res.statusCode;
        error.rawError = data?.error;
        throw error;
      }

      const content = data?.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        throw new Error(`Empty response from ${options.modelName || model}.`);
      }

      return {
        content,
        modelUsed: options.modelName || "OpenRouter Free Model",
        tokensUsed: data?.usage?.total_tokens,
      };
    } catch (err: any) {
      lastError = err;
      const cause = err?.cause?.message || err?.cause?.code || "";
      console.error(`AI Model chat attempt failed for ${model}:`, err?.message, cause);
      const msg = `${err?.message || ""} ${cause}`.toLowerCase();
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
  const cause =
    err?.cause?.message ||
    err?.cause?.code ||
    (err?.cause ? String(err.cause) : "");
  const rawMsg = [err?.message, cause].filter(Boolean).join(" - ") || "";
  const message = rawMsg.toLowerCase();
  const statusCode = err?.statusCode;

  // 1. Authentication errors (Invalid key, missing bearer, 401, 403, "User not found")
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("bearer") ||
    message.includes("user not found") ||
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
      `AI Model rate limit reached on OpenRouter (${rawMsg}). Free tier models are limited per minute and per day. Please switch to another free model (e.g. Ling 3.0 Santé or Google Gemini).`
    );
    safeError.code = "RATE_LIMITED";
    safeError.statusCode = 429;
    throw safeError;
  }

  // 4. Timeout
  if (
    statusCode === 504 ||
    message.includes("timeout") ||
    message.includes("deadline") ||
    message.includes("timed out")
  ) {
    const safeError: any = new Error(
      "AI Model timed out while analyzing data. The model took too long to compute reasoning tokens. Please try again or switch to Google Gemini."
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
      `The selected free AI model is currently overloaded on OpenRouter (${rawMsg}). Please choose one of the other free models (e.g. Ling 3.0 Santé, Gemma 4 31B, or Google Gemini).`
    );
    safeError.code = "SERVICE_UNAVAILABLE";
    safeError.statusCode = 503;
    throw safeError;
  }

  // 6. Network / Host unreachable failures
  if (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("ehostunreach") ||
    message.includes("enetunreach") ||
    message.includes("und_err") ||
    message.includes("econnreset")
  ) {
    const safeError: any = new Error(
      `Network connection failed: server could not reach AI provider endpoint (${rawMsg}). Please switch to Google Gemini.`
    );
    safeError.code = "NETWORK_ERROR";
    safeError.statusCode = 502;
    throw safeError;
  }

  // 7. Generic with exact diagnostic detail
  const genericError: any = new Error(
    `AI Model unavailable: ${rawMsg || "Service temporarily offline"}. Please switch to another free model or Google Gemini.`
  );
  genericError.code = "SERVICE_UNAVAILABLE";
  genericError.statusCode = statusCode || 503;
  throw genericError;
}
