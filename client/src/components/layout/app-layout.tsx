import { Sidebar } from "./sidebar";
import { AiChatWidget } from "../chat/ai-chat-widget";
import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto z-10">
          <div className="container max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
      <AiChatWidget />
    </div>
  );
}
