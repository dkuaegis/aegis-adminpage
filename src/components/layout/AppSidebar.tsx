import { NavLink } from "react-router-dom";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

interface AppSidebarProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <ScrollArea className="h-full rounded-2xl border bg-sidebar px-3 py-4">
      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent shadow-sm"
                )
              }
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
