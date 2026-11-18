import assert from "node:assert/strict";
import test from "node:test";
import { AIProviderError } from "../lib/ai/providers/provider";
import { NvidiaProvider } from "../lib/ai/providers/nvidia";

test("sends a mocked NVIDIA chat request and returns its response and usage", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.NVIDIA_API_KEY;
  let requestUrl = "";
  let requestHeaders: HeadersInit | undefined;
  let requestBody: Record<string, unknown> | undefined;
  process.env.NVIDIA_API_KEY = "test-key";
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestHeaders = init?.headers;
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        model: "nvidia/test-model",
        choices: [{ message: { content: "  grounded response  " } }],
        usage: { total_tokens: 17 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const result = await new NvidiaProvider().chat(
      [{ role: "user", content: "Summarize this study." }],
      { model: "nvidia/test-model", systemPrompt: "Be accurate." }
    );

    assert.equal(requestUrl, "https://integrate.api.nvidia.com/v1/chat/completions");
    assert.equal(new Headers(requestHeaders).get("Authorization"), "Bearer test-key");
    assert.equal(requestBody?.model, "nvidia/test-model");
    assert.equal(result.content, "grounded response");
    assert.equal(result.modelUsed, "nvidia/test-model");
    assert.equal(result.tokensUsed, 17);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = originalApiKey;
  }
});

test("maps NVIDIA rate limits to a safe provider error", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.NVIDIA_API_KEY;
  process.env.NVIDIA_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(null, { status: 429 });

  try {
    await assert.rejects(
      new NvidiaProvider().chat(
        [{ role: "user", content: "Hello" }],
        { model: "nvidia/test-model" }
      ),
      (error: unknown) =>
        error instanceof AIProviderError &&
        error.code === "NVIDIA_RATE_LIMITED" &&
        error.statusCode === 429 &&
        !error.message.includes("test-key")
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = originalApiKey;
  }
});
