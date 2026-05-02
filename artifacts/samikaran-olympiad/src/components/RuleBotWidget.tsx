import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, Volume2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  sender: "user" | "bot";
  content: string;
  quickReplies?: Array<{ label: string; action: string }>;
  timestamp: Date;
}

interface RuleBotWidgetProps {
  userId?: number;
  role?: string;
  firstName?: string;
}

export function RuleBotWidget({ userId, role, firstName }: RuleBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen, sessionId]);

  const initSession = async () => {
    try {
      setSessionError(false);
      const response = await apiRequest("POST", "/api/rulebot/session", { userId, role });
      const data = await response.json();
      
      if (!data.sessionToken) {
        setSessionError(true);
        return;
      }
      
      setSessionId(data.sessionToken);

      const welcomeRes = await fetch(`/api/rulebot/welcome?userId=${userId || ""}&role=${role || ""}`);
      const welcomeData = await welcomeRes.json();
      
      if (welcomeData.success) {
        setMessages([{
          id: `msg-${Date.now()}`,
          sender: "bot",
          content: welcomeData.welcome.content,
          quickReplies: welcomeData.welcome.quickReplies,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Failed to init session:", error);
      setSessionError(true);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/rulebot/message", {
        message: text,
        sessionId,
        userId,
        role,
      });
      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: `msg-${Date.now()}`,
          sender: "bot",
          content: data.response.content,
          quickReplies: data.response.quickReplies,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (action: string) => {
    sendMessage(action.replace(/_/g, " "));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  if (!isOpen) {
    return (
      <Button
        data-testid="button-open-chatbot"
        size="icon"
        className="fixed bottom-24 right-4 md:bottom-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid="chatbot-panel"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed z-50 ${
          isMobile 
            ? "inset-0" 
            : "bottom-6 right-4 w-[380px] h-[520px] rounded-2xl"
        } flex flex-col overflow-hidden`}
        style={{
          background: "linear-gradient(145deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div 
          className="flex items-center justify-between p-4 border-b border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h3 className="font-semibold text-white">Samikaran Assistant</h3>
              <p className="text-xs text-white/70">Always here to help</p>
            </div>
          </div>
          <Button
            data-testid="button-close-chatbot"
            size="icon"
            variant="ghost"
            className="text-white"
            onClick={() => setIsOpen(false)}
          >
            {isMobile ? <ChevronDown className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white/10 text-white border border-white/10"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.quickReplies.map((reply, idx) => (
                      <Button
                        key={idx}
                        data-testid={`button-quick-reply-${idx}`}
                        onClick={() => handleQuickReply(reply.action)}
                        size="sm"
                        variant="outline"
                        className="text-xs rounded-full bg-white/10 text-white border-white/20"
                      >
                        {reply.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              data-testid="input-chat-message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={sessionError ? "Connection failed. Please try again." : (!sessionId ? "Connecting..." : "Type your message...")}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
              disabled={isLoading || !sessionId || sessionError}
            />
            <Button
              data-testid="button-send-message"
              size="icon"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading || !sessionId || sessionError}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {!userId && (
            <p className="text-xs text-white/50 text-center mt-2">
              <a href="/student/login" className="underline hover:text-white/70">Login</a> for personalized assistance
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
