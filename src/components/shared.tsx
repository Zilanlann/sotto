import { Chip, Description, Label, Switch, toast } from "@heroui/react";

import { navigate } from "../hooks";

// Real anchor for internal routes: crawlers and middle-click get a plain
// link, while normal clicks stay inside the SPA router.
export function AppLink({
  href,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return (
    <a className={className} href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

export async function copyText(value: string, message: string, failureMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(message);
    return true;
  } catch {
    toast.danger(failureMessage);
    return false;
  }
}

export function StatusChip({
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

/* Speech bubble dissolving into particles — sotto voce: a whisper that fades.
   /logo.svg is the brand mark traced from the original artwork (cropped from the
   vtracer output, glow fragments stripped); colors are baked in, not theme vars.
   /favicon.svg is the same mark. */
export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <img
      alt=""
      className={`shrink-0 ${className}`}
      src="/logo.svg"
      style={{ filter: "drop-shadow(0 4px 12px var(--glow-1))" }}
    />
  );
}

export function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <span className="grid size-6 place-items-center rounded-md bg-surface-secondary text-muted">{icon}</span>
      {children}
    </div>
  );
}

export function SettingSwitch({
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
