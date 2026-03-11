import { useState } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { AiChatWidget } from "../chat/ai-chat-widget";
import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto z-10">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </div>
      </main>
      <BottomNav />
      <AiChatWidget />
    </div>
  );
}
