import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, CalendarDays, Activity } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Schedule", path: "/schedule", icon: CalendarDays },
    { name: "Doctors", path: "/doctors", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">MediSync</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.path} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
