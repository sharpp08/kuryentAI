import { z } from 'zod';
import { insertDeviceSchema, insertAiInsightSchema, devices, consumptionLogs, aiInsights } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  devices: {
    list: {
      method: 'GET' as const,
      path: '/api/devices' as const,
      responses: {
        200: z.array(z.custom<typeof devices.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/devices/:id' as const,
      responses: {
        200: z.custom<typeof devices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/devices' as const,
      input: insertDeviceSchema,
      responses: {
        201: z.custom<typeof devices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    toggle: {
      method: 'PATCH' as const,
      path: '/api/devices/:id/toggle' as const,
      input: z.object({ status: z.boolean() }),
      responses: {
        200: z.custom<typeof devices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  consumption: {
    overview: {
      method: 'GET' as const,
      path: '/api/consumption/overview' as const,
      responses: {
        200: z.array(z.object({
          date: z.string(),
          energyKwh: z.number(),
        })),
      },
    },
    byCategory: {
      method: 'GET' as const,
      path: '/api/consumption/category' as const,
      responses: {
        200: z.array(z.object({
          category: z.string(),
          percentage: z.number(),
          totalKwh: z.number(),
        })),
      },
    },
  },
  insights: {
    list: {
      method: 'GET' as const,
      path: '/api/insights' as const,
      responses: {
        200: z.array(z.custom<typeof aiInsights.$inferSelect>()),
      },
    },
    apply: {
      method: 'POST' as const,
      path: '/api/insights/:id/apply' as const,
      responses: {
        200: z.custom<typeof aiInsights.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings' as const,
      responses: {
        200: z.any(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/settings' as const,
      input: z.any(),
      responses: {
        200: z.any(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
