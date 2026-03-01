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
            className="fixed bottom-20 right-6 z-50 w-[380px] h-[500px] flex flex-col glass-panel rounded-2xl overflow-hidden neon-glow-accent"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Energy Assistant</h3>
                  <p className="text-xs text-muted-foreground">Always active</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 pr-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 mt-20 opacity-50">
                  <Sparkles className="h-10 w-10 text-accent" />
                  <p className="text-sm">Hi! I'm your kuryentAI assistant.<br/>Ask me about your energy usage.</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                      {msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex w-max max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 bg-background border-t border-border/50">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about saving energy..."
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

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-accent text-white shadow-xl neon-glow-accent flex items-center justify-center hover:bg-accent/90 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
