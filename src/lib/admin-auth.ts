import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuthConfigStatus } from "@/lib/env";

const ADMIN_SESSION_COOKIE = "health_dashboard_admin";
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const HASH_PREFIX = "scrypt";

type PasswordHashParts = {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
};

export function getSafeNextPath(value: FormDataEntryValue | string | string[] | null | undefined) {
  const next = Array.isArray(value) ? value[0] : value;

  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  if (next.includes("://") || next.includes("\\")) {
    return "/admin";
  }

  return next;
}

export function isAdminAuthConfigured() {
  return getAdminAuthConfigStatus().configured;
}

export async function verifyAdminPassword(password: string) {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    return false;
  }

  const parts = parsePasswordHash(passwordHash);

  if (!parts) {
    return false;
  }

  const candidateHash = crypto.scryptSync(password, parts.salt, parts.hash.length, {
    N: parts.n,
    r: parts.r,
    p: parts.p,
    maxmem: 64 * 1024 * 1024,
  });

  return timingSafeEqual(candidateHash, parts.hash);
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  const token = createSessionToken();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function requireAdminApi() {
  if (!(await hasAdminSession())) {
    return NextResponse.json(
      {
        error: isAdminAuthConfigured()
          ? "Admin login is required."
          : "Admin login is not configured.",
      },
      { status: 401 },
    );
  }

  return null;
}

function createSessionToken() {
  const secret = getRequiredSessionSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const nonce = crypto.randomBytes(18).toString("base64url");
  const payload = `v1.${expiresAt}.${nonce}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

function verifySessionToken(token: string | undefined) {
  const secret = getSessionSecret();

  if (!token || !secret) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    return false;
  }

  const expiresAt = Number(parts[1]);

  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = parts.slice(0, 3).join(".");
  const expectedSignature = signPayload(payload, secret);

  return timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expectedSignature));
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function getRequiredSessionSecret() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is missing.");
  }

  return secret;
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  const [prefix, n, r, p, salt, hash] = value.split("$");

  if (prefix !== HASH_PREFIX || !n || !r || !p || !salt || !hash) {
    return null;
  }

  const parsed = {
    n: Number(n),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, "base64url"),
    hash: Buffer.from(hash, "base64url"),
  };

  if (
    !Number.isInteger(parsed.n) ||
    !Number.isInteger(parsed.r) ||
    !Number.isInteger(parsed.p) ||
    parsed.salt.length === 0 ||
    parsed.hash.length === 0
  ) {
    return null;
  }

  return parsed;
}

function timingSafeEqual(left: Buffer, right: Buffer) {
  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}
