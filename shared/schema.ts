import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Devices / Energy Consumers
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., HVAC, Lighting, Appliances
  status: boolean("status").default(false).notNull(), // true = on, false = off
  currentPowerW: integer("current_power_w").notNull().default(0), // Current power draw in Watts
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Time-series consumption logs
export const consumptionLogs = pgTable("consumption_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().references(() => devices.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  energyKwh: real("energy_kwh").notNull(),
});

// AI-generated energy saving recommendations
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedSavingsKwh: real("estimated_savings_kwh").notNull(),
  applied: boolean("applied").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export * from "./models/chat";

export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, createdAt: true });
export const insertConsumptionLogSchema = createInsertSchema(consumptionLogs).omit({ id: true, timestamp: true });
export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({ id: true, createdAt: true, applied: true });

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type ConsumptionLog = typeof consumptionLogs.$inferSelect;
export type InsertConsumptionLog = z.infer<typeof insertConsumptionLogSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
