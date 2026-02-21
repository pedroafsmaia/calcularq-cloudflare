// Utilities for Cloudflare Pages Functions (Workers runtime)

import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "calcularq_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    32 * 8
  );
  const saltB64 = base64urlEncode(salt);
  const hashB64 = base64urlEncode(bits);
  return `pbkdf2$sha256$${iterations}$${saltB64}$${hashB64}`;
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

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      expected.byteLength * 8
    );
    const actual = new Uint8Array(bits);

    if (actual.length !== expected.length) return false;
    // constant-time compare
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
  const parts = cookie.split(";").map(s => s.trim());
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
  return await new SignJWT(payload)
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
  if (!token) return { ok: false, response: jsonResponse({ success: false, message: "Não autenticado" }, { status: 401 }) };
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

export function corsForSameOrigin(request, headers) {
  // Pages Functions are same-origin by default; keep minimal headers.
  headers.set("Vary", "Origin");
  return headers;
}
