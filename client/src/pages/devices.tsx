import { Card, CardContent } from "@/components/ui/card";
import { useDevices, useToggleDevice } from "@/hooks/use-devices";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Power, Cpu, Monitor, Snowflake, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function getDeviceIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'hvac': return Snowflake;
    case 'lighting': return Lightbulb;
    case 'appliances': return Monitor;
    default: return Cpu;
  }
}

export default function Devices() {
  const { data: devices, isLoading } = useDevices();
  const toggleMutation = useToggleDevice();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Device Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and control your appliances across the Philippines.</p>
        </div>
        <div className="flex items-center gap-4 bg-card/50 p-2 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-primary neon-glow" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-2xl" />
          ))
        ) : (
          devices?.map((device, index) => {
            const Icon = getDeviceIcon(device.category);
            const isPending = toggleMutation.isPending && toggleMutation.variables?.id === device.id;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={device.id}
              >
                <Card className={cn(
                  "glass-panel overflow-hidden transition-all duration-300 h-[180px]",
                  device.status ? "border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]" : "opacity-80"
                )}>
                  <CardContent className="p-5 flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        device.status ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Switch 
                        checked={device.status}
                        disabled={isPending}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: device.id, status: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg truncate">{device.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          {device.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-medium font-mono">
                          <Power className={cn("h-3.5 w-3.5", device.status ? "text-primary" : "text-muted-foreground")} />
                          {device.status ? `${device.currentPowerW}W` : '0W'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
