/**
 * Resolves the public base URL and Google OAuth callback URI dynamically.
 * Handles production domains (e.g. https://tinat.app.aletcloud.com), reverse proxies, and local development.
 */
export function getBaseUrl(request?: Request): string {
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const host = request.headers.get("host");

    // 1. If accessed via reverse proxy with a public domain
    if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
      const proto = forwardedProto || "https";
      return `${proto}://${forwardedHost}`.replace(/\/$/, "");
    }

    // 2. If Host header has a public domain
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const proto = forwardedProto || (request.url.startsWith("https") ? "https" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }

    // 3. If accessed locally (localhost or 127.0.0.1)
    if (host && (host.includes("localhost") || host.includes("127.0.0.1"))) {
      const proto = forwardedProto || (request.url.startsWith("https") ? "https" : "http");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  // 4. Default to configured APP_URL
  const envAppUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL;
  if (envAppUrl) {
    return envAppUrl.trim().replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getGoogleRedirectUri(request?: Request): string {
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;
  console.log(`[Google Auth] Resolved redirect_uri: ${redirectUri}`);
  return redirectUri;
}
