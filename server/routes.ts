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
  const devices = await storage.getDevices();
  if (devices.length === 0) {
    await storage.createDevice({ name: "Central AC", category: "HVAC", status: true, currentPowerW: 3500 });
    await storage.createDevice({ name: "Office Lights", category: "Lighting", status: true, currentPowerW: 400 });
    await storage.createDevice({ name: "Breakroom Refrigerator", category: "Appliances", status: true, currentPowerW: 150 });
    await storage.createDevice({ name: "Server Rack A", category: "IT", status: true, currentPowerW: 1200 });
    await storage.createDevice({ name: "Conference Room Display", category: "AV", status: false, currentPowerW: 0 });
  }

  const insights = await storage.getInsights();
  if (insights.length === 0) {
    await storage.applyInsight(await storage.getInsights().then(res => res[0]?.id || 0)).catch(() => {}); // catch block just in case
    // We can't directly create insights through the storage API right now, let's just use the DB directly for seeding
    const { db } = await import("./db");
    const { aiInsights } = await import("@shared/schema");
    await db.insert(aiInsights).values([
      {
        title: "Optimize HVAC Schedule",
        description: "The Central AC is running during non-business hours (11 PM - 5 AM). Adjusting the schedule can save significant energy.",
        estimatedSavingsKwh: 120.5,
        applied: false,
      },
      {
        title: "Dim Office Lights",
        description: "Natural light is sufficient in the main office area between 10 AM and 3 PM. Recommend dimming lights by 40%.",
        estimatedSavingsKwh: 45.2,
        applied: false,
      },
      {
        title: "Idle Equipment Detected",
        description: "Conference Room Display has been idle but powered on for 48 hours. Enable auto-standby.",
        estimatedSavingsKwh: 12.8,
        applied: true,
      }
    ]);
  }
}
