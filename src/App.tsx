import DOMPurify from "dompurify";
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Input,
  Kbd,
  Label,
  Meter,
  NumberField,
  ScrollShadow,
  Separator,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toast,
  Tooltip,
  toast,
} from "@heroui/react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Hash,
  KeyRound,
  Languages,
  Link2,
  Lock,
  Moon,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  Trash2,
} from "lucide-react";
import { marked } from "marked";
import { useEffect, useMemo, useState } from "react";

type ExpiryPreset = "10m" | "1h" | "1d" | "7d" | "custom";
type EditorMode = "write" | "preview";
type ViewMode = "locked" | "loading" | "ready" | "expired" | "destroyed" | "missing" | "bad-link" | "error";
type Theme = "light" | "dark";
type Locale = "zh" | "en";
type CreateError = "" | "invalid" | "crypto" | "remote";

type StoredPaste = {
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

const STORAGE_KEY = "sotto:prototype:pastes";
const THEME_KEY = "sotto:theme";
const LOCALE_KEY = "sotto:locale";
const MAX_BYTES = 256 * 1024;
const MAX_EXPIRY_MINUTES = 30 * 24 * 60;
const MIN_PASSWORD_LENGTH = 4;
const LOCAL_STORAGE_FALLBACK_ENABLED = import.meta.env.DEV;
const SAMPLE_TEXT = `# Release notes

- Deploy preview is ready
- API keys are rotated
- Read-once link expires after review

\`\`\`ts
const encrypted = await encryptPaste(markdown);
\`\`\``;

const EXPIRY_OPTIONS: Array<{ key: ExpiryPreset; minutes: number }> = [
  { key: "10m", minutes: 10 },
  { key: "1h", minutes: 60 },
  { key: "1d", minutes: 60 * 24 },
  { key: "7d", minutes: 60 * 24 * 7 },
  { key: "custom", minutes: 60 * 24 },
];

const COPY = {
  zh: {
    pageTitle: "Sotto · 端到端加密的临时分享",
    nav: {
      tagline: "端到端加密 · 临时分享",
      noServerLogs: "无服务端日志",
      newPaste: "新建",
    },
    theme: {
      aria: "切换主题",
      toLight: "切换到浅色",
      toDark: "切换到深色",
    },
    locale: {
      aria: "切换语言",
      toggleLabel: "EN",
      tooltip: "Switch to English",
    },
    footer: {
      model: "sotto · 前端加密原型 · 不做服务端存储",
      keyStays: "密钥永远留在浏览器",
    },
    create: {
      badge: "端到端加密 · 零知识",
      titleStart: "端到端加密的",
      titleHighlight: "临时分享",
      description:
        "内容在浏览器本地以 AES-256-GCM 加密后才上传，密钥仅存于链接的 # 片段、不经服务端。零知识架构确保我们无法访问你的明文。",
      editorTitle: "编写内容",
      editorDescription: "支持 Markdown，保存前会在本地完成加密。",
      editorModeLabel: "编辑模式",
      edit: "编辑",
      preview: "预览",
      pasteAria: "Paste 内容",
      placeholder: "粘贴要临时分享的内容...",
      noPreview: "暂无 Markdown 预览",
      usageAria: "内容大小占用",
      usedSpace: "已用空间",
      quickCreate: "快速创建",
      settingsTitle: "发布设置",
      settingsDescription: "生成后不可编辑，只能重新创建。",
      expiryLabel: "过期时间",
      expiryOptions: {
        "10m": "10分钟",
        "1h": "1小时",
        "1d": "1天",
        "7d": "7天",
        custom: "自定义",
      },
      customMinutesLabel: "自定义分钟数",
      customMinutesDescription: "单位：分钟。最长 30 天，前后端都会校验。",
      burnLabel: "阅后即焚",
      burnDescription: "成功解密后销毁服务器副本。",
      passwordLabel: "访问密码",
      passwordDescription: "密码只参与本地密钥派生。",
      passwordFieldLabel: "密码",
      passwordPlaceholder: "至少 4 位",
      passwordTooShort: "密码至少 4 位。",
      passwordHelp: "不会上传到服务端。",
      createErrorTitle: "无法创建",
      errors: {
        invalid: "内容为空、超过大小限制，或密码少于 4 位。",
        crypto: "当前浏览器无法完成加密，请确认支持 Web Crypto。",
        remote: "密文无法保存，请稍后重试。",
      },
      submit: "加密并生成链接",
    },
    share: {
      title: "链接已就绪",
      description: "密钥位于 # 片段，后端不会收到。",
      copy: "复制链接",
      copied: "链接已复制到剪贴板",
      open: "打开",
    },
    privacy: {
      title: "隐私模型",
      items: [
        "只保存密文、IV、过期时间和访问策略。",
        "不提供公开列表、搜索或服务端预览。",
        "解密密钥仅存在于链接片段，不入库、不进日志。",
      ],
    },
    view: {
      title: "查看 Paste",
      description: "需要主动解锁，避免链接预览误触发阅后即焚。",
      ciphertext: "密文",
      burn: "阅后即焚",
      readyTitle: "加密内容已就绪",
      passwordPrompt: "输入密码后将在本地解密，密码不会发送给后端。",
      unlockPrompt: "点击解锁后将在本地完成解密。",
      passwordLabel: "访问密码",
      passwordPlaceholder: "输入密码",
      passwordHelp: "密码不会发送给后端。",
      unlockErrorTitle: "无法解锁",
      unlockErrorDescription: "密码错误、密钥不匹配，或内容无法解密。",
      destroyedCopyTitle: "服务器副本已销毁",
      destroyedCopyDescription: "刷新或再次打开这个链接会进入已销毁状态。",
      viewModeLabel: "查看方式",
      preview: "预览",
      raw: "原文",
      copyContent: "复制内容",
      copiedContent: "已复制解密后的内容",
      copyContentTooltip: "复制解密后的文本",
      createNew: "创建新的 Paste",
      unlock: "解锁查看",
    },
    terminal: {
      expiredTitle: "内容已过期",
      expiredWithDate: (date: string) => `这个 Paste 在 ${date} 过期。`,
      expiredFallback: "链接已失效。",
      destroyedTitle: "内容已被销毁",
      destroyedDescription: "这个 Paste 启用了阅后即焚，服务器副本已经删除。",
      missingTitle: "找不到内容",
      missingDescription: "Paste 不存在，或当前原型浏览器没有这条本地模拟数据。",
      badLinkTitle: "链接缺少解密材料",
      badLinkDescription: "URL 片段中没有可用密钥，服务端也不会保存密钥。",
      lockedTitle: "需要解锁",
      lockedDescription: "打开链接后主动解锁查看。",
      loadingTitle: "正在解锁",
      loadingDescription: "浏览器正在本地解密。",
      readyTitle: "已解锁",
      readyDescription: "内容已经解密。",
      errorTitle: "无法解锁",
      errorDescription: "密钥或密码不匹配。",
      back: "返回创建页",
    },
    toast: {
      created: "加密链接已生成",
      createdDescription: "密钥已写入 # 片段，不会发往服务端。",
      createdLocalDescription: "当前使用本地原型存储。部署到 Worker 后，链接可跨浏览器访问密文。",
      copyFailed: "复制失败，请手动选择文本。",
      destroyFailed: "内容已解密，但服务器副本销毁失败，请稍后重试。",
    },
  },
  en: {
    pageTitle: "Sotto · End-to-end encrypted temporary sharing",
    nav: {
      tagline: "End-to-end encrypted · Temporary sharing",
      noServerLogs: "No server logs",
      newPaste: "New",
    },
    theme: {
      aria: "Toggle theme",
      toLight: "Switch to light",
      toDark: "Switch to dark",
    },
    locale: {
      aria: "Switch language",
      toggleLabel: "中",
      tooltip: "切换到中文",
    },
    footer: {
      model: "sotto · frontend encryption prototype · no server-side storage",
      keyStays: "Keys stay in your browser",
    },
    create: {
      badge: "End-to-end encrypted · Zero knowledge",
      titleStart: "End-to-end encrypted ",
      titleHighlight: "temporary sharing",
      description:
        "Content is encrypted locally in your browser with AES-256-GCM before upload. The key only lives in the URL # fragment and never reaches the server, so the zero-knowledge model keeps plaintext inaccessible to us.",
      editorTitle: "Compose Content",
      editorDescription: "Supports Markdown and encrypts locally before saving.",
      editorModeLabel: "Editor mode",
      edit: "Edit",
      preview: "Preview",
      pasteAria: "Paste content",
      placeholder: "Paste content to share temporarily...",
      noPreview: "No Markdown preview yet",
      usageAria: "Content size usage",
      usedSpace: "Used",
      quickCreate: "Quick create",
      settingsTitle: "Publish Settings",
      settingsDescription: "Generated links cannot be edited. Create a new one instead.",
      expiryLabel: "Expiration",
      expiryOptions: {
        "10m": "10 min",
        "1h": "1 hour",
        "1d": "1 day",
        "7d": "7 days",
        custom: "Custom",
      },
      customMinutesLabel: "Custom minutes",
      customMinutesDescription: "Unit: minutes. Maximum 30 days, validated on both client and backend.",
      burnLabel: "Burn after reading",
      burnDescription: "Destroy the server copy after successful decryption.",
      passwordLabel: "Access password",
      passwordDescription: "Password only participates in local key derivation.",
      passwordFieldLabel: "Password",
      passwordPlaceholder: "At least 4 characters",
      passwordTooShort: "Password must be at least 4 characters.",
      passwordHelp: "Never uploaded to the server.",
      createErrorTitle: "Cannot create",
      errors: {
        invalid: "Content is empty, over the size limit, or the password is shorter than 4 characters.",
        crypto: "This browser cannot complete encryption. Check Web Crypto support.",
        remote: "Ciphertext could not be saved. Please try again later.",
      },
      submit: "Encrypt and generate link",
    },
    share: {
      title: "Link ready",
      description: "The key is in the # fragment, so the backend never receives it.",
      copy: "Copy link",
      copied: "Link copied to clipboard",
      open: "Open",
    },
    privacy: {
      title: "Privacy Model",
      items: [
        "Only ciphertext, IV, expiration, and access policy are stored.",
        "No public listing, search, or server-side preview.",
        "The decryption key only exists in the URL fragment: not stored, not logged.",
      ],
    },
    view: {
      title: "View Paste",
      description: "Unlock manually to avoid link previews triggering burn-after-reading.",
      ciphertext: "Ciphertext",
      burn: "Burn after reading",
      readyTitle: "Encrypted content is ready",
      passwordPrompt: "Enter the password to decrypt locally. The password is never sent to the backend.",
      unlockPrompt: "Click unlock to decrypt locally in your browser.",
      passwordLabel: "Access password",
      passwordPlaceholder: "Enter password",
      passwordHelp: "Password is never sent to the backend.",
      unlockErrorTitle: "Cannot unlock",
      unlockErrorDescription: "Wrong password, mismatched key, or content cannot be decrypted.",
      destroyedCopyTitle: "Server copy destroyed",
      destroyedCopyDescription: "Refreshing or reopening this link will show it as destroyed.",
      viewModeLabel: "View mode",
      preview: "Preview",
      raw: "Raw",
      copyContent: "Copy content",
      copiedContent: "Decrypted content copied",
      copyContentTooltip: "Copy decrypted text",
      createNew: "Create new Paste",
      unlock: "Unlock",
    },
    terminal: {
      expiredTitle: "Content expired",
      expiredWithDate: (date: string) => `This Paste expired at ${date}.`,
      expiredFallback: "The link has expired.",
      destroyedTitle: "Content destroyed",
      destroyedDescription: "This Paste had burn-after-reading enabled, and the server copy has been deleted.",
      missingTitle: "Content not found",
      missingDescription: "The Paste does not exist, or this prototype browser does not have its local mock data.",
      badLinkTitle: "Missing decryption material",
      badLinkDescription: "The URL fragment has no usable key, and the server does not store keys.",
      lockedTitle: "Unlock required",
      lockedDescription: "Open the link and unlock it manually.",
      loadingTitle: "Unlocking",
      loadingDescription: "Your browser is decrypting locally.",
      readyTitle: "Unlocked",
      readyDescription: "Content has been decrypted.",
      errorTitle: "Cannot unlock",
      errorDescription: "Key or password does not match.",
      back: "Back to create",
    },
    toast: {
      created: "Encrypted link generated",
      createdDescription: "The key was written to the # fragment and will not be sent to the server.",
      createdLocalDescription:
        "Using local prototype storage right now. After Worker deployment, links can fetch ciphertext across browsers.",
      copyFailed: "Copy failed. Please select the text manually.",
      destroyFailed: "Content decrypted, but destroying the server copy failed. Please retry later.",
    },
  },
} as const;

type Copy = (typeof COPY)[Locale];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getRoute() {
  const match = window.location.pathname.match(/^\/p\/([^/]+)/);

  return match?.[1] ?? null;
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

class ApiUnavailableError extends Error {
  constructor() {
    super("api-unavailable");
  }
}

class ApiError extends Error {
  constructor(message = "api-error") {
    super(message);
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiUnavailableError();
  }

  return response.json() as Promise<T>;
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

async function destroyRemotePaste(id: string) {
  const response = await fetch(`/api/pastes/${encodeURIComponent(id)}/destroy`, {
    headers: { accept: "application/json" },
    method: "POST",
  });
  const data = await readJsonResponse<{ error?: string }>(response);

  if (!response.ok) {
    throw new ApiError(data.error);
  }
}

async function saveStoredPaste(paste: StoredPaste) {
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

async function readStoredPaste(id: string) {
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

async function destroyStoredPaste(paste: StoredPaste) {
  const next = getDestroyedPaste(paste);

  try {
    await destroyRemotePaste(paste.id);
  } catch (caught) {
    if (!(caught instanceof ApiUnavailableError && LOCAL_STORAGE_FALLBACK_ENABLED)) {
      throw caught instanceof ApiUnavailableError ? new ApiError("api-unavailable") : caught;
    }
  } finally {
    if (LOCAL_STORAGE_FALLBACK_ENABLED) {
      writeLocalPaste(next);
    }
  }
}

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

function parseFragment() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    key: params.get("k"),
    secret: params.get("s"),
  };
}

function createId() {
  return toBase64Url(randomBytes(10));
}

function normalizeExpiryMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_EXPIRY_MINUTES, Math.max(1, Math.trunc(value)));
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

async function encryptText(text: string, password: string) {
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

async function decryptText(paste: StoredPaste, password: string) {
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

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatExpiry(timestamp: number, locale: Locale) {
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

function formatDateTime(timestamp: number, locale: Locale) {
  return new Date(timestamp).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}

function renderMarkdown(value: string) {
  const raw = marked.parse(value, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

function useRouteId() {
  const [routeId, setRouteId] = useState(() => getRoute());

  useEffect(() => {
    const sync = () => setRouteId(getRoute());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return routeId;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getInitialTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "zh" || stored === "en") {
      return stored;
    }
  } catch {
    // ignore persistence failures (private mode, etc.)
  }

  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore persistence failures (private mode, etc.)
    }
  }, [theme]);

  const toggle = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  return { theme, toggle };
}

function useLocale() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const copy = COPY[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = copy.pageTitle;
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // ignore persistence failures (private mode, etc.)
    }
  }, [copy.pageTitle, locale]);

  const toggle = () => setLocale((current) => (current === "zh" ? "en" : "zh"));

  return { locale, copy, toggle };
}

async function copyText(value: string, message: string, failureMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(message);
    return true;
  } catch {
    toast.danger(failureMessage);
    return false;
  }
}

function StatusChip({
  children,
  color = "default",
  icon,
}: {
  children: React.ReactNode;
  color?: "default" | "accent" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}) {
  return (
    <Chip color={color} size="sm" variant="soft">
      {icon}
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
}

function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-xl brand-gradient brand-glow ${className}`}>
      <Lock className="size-1/2 text-white" />
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <span className="grid size-6 place-items-center rounded-md bg-surface-secondary text-muted">{icon}</span>
      {children}
    </div>
  );
}

function SettingSwitch({
  label,
  description,
  selected,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  selected: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <Switch
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary/50 p-3.5 transition-colors data-[selected=true]:border-accent/40"
      isSelected={selected}
      onChange={onChange}
    >
      <Switch.Content className="flex min-w-0 flex-row items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-tertiary text-muted transition-colors group-data-[selected=true]:bg-accent-soft group-data-[selected=true]:text-accent-soft-foreground">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <Label className="text-sm font-medium">{label}</Label>
          <Description className="text-xs leading-snug">{description}</Description>
        </span>
      </Switch.Content>
      <Switch.Control className="shrink-0">
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  );
}

function ThemeToggle({ copy }: { copy: Copy }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <Tooltip delay={300}>
      <Button aria-label={copy.theme.aria} isIconOnly size="sm" variant="ghost" onPress={toggle}>
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Tooltip.Content showArrow>
        <Tooltip.Arrow />
        <p>{isDark ? copy.theme.toLight : copy.theme.toDark}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

function LanguageToggle({ copy, onToggle }: { copy: Copy; onToggle: () => void }) {
  return (
    <Tooltip delay={300}>
      <Button aria-label={copy.locale.aria} size="sm" variant="ghost" onPress={onToggle}>
        <Languages className="size-4" />
        <span className="font-mono text-xs">{copy.locale.toggleLabel}</span>
      </Button>
      <Tooltip.Content showArrow>
        <Tooltip.Arrow />
        <p>{copy.locale.tooltip}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

function App() {
  const routeId = useRouteId();
  const { locale, copy, toggle } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar copy={copy} routeId={routeId} onToggleLocale={toggle} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {routeId ? <ViewPaste copy={copy} locale={locale} pasteId={routeId} /> : <CreatePaste copy={copy} />}
      </main>
      <SiteFooter copy={copy} />
      <Toast.Provider />
    </div>
  );
}

function NavBar({
  copy,
  routeId,
  onToggleLocale,
}: {
  copy: Copy;
  routeId: string | null;
  onToggleLocale: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in oklab, var(--background) 78%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          className="flex items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={() => navigate("/")}
          type="button"
        >
          <BrandMark className="size-9" />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">Sotto</span>
              <span className="hidden rounded-full bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
                v0.1
              </span>
            </div>
            <p className="font-mono text-xs text-muted">{copy.nav.tagline}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <StatusChip color="success" icon={<ShieldCheck className="size-3" />}>
              E2EE
            </StatusChip>
            <StatusChip icon={<EyeOff className="size-3" />}>{copy.nav.noServerLogs}</StatusChip>
          </div>
          {routeId ? (
            <Button size="sm" variant="secondary" onPress={() => navigate("/")}>
              <ArrowLeft className="size-4" />
              {copy.nav.newPaste}
            </Button>
          ) : null}
          <LanguageToggle copy={copy} onToggle={onToggleLocale} />
          <ThemeToggle copy={copy} />
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <Separator className="mb-4" />
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
        <p className="font-mono">{copy.footer.model}</p>
        <p className="flex items-center gap-1.5">
          <Lock className="size-3" />
          {copy.footer.keyStays}
        </p>
      </div>
    </footer>
  );
}

function CreatePaste({ copy }: { copy: Copy }) {
  const [content, setContent] = useState(SAMPLE_TEXT);
  const [editorMode, setEditorMode] = useState<EditorMode>("write");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("1d");
  const [customMinutes, setCustomMinutes] = useState(120);
  const [burnAfterReading, setBurnAfterReading] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState<CreateError>("");

  const contentBytes = encoder.encode(content).byteLength;
  const usagePercent = Math.min(100, (contentBytes / MAX_BYTES) * 100);
  const meterColor = usagePercent > 95 ? "danger" : usagePercent > 75 ? "warning" : "success";
  const selectedExpiry = EXPIRY_OPTIONS.find((option) => option.key === expiryPreset)!;
  const expiryMinutes = expiryPreset === "custom" ? normalizeExpiryMinutes(customMinutes) : selectedExpiry.minutes;
  const previewHtml = useMemo(() => renderMarkdown(content), [content]);
  const passwordTooShort = passwordEnabled && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canCreate =
    content.trim().length > 0 &&
    contentBytes <= MAX_BYTES &&
    expiryMinutes <= MAX_EXPIRY_MINUTES &&
    (!passwordEnabled || password.length >= MIN_PASSWORD_LENGTH);

  const createPaste = async () => {
    if (!canCreate) {
      setError("invalid");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 360));
      const id = createId();
      const encrypted = await encryptText(content, passwordEnabled ? password : "");
      const createdAt = Date.now();
      const expiresAt = createdAt + expiryMinutes * 60_000;
      const nextPaste: StoredPaste = {
        id,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        createdAt,
        expiresAt,
        burnAfterReading,
        markdown: true,
        passwordProtected: passwordEnabled,
        bytes: contentBytes,
      };
      const storage = await saveStoredPaste(nextPaste);

      setShareUrl(`${window.location.origin}/p/${id}#${encrypted.fragment}`);
      toast.success(copy.toast.created, {
        description: storage === "remote" ? copy.toast.createdDescription : copy.toast.createdLocalDescription,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? "remote" : "crypto");
    } finally {
      setIsCreating(false);
    }
  };

  const onEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void createPaste();
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <section className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Chip color="accent" size="sm" variant="soft">
            <Sparkles className="size-3" />
            <Chip.Label>{copy.create.badge}</Chip.Label>
          </Chip>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.create.titleStart}
            <span className="brand-text">{copy.create.titleHighlight}</span>
          </h1>
          <p className="max-w-xl text-sm text-muted">{copy.create.description}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="animate-rise flex min-h-[640px] flex-col gap-0">
          <Card.Header>
            <Card.Title>{copy.create.editorTitle}</Card.Title>
            <Card.Description>{copy.create.editorDescription}</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-1 flex-col gap-4">
            <Tabs
              className="editor-mode-tabs flex flex-1 flex-col gap-4"
              selectedKey={editorMode}
              onSelectionChange={(key) => setEditorMode(String(key) as EditorMode)}
            >
              <div className="flex justify-end">
                <Tabs.ListContainer>
                  <Tabs.List aria-label={copy.create.editorModeLabel}>
                    <Tabs.Tab id="write">
                      <PencilLine className="size-3.5" />
                      {copy.create.edit}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="preview">
                      <Eye className="size-3.5" />
                      {copy.create.preview}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </div>
              <Tabs.Panel className="flex min-w-0 flex-1" id="write">
                <TextArea
                  aria-label={copy.create.pasteAria}
                  className="min-h-[500px] w-full font-mono text-sm leading-6 sm:min-h-[520px]"
                  fullWidth
                  placeholder={copy.create.placeholder}
                  rows={20}
                  value={content}
                  variant="secondary"
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={onEditorKeyDown}
                />
              </Tabs.Panel>
              <Tabs.Panel className="flex min-w-0 flex-1" id="preview">
                <ScrollShadow className="thin-scroll min-h-[500px] max-h-[560px] min-w-0 w-full rounded-2xl border border-border bg-surface-secondary/50 p-5 sm:min-h-[520px]">
                  {content.trim() ? (
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  ) : (
                    <div className="grid min-h-[460px] place-items-center text-sm text-muted">{copy.create.noPreview}</div>
                  )}
                </ScrollShadow>
              </Tabs.Panel>
            </Tabs>
          </Card.Content>
          <Card.Footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Meter
              aria-label={copy.create.usageAria}
              className="w-full sm:max-w-xs"
              color={meterColor}
              value={usagePercent}
              valueLabel={`${formatBytes(contentBytes)} / 256 KB`}
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <Label className="text-xs">{copy.create.usedSpace}</Label>
                <Meter.Output className="font-mono" />
              </div>
              <Meter.Track className="mt-1.5">
                <Meter.Fill />
              </Meter.Track>
            </Meter>
            <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
              <Kbd>
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>↵</Kbd.Content>
              </Kbd>
              {copy.create.quickCreate}
            </p>
          </Card.Footer>
        </Card>

        <aside className="flex flex-col gap-6">
          <Card className="animate-rise-2">
            <Card.Header>
              <Card.Title>{copy.create.settingsTitle}</Card.Title>
              <Card.Description>{copy.create.settingsDescription}</Card.Description>
            </Card.Header>
            <Card.Content className="gap-5">
              <section className="flex flex-col gap-3">
                <SectionLabel icon={<Clock3 className="size-3.5" />}>{copy.create.expiryLabel}</SectionLabel>
                <ToggleButtonGroup
                  aria-label={copy.create.expiryLabel}
                  disallowEmptySelection
                  isDetached
                  selectedKeys={new Set([expiryPreset])}
                  selectionMode="single"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", width: "100%" }}
                  onSelectionChange={(keys) => {
                    const next = [...keys][0];
                    if (next) {
                      setExpiryPreset(next as ExpiryPreset);
                    }
                  }}
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <ToggleButton
                      key={option.key}
                      className="justify-center rounded-xl py-2.5 font-medium transition-shadow data-[selected=true]:shadow-[0_4px_18px_-6px_var(--accent)]"
                      id={option.key}
                      style={
                        {
                          width: "100%",
                          "--toggle-button-bg-selected": "var(--accent)",
                          "--toggle-button-bg-selected-hover": "var(--accent-hover)",
                          "--toggle-button-bg-selected-pressed": "var(--accent-hover)",
                          "--toggle-button-fg-selected": "var(--accent-foreground)",
                          ...(option.key === "custom" ? { gridColumn: "1 / -1" } : {}),
                        } as React.CSSProperties
                      }
                    >
                      {copy.create.expiryOptions[option.key]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {expiryPreset === "custom" ? (
                  <NumberField
                    className="w-full"
                    maxValue={MAX_EXPIRY_MINUTES}
                    minValue={1}
                    value={customMinutes}
                    onChange={(value) => setCustomMinutes(normalizeExpiryMinutes(value))}
                  >
                    <Label className="sr-only">{copy.create.customMinutesLabel}</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input className="font-mono" />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                    <Description>{copy.create.customMinutesDescription}</Description>
                  </NumberField>
                ) : null}
              </section>

              <Separator />

              <SettingSwitch
                description={copy.create.burnDescription}
                icon={<Flame className="size-3.5" />}
                label={copy.create.burnLabel}
                selected={burnAfterReading}
                onChange={setBurnAfterReading}
              />

              <SettingSwitch
                description={copy.create.passwordDescription}
                icon={<KeyRound className="size-3.5" />}
                label={copy.create.passwordLabel}
                selected={passwordEnabled}
                onChange={setPasswordEnabled}
              />

              {passwordEnabled ? (
                <TextField
                  fullWidth
                  isInvalid={passwordTooShort}
                  name="password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                >
                  <Label>{copy.create.passwordFieldLabel}</Label>
                  <Input
                    autoComplete="new-password"
                    placeholder={copy.create.passwordPlaceholder}
                    type="password"
                    variant="secondary"
                  />
                  {passwordTooShort ? (
                    <FieldError>{copy.create.passwordTooShort}</FieldError>
                  ) : (
                    <Description>{copy.create.passwordHelp}</Description>
                  )}
                </TextField>
              ) : null}

              {error ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{copy.create.createErrorTitle}</Alert.Title>
                    <Alert.Description>{copy.create.errors[error]}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
            </Card.Content>
            <Card.Footer>
              <Button
                className="brand-glow"
                fullWidth
                isDisabled={!canCreate}
                isPending={isCreating}
                size="lg"
                onPress={createPaste}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : <ShieldCheck className="size-4" />}
                    {copy.create.submit}
                  </>
                )}
              </Button>
            </Card.Footer>
          </Card>

          {shareUrl ? <ShareCard copy={copy} shareUrl={shareUrl} /> : <PrivacyCard copy={copy} />}
        </aside>
      </div>
    </div>
  );
}

function ShareCard({ copy, shareUrl }: { copy: Copy; shareUrl: string }) {
  return (
    <Card className="animate-rise border-accent/30">
      <Card.Header className="flex flex-row items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-success-soft text-success-soft-foreground">
          <Check className="size-5" />
        </span>
        <div>
          <Card.Title>{copy.share.title}</Card.Title>
          <Card.Description>{copy.share.description}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary/60 px-3 py-2">
          <Hash className="size-4 shrink-0 text-muted" />
          <span className="thin-scroll overflow-x-auto whitespace-nowrap font-mono text-xs">{shareUrl}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onPress={() => copyText(shareUrl, copy.share.copied, copy.toast.copyFailed)}
          >
            <Copy className="size-4" />
            {copy.share.copy}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => window.location.assign(shareUrl)}>
            <Link2 className="size-4" />
            {copy.share.open}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function PrivacyCard({ copy }: { copy: Copy }) {
  const items = [
    { icon: <ShieldCheck className="size-4 text-success" />, text: copy.privacy.items[0] },
    { icon: <EyeOff className="size-4 text-accent" />, text: copy.privacy.items[1] },
    { icon: <KeyRound className="size-4 text-warning" />, text: copy.privacy.items[2] },
  ];

  return (
    <Card className="animate-rise-2 border-dashed bg-transparent">
      <Card.Header>
        <Card.Title className="text-base">{copy.privacy.title}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-3 text-sm text-muted">
        {items.map((item) => (
          <div key={item.text} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

function ViewPaste({ copy, locale, pasteId }: { copy: Copy; locale: Locale; pasteId: string }) {
  const [paste, setPaste] = useState<StoredPaste | null>(null);
  const [mode, setMode] = useState<ViewMode>("locked");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [view, setView] = useState<"preview" | "raw">("preview");
  const [unlockError, setUnlockError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPaste = async () => {
      try {
        const found = await readStoredPaste(pasteId);

        if (cancelled) {
          return;
        }

        if (!found) {
          setMode("missing");
          setPaste(null);
          return;
        }

        if (found.destroyedAt) {
          setMode("destroyed");
          setPaste(found);
          return;
        }

        if (found.expiresAt <= Date.now()) {
          setMode("expired");
          setPaste(found);
          return;
        }

        const fragment = parseFragment();
        if ((!found.passwordProtected && !fragment.key) || (found.passwordProtected && !fragment.secret)) {
          setMode("bad-link");
          setPaste(found);
          return;
        }

        setPaste(found);
        setMode("locked");
      } catch {
        if (!cancelled) {
          setMode("error");
          setPaste(null);
        }
      }
    };

    void loadPaste();

    return () => {
      cancelled = true;
    };
  }, [pasteId]);

  const unlock = async () => {
    if (!paste) {
      return;
    }

    setMode("loading");
    setUnlockError(false);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      const decrypted = await decryptText(paste, password);
      setContent(decrypted);
      setMode("ready");

      if (paste.burnAfterReading) {
        try {
          await destroyStoredPaste(paste);
        } catch {
          toast.danger(copy.toast.destroyFailed);
        }
      }
    } catch (caught) {
      setMode(caught instanceof Error && caught.message === "bad-link" ? "bad-link" : "locked");
      setUnlockError(true);
    }
  };

  if (mode === "missing" || mode === "expired" || mode === "destroyed" || mode === "bad-link") {
    return <TerminalState copy={copy} locale={locale} mode={mode} paste={paste} />;
  }

  const previewHtml = renderMarkdown(content);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <Card className="animate-rise">
        <Card.Header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Card.Title>{copy.view.title}</Card.Title>
            <Card.Description>{copy.view.description}</Card.Description>
          </div>
          {paste ? (
            <div className="flex flex-wrap gap-2">
              <StatusChip color="success" icon={<Lock className="size-3" />}>
                {copy.view.ciphertext} {formatBytes(paste.bytes)}
              </StatusChip>
              <StatusChip color="warning" icon={<Clock3 className="size-3" />}>
                {formatExpiry(paste.expiresAt, locale)}
              </StatusChip>
              {paste.burnAfterReading ? (
                <StatusChip color="danger" icon={<Flame className="size-3" />}>
                  {copy.view.burn}
                </StatusChip>
              ) : null}
            </div>
          ) : null}
        </Card.Header>

        {mode !== "ready" ? (
          <Card.Content className="gap-5">
            <div className="relative grid place-items-center overflow-hidden rounded-2xl border border-border bg-surface-secondary/50 px-6 py-10">
              <div className="brand-gradient animate-halo absolute size-28 rounded-full opacity-60 blur-2xl" />
              <div className="relative grid size-16 place-items-center rounded-2xl brand-gradient brand-glow">
                <Lock className="size-7 text-white" />
              </div>
              <h2 className="relative mt-4 text-base font-semibold tracking-tight">{copy.view.readyTitle}</h2>
              <p className="relative mt-1 max-w-sm text-center text-sm text-muted">
                {paste?.passwordProtected ? copy.view.passwordPrompt : copy.view.unlockPrompt}
              </p>
            </div>

            {paste?.passwordProtected ? (
              <TextField fullWidth name="unlock-password" type="password" value={password} onChange={setPassword}>
                <Label>{copy.view.passwordLabel}</Label>
                <Input
                  autoComplete="current-password"
                  placeholder={copy.view.passwordPlaceholder}
                  type="password"
                  variant="secondary"
                />
                <Description>{copy.view.passwordHelp}</Description>
              </TextField>
            ) : null}

            {unlockError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{copy.view.unlockErrorTitle}</Alert.Title>
                  <Alert.Description>{copy.view.unlockErrorDescription}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
          </Card.Content>
        ) : (
          <Card.Content className="gap-4">
            {paste?.burnAfterReading ? (
              <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                  <Alert.Title>{copy.view.destroyedCopyTitle}</Alert.Title>
                  <Alert.Description>{copy.view.destroyedCopyDescription}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <ToggleButtonGroup
                aria-label={copy.view.viewModeLabel}
                disallowEmptySelection
                selectedKeys={new Set([view])}
                selectionMode="single"
                size="sm"
                onSelectionChange={(keys) => {
                  const next = [...keys][0];
                  if (next) {
                    setView(next as "preview" | "raw");
                  }
                }}
              >
                <ToggleButton id="preview">
                  <Eye className="size-4" />
                  {copy.view.preview}
                </ToggleButton>
                <ToggleButton id="raw">
                  <FileText className="size-4" />
                  {copy.view.raw}
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip delay={0}>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => copyText(content, copy.view.copiedContent, copy.toast.copyFailed)}
                >
                  <Copy className="size-4" />
                  {copy.view.copyContent}
                </Button>
                <Tooltip.Content showArrow>
                  <Tooltip.Arrow />
                  <p>{copy.view.copyContentTooltip}</p>
                </Tooltip.Content>
              </Tooltip>
            </div>

            <ScrollShadow className="thin-scroll min-h-[380px] max-h-[560px] rounded-xl border border-border bg-surface-secondary/50 p-5">
              {view === "raw" ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6">{content}</pre>
              ) : (
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
            </ScrollShadow>
          </Card.Content>
        )}

        <Card.Footer className="flex flex-wrap gap-2">
          {mode === "ready" ? (
            <Button variant="secondary" onPress={() => navigate("/")}>
              <RefreshCw className="size-4" />
              {copy.view.createNew}
            </Button>
          ) : (
            <Button
              className="brand-glow"
              isDisabled={mode === "loading" || Boolean(paste?.passwordProtected && !password)}
              isPending={mode === "loading"}
              onPress={unlock}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : <Eye className="size-4" />}
                  {copy.view.unlock}
                </>
              )}
            </Button>
          )}
        </Card.Footer>
      </Card>
    </div>
  );
}

function TerminalState({
  copy,
  locale,
  mode,
  paste,
}: {
  copy: Copy;
  locale: Locale;
  mode: ViewMode;
  paste: StoredPaste | null;
}) {
  const state = {
    expired: {
      icon: <TimerReset className="size-7" />,
      title: copy.terminal.expiredTitle,
      description: paste
        ? copy.terminal.expiredWithDate(formatDateTime(paste.expiresAt, locale))
        : copy.terminal.expiredFallback,
      color: "warning" as const,
    },
    destroyed: {
      icon: <Trash2 className="size-7" />,
      title: copy.terminal.destroyedTitle,
      description: copy.terminal.destroyedDescription,
      color: "danger" as const,
    },
    missing: {
      icon: <FileText className="size-7" />,
      title: copy.terminal.missingTitle,
      description: copy.terminal.missingDescription,
      color: "default" as const,
    },
    "bad-link": {
      icon: <KeyRound className="size-7" />,
      title: copy.terminal.badLinkTitle,
      description: copy.terminal.badLinkDescription,
      color: "danger" as const,
    },
    locked: {
      icon: <Lock className="size-7" />,
      title: copy.terminal.lockedTitle,
      description: copy.terminal.lockedDescription,
      color: "accent" as const,
    },
    loading: {
      icon: <Spinner />,
      title: copy.terminal.loadingTitle,
      description: copy.terminal.loadingDescription,
      color: "accent" as const,
    },
    ready: {
      icon: <ShieldCheck className="size-7" />,
      title: copy.terminal.readyTitle,
      description: copy.terminal.readyDescription,
      color: "success" as const,
    },
    error: {
      icon: <KeyRound className="size-7" />,
      title: copy.terminal.errorTitle,
      description: copy.terminal.errorDescription,
      color: "danger" as const,
    },
  }[mode];

  const toneBg: Record<string, string> = {
    warning: "bg-warning-soft text-warning-soft-foreground",
    danger: "bg-danger-soft text-danger-soft-foreground",
    accent: "bg-accent-soft text-accent-soft-foreground",
    success: "bg-success-soft text-success-soft-foreground",
    default: "bg-surface-secondary text-muted",
  };

  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-md place-items-center">
      <Card className="animate-rise w-full text-center">
        <Card.Content className="items-center gap-5 py-12">
          <div className={`grid size-16 place-items-center rounded-2xl ${toneBg[state.color]}`}>{state.icon}</div>
          <div>
            <Card.Title className="text-xl">{state.title}</Card.Title>
            <Card.Description className="mt-2">{state.description}</Card.Description>
          </div>
          <Chip color={state.color} variant="soft">
            <Chip.Label className="font-mono">{mode}</Chip.Label>
          </Chip>
        </Card.Content>
        <Card.Footer className="justify-center">
          <Button variant="secondary" onPress={() => navigate("/")}>
            <ArrowLeft className="size-4" />
            {copy.terminal.back}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default App;
