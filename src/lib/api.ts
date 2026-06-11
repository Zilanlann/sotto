import type { StoredPaste } from "../types";

import { sha256Base64Url } from "./crypto";

const STORAGE_KEY = "sotto:dev:pastes";
const LOCAL_STORAGE_FALLBACK_ENABLED = import.meta.env.DEV;

export class ApiError extends Error {
  constructor(message = "api-error") {
    super(message);
  }
}

class ApiUnavailableError extends Error {
  constructor() {
    super("api-unavailable");
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiUnavailableError();
  }

  return response.json() as Promise<T>;
}

function readStore(): Record<string, StoredPaste> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredPaste>) : {};
  } catch {
    return {};
  }
}

function writeStore(next: Record<string, StoredPaste>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function writeLocalPaste(paste: StoredPaste) {
  writeStore({ ...readStore(), [paste.id]: paste });
}

function readLocalPaste(id: string) {
  return readStore()[id] ?? null;
}

function getDestroyedPaste(paste: StoredPaste): StoredPaste {
  const destroyedAt = Date.now();

  return {
    ...paste,
    destroyedAt: paste.destroyedAt ?? destroyedAt,
    readAt: paste.readAt ?? destroyedAt,
    ciphertext: "",
  };
}

async function saveRemotePaste(paste: StoredPaste) {
  const response = await fetch("/api/pastes", {
    body: JSON.stringify(paste),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const data = await readJsonResponse<{ error?: string }>(response);

  if (!response.ok) {
    throw new ApiError(data.error);
  }
}

async function readRemotePaste(id: string) {
  const response = await fetch(`/api/pastes/${encodeURIComponent(id)}`, {
    headers: { accept: "application/json" },
  });
  const data = await readJsonResponse<StoredPaste | { error?: string }>(response);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ApiError("error" in data ? data.error : undefined);
  }

  return data as StoredPaste;
}

async function claimRemotePaste(id: string, authToken: string) {
  const response = await fetch(`/api/pastes/${encodeURIComponent(id)}/claim`, {
    body: JSON.stringify({ authToken }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const data = await readJsonResponse<{ ciphertext?: string; error?: string }>(response);

  if (!response.ok) {
    throw new ApiError(data.error);
  }

  return data.ciphertext ?? "";
}

async function claimLocalPaste(id: string, authToken: string) {
  const paste = readLocalPaste(id);
  if (!paste) {
    throw new ApiError("not-found");
  }
  if (paste.expiresAt <= Date.now()) {
    throw new ApiError("expired");
  }
  if (paste.destroyedAt) {
    throw new ApiError("destroyed");
  }
  if (!paste.authHash || (await sha256Base64Url(authToken)) !== paste.authHash) {
    throw new ApiError("forbidden");
  }

  writeLocalPaste(getDestroyedPaste(paste));
  return paste.ciphertext;
}

export async function saveStoredPaste(paste: StoredPaste) {
  try {
    await saveRemotePaste(paste);
    if (LOCAL_STORAGE_FALLBACK_ENABLED) {
      writeLocalPaste(paste);
    }
    return "remote" as const;
  } catch (caught) {
    if (caught instanceof ApiUnavailableError && LOCAL_STORAGE_FALLBACK_ENABLED) {
      writeLocalPaste(paste);
      return "local" as const;
    }

    throw caught instanceof ApiUnavailableError ? new ApiError("api-unavailable") : caught;
  }
}

export async function readStoredPaste(id: string) {
  try {
    const remotePaste = await readRemotePaste(id);
    if (remotePaste) {
      if (LOCAL_STORAGE_FALLBACK_ENABLED) {
        writeLocalPaste(remotePaste);
      }
      return remotePaste;
    }
  } catch (caught) {
    if (caught instanceof ApiUnavailableError && LOCAL_STORAGE_FALLBACK_ENABLED) {
      return readLocalPaste(id);
    }

    throw caught instanceof ApiUnavailableError ? new ApiError("api-unavailable") : caught;
  }

  return LOCAL_STORAGE_FALLBACK_ENABLED ? readLocalPaste(id) : null;
}

export async function claimStoredPaste(id: string, authToken: string) {
  try {
    return await claimRemotePaste(id, authToken);
  } catch (caught) {
    if (caught instanceof ApiUnavailableError) {
      if (LOCAL_STORAGE_FALLBACK_ENABLED) {
        return claimLocalPaste(id, authToken);
      }
      throw new ApiError("api-unavailable");
    }

    throw caught;
  }
}
