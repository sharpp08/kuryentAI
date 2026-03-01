import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useConsumptionOverview() {
  return useQuery({
    queryKey: [api.consumption.overview.path],
    queryFn: async () => {
      const res = await fetch(api.consumption.overview.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch consumption overview");
      const data = await res.json();
      return parseWithLogging(api.consumption.overview.responses[200], data, "consumption.overview");
    },
  });
}

export function useConsumptionByCategory() {
  return useQuery({
    queryKey: [api.consumption.byCategory.path],
    queryFn: async () => {
      const res = await fetch(api.consumption.byCategory.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch consumption by category");
      const data = await res.json();
      return parseWithLogging(api.consumption.byCategory.responses[200], data, "consumption.byCategory");
    },
  });
}
