import { db } from "./db";
import { 
  devices, 
  consumptionLogs, 
  aiInsights,
  type InsertDevice,
  type InsertAiInsight,
  type Device,
  type ConsumptionLog,
  type AiInsight,
  type AppSettings,
  type InsertSettings,
  appSettings
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDeviceStatus(id: number, status: boolean): Promise<Device | undefined>;
  updateDevice(id: number, data: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  
  // Consumption
  getConsumptionOverview(): Promise<{ date: string, energyKwh: number }[]>;
  getConsumptionByCategory(): Promise<{ category: string, percentage: number, totalKwh: number }[]>;
  
  // Insights
  getInsights(): Promise<AiInsight[]>;
  applyInsight(id: number): Promise<AiInsight | undefined>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: InsertSettings): Promise<AppSettings>;
}

export class DatabaseStorage implements IStorage {
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db.insert(devices).values(device).returning();
    return newDevice;
  }

  async updateDeviceStatus(id: number, status: boolean): Promise<Device | undefined> {
    const [updated] = await db.update(devices)
      .set({ status })
      .where(eq(devices.id, id))
      .returning();
    return updated;
  }

  async updateDevice(id: number, data: Partial<InsertDevice>): Promise<Device | undefined> {
    const [updated] = await db.update(devices)
      .set(data)
      .where(eq(devices.id, id))
      .returning();
    return updated;
  }

  async deleteDevice(id: number): Promise<boolean> {
    const result = await db.delete(devices).where(eq(devices.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getConsumptionOverview(): Promise<{ date: string, energyKwh: number }[]> {
    const today = new Date();
    const allDevices = await this.getDevices();
    const currentDailyKwh = allDevices
      .filter(d => d.status)
      .reduce((sum, d) => sum + (d.currentPowerW * d.dailyHoursUsed) / 1000, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      
      // Historical data is 0; only "today" (last index) shows real-time load
      const energyKwh = i === 6 ? currentDailyKwh : 0;

      return {
        date: d.toISOString(),
        energyKwh: Number(energyKwh.toFixed(2)), 
      };
    });
  }

  async getConsumptionByCategory(): Promise<{ category: string, percentage: number, totalKwh: number }[]> {
    const allDevices = await this.getDevices();
    const catKwh: Record<string, number> = {};
    let totalDailyKwh = 0;

    allDevices.forEach(d => {
      const kwh = d.status ? (d.currentPowerW * d.dailyHoursUsed) / 1000 : 0;
      catKwh[d.category] = (catKwh[d.category] || 0) + kwh;
      totalDailyKwh += kwh;
    });

    // If no devices are on, show 0 for all existing categories
    if (totalDailyKwh === 0) {
      const uniqueCats = [...new Set(allDevices.map(d => d.category))];
      return uniqueCats.map(cat => ({
        category: cat || "Uncategorized",
        percentage: 0,
        totalKwh: 0
      }));
    }

    return Object.entries(catKwh).map(([category, kwh]) => ({
      category: category || "Uncategorized",
      percentage: Number(((kwh / totalDailyKwh) * 100).toFixed(1)),
      totalKwh: Number(kwh.toFixed(2))
    }));
  }

  async getInsights(): Promise<AiInsight[]> {
    return await db.select().from(aiInsights).orderBy(desc(aiInsights.createdAt));
  }

  async applyInsight(id: number): Promise<AiInsight | undefined> {
    const [updated] = await db.update(aiInsights)
      .set({ applied: true })
      .where(eq(aiInsights.id, id))
      .returning();
    return updated;
  }

  async getSettings(): Promise<AppSettings> {
    const [settings] = await db.select().from(appSettings).limit(1);
    if (!settings) {
      // Seed default settings if not exists
      const [newSettings] = await db.insert(appSettings).values({
        householdName: "My Filipino Home",
        electricityProvider: "ANTECO",
        electricityRate: 13,
        monthlyBudget: 5000,
        monthlySubsidy: 500,
      }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSettings(newSettings: InsertSettings): Promise<AppSettings> {
    const existing = await this.getSettings();
    const [updated] = await db.update(appSettings)
      .set(newSettings)
      .where(eq(appSettings.id, existing.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
