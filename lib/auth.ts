import { cookies, headers } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  try {
    const cookieStore = await cookies();

    let isHttps = false;
    try {
      const headersList = await headers();
      const proto = headersList.get("x-forwarded-proto");
      const referer = headersList.get("referer");
      isHttps = proto === "https" || (referer?.startsWith("https://") ?? false);
    } catch {
      isHttps = process.env.NODE_ENV === "production" && (process.env.APP_URL?.startsWith("https://") ?? false);
    }

    cookieStore.set("tinat_session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch {
    // In background or non-cookie contexts, cookies() may fail; proceed with returning token
  }

  return token;
}

export async function getSession() {
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get("tinat_session")?.value;
  } catch {
    // cookies() unavailable
  }

  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    } catch {
      // headers() unavailable
    }
  }

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    return {
      userId: payload.userId as string,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();

    cookieStore.set("tinat_session", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    cookieStore.delete("tinat_session");
  } catch {
    // Ignore in non-cookie environments
  }
}
