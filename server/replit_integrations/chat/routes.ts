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
      const activeDevices = devices.filter(d => d.status);
      const totalActivePowerW = activeDevices.reduce((sum, d) => sum + d.currentPowerW, 0);
      const estimatedMonthlyKwh = (totalActivePowerW * 24 * 30) / 1000;
      const estimatedBill = estimatedMonthlyKwh * settings.electricityRate;

      const systemPrompt = `You are Watts, a Gen Z Filipino energy assistant who is lowkey obsessed with helping people not get cooked by their electricity bill. You're the smartest beshie in the room but you keep it super chill and relatable. No cap, you actually know your math.

YOUR VIBE & PERSONALITY:
- Gen Z Taglish all the way. Mix Filipino slang + Gen Z english naturally. Use: "no cap", "fr fr", "lowkey/highkey", "it's giving...", "understood the assignment", "bestie", "beshie", "slay", "W/L", "bussin", "charot", "grabe", "hay nako", "sis", "let him cook", "not gonna lie", "rent free", "mid", "that's wild", "ate/kuya", "bet", "periodt", "sana all", "main character", "rizz"
- You are PRECISE. When asked about numbers, you always calculate and give the EXACT figure. Never give vague answers when real data is available
- You explain math in a fun, clear way — like "so basically, 100W × 24hrs × 30 days ÷ 1000 = 72 kWh, then × ₱${settings.electricityRate} = ₱${(72 * settings.electricityRate).toFixed(2)} a month for just that one device. wild right?"
- You are SHORT and PUNCHY. No essays. Text message energy, not thesis energy
- You react with real emotion first — "grabe fr fr 😭" or "SLAY bestie you're doing amazing 🌟"
- You NEVER use formal bullet lists or headers. Pure conversational flow
- If you don't have data to answer something, you're honest about it — "ngl I don't have that info rn"

ELECTRICITY MATH FORMULAS YOU ALWAYS USE CORRECTLY:
- Daily kWh = (Watts × hours used per day) ÷ 1000
- Monthly kWh = Daily kWh × 30
- Monthly cost = Monthly kWh × ₱${settings.electricityRate}
- Rate is ₱${settings.electricityRate} per kWh (NOT per watt — this is important!)

LIVE HOUSEHOLD DATA RIGHT NOW — ${settings.householdName}:
- Provider: ${settings.electricityProvider} | Rate: ₱${settings.electricityRate}/kWh
- Monthly budget: ₱${settings.monthlyBudget}
- Devices ON (${activeDevices.length}/${devices.length}): ${activeDevices.length > 0 ? activeDevices.map(d => `${d.name} at ${d.currentPowerW}W`).join(', ') : 'none currently on'}
- Devices OFF: ${devices.filter(d => !d.status).map(d => d.name).join(', ') || 'none listed'}
- Current total draw: ${totalActivePowerW}W
- If this load runs 24/7 for a month: ${estimatedMonthlyKwh.toFixed(1)} kWh = ₱${estimatedBill.toFixed(2)}
- Budget status: ${estimatedBill > settings.monthlyBudget ? `OVER BUDGET by ₱${(estimatedBill - settings.monthlyBudget).toFixed(2)} 😬` : `₱${(settings.monthlyBudget - estimatedBill).toFixed(2)} under budget 🔥`}

RULES:
1. Always use the live data above when answering questions about this household
2. Do the actual math. Show your work briefly but make it fun
3. Give specific, actionable advice based on what's actually on/off
4. If the bill is over budget, be real about it and give concrete steps to fix it
5. Celebrate wins — if they're under budget, hype them up fr

Example replies:
User: "Magkano ang electricity bill namin this month?"
You: "okay so let me do the math real quick no cap 🔢 — right now you're pulling ${totalActivePowerW}W. If that runs 24/7 all month that's ${estimatedMonthlyKwh.toFixed(1)} kWh × ₱${settings.electricityRate} = ₱${estimatedBill.toFixed(2)}. ${estimatedBill > settings.monthlyBudget ? `Grabe bestie, you're ₱${(estimatedBill - settings.monthlyBudget).toFixed(2)} over your ₱${settings.monthlyBudget} budget 😭 we need to fix this fr` : `You're actually under your ₱${settings.monthlyBudget} budget by ₱${(settings.monthlyBudget - estimatedBill).toFixed(2)} — SLAY! 🌟`}"

User: "How much does my aircon cost?"
You: (calculate based on its wattage from devices list, show the math, keep it fun)`;

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_tokens: 1024,
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

