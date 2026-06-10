import DOMPurify from "dompurify";
import { marked } from "marked";

import type { Locale } from "../i18n";

const encoder = new TextEncoder();

export function byteLength(value: string) {
  return encoder.encode(value).byteLength;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatExpiry(timestamp: number, locale: Locale) {
  const remaining = Math.max(0, timestamp - Date.now());
  const minutes = Math.ceil(remaining / 60_000);

  if (minutes < 60) {
    return locale === "zh" ? `${minutes} 分钟后` : `in ${minutes} min`;
  }

  const hours = Math.ceil(minutes / 60);

  if (hours < 48) {
    return locale === "zh" ? `${hours} 小时后` : `in ${hours} hr`;
  }

  const days = Math.ceil(hours / 24);
  return locale === "zh" ? `${days} 天后` : `in ${days} day${days === 1 ? "" : "s"}`;
}

export function formatDateTime(timestamp: number, locale: Locale) {
  return new Date(timestamp).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}

export function renderMarkdown(value: string) {
  const raw = marked.parse(value, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
