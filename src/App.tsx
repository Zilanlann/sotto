import { Toast } from "@heroui/react";

import { CreatePaste } from "./components/CreatePaste";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
import { ViewPaste } from "./components/ViewPaste";
import { useLocale, useRouteId } from "./hooks";

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

export default App;
