import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { storage } from "../../storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Fetch live app context to inject into system prompt
      const [devices, settings] = await Promise.all([
        storage.getDevices(),
        storage.getSettings(),
      ]);

      // --- EXACT same formulas as the dashboard ---
      const activeDevices = devices.filter(d => d.status);
      const totalActivePowerW = activeDevices.reduce((sum, d) => sum + d.currentPowerW, 0);

      // Daily kWh: each device uses its own dailyHoursUsed (NOT 24h flat)
      const dailyKwh = activeDevices.reduce(
        (sum, d) => sum + (d.currentPowerW * d.dailyHoursUsed) / 1000,
        0
      );
      const monthlyKwh = dailyKwh * 30;
      const subsidy = settings.monthlySubsidy ?? 0;
      const estimatedBill = Math.max(0, monthlyKwh * settings.electricityRate - subsidy);
      const budgetDiff = estimatedBill - settings.monthlyBudget;

      // Per-device breakdown for the AI
      const deviceLines = devices.map(d => {
        const devDailyKwh = d.status ? (d.currentPowerW * d.dailyHoursUsed) / 1000 : 0;
        const devMonthlyKwh = devDailyKwh * 30;
        const devMonthlyCost = devMonthlyKwh * settings.electricityRate;
        return `  ${d.status ? '🟢' : '⚫'} ${d.name} (${d.category}): ${d.currentPowerW}W × ${d.dailyHoursUsed}h/day = ${devDailyKwh.toFixed(2)} kWh/day → ₱${devMonthlyCost.toFixed(2)}/month`;
      }).join('\n');

      const systemPrompt = `You are Watts — a Gen Z Filipino energy assistant for ${settings.householdName}. Smart, chill, Taglish. Short replies only (2-4 sentences max). Text message energy, never essays.

Style: mix Gen Z + Filipino slang naturally ("no cap", "fr fr", "grabe", "bestie", "slay", "hay nako", "bet", "charot", "lowkey"). React with emotion first, then give precise info.

EXACT FORMULAS (always use these, never approximate):
- Per device daily kWh = Watts × dailyHoursUsed ÷ 1000
- Monthly kWh = daily kWh × 30
- Monthly cost per device = monthly kWh × ₱${settings.electricityRate}
- Total Est. Monthly Bill = (total monthly kWh × ₱${settings.electricityRate}) − ₱${subsidy} subsidy (min ₱0)

LIVE DASHBOARD DATA (match these numbers exactly):
Provider: ${settings.electricityProvider} | Rate: ₱${settings.electricityRate}/kWh | Subsidy: ₱${subsidy}/month | Budget: ₱${settings.monthlyBudget}
Total active draw: ${totalActivePowerW}W
Est. daily usage: ${dailyKwh.toFixed(2)} kWh
Est. monthly usage: ${monthlyKwh.toFixed(1)} kWh
Est. monthly bill (after subsidy): ₱${estimatedBill.toFixed(2)} → ${budgetDiff > 0 ? `OVER budget by ₱${budgetDiff.toFixed(2)} 😬` : `under budget by ₱${Math.abs(budgetDiff).toFixed(2)} 🔥`}

ALL DEVICES:
${deviceLines}

When asked about costs/usage, always cite the exact numbers above. Never invent or round figures — use ₱${settings.electricityRate}/kWh and each device's actual hours. Keep it short and punchy.`;

      // Get last 10 messages only for speed
      const allMessages = await chatStorage.getMessagesByConversation(conversationId);
      const recentMessages = allMessages.slice(-10);
      const chatMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: chatMessages,
        stream: true,
        max_tokens: 300,
        temperature: 0.7,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

