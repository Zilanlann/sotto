import { useEffect, useState } from "react";

import { COPY, type Locale } from "./i18n";

export type Theme = "light" | "dark";

const THEME_KEY = "sotto:theme";
const LOCALE_KEY = "sotto:locale";

function getRoute() {
  const match = window.location.pathname.match(/^\/p\/([^/]+)/);

  return match?.[1] ?? null;
}

export function useRouteId() {
  const [routeId, setRouteId] = useState(() => getRoute());

  useEffect(() => {
    const sync = () => setRouteId(getRoute());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return routeId;
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

export function useLocale() {
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
