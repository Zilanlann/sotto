import { Separator } from "@heroui/react";
import { Lock } from "lucide-react";

import type { Copy } from "../i18n";
import { AppLink } from "./shared";

export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <Separator className="mb-4" />
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
        <p className="font-mono">{copy.footer.model}</p>
        <div className="flex items-center gap-4">
          <AppLink className="transition-colors hover:text-foreground" href="/about">
            {copy.nav.about}
          </AppLink>
          <p className="flex items-center gap-1.5">
            <Lock className="size-3" />
            {copy.footer.keyStays}
          </p>
        </div>
      </div>
    </footer>
  );
}
