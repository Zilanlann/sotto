/// <reference types="@cloudflare/workers-types" />

import { MAX_BYTES, MAX_EXPIRY_MINUTES, type StoredPaste } from "./types";

type Env = {
  ASSETS: Fetcher;
  PASTES: KVNamespace;
};

const MAX_RECORD_BYTES = 512 * 1024;
const MAX_TTL_MS = MAX_EXPIRY_MINUTES * 60 * 1000;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const JSON_CONTENT_TYPE_PATTERN = /^application\/(?:[\w.+-]+\+)?json(?:;|$)/i;
const encoder = new TextEncoder();
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
].join("; ");

function setSecurityHeaders(headers: Headers) {
  headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("origin-agent-cluster", "?1");
  headers.set("permissions-policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
}

function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  setSecurityHeaders(headers);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  setSecurityHeaders(headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(body), { ...init, headers });
}

function emptyResponse(init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  setSecurityHeaders(headers);
  headers.set("cache-control", "no-store");

  return new Response(null, { ...init, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBase64Url(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength && /^[A-Za-z0-9_-]+$/.test(value);
}

function getPasteKey(id: string) {
  return `paste:${id}`;
}

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function validatePastePayload(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const now = Date.now();
  const paste = value as Partial<StoredPaste>;
  const { id, ciphertext, iv, salt, createdAt, expiresAt, bytes, burnAfterReading, markdown, passwordProtected } = paste;

  if (
    !isBase64Url(id, 64) ||
    !ID_PATTERN.test(id) ||
    !isBase64Url(ciphertext, MAX_RECORD_BYTES) ||
    !isBase64Url(iv, 64) ||
    (salt !== undefined && !isBase64Url(salt, 128)) ||
    typeof createdAt !== "number" ||
    typeof expiresAt !== "number" ||
    typeof bytes !== "number" ||
    typeof burnAfterReading !== "boolean" ||
    typeof markdown !== "boolean" ||
    typeof passwordProtected !== "boolean"
  ) {
    return null;
  }

  if (
    !Number.isFinite(createdAt) ||
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(bytes) ||
    expiresAt <= createdAt ||
    bytes <= 0 ||
    bytes > MAX_BYTES ||
    expiresAt <= now ||
    expiresAt - now > MAX_TTL_MS
  ) {
    return null;
  }

  return {
    id,
    ciphertext,
    iv,
    salt,
    createdAt,
    expiresAt,
    burnAfterReading,
    markdown,
    passwordProtected,
    bytes,
  } satisfies StoredPaste;
}

async function readPaste(env: Env, id: string) {
  return env.PASTES.get<StoredPaste>(getPasteKey(id), "json");
}

async function writePaste(env: Env, paste: StoredPaste) {
  await env.PASTES.put(getPasteKey(paste.id), JSON.stringify(paste), {
    expiration: Math.floor(paste.expiresAt / 1000),
  });
}

async function createPaste(request: Request, env: Env) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: "forbidden-origin" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!JSON_CONTENT_TYPE_PATTERN.test(contentType)) {
    return jsonResponse({ error: "unsupported-media-type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RECORD_BYTES) {
    return jsonResponse({ error: "payload-too-large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid-json" }, { status: 400 });
  }

  const paste = validatePastePayload(body);
  if (!paste) {
    return jsonResponse({ error: "invalid-paste" }, { status: 400 });
  }

  if (encoder.encode(JSON.stringify(paste)).byteLength > MAX_RECORD_BYTES) {
    return jsonResponse({ error: "payload-too-large" }, { status: 413 });
  }

  const existing = await readPaste(env, paste.id);
  if (existing) {
    return jsonResponse({ error: "id-conflict" }, { status: 409 });
  }

  await writePaste(env, paste);

  return jsonResponse({ id: paste.id }, { status: 201 });
}

async function getPaste(id: string, env: Env) {
  if (!ID_PATTERN.test(id)) {
    return jsonResponse({ error: "invalid-id" }, { status: 400 });
  }

  const paste = await readPaste(env, id);
  if (!paste) {
    return jsonResponse({ error: "not-found" }, { status: 404 });
  }

  if (paste.expiresAt <= Date.now()) {
    await env.PASTES.delete(getPasteKey(id));
    return jsonResponse({ ...paste, ciphertext: "" });
  }

  return jsonResponse(paste);
}

async function destroyPaste(id: string, env: Env) {
  if (!ID_PATTERN.test(id)) {
    return jsonResponse({ error: "invalid-id" }, { status: 400 });
  }

  const paste = await readPaste(env, id);
  if (!paste) {
    return jsonResponse({ error: "not-found" }, { status: 404 });
  }

  if (!paste.burnAfterReading) {
    return jsonResponse({ error: "destroy-not-allowed" }, { status: 403 });
  }

  const destroyedAt = Date.now();
  const next: StoredPaste = {
    ...paste,
    ciphertext: "",
    destroyedAt: paste.destroyedAt ?? destroyedAt,
    readAt: paste.readAt ?? destroyedAt,
  };

  await writePaste(env, next);

  return jsonResponse({ ok: true });
}

async function handleApi(request: Request, env: Env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return emptyResponse({ status: 204 });
  }

  if (request.method !== "GET" && !isSameOriginRequest(request)) {
    return jsonResponse({ error: "forbidden-origin" }, { status: 403 });
  }

  if (url.pathname === "/api/pastes" && request.method === "POST") {
    return createPaste(request, env);
  }

  if (url.pathname === "/api/pastes") {
    return jsonResponse({ error: "method-not-allowed" }, { headers: { allow: "POST, OPTIONS" }, status: 405 });
  }

  const match = url.pathname.match(/^\/api\/pastes\/([^/]+)(?:\/destroy)?$/);
  if (!match) {
    return jsonResponse({ error: "not-found" }, { status: 404 });
  }

  const id = match[1];
  const isDestroyRoute = url.pathname.endsWith("/destroy");

  if (!isDestroyRoute && request.method === "GET") {
    return getPaste(id, env);
  }

  if (isDestroyRoute && request.method === "POST") {
    return destroyPaste(id, env);
  }

  return jsonResponse(
    { error: "method-not-allowed" },
    { headers: { allow: isDestroyRoute ? "POST, OPTIONS" : "GET, OPTIONS" }, status: 405 },
  );
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env);
      } catch {
        return jsonResponse({ error: "server-error" }, { status: 500 });
      }
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
