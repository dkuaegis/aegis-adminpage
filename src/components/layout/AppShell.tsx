import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

export default function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onOpenMobileSidebar={() => setMobileNavOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1680px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 lg:block">
          <AppSidebar />
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">네비게이션</SheetTitle>
          <div className="h-full p-4">
            <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
