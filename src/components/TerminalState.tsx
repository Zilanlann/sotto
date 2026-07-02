import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, FileText, KeyRound, TimerReset, Trash2 } from "lucide-react";

import { localePath, navigate } from "../hooks";
import type { Copy, Locale } from "../i18n";
import { formatDateTime } from "../lib/format";
import type { StoredPaste } from "../types";

export type TerminalMode = "expired" | "destroyed" | "missing" | "bad-link" | "error";

export function TerminalState({
  copy,
  locale,
  mode,
  paste,
}: {
  copy: Copy;
  locale: Locale;
  mode: TerminalMode;
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
          <Button variant="secondary" onPress={() => navigate(localePath(locale, "/"))}>
            <ArrowLeft className="size-4" />
            {copy.terminal.back}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
