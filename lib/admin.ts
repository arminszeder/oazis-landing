import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Shared-password auth for /admin. Small club, five organisers, three weeks of
// use — a password everyone knows plus a name on every change is the honest
// amount of ceremony. Nothing here protects against an organiser who leaks the
// password, and nothing here pretends to.

export const SESSION_COOKIE = "oazis_admin";
const SESSION_DAYS = 30;

export type Session = { name: string };

function password() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

/**
 * Signing key derived from the password, so changing the password in Vercel
 * signs everyone out. One env var to set instead of two, and rotating it is a
 * real revocation rather than a cosmetic one.
 */
function signingKey() {
  return createHash("sha256").update(`oazis-admin-session:${password()}`).digest();
}

function sign(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function passwordMatches(given: string) {
  const expected = password();
  if (!expected) return false;

  // Hash first: constant time, and equal length whatever the guess was.
  return timingSafeEqual(
    createHash("sha256").update(given).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export function issueToken(name: string) {
  const payload = Buffer.from(
    JSON.stringify({ name, exp: Date.now() + SESSION_DAYS * 86_400_000 }),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): Session | null {
  if (!token || !password()) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const { name, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof name !== "string" || typeof exp !== "number" || Date.now() > exp) return null;
    return { name };
  } catch {
    return null;
  }
}

/** The signed-in organiser, or null. Server-side only. */
export async function currentSession(): Promise<Session | null> {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
} as const;
