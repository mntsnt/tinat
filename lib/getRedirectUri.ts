/**
 * Resolves the public base URL and Google OAuth callback URI dynamically.
 * Handles reverse proxies, ngrok, Vercel, and local development.
 */
export function getBaseUrl(request: Request): string {
  // 1. Check forwarded headers (used by reverse proxies like ngrok, Vercel, Cloudflare)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const isLocal = forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1");
    const proto = forwardedProto || (isLocal ? "http" : "https");
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }

  // 2. Check standard Host header
  const host = request.headers.get("host");
  if (host) {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto = isLocal ? "http" : "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  // 3. Fallback to APP_URL environment variable if set
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 4. Fallback to request.url origin
  try {
    const url = new URL(request.url);
    return url.origin.replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

export function getGoogleRedirectUri(request: Request): string {
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;
  console.log(`[Google Auth] Resolved redirect_uri: ${redirectUri}`);
  return redirectUri;
}
