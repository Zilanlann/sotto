import type { StoredPaste } from "../types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function parseFragment() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    key: params.get("k"),
    secret: params.get("s"),
  };
}

export function createId() {
  return toBase64Url(randomBytes(10));
}

async function importAesKey(keyBytes: Uint8Array, usages: KeyUsage[]) {
  return crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), "AES-GCM", false, usages);
}

async function derivePasswordKey(password: string, secret: string, salt: Uint8Array, usages: KeyUsage[]) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${password}:${secret}`),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 150_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

export async function encryptText(text: string, password: string) {
  const iv = randomBytes(12);
  let key: CryptoKey;
  let fragment: string;
  let salt: Uint8Array | undefined;

  if (password) {
    salt = randomBytes(16);
    const secret = toBase64Url(randomBytes(16));
    key = await derivePasswordKey(password, secret, salt, ["encrypt"]);
    fragment = `s=${secret}`;
  } else {
    const keyBytes = randomBytes(32);
    key = await importAesKey(keyBytes, ["encrypt"]);
    fragment = `k=${toBase64Url(keyBytes)}`;
  }

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(encoder.encode(text)));

  return {
    ciphertext: toBase64Url(new Uint8Array(encrypted)),
    iv: toBase64Url(iv),
    salt: salt ? toBase64Url(salt) : undefined,
    fragment,
  };
}

export async function decryptText(paste: StoredPaste, password: string) {
  const fragment = parseFragment();
  let key: CryptoKey;

  if (paste.passwordProtected) {
    if (!fragment.secret || !paste.salt) {
      throw new Error("bad-link");
    }
    key = await derivePasswordKey(password, fragment.secret, fromBase64Url(paste.salt), ["decrypt"]);
  } else {
    if (!fragment.key) {
      throw new Error("bad-link");
    }
    key = await importAesKey(fromBase64Url(fragment.key), ["decrypt"]);
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(paste.iv) },
    key,
    toArrayBuffer(fromBase64Url(paste.ciphertext)),
  );

  return decoder.decode(decrypted);
}
