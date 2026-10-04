import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Users, Network } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="hidden sm:block font-heading text-lg tracking-wide text-primary whitespace-nowrap">
            ❦ Grimoire
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              <Users className="w-4 h-4 inline mr-1 -mt-0.5" />Characters
            </NavLink>
            <NavLink
              to="/organizations"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              <Network className="w-4 h-4 inline mr-1 -mt-0.5" />Organizations
            </NavLink>
          </nav>
          <div className="ml-auto"><ThemeSwitcher /></div>
        </div>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
