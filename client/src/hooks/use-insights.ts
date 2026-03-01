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

export function useInsights() {
  return useQuery({
    queryKey: [api.insights.list.path],
    queryFn: async () => {
      const res = await fetch(api.insights.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      return parseWithLogging(api.insights.list.responses[200], data, "insights.list");
    },
  });
}

export function useApplyInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.insights.apply.path, { id });
      const res = await fetch(url, {
        method: api.insights.apply.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to apply insight");
      const data = await res.json();
      return parseWithLogging(api.insights.apply.responses[200], data, "insights.apply");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.insights.list.path] });
      // Invalidate devices in case the insight modified them
      queryClient.invalidateQueries({ queryKey: [api.devices.list.path] });
    },
  });
}
