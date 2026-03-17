import { Card, CardContent } from "@/components/ui/card";
import { useDevices, useToggleDevice, useCreateDevice, useUpdateDevice, useDeleteDevice } from "@/hooks/use-devices";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Power, Cpu, Monitor, Snowflake, Lightbulb, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeviceSchema, Device } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Device> | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);

  const addForm = useForm({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: { name: "", category: "Appliances", currentPowerW: 0, dailyHoursUsed: 8, status: false },
  });

  const editForm = useForm({
    defaultValues: { name: "", category: "Appliances", currentPowerW: 0, dailyHoursUsed: 8 },
  });

  useEffect(() => {
    if (addOpen && prefill) {
      addForm.reset({
        name: prefill.name || "",
        category: prefill.category || "Appliances",
        currentPowerW: prefill.currentPowerW || 0,
        dailyHoursUsed: prefill.dailyHoursUsed ?? 8,
        status: false,
      });
    } else if (addOpen && !prefill) {
      addForm.reset({ name: "", category: "Appliances", currentPowerW: 0, dailyHoursUsed: 8, status: false });
    }
  }, [addOpen, prefill]);

  useEffect(() => {
    if (editDevice) {
      editForm.reset({
        name: editDevice.name,
        category: editDevice.category,
        currentPowerW: editDevice.currentPowerW,
        dailyHoursUsed: editDevice.dailyHoursUsed,
      });
    }
  }, [editDevice]);

  const onAdd = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Device added", description: `${data.name} has been added.` });
        setAddOpen(false);
        setPrefill(null);
        addForm.reset();
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const onEdit = (data: any) => {
    if (!editDevice) return;
    updateMutation.mutate({ id: editDevice.id, ...data }, {
      onSuccess: () => {
        toast({ title: "Device updated", description: `${data.name} has been updated.` });
        setEditDevice(null);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const onDelete = (device: Device) => {
    deleteMutation.mutate(device.id, {
      onSuccess: () => toast({ title: "Device removed", description: `${device.name} was deleted.` }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Device Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor and control your appliances.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => { setPrefill(null); setAddOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
          <div className="flex items-center gap-4 bg-card/50 p-2 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-primary neon-glow" />
              <span className="text-sm font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-2xl" />
          ))
        ) : (
          <>
            {devices?.map((device, index) => {
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
                    "glass-panel overflow-hidden transition-all duration-300 h-[200px] group relative",
                    device.status ? "border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]" : "opacity-80"
                  )}>
                    {/* Action buttons — visible on hover */}
                    <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setPrefill(device); setAddOpen(true); }}
                        title="Add another like this"
                        className="h-6 w-6 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white flex items-center justify-center shadow transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditDevice(device)}
                        title="Edit device"
                        className="h-6 w-6 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white flex items-center justify-center shadow transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(device)}
                        title="Delete device"
                        className="h-6 w-6 rounded-full bg-destructive/20 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center shadow transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

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
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium font-mono">
                              <Power className={cn("h-3.5 w-3.5", device.status ? "text-primary" : "text-muted-foreground")} />
                              {device.status ? `${device.currentPowerW}W` : '0W'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {device.dailyHoursUsed}h/day
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Add new device card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (devices?.length || 0) * 0.05 }}
            >
              <button
                onClick={() => { setPrefill(null); setAddOpen(true); }}
                className="w-full h-[200px] rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
              >
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors text-muted-foreground">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Add Device
                </span>
              </button>
            </motion.div>
          </>
        )}
      </div>

      {/* Add Device Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setPrefill(null); }}>
        <DialogContent className="glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle>{prefill ? `Add another like "${prefill.name}"` : "Add New Device"}</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4 pt-4">
              <FormField control={addForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Living Room Aircon" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HVAC">HVAC / Aircon</SelectItem>
                      <SelectItem value="Lighting">Lighting</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="IT">IT / Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="currentPowerW" render={({ field }) => (
                <FormItem>
                  <FormLabel>Wattage (W)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="dailyHoursUsed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Used Per Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={1} max={24} placeholder="8"
                      {...field}
                      onChange={e => field.onChange(Math.min(24, Math.max(1, parseInt(e.target.value) || 8)))}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">How many hours per day does this device typically run? (1–24)</p>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Device"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!editDevice} onOpenChange={(v) => { if (!v) setEditDevice(null); }}>
        <DialogContent className="glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle>Edit "{editDevice?.name}"</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4 pt-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Living Room Aircon" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HVAC">HVAC / Aircon</SelectItem>
                      <SelectItem value="Lighting">Lighting</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="IT">IT / Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="currentPowerW" render={({ field }) => (
                <FormItem>
                  <FormLabel>Wattage (W)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="dailyHoursUsed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Used Per Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={1} max={24} placeholder="8"
                      {...field}
                      onChange={e => field.onChange(Math.min(24, Math.max(1, parseInt(e.target.value) || 8)))}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">How many hours per day does this device typically run? (1–24)</p>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDevice(null)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
