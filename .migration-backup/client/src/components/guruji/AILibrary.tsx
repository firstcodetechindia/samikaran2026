import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Search, Calendar, BookOpen, MessageCircle, Clock, 
  ChevronRight, X, Filter, Printer, Volume2, Loader2,
  Mic, PauseCircle, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const userStr = localStorage.getItem("samikaran_user");
  const sessionToken = localStorage.getItem("samikaran_session_token");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) headers["X-User-Id"] = String(user.id);
    } catch {}
  }
  if (sessionToken) headers["X-Session-Token"] = sessionToken;
  return headers;
}

interface Conversation {
  id: number;
  conversationId: string;
  mode: string;
  language: string;
  subject?: string;
  gradeLevel?: number;
  messageCount: number;
  totalCreditsConsumed: number;
  createdAt: string;
}

interface Message {
  id: number;
  role: "student" | "guruji" | "tara";
  messageType?: "text" | "voice";
  content: string;
  wordCount?: number;
  creditsCharged?: number;
  wasSpokenAloud?: boolean;
  createdAt: string;
}

interface AILibraryProps {
  isOpen?: boolean;
  onClose?: () => void;
  studentId: number;
  onLoadConversation?: (conversationId: number, messages: Message[]) => void;
  mode?: 'dialog' | 'page';
}

const subjectOptions = [
  { value: "all", label: "All Subjects" },
  { value: "math", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "reasoning", label: "Reasoning" },
  { value: "gk", label: "General Knowledge" },
  { value: "computer", label: "Computer" },
  { value: "hindi", label: "Hindi" },
];

export function AILibrary({ isOpen = true, onClose, studentId, onLoadConversation, mode = 'dialog' }: AILibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleContinueConversation = () => {
    if (selectedConversation && conversationDetails?.messages && onLoadConversation) {
      onLoadConversation(selectedConversation, conversationDetails.messages);
      if (onClose) onClose();
      toast({ title: "Conversation Loaded", description: "You can continue your previous conversation now." });
    }
  };

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/guruji/conversations", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/guruji/conversations/${studentId}?limit=50`, { 
        credentials: 'include',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.conversations || []);
    },
    enabled: (mode === 'page' || isOpen) && !!studentId,
  });
  
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];

  const { data: conversationDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/guruji/conversation", selectedConversation],
    queryFn: async () => {
      const res = await fetch(`/api/guruji/conversation/${selectedConversation}`, { 
        credentials: 'include',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    enabled: !!selectedConversation,
  });

  const handlePrint = async (messageId: number, content: string) => {
    try {
      await apiRequest("POST", "/api/guruji/print-log", { studentId, messageId });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>TARA Response</title>
            <style>body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #8B5CF6; margin-bottom: 20px; }
              .content { line-height: 1.8; white-space: pre-wrap; }
              .footer { margin-top: 40px; color: #666; font-size: 12px; }</style>
          </head><body>
            <h1>TARA - Helping You Learn Better</h1>
            <div class="content">${content}</div>
            <div class="footer">Printed from Samikaran Olympiad Platform - ${format(new Date(), 'PPpp')}</div>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      toast({ title: "Print Started", description: "Check your print dialog." });
    } catch {
      toast({ title: "Print Failed", description: "Could not print the response.", variant: "destructive" });
    }
  };

  const speakText = async (text: string, messageId?: number) => {
    try {
      if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; setPlayingMessageId(null); }
      if (messageId) setPlayingMessageId(messageId);
      const res = await fetch("/api/guruji/tts", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include',
        body: JSON.stringify({ text, language: "hi" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.onended = () => { URL.revokeObjectURL(audioUrl); setPlayingMessageId(null); setCurrentAudio(null); };
      await audio.play();
    } catch {
      setPlayingMessageId(null);
      toast({ title: "Audio Error", description: "Could not play audio.", variant: "destructive" });
    }
  };

  const stopAudio = () => {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; setPlayingMessageId(null); setCurrentAudio(null); }
  };

  const filteredConversations = conversations.filter((conv: Conversation) => {
    if (subjectFilter !== "all" && conv.subject !== subjectFilter) return false;
    return true;
  });

  // Shared content for both modes
  const libraryContent = (
    <>
      {/* Header for page mode */}
      {mode === 'page' && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">TARA Library</h1>
            <p className="text-sm text-muted-foreground">Review and listen to your past conversations</p>
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search your conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="input-library-search" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-library-subject">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            {subjectOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex gap-4">
        <ScrollArea className={selectedConversation ? "w-1/2 pr-2" : "flex-1 pr-2"}>
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm">Start chatting with TARA to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredConversations.map((conv: Conversation, index: number) => {
                  const getRelativeTime = (dateStr: string) => {
                    const date = new Date(dateStr);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    if (diffMins < 1) return "Just now";
                    if (diffMins < 60) return `${diffMins} min ago`;
                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                    if (diffDays === 1) return "Yesterday";
                    if (diffDays < 7) return `${diffDays} days ago`;
                    return format(date, "MMM d, yyyy");
                  };
                  const getSessionTitle = () => {
                    if (conv.subject) return `${conv.subject} Session`;
                    if (conv.mode === "voice") return "Voice Chat Session";
                    return "Study Session";
                  };
                  return (
                  <motion.div key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.03 }}>
                    <Card className={`cursor-pointer transition-all hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 ${selectedConversation === conv.id ? "border-purple-500 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20" : "bg-white dark:bg-gray-900"}`} onClick={() => setSelectedConversation(conv.id)} data-testid={`card-conversation-${conv.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${conv.mode === "voice" ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-purple-500 to-pink-600"}`}>
                            {conv.mode === "voice" ? <Mic className="w-5 h-5 text-white" /> : <BookOpen className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{getSessionTitle()}</h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{getRelativeTime(conv.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">{conv.messageCount}</span> messages
                              </span>
                              {conv.totalCreditsConsumed > 0 && (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <span className="font-medium">{conv.totalCreditsConsumed}</span> credits
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {conv.mode === "voice" && (
                                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 flex-shrink-0">
                                  <Volume2 className="w-2.5 h-2.5 mr-0.5" />Voice
                                </Badge>
                              )}
                              {conv.gradeLevel && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                                  Class {conv.gradeLevel}
                                </Badge>
                              )}
                              {conv.subject && (
                                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 flex-shrink-0">
                                  {conv.subject}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${selectedConversation === conv.id ? "text-purple-600 rotate-90" : "text-muted-foreground"}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )})}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Conversation details panel */}
        {selectedConversation && (
          <div className="w-1/2 border-l pl-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Conversation Details</h3>
              <div className="flex items-center gap-2">
                {onLoadConversation && (
                  <Button variant="default" size="sm" onClick={handleContinueConversation} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" data-testid="button-continue-conversation">
                    <MessageCircle className="w-4 h-4 mr-2" />Continue Chat
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)} data-testid="button-close-details"><X className="w-4 h-4" /></Button>
              </div>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-2">
                  {conversationDetails?.messages?.map((msg: Message) => (
                    <div key={msg.id} className={`rounded-lg p-3 ${msg.role === "student" ? "bg-purple-100 dark:bg-purple-900/30 ml-8" : "bg-muted mr-8"} ${playingMessageId === msg.id ? "ring-2 ring-purple-500" : ""}`} data-testid={`message-${msg.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{msg.role === "student" ? "You" : "TARA"}</span>
                          {msg.messageType === "voice" && (<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4"><Mic className="w-2.5 h-2.5 mr-0.5" />Voice</Badge>)}
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), "h:mm a")}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.role === "guruji" && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                          {playingMessageId === msg.id ? (
                            <Button variant="default" size="sm" onClick={stopAudio} className="h-7 text-xs bg-purple-600 hover:bg-purple-700" data-testid={`button-stop-${msg.id}`}>
                              <PauseCircle className="w-3 h-3 mr-1 animate-pulse" />Playing...
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => speakText(msg.content, msg.id)} className="h-7 text-xs hover:text-purple-600" data-testid={`button-speak-${msg.id}`}>
                              <PlayCircle className="w-3 h-3 mr-1" />Listen
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(msg.id, msg.content)} className="h-7 text-xs" data-testid={`button-print-${msg.id}`}>
                            <Printer className="w-3 h-3 mr-1" />Print
                          </Button>
                          {msg.creditsCharged && (<span className="text-xs text-muted-foreground ml-auto">{msg.creditsCharged} credits</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Page mode - render directly
  if (mode === 'page') {
    return (
      <div className="h-full flex flex-col p-4" data-testid="ai-library-page">
        {libraryContent}
      </div>
    );
  }

  // Dialog mode
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden" data-testid="ai-library-dialog">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold">म</span>
            </div>
            AI Library
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-4 overflow-hidden flex flex-col">
          {libraryContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
