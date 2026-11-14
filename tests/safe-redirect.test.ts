import { test } from "node:test";
import assert from "node:assert/strict";
import { getSafeInternalRedirectPath } from "../lib/safeRedirect";

test("accepts same-origin paths and preserves their query strings", () => {
  assert.equal(
    getSafeInternalRedirectPath("/forms/new?template=survey"),
    "/forms/new?template=survey"
  );
});

test("rejects external, protocol-relative, malformed, and login-loop destinations", () => {
  assert.equal(getSafeInternalRedirectPath("https://example.com"), null);
  assert.equal(getSafeInternalRedirectPath("//example.com"), null);
  assert.equal(getSafeInternalRedirectPath("/\\example.com"), null);
  assert.equal(getSafeInternalRedirectPath("/login?redirect=/admin"), null);
  assert.equal(getSafeInternalRedirectPath(["/admin"]), null);
});
