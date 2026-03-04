import { db } from "./db";
import { 
  devices, 
  consumptionLogs, 
  aiInsights,
  type InsertDevice,
  type InsertAiInsight,
  type Device,
  type ConsumptionLog,
  type AiInsight
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDeviceStatus(id: number, status: boolean): Promise<Device | undefined>;
  
  // Consumption
  getConsumptionOverview(): Promise<{ date: string, energyKwh: number }[]>;
  getConsumptionByCategory(): Promise<{ category: string, percentage: number, totalKwh: number }[]>;
  
  // Insights
  getInsights(): Promise<AiInsight[]>;
  applyInsight(id: number): Promise<AiInsight | undefined>;
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

  async getConsumptionOverview(): Promise<{ date: string, energyKwh: number }[]> {
    const today = new Date();
    const allDevices = await this.getDevices();
    const currentActiveLoadKw = allDevices
      .filter(d => d.status)
      .reduce((sum, d) => sum + d.currentPowerW, 0) / 1000;

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      
      // Simulate historical data: baseline + random fluctuation
      // But we'll make the "today" value (last index) reflect the actual current load
      const baseline = 5 + Math.random() * 5;
      const energyKwh = i === 6 ? (currentActiveLoadKw * 24) : baseline;

      return {
        date: d.toISOString(),
        energyKwh: Number(energyKwh.toFixed(2)), 
      };
    });
  }

  async getConsumptionByCategory(): Promise<{ category: string, percentage: number, totalKwh: number }[]> {
    const allDevices = await this.getDevices();
    const categories: Record<string, number> = {};
    let totalPower = 0;

    allDevices.forEach(d => {
      const p = d.status ? d.currentPowerW : 0;
      categories[d.category] = (categories[d.category] || 0) + p;
      totalPower += p;
    });

    // If no devices are on, show 0 for all existing categories
    if (totalPower === 0) {
      const uniqueCats = [...new Set(allDevices.map(d => d.category))];
      return uniqueCats.map(cat => ({
        category: cat || "Uncategorized",
        percentage: 0,
        totalKwh: 0
      }));
    }

    return Object.entries(categories).map(([category, power]) => ({
      category: category || "Uncategorized",
      percentage: Number(((power / totalPower) * 100).toFixed(1)),
      totalKwh: Number(((power * 24) / 1000).toFixed(2)) // Projected daily kWh
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
}

export const storage = new DatabaseStorage();
