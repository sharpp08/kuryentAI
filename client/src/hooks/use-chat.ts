import { useState, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Kumusta! I am your kuryentAI assistant. I can help you optimize your electricity usage and save on your Meralco bills. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initConversation = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Energy Assistant" }),
      });
      const data = await res.json();
      setConversationId(data.id);
      return data.id;
    } catch (err) {
      console.error("Failed to init conversation", err);
      return null;
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    setError(null);
    setIsLoading(true);

    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = await initConversation();
    }

    if (!currentConvId) {
      setError("Could not connect to chat server.");
      setIsLoading(false);
      return;
    }

    const userMessageId = Math.random().toString(36).substring(7);
    const assistantMessageId = Math.random().toString(36).substring(7);

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`/api/conversations/${currentConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Network response was not ok");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  setError(data.error);
                  break;
                }
                
                if (data.content) {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    stopGeneration,
  };
}
