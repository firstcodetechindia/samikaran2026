import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X, Send, Loader2, MessageCircle, Bot, User, Sparkles,
  Clock, CheckCheck, ArrowDown, Trash2, HelpCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  message: string;
  timestamp: Date;
  confidence?: number;
}

interface HelpChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileType?: "student" | "school" | "partner" | "group" | "admin" | "supervisor" | "guest";
  userName?: string;
}

const QUICK_ACTIONS = [
  "How do I register for an exam?",
  "Where can I see my results?",
  "How to download certificates?",
  "I need help with my account",
  "Contact support team",
];

export default function HelpChatPanel({ isOpen, onClose, profileType = "guest", userName }: HelpChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agent } = useQuery<{ id: number; name: string; isActive: boolean }>({
    queryKey: ["/api/chatbot/agent"],
    enabled: isOpen,
  });

  const sessionRetryRef = useRef(0);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent?.id,
          language: "en",
          profileType,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Session creation failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
      } else {
        const fallback = `local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        setSessionToken(fallback);
      }
      const agentName = agent?.name || "TARA";
      const greeting = userName
        ? `Hello ${userName}! I'm ${agentName}, your Samikaran Olympiad assistant. How can I help you today?`
        : `Hello! I'm ${agentName}, your Samikaran Olympiad assistant. How can I help you today?`;
      setMessages([{
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: greeting,
        timestamp: new Date(),
      }]);
    },
    onError: () => {
      if (sessionRetryRef.current < 3) {
        sessionRetryRef.current += 1;
        setTimeout(() => createSessionMutation.mutate(), 1500 * sessionRetryRef.current);
      } else {
        const fallback = `local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        setSessionToken(fallback);
        const agentName = agent?.name || "TARA";
        const greeting = userName
          ? `Hello ${userName}! I'm ${agentName}, your Samikaran Olympiad assistant. How can I help you today?`
          : `Hello! I'm ${agentName}, your Samikaran Olympiad assistant. How can I help you today?`;
        setMessages([{
          id: `msg_${Date.now()}`,
          sender: "agent",
          message: greeting,
          timestamp: new Date(),
        }]);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsAgentTyping(true);
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          message,
          profileType,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Message failed: ${res.status}`);
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setIsAgentTyping(false);
      if (data.newSessionToken) {
        setSessionToken(data.newSessionToken);
      }
      const responseText = data.response || data.message || "I received your message. Let me help you with that.";
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: responseText,
        timestamp: new Date(),
        confidence: data.confidence,
      }]);
    },
    onError: () => {
      setIsAgentTyping(false);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: "Thank you for reaching out! I can help you with exam registration, results, certificates, and account issues.\n\nPlease try asking your question again, or contact our support team at **+91 98765 43210**.",
        timestamp: new Date(),
      }]);
    },
  });

  useEffect(() => {
    if (isOpen && !sessionToken && agent) {
      createSessionMutation.mutate();
    }
  }, [isOpen, agent]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping, scrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const handleSend = () => {
    if (!inputValue.trim() || !sessionToken || sendMessageMutation.isPending) return;
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      message: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue.trim());
    setInputValue("");
  };

  const handleQuickAction = (action: string) => {
    if (!sessionToken || sendMessageMutation.isPending) return;
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      message: action,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(action);
  };

  const handleClearChat = () => {
    setSessionToken(null);
    setMessages([]);
    if (agent) {
      createSessionMutation.mutate();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatMarkdown = (text: string) => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
            data-testid="help-chat-overlay"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-white z-[101] flex flex-col shadow-2xl"
            data-testid="help-chat-panel"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">{agent?.name || "TARA"}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                    <span className="text-white/80 text-xs">Online - Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                  onClick={handleClearChat}
                  title="New conversation"
                  data-testid="button-clear-chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                  onClick={onClose}
                  data-testid="button-close-chat"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
              onScroll={handleScroll}
              ref={scrollAreaRef}
            >
              {messages.length === 0 && !createSessionMutation.isPending && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-2">How can we help?</h4>
                  <p className="text-sm text-gray-500 mb-6">Ask anything about exams, results, registration, or your account.</p>
                </div>
              )}

              {createSessionMutation.isPending && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-gray-500">Connecting...</span>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "system" ? (
                    <div className="w-full text-center py-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {msg.message}
                      </Badge>
                    </div>
                  ) : (
                    <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                          : "bg-gradient-to-br from-emerald-500 to-green-500"
                      }`}>
                        {msg.sender === "user"
                          ? <User className="w-3.5 h-3.5 text-white" />
                          : <Bot className="w-3.5 h-3.5 text-white" />
                        }
                      </div>
                      <div>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-tr-sm"
                            : "bg-gray-100 text-gray-800 rounded-tl-sm"
                        }`}>
                          <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.message) }} />
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 ${msg.sender === "user" ? "justify-end" : ""}`}>
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                          {msg.sender === "user" && <CheckCheck className="w-3 h-3 text-blue-400 ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {isAgentTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {showScrollButton && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full shadow-lg h-8 px-3"
                  onClick={scrollToBottom}
                >
                  <ArrowDown className="w-3.5 h-3.5 mr-1" /> New messages
                </Button>
              </div>
            )}

            {messages.length <= 1 && !isAgentTyping && sessionToken && (
              <div className="px-4 pb-2 shrink-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action)}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1.5 transition-colors"
                      data-testid={`button-quick-action-${i}`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type your message..."
                  disabled={!sessionToken || sendMessageMutation.isPending}
                  className="flex-1 rounded-full border-gray-200 bg-gray-50 focus:bg-white px-4 h-10"
                  data-testid="input-help-chat-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || !sessionToken || sendMessageMutation.isPending}
                  size="icon"
                  className="rounded-full h-10 w-10 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shrink-0"
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Powered by TARA AI - Samikaran Olympiad</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
