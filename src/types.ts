// Shared data contract between the browser client and the Worker.
export type StoredPaste = {
  id: string;
  ciphertext: string;
  iv: string;
  salt?: string;
  createdAt: number;
  expiresAt: number;
  burnAfterReading: boolean;
  markdown: boolean;
  passwordProtected: boolean;
  destroyedAt?: number;
  readAt?: number;
  bytes: number;
};

export const MAX_BYTES = 256 * 1024;
export const MAX_EXPIRY_MINUTES = 30 * 24 * 60;
