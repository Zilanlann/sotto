import { Button, Tooltip } from "@heroui/react";
import { ArrowLeft, EyeOff, Languages, Moon, ShieldCheck, Sun } from "lucide-react";

import { navigate, useTheme } from "../hooks";
import type { Copy } from "../i18n";
import { BrandMark, StatusChip } from "./shared";

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

export function NavBar({
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
              <span className="text-base font-semibold tracking-tight">sotto</span>
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
