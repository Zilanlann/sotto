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
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import {
  Check,
  Clock3,
  Copy as CopyIcon,
  Eye,
  EyeOff,
  Flame,
  Hash,
  KeyRound,
  Link2,
  PencilLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ApiError, saveStoredPaste } from "../lib/api";
import { createId, encryptText } from "../lib/crypto";
import { byteLength, formatBytes, renderMarkdown } from "../lib/format";
import type { Copy } from "../i18n";
import { MAX_BYTES, MAX_EXPIRY_MINUTES, type StoredPaste } from "../types";
import { copyText, SectionLabel, SettingSwitch } from "./shared";

type ExpiryPreset = "10m" | "1h" | "1d" | "7d" | "custom";
type EditorMode = "write" | "preview";
type CreateError = "" | "invalid" | "crypto" | "remote";

const MIN_PASSWORD_LENGTH = 4;
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

function normalizeExpiryMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_EXPIRY_MINUTES, Math.max(1, Math.trunc(value)));
}

export function CreatePaste({ copy }: { copy: Copy }) {
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

  const contentBytes = byteLength(content);
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
            <CopyIcon className="size-4" />
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
