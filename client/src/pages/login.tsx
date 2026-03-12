import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface LoginProps {
  onLogin: (householdName: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdName: trimmed }),
      });
    } catch (_) {}
    localStorage.setItem("kuryentai_household", trimmed);
    onLogin(trimmed);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary neon-glow mb-4"
          >
            <Zap className="h-9 w-9 fill-primary text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl font-bold tracking-tight"
          >
            kuryentAI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-semibold"
          >
            Philippines · ANTECO
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="glass-panel rounded-2xl p-8 border border-border/50 shadow-2xl"
        >
          <h2 className="text-xl font-semibold mb-1">Welcome!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            What should we call your household?
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dela Cruz Residence"
                className="h-12 text-base bg-secondary border-border/50 focus-visible:ring-primary rounded-xl"
                maxLength={60}
                data-testid="input-household-name"
              />
            </div>

            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full h-12 text-base rounded-xl gap-2 bg-primary hover:bg-primary/90 neon-glow transition-all"
              data-testid="button-enter"
            >
              {loading ? "Setting up..." : "Enter kuryentAI"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Monitoring your energy usage with ANTECO rates
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
