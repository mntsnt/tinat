import { NextResponse } from "next/server";
import { z } from "zod";

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Standardized JSON error response builder conforming to the uniform API error shape.
 */
export function jsonError(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: message,
    code:
      code ||
      (status === 400
        ? "BAD_REQUEST"
        : status === 401
        ? "UNAUTHORIZED"
        : status === 403
        ? "FORBIDDEN"
        : status === 404
        ? "NOT_FOUND"
        : status === 429
        ? "RATE_LIMITED"
        : "INTERNAL_ERROR"),
  };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Safely parses and validates a request body against a Zod schema.
 * Returns either validated typed data or a standardized 400 response.
 */
export async function validateBody<T>(
  schema: z.ZodType<T>,
  reqOrBody: Request | unknown
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  let body: unknown;
  if (reqOrBody instanceof Request) {
    try {
      body = await reqOrBody.json();
    } catch {
      return {
        ok: false,
        response: jsonError("Invalid JSON in request body", 400, "INVALID_JSON"),
      };
    }
  } else {
    body = reqOrBody;
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: jsonError(
        "Validation error: invalid request payload",
        400,
        "VALIDATION_ERROR",
        result.error.flatten()
      ),
    };
  }

  return { ok: true, data: result.data };
}
