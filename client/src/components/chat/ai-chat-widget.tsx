import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, stopGeneration } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-50 flex flex-col glass-panel overflow-hidden neon-glow-accent",
              "inset-0 rounded-none",
              "md:inset-auto md:bottom-20 md:right-6 md:w-[380px] md:h-[520px] md:rounded-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Energy Assistant</h3>
                  <p className="text-xs text-muted-foreground">Aware of your live usage</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                      : "bg-secondary text-foreground rounded-bl-none border border-border/50"
                  )}
                >
                  {msg.content || (isLoading && i === messages.length - 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : null)}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex w-max max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 text-sm border border-border/50">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-background border-t border-border/50 shrink-0 pb-safe">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your devices or bill..."
                  className="flex-1 bg-secondary border-none rounded-full h-10 px-4 focus-visible:ring-1 focus-visible:ring-accent"
                />
                {isLoading ? (
                  <Button type="button" size="icon" variant="ghost" onClick={stopGeneration} className="h-10 w-10 rounded-full shrink-0 text-muted-foreground hover:bg-secondary">
                    <X className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button type="submit" size="icon" disabled={!input.trim()} className="h-10 w-10 rounded-full shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground neon-glow-accent">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button — hidden on mobile when chat is open to avoid overlap */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-accent text-white shadow-xl neon-glow-accent flex items-center justify-center hover:bg-accent/90 transition-colors",
          "md:bottom-6 md:right-6",
          isOpen && "hidden md:flex"
        )}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>
    </>
  );
}
