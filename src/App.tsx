import { Toast } from "@heroui/react";
import { useEffect } from "react";

import { AboutPage } from "./components/AboutPage";
import { CreatePaste } from "./components/CreatePaste";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
import { ViewPaste } from "./components/ViewPaste";
import { useLocale, useRoute } from "./hooks";

function App() {
  const route = useRoute();
  const { locale, copy, toggle } = useLocale();

  useEffect(() => {
    document.title = route.name === "about" ? copy.about.pageTitle : copy.pageTitle;
  }, [copy, route.name]);

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar copy={copy} locale={locale} route={route} onToggleLocale={toggle} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {route.name === "view" ? (
          <ViewPaste copy={copy} locale={locale} pasteId={route.pasteId} />
        ) : route.name === "about" ? (
          <AboutPage copy={copy} locale={locale} />
        ) : (
          <CreatePaste copy={copy} />
        )}
      </main>
      <SiteFooter copy={copy} locale={locale} />
      <Toast.Provider />
    </div>
  );
}

export default App;
