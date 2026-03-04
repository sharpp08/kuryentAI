import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useDevices() {
  return useQuery({
    queryKey: [api.devices.list.path],
    queryFn: async () => {
      const res = await fetch(api.devices.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      return parseWithLogging(api.devices.list.responses[200], data, "devices.list");
    },
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (device: z.infer<typeof api.devices.create.input>) => {
      const res = await fetch(api.devices.create.path, {
        method: api.devices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create device");
      }
      const data = await res.json();
      return parseWithLogging(api.devices.create.responses[201], data, "devices.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.devices.list.path] });
      // Invalidate consumption data so the dashboard updates
      queryClient.invalidateQueries({ queryKey: [api.consumption.overview.path] });
      queryClient.invalidateQueries({ queryKey: [api.consumption.byCategory.path] });
    },
  });
}

export function useToggleDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: boolean }) => {
      const url = buildUrl(api.devices.toggle.path, { id });
      const res = await fetch(url, {
        method: api.devices.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to toggle device");
      const data = await res.json();
      return parseWithLogging(api.devices.toggle.responses[200], data, "devices.toggle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.devices.list.path] });
      // Invalidate consumption data so the dashboard updates
      queryClient.invalidateQueries({ queryKey: [api.consumption.overview.path] });
      queryClient.invalidateQueries({ queryKey: [api.consumption.byCategory.path] });
    },
  });
}
