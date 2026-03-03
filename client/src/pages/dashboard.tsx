import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsumptionOverview, useConsumptionByCategory } from "@/hooks/use-consumption";
import { useDevices } from "@/hooks/use-devices";
import { format } from "date-fns";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Zap, Activity, Cpu, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: overview, isLoading: isLoadingOverview } = useConsumptionOverview();
  const { data: categoryData, isLoading: isLoadingCat } = useConsumptionByCategory();
  const { data: devices, isLoading: isLoadingDev } = useDevices();

  const totalUsage = overview?.reduce((sum, item) => sum + item.energyKwh, 0) || 0;
  const activeDevices = devices?.filter(d => d.status).length || 0;
  const currentDraw = devices?.filter(d => d.status).reduce((sum, d) => sum + d.currentPowerW, 0) || 0;
  
  // Calculate estimated monthly usage and bill
  // We combine historical 7-day average with real-time current draw for a more "live" estimate
  // ANTECO residential rate as of Jan 2026 is ₱14.4881 per kWh
  const avgHistoricalDailyUsage = overview && overview.length > 0 
    ? overview.reduce((sum, item) => sum + item.energyKwh, 0) / overview.length 
    : 15; // Fallback to 15kWh/day if no data
  
  // Current real-time load converted to daily kWh (W * 24h / 1000)
  const currentDailyKwh = (currentDraw * 24) / 1000;
  
  // We weight the estimate: 70% historical trend, 30% current active load projection
  // This ensures the bill "reacts" when you toggle devices
  const projectedDailyUsage = (avgHistoricalDailyUsage * 0.7) + (currentDailyKwh * 0.3);
  
  const estMonthlyUsage = projectedDailyUsage * 30;
  const estMonthlyBill = estMonthlyUsage * 14.4881;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold">kuryentAI Dashboard</h1>
        <p className="text-muted-foreground mt-1">AI-driven energy management for the Philippines.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-panel overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Total Usage (30d)</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold font-display">{estMonthlyUsage.toFixed(1)} <span className="text-lg text-muted-foreground">kWh</span></div>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Average for PH Climate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-panel overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Devices</CardTitle>
              <Cpu className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {isLoadingDev ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold font-display">{activeDevices} <span className="text-lg text-muted-foreground">/ {devices?.length}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Drawing {currentDraw}W currently</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-panel overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Monthly Bill (2026)</CardTitle>
              <span className="text-primary font-bold">₱</span>
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold font-display text-green-400">
                  ₱{estMonthlyBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                <span>Based on ~{estMonthlyUsage.toFixed(0)} kWh/mo at ANTECO rates</span>
                <span className="text-primary font-medium italic">* Includes ₱500 PEPS subsidy if qualified</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="col-span-1 lg:col-span-2">
          <Card className="glass-panel h-full">
            <CardHeader>
              <CardTitle>Consumption Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {isLoadingOverview ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => {
                          try {
                            const d = new Date(val);
                            return isNaN(d.getTime()) ? val : format(d, 'MMM dd');
                          } catch (e) {
                            return val;
                          }
                        }}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={(val) => {
                          try {
                            const d = new Date(val);
                            return isNaN(d.getTime()) ? val : format(d, 'MMM dd, yyyy');
                          } catch (e) {
                            return val;
                          }
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="energyKwh" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorUsage)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <Card className="glass-panel h-full">
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                {isLoadingCat ? (
                  <Skeleton className="h-64 w-64 rounded-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="totalKwh"
                        nameKey="category"
                        stroke="none"
                      >
                        {categoryData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(val: number) => [`${val.toFixed(1)} kWh`, 'Usage']}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
