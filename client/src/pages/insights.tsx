import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInsights, useApplyInsight } from "@/hooks/use-insights";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { AppSettings } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, CheckCircle2, Zap, AlertTriangle, TrendingDown, CircleCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveInsight {
  estimatedBill: number;
  monthlyBudget: number;
  monthlySubsidy: number;
  electricityRate: number;
  isOverBudget: boolean;
  overBy: number;
  monthlyKwh: number;
  dailyKwh: number;
  deviceBreakdown: {
    id: number;
    name: string;
    category: string;
    currentPowerW: number;
    dailyHoursUsed: number;
    status: boolean;
    devDailyKwh: number;
    devMonthlyKwh: number;
    devMonthlyCost: number;
    savingsIfReduced2h: number;
  }[];
}

export default function Insights() {
  const { data: insights, isLoading } = useInsights();
  const applyMutation = useApplyInsight();
  const { data: settings } = useQuery<AppSettings>({
    queryKey: [api.settings.get.path]
  });
  const { data: live, isLoading: isLoadingLive } = useQuery<LiveInsight>({
    queryKey: ['/api/insights/live'],
    refetchInterval: 30000,
  });

  const potentialSavingsKwh = insights
    ?.filter(i => !i.applied)
    .reduce((sum, i) => sum + i.estimatedSavingsKwh, 0) || 0;

  const rate = settings?.electricityRate || 9.2199;
  const potentialSavingsPesos = potentialSavingsKwh * rate;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/20 text-accent neon-glow-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Smart recommendations based on {settings?.electricityProvider || 'ANTECO'} energy patterns.</p>
        </div>
      </div>

      {/* Live Budget Status */}
      {isLoadingLive ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : live && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-2 ${live.isOverBudget ? 'border-red-500/60 bg-red-500/5' : 'border-green-500/40 bg-green-500/5'} glass-panel`}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${live.isOverBudget ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {live.isOverBudget ? <AlertTriangle className="h-6 w-6" /> : <CircleCheck className="h-6 w-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base ${live.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                    {live.isOverBudget
                      ? `Over Budget by ₱${live.overBy.toFixed(2)}`
                      : `Under Budget by ₱${Math.abs(live.overBy).toFixed(2)}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Est. monthly bill: <span className="text-foreground font-medium">₱{live.estimatedBill.toFixed(2)}</span>
                    {' '}({live.monthlyKwh.toFixed(1)} kWh − ₱{live.monthlySubsidy} subsidy)
                    {' '}vs target <span className="text-foreground font-medium">₱{live.monthlyBudget}</span>
                  </p>
                  {live.isOverBudget && live.deviceBreakdown.length > 0 && (
                    <p className="text-xs text-red-400/80 mt-1.5">
                      Biggest load: {live.deviceBreakdown[0].name} — ₱{live.deviceBreakdown[0].devMonthlyCost.toFixed(2)}/month
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold font-display ${live.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                    ₱{live.estimatedBill.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">est. bill</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Device Tips (only when over budget) */}
      {live?.isOverBudget && live.deviceBreakdown.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-400" />
            Cost-Reduction Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.deviceBreakdown.slice(0, 4).map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="glass-panel border border-red-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.category} · {d.currentPowerW}W × {d.dailyHoursUsed}h/day</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">₱{d.devMonthlyCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>
                    <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                      <p className="text-xs text-green-400 font-medium">
                        💡 Cut by 2h/day → save ₱{d.savingsIfReduced2h.toFixed(2)}/month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 w-fit">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-semibold">₱{potentialSavingsPesos.toLocaleString(undefined, { maximumFractionDigits: 0 })} Potential Savings</span>
      </div>

      {/* Saved AI Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-3">AI Recommendations</h2>
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
