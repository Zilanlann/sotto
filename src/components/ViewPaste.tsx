import {
  Alert,
  Button,
  Card,
  Description,
  Input,
  Label,
  ScrollShadow,
  Spinner,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@heroui/react";
import { Clock3, Copy as CopyIcon, Eye, FileText, Flame, Lock, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { navigate } from "../hooks";
import type { Copy, Locale } from "../i18n";
import { ApiError, claimStoredPaste, readStoredPaste } from "../lib/api";
import { decryptWithKey, deriveViewKeys, parseFragment } from "../lib/crypto";
import { formatBytes, formatExpiry, renderMarkdown } from "../lib/format";
import type { StoredPaste } from "../types";
import { copyText, StatusChip } from "./shared";
import { TerminalState, type TerminalMode } from "./TerminalState";

type ViewMode = "locked" | "loading" | "ready" | TerminalMode;

function isTerminalMode(mode: ViewMode): mode is TerminalMode {
  return mode === "expired" || mode === "destroyed" || mode === "missing" || mode === "bad-link" || mode === "error";
}

export function ViewPaste({ copy, locale, pasteId }: { copy: Copy; locale: Locale; pasteId: string }) {
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

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  const unlock = async () => {
    if (!paste) {
      return;
    }

    setMode("loading");
    setUnlockError(false);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      const { key, authToken } = await deriveViewKeys(paste, password);
      const ciphertext = paste.burnAfterReading ? await claimStoredPaste(paste.id, authToken) : paste.ciphertext;
      setContent(await decryptWithKey(key, paste.iv, ciphertext));
      setMode("ready");
    } catch (caught) {
      if (caught instanceof Error && caught.message === "bad-link") {
        setMode("bad-link");
        return;
      }

      if (caught instanceof ApiError) {
        if (caught.message === "expired") {
          setMode("expired");
          return;
        }
        if (caught.message === "destroyed") {
          setMode("destroyed");
          return;
        }
        if (caught.message === "not-found") {
          setMode("missing");
          return;
        }
        if (caught.message !== "forbidden") {
          setMode("error");
          return;
        }
      }

      // Wrong password (claim rejected, or local AES-GCM failure) — content intact.
      setMode("locked");
      setUnlockError(true);
    }
  };

  if (isTerminalMode(mode)) {
    return <TerminalState copy={copy} locale={locale} mode={mode} paste={paste} />;
  }

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
              {paste?.burnAfterReading ? (
                <p className="relative mt-2 max-w-sm text-center text-sm font-medium text-warning">
                  {copy.view.burnUnlockNotice}
                </p>
              ) : null}
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
                  <CopyIcon className="size-4" />
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
