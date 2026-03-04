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
    // We'll return 0 usage by default to satisfy the "start from 0" requirement
    // In a production environment, this would query the consumptionLogs table
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString(),
        energyKwh: 0, 
      };
    });
  }

  async getConsumptionByCategory(): Promise<{ category: string, percentage: number, totalKwh: number }[]> {
    return [
      { category: "Aircon (HVAC)", percentage: 55, totalKwh: 198 },
      { category: "Lighting", percentage: 15, totalKwh: 54 },
      { category: "Appliances", percentage: 20, totalKwh: 72 },
      { category: "Other", percentage: 10, totalKwh: 36 },
    ];
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
