import type { StoredPaste } from "../types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const HKDF_ENCRYPTION_INFO = encoder.encode("sotto:enc");
const HKDF_AUTH_INFO = encoder.encode("sotto:auth");

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

export async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(encoder.encode(value)));
  return toBase64Url(new Uint8Array(digest));
}

async function derivePasswordMaster(password: string, secret: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${password}:${secret}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 150_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

// Domain-separated sub-keys from one master: the AES key never leaves the
// browser, while authToken is revealed to the server on claim, so knowing
// one never yields the other.
async function deriveSubKeys(masterBytes: Uint8Array, usages: KeyUsage[]) {
  const master = await crypto.subtle.importKey("raw", toArrayBuffer(masterBytes), "HKDF", false, [
    "deriveKey",
    "deriveBits",
  ]);

  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info: HKDF_ENCRYPTION_INFO },
    master,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );

  const authBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info: HKDF_AUTH_INFO },
    master,
    256,
  );

  return { key, authToken: toBase64Url(new Uint8Array(authBits)) };
}

export async function encryptText(text: string, password: string) {
  const iv = randomBytes(12);
  let masterBytes: Uint8Array;
  let fragment: string;
  let salt: Uint8Array | undefined;

  if (password) {
    salt = randomBytes(16);
    const secret = toBase64Url(randomBytes(16));
    masterBytes = await derivePasswordMaster(password, secret, salt);
    fragment = `s=${secret}`;
  } else {
    masterBytes = randomBytes(32);
    fragment = `k=${toBase64Url(masterBytes)}`;
  }

  const { key, authToken } = await deriveSubKeys(masterBytes, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(encoder.encode(text)));

  return {
    ciphertext: toBase64Url(new Uint8Array(encrypted)),
    iv: toBase64Url(iv),
    salt: salt ? toBase64Url(salt) : undefined,
    authHash: await sha256Base64Url(authToken),
    fragment,
  };
}

export async function deriveViewKeys(paste: Pick<StoredPaste, "passwordProtected" | "salt">, password: string) {
  const fragment = parseFragment();

  if (paste.passwordProtected) {
    if (!fragment.secret || !paste.salt) {
      throw new Error("bad-link");
    }
    return deriveSubKeys(await derivePasswordMaster(password, fragment.secret, fromBase64Url(paste.salt)), ["decrypt"]);
  }

  if (!fragment.key) {
    throw new Error("bad-link");
  }

  return deriveSubKeys(fromBase64Url(fragment.key), ["decrypt"]);
}

export async function decryptWithKey(key: CryptoKey, iv: string, ciphertext: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(iv) },
    key,
    toArrayBuffer(fromBase64Url(ciphertext)),
  );

  return decoder.decode(decrypted);
}
