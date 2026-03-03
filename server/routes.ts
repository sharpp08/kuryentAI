import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register the AI chat routes from the integration
  registerChatRoutes(app);

  // --- Devices ---
  app.get(api.devices.list.path, async (req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  });

  app.get(api.devices.get.path, async (req, res) => {
    const device = await storage.getDevice(Number(req.params.id));
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.json(device);
  });

  app.post(api.devices.create.path, async (req, res) => {
    try {
      const input = api.devices.create.input.parse(req.body);
      const device = await storage.createDevice(input);
      res.status(201).json(device);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.devices.toggle.path, async (req, res) => {
    try {
      const { status } = api.devices.toggle.input.parse(req.body);
      const device = await storage.updateDeviceStatus(Number(req.params.id), status);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // --- Consumption ---
  app.get(api.consumption.overview.path, async (req, res) => {
    const overview = await storage.getConsumptionOverview();
    res.json(overview);
  });

  app.get(api.consumption.byCategory.path, async (req, res) => {
    const breakdown = await storage.getConsumptionByCategory();
    res.json(breakdown);
  });

  // --- Insights ---
  app.get(api.insights.list.path, async (req, res) => {
    const insights = await storage.getInsights();
    res.json(insights);
  });

  app.post(api.insights.apply.path, async (req, res) => {
    const insight = await storage.applyInsight(Number(req.params.id));
    if (!insight) {
      return res.status(404).json({ message: "Insight not found" });
    }
    res.json(insight);
  });

  return httpServer;
}

// Seed the database
export async function seedDatabase() {
  const devicesList = await storage.getDevices();
  if (devicesList.length === 0) {
    await storage.createDevice({ name: "Master Bedroom Aircon", category: "HVAC", status: true, currentPowerW: 1500 });
    await storage.createDevice({ name: "Living Room Lights", category: "Lighting", status: true, currentPowerW: 200 });
    await storage.createDevice({ name: "Sari-Sari Store Chiller", category: "Appliances", status: true, currentPowerW: 300 });
    await storage.createDevice({ name: "Kitchen Refrigerator", category: "Appliances", status: true, currentPowerW: 150 });
    await storage.createDevice({ name: "Office Desktop", category: "IT", status: false, currentPowerW: 0 });
  }

  const insightsList = await storage.getInsights();
  if (insightsList.length === 0) {
    const { db } = await import("./db");
    const { aiInsights } = await import("@shared/schema");
    await db.insert(aiInsights).values([
      {
        title: "Optimize Aircon Usage",
        description: "Your Master Bedroom Aircon is running at 18°C. Increasing it to 24°C with a fan can save up to 25% on your ANTECO bill.",
        estimatedSavingsKwh: 85.5,
        applied: false,
      },
      {
        title: "Chiller Maintenance Alert",
        description: "The Sari-Sari Store Chiller is consuming 20% more power than usual. Recommend cleaning the condenser coils to improve efficiency and lower generation charges.",
        estimatedSavingsKwh: 30.2,
        applied: false,
      },
      {
        title: "Peak Hour Load Shifting",
        description: "ANTECO encourages minimizing high-power appliance use during peak hours. Shift heavy loads to late night to save on generation charges.",
        estimatedSavingsKwh: 15.8,
        applied: true,
      }
    ]);
  }
}
