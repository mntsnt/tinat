import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

describe("Next.js request proxy authentication", () => {
  test("redirects unauthenticated dashboard requests to login", async () => {
    const request = new NextRequest("https://tinat.test/admin");
    const response = await proxy(request);
    const location = new URL(response.headers.get("location")!);

    assert.equal(response.status, 307);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("redirect"), "/admin");
  });

  test("preserves nested paths and query strings for private pages", async () => {
    const request = new NextRequest("https://tinat.test/forms/new?template=survey");
    const response = await proxy(request);
    const location = new URL(response.headers.get("location")!);

    assert.equal(location.pathname, "/login");
    assert.equal(
      location.searchParams.get("redirect"),
      "/forms/new?template=survey"
    );
  });

  test("rejects unauthenticated protected API requests with JSON", async () => {
    const request = new NextRequest("https://tinat.test/api/admin/users");
    const response = await proxy(request);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  });
});
