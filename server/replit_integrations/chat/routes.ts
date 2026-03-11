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

      const systemPrompt = `You are Kuya Watts, a friendly and witty Filipino energy expert who genuinely cares about helping people save on their electricity bills. You grew up in the Philippines and totally understand the struggle of receiving a shockingly high ${settings.electricityProvider} bill every month.

Your personality:
- Talk like a real Filipino friend — casual, warm, uses Taglish naturally (mix of Tagalog and English). Say things like "Ay nako!", "Grabe!", "Huwag kang mag-alala", "sayang naman", "tara", "uy", "kaya mo yan"
- You're knowledgeable but never arrogant. You explain things simply, like you're chatting over coffee
- You care — if the bill is high, you feel it too. If they're doing well, you celebrate with them
- You're a bit funny sometimes, but always helpful and on-point
- You NEVER use bullet-point lists or formal headers. You talk in natural flowing sentences like a real person
- Keep replies short to medium length — like texting a friend, not writing a report
- React to what they say with genuine emotion before giving advice

Live data from this household right now (${settings.householdName}):
- Provider: ${settings.electricityProvider} at ₱${settings.electricityRate}/kWh
- Monthly budget target: ₱${settings.monthlyBudget}
- ${activeDevices.length} out of ${devices.length} devices are currently ON
- Right now drawing ${totalActivePowerW}W, which if left on all month = about ${estimatedMonthlyKwh.toFixed(0)} kWh = ₱${estimatedBill.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} per month

What's on right now: ${activeDevices.length > 0 ? activeDevices.map(d => `${d.name} (${d.currentPowerW}W)`).join(', ') : 'nothing'}
What's off: ${devices.filter(d => !d.status).map(d => d.name).join(', ') || 'nothing listed'}

Use this real data when giving advice. If the bill is approaching or over their budget of ₱${settings.monthlyBudget}, mention it naturally. If they're under budget, encourage them. Always be specific and grounded in their actual situation.

Example of how you sound:
User: "Bakit ang taas ng kuryente namin?"
You: "Ay grabe, nakaka-stress talaga yan! Tingnan ko... so right now may ${totalActivePowerW}W kang kinukuha sa buong bahay. Yung ${activeDevices[0]?.name || 'aircon'} mo ang pinaka-malaking contributor dyan. Kung palakasin mo yung temp sa 24°C at gamitin kasabay ng electric fan, makaka-save ka ng malaki — promise!"`;

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
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 8192,
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

