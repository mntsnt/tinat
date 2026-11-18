import assert from "node:assert/strict";
import test from "node:test";
import { getAIModel } from "../lib/ai/models";

test("resolves NVIDIA model IDs and provider model codes", () => {
  const model = getAIModel("nvidia-nemotron-lightning");

  assert.equal(model?.providerId, "NVIDIA");
  assert.equal(
    getAIModel("nvidia/nemotron-3.5-lightning-30b-a3b")?.id,
    "nvidia-nemotron-lightning"
  );
});

test("keeps Gemini as the default and rejects unknown model IDs", () => {
  assert.equal(getAIModel()?.id, "gemini");
  assert.equal(getAIModel("not-a-model"), null);
});
