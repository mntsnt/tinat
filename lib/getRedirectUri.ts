/**
 * Resolves the public base URL and Google OAuth callback URI dynamically.
 * Handles production domains (e.g. https://tinat.app.aletcloud.com), reverse proxies, and local development.
 */
export function getBaseUrl(request?: Request): string {
  // 1. Explicit APP_URL / NEXT_PUBLIC_APP_URL configuration (highest priority for production)
  const envAppUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL;
  if (envAppUrl && !envAppUrl.includes("localhost") && !envAppUrl.includes("127.0.0.1")) {
    return envAppUrl.trim().replace(/\/$/, "");
  }

  if (request) {
    // 2. Check forwarded headers (used by reverse proxies like Nginx, Cloudflare, Aletcloud, Vercel)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");

    if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
      const proto = forwardedProto || "https";
      return `${proto}://${forwardedHost}`.replace(/\/$/, "");
    }

    // 3. Check Host header if it's an external domain
    const host = request.headers.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const proto = forwardedProto || (request.url.startsWith("https") ? "https" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  // 4. If APP_URL is explicitly set (even if localhost in local development)
  if (envAppUrl) {
    return envAppUrl.trim().replace(/\/$/, "");
  }

  // 5. Default local fallback
  return "http://localhost:3000";
}

export function getGoogleRedirectUri(request?: Request): string {
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;
  console.log(`[Google Auth] Resolved redirect_uri: ${redirectUri}`);
  return redirectUri;
}
