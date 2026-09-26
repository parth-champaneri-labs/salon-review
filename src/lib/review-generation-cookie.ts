import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { MAX_GENERATIONS } from "./review-contract";

export { MAX_GENERATIONS };
export const GENERATION_COOKIE_NAME = "salon_review_generation";
export const GENERATION_WINDOW_SECONDS = 12 * 60 * 60;

type CookiePayload = { count: number; expiresAt: number };

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function signGenerationCookie(count: number, expiresAt: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ count, expiresAt } satisfies CookiePayload)).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function verifyGenerationCookie(value: string | undefined, secret: string, now = Date.now()): number {
  if (!value) return 0;
  const parts = value.split(".");
  if (parts.length !== 2) return 0;

  try {
    const supplied = Buffer.from(parts[1], "base64url");
    const expected = signature(parts[0], secret);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return 0;

    const payload: unknown = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return 0;
    const { count, expiresAt } = payload as Record<string, unknown>;
    if (!Number.isInteger(count) || typeof count !== "number" || count < 0 || count > MAX_GENERATIONS) return 0;
    if (!Number.isSafeInteger(expiresAt) || typeof expiresAt !== "number" || expiresAt <= now) return 0;
    return count;
  } catch {
    return 0;
  }
}

export function readGenerationCount(request: Request, secret: string, now = Date.now()): number {
  const value = request.headers.get("cookie")?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${GENERATION_COOKIE_NAME}=`))
    ?.slice(GENERATION_COOKIE_NAME.length + 1);
  return verifyGenerationCookie(value, secret, now);
}

export function generationCookieHeader(count: number, secret: string, now = Date.now(), production = process.env.NODE_ENV === "production"): string {
  const value = signGenerationCookie(count, now + GENERATION_WINDOW_SECONDS * 1000, secret);
  return `${GENERATION_COOKIE_NAME}=${value}; Max-Age=${GENERATION_WINDOW_SECONDS}; Path=/; HttpOnly; SameSite=Lax${production ? "; Secure" : ""}`;
}

// A strict distributed IP rate limiter would require shared persistent infrastructure such as Redis or a platform-level rate limiter. The signed cookie enforces the current per-browser generation limit without server state.
