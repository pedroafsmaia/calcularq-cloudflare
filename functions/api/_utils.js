// Utilities for Cloudflare Pages Functions (Workers runtime)

import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "calcularq_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
let securityTablesEnsured = false;

function base64urlEncode(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Password hashing using WebCrypto PBKDF2 (bcrypt is not available in Workers runtime)
// Stored format: pbkdf2$sha256$<iterations>$<salt_b64url>$<hash_b64url>
export async function hashPassword(password, iterations = 100_000) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    32 * 8
  );
  return `pbkdf2$sha256$${iterations}$${base64urlEncode(salt)}$${base64urlEncode(bits)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 5) return false;
    const [algo, hashName, iterStr, saltB64, hashB64] = parts;
    if (algo !== "pbkdf2" || hashName !== "sha256") return false;
    const iterations = parseInt(iterStr, 10);
    if (!Number.isFinite(iterations) || iterations < 50_000) return false;

    const enc = new TextEncoder();
    const salt = base64urlDecode(saltB64);
    const expected = base64urlDecode(hashB64);
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      expected.byteLength * 8
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

// Reset token helpers (for password recovery)
export async function generateResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64urlEncode(bytes);
}

export async function hashResetToken(token) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return base64urlEncode(digest);
}

export function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map((s) => s.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

export function setSessionCookie(headers, token) {
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ];
  headers.append("Set-Cookie", attrs.join("; "));
}

export function clearSessionCookie(headers) {
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ];
  headers.append("Set-Cookie", attrs.join("; "));
}

export async function signSessionToken(payload, secret) {
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifySessionToken(token, secret) {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  return payload;
}

export async function requireAuth(context) {
  const token = getCookie(context.request, SESSION_COOKIE_NAME);
  if (!token) {
    return { ok: false, response: jsonResponse({ success: false, message: "Não autenticado" }, { status: 401 }) };
  }
  try {
    const payload = await verifySessionToken(token, context.env.JWT_SECRET);
    const userId = payload.sub;
    if (!userId) throw new Error("missing sub");
    return { ok: true, userId: String(userId) };
  } catch {
    return { ok: false, response: jsonResponse({ success: false, message: "Sessão inválida" }, { status: 401 }) };
  }
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function corsForSameOrigin(_request, headers) {
  headers.set("Vary", "Origin");
  return headers;
}

export function validateEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function sanitizeText(value, { max = 255, allowEmpty = true } = {}) {
  if (value === undefined || value === null) return allowEmpty ? null : "";
  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (!normalized && allowEmpty) return null;
  return normalized.slice(0, max);
}

export function assertAllowedOrigin(context, { allowNoOrigin = true } = {}) {
  const origin = context.request.headers.get("Origin");
  if (!origin && allowNoOrigin) return null;
  if (!origin) {
    return jsonResponse({ success: false, message: "Origem inválida" }, { status: 403 });
  }

  try {
    const requestOrigin = new URL(context.request.url).origin;
    const frontendOrigin = context.env.FRONTEND_URL ? new URL(String(context.env.FRONTEND_URL)).origin : null;
    if (origin === requestOrigin || (frontendOrigin && origin === frontendOrigin)) return null;
  } catch {
    // fall through to deny
  }

  return jsonResponse({ success: false, message: "Origem inválida" }, { status: 403 });
}

export function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function ensureSecurityTables(db) {
  if (securityTablesEnsured) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS request_rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      window_start_ms INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_request_rate_limits_updated_at ON request_rate_limits(updated_at);

    CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT,
      created_at TEXT NOT NULL
    );
  `);
  securityTablesEnsured = true;
}

export async function rateLimitByIp(context, { endpoint = "generic", limit = 10, windowMs = 60_000 } = {}) {
  const db = context.env.DB;
  if (!db) return { ok: true };
  await ensureSecurityTables(db);

  const ip = getClientIp(context.request);
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const row = await db.prepare(
    "SELECT count, window_start_ms FROM request_rate_limits WHERE key = ?"
  ).bind(key).first();

  if (!row) {
    await db.prepare(
      "INSERT INTO request_rate_limits (key, count, window_start_ms, updated_at) VALUES (?, 1, ?, ?)"
    ).bind(key, now, nowIso).run();
    return { ok: true };
  }

  const count = Number(row.count || 0);
  const windowStart = Number(row.window_start_ms || 0);
  if (!Number.isFinite(windowStart) || now - windowStart >= windowMs) {
    await db.prepare(
      "UPDATE request_rate_limits SET count = 1, window_start_ms = ?, updated_at = ? WHERE key = ?"
    ).bind(now, nowIso, key).run();
    return { ok: true };
  }

  if (count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - windowStart)) / 1000));
    return { ok: false, retryAfterSec };
  }

  await db.prepare(
    "UPDATE request_rate_limits SET count = ?, updated_at = ? WHERE key = ?"
  ).bind(count + 1, nowIso, key).run();
  return { ok: true };
}
