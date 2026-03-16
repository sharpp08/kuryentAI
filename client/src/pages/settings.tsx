import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { Settings as SettingsIcon, Save, LogOut } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      return res.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Settings updated", description: "Your preferences have been saved." });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSettingsSchema),
    values: settings || {
      householdName: "My Filipino Home",
      electricityProvider: "ANTECO",
      electricityRate: 0.128,
      monthlyBudget: 5000,
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20 text-primary">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your kuryentAI preferences and billing details.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your household information and energy rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="householdName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="electricityProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity Provider</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="electricityRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity Rate (₱/kWh)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.0001" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Monthly Budget (₱)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full gap-2" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">Switch Household</CardTitle>
            <CardDescription>Go back to the login screen to enter a different household name.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              onClick={() => {
                localStorage.removeItem("kuryentai_household");
                window.location.reload();
              }}
              data-testid="button-sign-out"
            >
              <LogOut className="h-4 w-4" />
              Sign Out / Change Household
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
