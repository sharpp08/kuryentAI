import { Link, useLocation } from "wouter";
import { LayoutDashboard, Cpu, Lightbulb, Zap, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Devices", href: "/devices", icon: Cpu },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Reports", href: "/reports", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-md">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary neon-glow">
            <Zap className="h-5 w-5 fill-primary text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight leading-none">kuryentAI</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">Philippines</span>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary neon-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50">
        <div className="rounded-xl bg-gradient-to-b from-primary/10 to-transparent p-4 border border-primary/20">
          <p className="text-xs font-medium text-primary mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Optimal Efficiency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
