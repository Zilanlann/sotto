import { useEffect, useState } from "react";

import { COPY, type Locale } from "./i18n";
import { renderMarkdown } from "./lib/format";

export type Theme = "light" | "dark";

const THEME_KEY = "sotto:theme";
const LOCALE_KEY = "sotto:locale";

export type Route = { name: "create" } | { name: "about" } | { name: "view"; pasteId: string };

function getRoute(): Route {
  const path = window.location.pathname;
  const pasteMatch = path.match(/^\/p\/([^/]+)/);

  if (pasteMatch) {
    return { name: "view", pasteId: pasteMatch[1] };
  }

  if (path === "/about" || path === "/about/") {
    return { name: "about" };
  }

  return { name: "create" };
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => getRoute());

  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return route;
}

export function navigate(path: string) {
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

export function useTheme() {
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

export function useMarkdownPreview(content: string, enabled = true) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!enabled || !content.trim()) {
      setHtml("");
      return;
    }

    let cancelled = false;
    void renderMarkdown(content).then((rendered) => {
      if (!cancelled) {
        setHtml(rendered);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [content, enabled]);

  return html;
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const copy = COPY[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // ignore persistence failures (private mode, etc.)
    }
  }, [locale]);

  const toggle = () => setLocale((current) => (current === "zh" ? "en" : "zh"));

  return { locale, copy, toggle };
}
