import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { 
  agentSessions, humanAgents, chatbotSessions, chatbotMessages, 
  chatAssignments, aiHandoverLogs 
} from "@workspace/db";
import { eq, and, or, sql, asc, desc } from "drizzle-orm";

interface SupportClient {
  ws: WebSocket;
  type: "agent" | "user";
  agentId?: number;
  sessionToken?: string; // For agents: agent session token, for users: chat session token
  chatSessionId?: number; // For users: their chat session
}

interface SupportMessage {
  type: string;
  payload: Record<string, unknown>;
}

class SupportWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, SupportClient> = new Map();
  private agentChatRooms: Map<number, Set<string>> = new Map(); // sessionId -> clientIds

  constructor(server: HttpServer) {
    // Use noServer mode to avoid conflict with Vite HMR WebSocket
    this.wss = new WebSocketServer({ noServer: true });
    
    // Handle upgrade requests manually for /support/ws path only
    server.on("upgrade", (request, socket, head) => {
      const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
      
      if (pathname === "/support/ws") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      }
      // Let other upgrade requests (like Vite HMR) pass through
    });

    this.wss.on("connection", (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`[Support WS] New connection: ${clientId}`);
      
      const client: SupportClient = {
        ws,
        type: "user", // Default, will be updated on auth
      };
      
      this.clients.set(clientId, client);
      
      ws.on("message", async (data) => {
        try {
          const message: SupportMessage = JSON.parse(data.toString());
          await this.handleMessage(clientId, message);
        } catch (err) {
          console.error("[Support WS] Message parse error:", err);
          this.sendToClient(clientId, { type: "error", payload: { message: "Invalid message format" } });
        }
      });
      
      ws.on("close", () => {
        this.handleDisconnect(clientId);
      });
      
      ws.on("error", (err) => {
        console.error(`[Support WS] Client error ${clientId}:`, err);
      });
      
      // Send welcome message
      this.sendToClient(clientId, { 
        type: "connected", 
        payload: { clientId, message: "Connected to support system" } 
      });
    });

    console.log("[Support WS] WebSocket server initialized on /support/ws");
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToClient(clientId: string, message: SupportMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(sessionId: number, message: SupportMessage, excludeClientId?: string) {
    const room = this.agentChatRooms.get(sessionId);
    if (!room) return;
    
    room.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  private async handleMessage(clientId: string, message: SupportMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "agent_auth":
        await this.handleAgentAuth(clientId, message.payload);
        break;
        
      case "user_auth":
        await this.handleUserAuth(clientId, message.payload);
        break;
        
      case "join_chat":
        await this.handleJoinChat(clientId, message.payload);
        break;
        
      case "leave_chat":
        await this.handleLeaveChat(clientId, message.payload);
        break;
        
      case "send_message":
        await this.handleSendMessage(clientId, message.payload);
        break;
        
      case "typing":
        await this.handleTyping(clientId, message.payload);
        break;
        
      case "read_receipt":
        await this.handleReadReceipt(clientId, message.payload);
        break;
        
      case "agent_status":
        await this.handleAgentStatus(clientId, message.payload);
        break;
        
      default:
        this.sendToClient(clientId, { type: "error", payload: { message: "Unknown message type" } });
    }
  }

  private async handleAgentAuth(clientId: string, payload: Record<string, unknown>) {
    const sessionToken = payload.sessionToken as string;
    if (!sessionToken) {
      this.sendToClient(clientId, { type: "auth_error", payload: { message: "Session token required" } });
      return;
    }
    
    try {
      // Verify agent session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        this.sendToClient(clientId, { type: "auth_error", payload: { message: "Invalid session" } });
        return;
      }
      
      // Get agent info
      const [agent] = await db.select().from(humanAgents)
        .where(eq(humanAgents.id, session.humanAgentId));
      
      // Update client
      const client = this.clients.get(clientId);
      if (client) {
        client.type = "agent";
        client.agentId = session.humanAgentId;
        client.sessionToken = sessionToken;
      }
      
      // Update agent status to online
      await db.update(humanAgents)
        .set({ status: "online", lastActiveAt: new Date() })
        .where(eq(humanAgents.id, session.humanAgentId));
      
      this.sendToClient(clientId, { 
        type: "auth_success", 
        payload: { 
          agentId: agent?.id,
          agentName: agent?.name,
          status: "online"
        } 
      });
      
      // Notify admin dashboard of agent coming online
      this.broadcastToAdmins({
        type: "agent_online",
        payload: { agentId: agent?.id, agentName: agent?.name }
      });
      
    } catch (err) {
      console.error("[Support WS] Agent auth error:", err);
      this.sendToClient(clientId, { type: "auth_error", payload: { message: "Authentication failed" } });
    }
  }

  private async handleUserAuth(clientId: string, payload: Record<string, unknown>) {
    const chatSessionToken = payload.sessionToken as string;
    if (!chatSessionToken) {
      this.sendToClient(clientId, { type: "auth_error", payload: { message: "Session token required" } });
      return;
    }
    
    try {
      // Find chat session
      const [chatSession] = await db.select().from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, chatSessionToken));
      
      if (!chatSession) {
        this.sendToClient(clientId, { type: "auth_error", payload: { message: "Invalid session" } });
        return;
      }
      
      // Update client
      const client = this.clients.get(clientId);
      if (client) {
        client.type = "user";
        client.sessionToken = chatSessionToken;
        client.chatSessionId = chatSession.id;
      }
      
      // Join the chat room
      if (!this.agentChatRooms.has(chatSession.id)) {
        this.agentChatRooms.set(chatSession.id, new Set());
      }
      this.agentChatRooms.get(chatSession.id)?.add(clientId);
      
      this.sendToClient(clientId, { 
        type: "auth_success", 
        payload: { 
          sessionId: chatSession.id,
          status: chatSession.status
        } 
      });
      
    } catch (err) {
      console.error("[Support WS] User auth error:", err);
      this.sendToClient(clientId, { type: "auth_error", payload: { message: "Authentication failed" } });
    }
  }

  private async handleJoinChat(clientId: string, payload: Record<string, unknown>) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== "agent") {
      this.sendToClient(clientId, { type: "error", payload: { message: "Not authorized" } });
      return;
    }
    
    const sessionId = payload.sessionId as number;
    if (!sessionId) {
      this.sendToClient(clientId, { type: "error", payload: { message: "Session ID required" } });
      return;
    }

    // Verify agent is assigned to this chat
    try {
      const [assignment] = await db.select().from(chatAssignments)
        .where(and(
          eq(chatAssignments.sessionId, sessionId),
          eq(chatAssignments.humanAgentId, client.agentId!),
          or(
            eq(chatAssignments.status, "pending"),
            eq(chatAssignments.status, "active")
          )
        ));
      
      if (!assignment) {
        this.sendToClient(clientId, { type: "error", payload: { message: "Not assigned to this chat" } });
        return;
      }
    } catch (err) {
      console.error("[Support WS] Assignment verification error:", err);
      this.sendToClient(clientId, { type: "error", payload: { message: "Authorization check failed" } });
      return;
    }
    
    // Add agent to chat room
    if (!this.agentChatRooms.has(sessionId)) {
      this.agentChatRooms.set(sessionId, new Set());
    }
    this.agentChatRooms.get(sessionId)?.add(clientId);
    
    // Notify room that agent joined
    this.broadcastToRoom(sessionId, {
      type: "agent_joined",
      payload: { agentId: client.agentId, sessionId }
    }, clientId);
    
    this.sendToClient(clientId, { 
      type: "joined_chat", 
      payload: { sessionId } 
    });
  }

  private async handleLeaveChat(clientId: string, payload: Record<string, unknown>) {
    const sessionId = payload.sessionId as number;
    if (!sessionId) return;
    
    const room = this.agentChatRooms.get(sessionId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.agentChatRooms.delete(sessionId);
      }
    }
    
    this.sendToClient(clientId, { 
      type: "left_chat", 
      payload: { sessionId } 
    });
  }

  private async handleSendMessage(clientId: string, payload: Record<string, unknown>) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const sessionId = payload.sessionId as number || client.chatSessionId;
    const message = payload.message as string;
    
    if (!sessionId || !message) {
      this.sendToClient(clientId, { type: "error", payload: { message: "Session ID and message required" } });
      return;
    }
    
    try {
      const sender = client.type === "agent" ? "agent" : "user";
      
      // Get agent info if sender is agent
      let agentInfo: { name?: string } = {};
      if (client.type === "agent" && client.agentId) {
        const [agent] = await db.select().from(humanAgents)
          .where(eq(humanAgents.id, client.agentId));
        agentInfo = { name: agent?.name };
      }
      
      // Save message to database
      const [newMessage] = await db.insert(chatbotMessages).values({
        sessionId,
        sender,
        message: message.trim(),
        sourceType: client.type === "agent" ? "human_agent" : "user_websocket",
        metadata: client.type === "agent" ? { agentId: client.agentId, agentName: agentInfo.name } : null,
      }).returning();
      
      // Update session timestamps
      if (sender === "user") {
        await db.update(chatbotSessions)
          .set({ lastUserMessageAt: new Date(), status: "active" })
          .where(eq(chatbotSessions.id, sessionId));
      } else {
        await db.update(chatbotSessions)
          .set({ lastAgentMessageAt: new Date() })
          .where(eq(chatbotSessions.id, sessionId));
      }
      
      // Broadcast message to room
      this.broadcastToRoom(sessionId, {
        type: "new_message",
        payload: {
          id: newMessage.id,
          sessionId,
          sender,
          message: newMessage.message,
          timestamp: newMessage.createdAt,
          agentName: agentInfo.name,
        }
      });
      
    } catch (err) {
      console.error("[Support WS] Send message error:", err);
      this.sendToClient(clientId, { type: "error", payload: { message: "Failed to send message" } });
    }
  }

  private async handleTyping(clientId: string, payload: Record<string, unknown>) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const sessionId = payload.sessionId as number || client.chatSessionId;
    const isTyping = payload.isTyping as boolean;
    
    if (!sessionId) return;
    
    // Broadcast typing indicator to room
    this.broadcastToRoom(sessionId, {
      type: "typing",
      payload: {
        sessionId,
        sender: client.type,
        isTyping,
        agentId: client.agentId,
      }
    }, clientId);
  }

  private async handleReadReceipt(clientId: string, payload: Record<string, unknown>) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const sessionId = payload.sessionId as number || client.chatSessionId;
    const messageId = payload.messageId as number;
    
    if (!sessionId || !messageId) return;
    
    // Broadcast read receipt to room
    this.broadcastToRoom(sessionId, {
      type: "read_receipt",
      payload: {
        sessionId,
        messageId,
        readBy: client.type,
        readAt: new Date(),
      }
    }, clientId);
  }

  private async handleAgentStatus(clientId: string, payload: Record<string, unknown>) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== "agent" || !client.agentId) return;
    
    const status = payload.status as string;
    if (!["online", "busy", "offline"].includes(status)) return;
    
    try {
      await db.update(humanAgents)
        .set({ status, lastActiveAt: new Date() })
        .where(eq(humanAgents.id, client.agentId));
      
      // Notify admins
      this.broadcastToAdmins({
        type: "agent_status_changed",
        payload: { agentId: client.agentId, status }
      });
      
      this.sendToClient(clientId, { type: "status_updated", payload: { status } });
      
    } catch (err) {
      console.error("[Support WS] Status update error:", err);
    }
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    console.log(`[Support WS] Client disconnected: ${clientId}`);
    
    // Remove from all rooms
    this.agentChatRooms.forEach((room, sessionId) => {
      if (room.has(clientId)) {
        room.delete(clientId);
        // Notify room of disconnect
        this.broadcastToRoom(sessionId, {
          type: client.type === "agent" ? "agent_disconnected" : "user_disconnected",
          payload: { clientId, agentId: client.agentId }
        });
      }
    });
    
    // If agent, update status
    if (client.type === "agent" && client.agentId) {
      this.handleAgentOffline(client.agentId);
    }
    
    this.clients.delete(clientId);
  }

  private async handleAgentOffline(agentId: number) {
    try {
      await db.update(humanAgents)
        .set({ status: "offline", lastActiveAt: new Date() })
        .where(eq(humanAgents.id, agentId));
      
      // Close active sessions for this agent
      await db.update(agentSessions)
        .set({ isActive: false, logoutAt: new Date(), logoutReason: "disconnected" })
        .where(and(
          eq(agentSessions.humanAgentId, agentId),
          eq(agentSessions.isActive, true)
        ));
      
      // Notify admins
      this.broadcastToAdmins({
        type: "agent_offline",
        payload: { agentId }
      });
      
    } catch (err) {
      console.error("[Support WS] Agent offline error:", err);
    }
  }

  private broadcastToAdmins(message: SupportMessage) {
    // Broadcast to all connected admin clients
    // In a real implementation, you'd filter for admin clients
    this.clients.forEach((client, clientId) => {
      if (client.type === "agent") {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Public methods for external use

  public notifyNewAssignment(agentId: number, assignment: Record<string, unknown>) {
    // Find agent's WebSocket connection and notify
    this.clients.forEach((client, clientId) => {
      if (client.type === "agent" && client.agentId === agentId) {
        this.sendToClient(clientId, {
          type: "new_assignment",
          payload: assignment
        });
      }
    });
  }

  public notifyUserEscalation(sessionId: number, message: string) {
    // Notify user in the chat that they're being escalated
    this.broadcastToRoom(sessionId, {
      type: "escalation_notice",
      payload: { message, sessionId }
    });
  }
}

let supportWsServer: SupportWebSocketServer | null = null;

export function initializeSupportWebSocket(server: HttpServer): SupportWebSocketServer {
  if (!supportWsServer) {
    supportWsServer = new SupportWebSocketServer(server);
  }
  return supportWsServer;
}

export function getSupportWebSocket(): SupportWebSocketServer | null {
  return supportWsServer;
}
