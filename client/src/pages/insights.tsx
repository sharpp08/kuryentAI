import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInsights, useApplyInsight } from "@/hooks/use-insights";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Insights() {
  const { data: insights, isLoading } = useInsights();
  const applyMutation = useApplyInsight();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/20 text-accent neon-glow-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Smart recommendations to optimize your energy consumption.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-2xl" />
          ))
        ) : (
          <AnimatePresence>
            {insights?.map((insight, index) => {
              const isPending = applyMutation.isPending && applyMutation.variables === insight.id;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  key={insight.id}
                >
                  <Card className="glass-panel overflow-hidden h-full flex flex-col group">
                    <CardHeader className="pb-3 border-b border-border/30">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl leading-tight text-foreground pr-4">
                          {insight.title}
                        </CardTitle>
                        {insight.applied && (
                          <div className="bg-green-500/20 text-green-400 p-1 rounded-full shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-2 text-muted-foreground">
                        {insight.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20 text-sm font-medium font-mono">
                          Save ~{insight.estimatedSavingsKwh} kWh
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => applyMutation.mutate(insight.id)}
                        disabled={insight.applied || isPending}
                        className={`w-full justify-between group/btn transition-all duration-300 ${
                          insight.applied 
                            ? "bg-secondary text-muted-foreground border-transparent" 
                            : "bg-gradient-to-r from-accent to-accent/80 hover:from-accent hover:to-accent text-white shadow-[0_0_20px_-5px_hsl(var(--accent)/0.5)]"
                        }`}
                      >
                        {insight.applied ? "Optimization Applied" : isPending ? "Applying..." : "Apply Optimization"}
                        {!insight.applied && !isPending && (
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      
      {insights?.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium">You're fully optimized!</h3>
          <p className="text-muted-foreground mt-2 max-w-md">Our AI currently has no new recommendations. Your energy consumption is highly efficient.</p>
        </div>
      )}
    </div>
  );
}
