import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { 
  humanAgents, agentSessions, chatbotSessions, chatbotMessages, 
  chatAssignments, aiHandoverLogs, agentPerformanceMetrics,
  abuseReports, issueCategories, chatQualityReviews, quickReplies,
  supportSettings, users
} from "@workspace/db";
import { eq, and, desc, asc, gte, lte, sql, isNull, or, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Authorization middleware for super admin only routes
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = req.user as { userType?: string } | undefined;
  if (!user || user.userType !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

// Authorization middleware for support agent or super admin
function requireSupportOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = req.user as { userType?: string } | undefined;
  if (!user || !["super_admin", "support_agent"].includes(user.userType || "")) {
    return res.status(403).json({ message: "Support agent or admin access required" });
  }
  next();
}

export function registerSupportRoutes(app: Express) {
  // ============================================
  // SUPPORT AGENT MANAGEMENT (Super Admin Only)
  // ============================================

  // Get all support agents (Super Admin only)
  app.get("/api/support/agents", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agents = await db.select({
        id: humanAgents.id,
        userId: humanAgents.userId,
        name: humanAgents.name,
        email: humanAgents.email,
        phone: humanAgents.phone,
        avatarUrl: humanAgents.avatarUrl,
        status: humanAgents.status,
        languagesSupported: humanAgents.languagesSupported,
        maxActiveChats: humanAgents.maxActiveChats,
        currentActiveChats: humanAgents.currentActiveChats,
        department: humanAgents.department,
        skills: humanAgents.skills,
        lastActiveAt: humanAgents.lastActiveAt,
        isActive: humanAgents.isActive,
        createdAt: humanAgents.createdAt,
      }).from(humanAgents).orderBy(desc(humanAgents.createdAt));
      
      res.json(agents);
    } catch (err) {
      console.error("Error fetching support agents:", err);
      res.status(500).json({ message: "Failed to fetch support agents" });
    }
  });

  // Create new support agent with credentials
  app.post("/api/support/agents", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        name, email, phone, password, department, 
        languagesSupported, maxActiveChats, skills, avatarUrl 
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      // Hash password for user account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user account for agent
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || null,
        userType: "support_agent",
        phone: phone || null,
      });

      // Create human agent record
      const [agent] = await db.insert(humanAgents).values({
        userId,
        name,
        email,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
        status: "offline",
        languagesSupported: languagesSupported || ["en", "hi"],
        maxActiveChats: maxActiveChats || 5,
        department: department || "General Support",
        skills: skills || [],
        isActive: true,
      }).returning();

      res.status(201).json({
        success: true,
        agent: {
          id: agent.id,
          userId: agent.userId,
          name: agent.name,
          email: agent.email,
          loginCredentials: {
            email,
            password: "***" // Don't return actual password
          }
        },
        message: "Support agent created successfully"
      });
    } catch (err) {
      console.error("Error creating support agent:", err);
      res.status(500).json({ message: "Failed to create support agent" });
    }
  });

  // Update support agent
  app.put("/api/support/agents/:id", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;
      
      const [updated] = await db.update(humanAgents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(humanAgents.id, agentId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(updated);
    } catch (err) {
      console.error("Error updating support agent:", err);
      res.status(500).json({ message: "Failed to update support agent" });
    }
  });

  // Disable/Enable support agent
  app.patch("/api/support/agents/:id/status", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const { isActive, status } = req.body;
      
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (status) updateData.status = status;
      
      const [updated] = await db.update(humanAgents)
        .set(updateData)
        .where(eq(humanAgents.id, agentId))
        .returning();
      
      res.json(updated);
    } catch (err) {
      console.error("Error updating agent status:", err);
      res.status(500).json({ message: "Failed to update agent status" });
    }
  });

  // Reset agent password
  app.post("/api/support/agents/:id/reset-password", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Get agent to find userId
      const [agent] = await db.select().from(humanAgents).where(eq(humanAgents.id, agentId));
      if (!agent || !agent.userId) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, agent.userId));
      
      res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      console.error("Error resetting password:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ============================================
  // AGENT AUTHENTICATION
  // ============================================

  // Agent login
  app.post("/api/support/agent/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Find agent record
      const [agent] = await db.select().from(humanAgents).where(eq(humanAgents.userId, user.id));
      if (!agent) {
        return res.status(403).json({ message: "User is not a support agent" });
      }
      
      if (!agent.isActive) {
        return res.status(403).json({ message: "Agent account is disabled" });
      }
      
      // Create session
      const sessionToken = randomUUID();
      await db.insert(agentSessions).values({
        humanAgentId: agent.id,
        sessionToken,
        ipAddress: req.ip || null,
        userAgent: req.get('user-agent') || null,
        isActive: true,
      });
      
      // Update agent status to online
      await db.update(humanAgents)
        .set({ status: "online", lastActiveAt: new Date() })
        .where(eq(humanAgents.id, agent.id));
      
      res.json({
        success: true,
        sessionToken,
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          department: agent.department,
          avatarUrl: agent.avatarUrl,
          status: "online",
          maxActiveChats: agent.maxActiveChats,
          currentActiveChats: agent.currentActiveChats,
        }
      });
    } catch (err) {
      console.error("Agent login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Agent logout
  app.post("/api/support/agent/logout", async (req: Request, res: Response) => {
    try {
      const { sessionToken } = req.body;
      
      if (!sessionToken) {
        return res.status(400).json({ message: "Session token required" });
      }
      
      // Find and close session
      const [session] = await db.select().from(agentSessions)
        .where(eq(agentSessions.sessionToken, sessionToken));
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Update session
      await db.update(agentSessions)
        .set({ isActive: false, logoutAt: new Date(), logoutReason: "manual" })
        .where(eq(agentSessions.id, session.id));
      
      // Update agent status to offline
      await db.update(humanAgents)
        .set({ status: "offline", lastActiveAt: new Date() })
        .where(eq(humanAgents.id, session.humanAgentId));
      
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      console.error("Agent logout error:", err);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Update agent status (online/busy/offline)
  app.patch("/api/support/agent/status", async (req: Request, res: Response) => {
    try {
      const { sessionToken, status } = req.body;
      
      if (!sessionToken || !status) {
        return res.status(400).json({ message: "Session token and status required" });
      }
      
      if (!["online", "busy", "offline"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Find session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Update agent status
      await db.update(humanAgents)
        .set({ status, lastActiveAt: new Date() })
        .where(eq(humanAgents.id, session.humanAgentId));
      
      // Update session activity
      await db.update(agentSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(agentSessions.id, session.id));
      
      res.json({ success: true, status });
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // ============================================
  // AGENT CHAT MANAGEMENT
  // ============================================

  // Get agent's incoming/active chats
  app.get("/api/support/agent/chats", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Session token required" });
      }
      
      // Verify session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Get assignments for this agent
      const assignments = await db.select({
        assignment: chatAssignments,
        chatSession: chatbotSessions,
      })
      .from(chatAssignments)
      .innerJoin(chatbotSessions, eq(chatAssignments.sessionId, chatbotSessions.id))
      .where(and(
        eq(chatAssignments.humanAgentId, session.humanAgentId),
        or(
          eq(chatAssignments.status, "pending"),
          eq(chatAssignments.status, "active")
        )
      ))
      .orderBy(desc(chatAssignments.assignedAt));
      
      // Get message counts for each chat
      const chatsWithDetails = await Promise.all(assignments.map(async (a) => {
        const [messageCount] = await db.select({ count: count() })
          .from(chatbotMessages)
          .where(eq(chatbotMessages.sessionId, a.chatSession.id));
        
        // Get last message
        const [lastMessage] = await db.select()
          .from(chatbotMessages)
          .where(eq(chatbotMessages.sessionId, a.chatSession.id))
          .orderBy(desc(chatbotMessages.createdAt))
          .limit(1);
        
        return {
          assignmentId: a.assignment.id,
          sessionId: a.chatSession.id,
          sessionToken: a.chatSession.sessionToken,
          userName: a.chatSession.userName || "Anonymous",
          userEmail: a.chatSession.userEmail,
          userPhone: a.chatSession.userPhone,
          status: a.assignment.status,
          issueCategory: a.assignment.issueCategory,
          assignedAt: a.assignment.assignedAt,
          acceptedAt: a.assignment.acceptedAt,
          messageCount: messageCount?.count || 0,
          lastMessage: lastMessage?.message,
          lastMessageAt: lastMessage?.createdAt,
          escalationReason: a.chatSession.escalationReason,
        };
      }));
      
      res.json(chatsWithDetails);
    } catch (err) {
      console.error("Error fetching agent chats:", err);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Accept a chat assignment
  app.post("/api/support/agent/chats/:assignmentId/accept", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      const assignmentId = parseInt(req.params.assignmentId);
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Session token required" });
      }
      
      // Verify session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Get and verify assignment
      const [assignment] = await db.select().from(chatAssignments)
        .where(and(
          eq(chatAssignments.id, assignmentId),
          eq(chatAssignments.humanAgentId, session.humanAgentId),
          eq(chatAssignments.status, "pending")
        ));
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found or already accepted" });
      }
      
      // Accept the assignment
      await db.update(chatAssignments)
        .set({ status: "active", acceptedAt: new Date() })
        .where(eq(chatAssignments.id, assignmentId));
      
      // Update handover log
      await db.update(aiHandoverLogs)
        .set({ humanAcceptedAt: new Date() })
        .where(and(
          eq(aiHandoverLogs.sessionId, assignment.sessionId),
          eq(aiHandoverLogs.humanAgentId, session.humanAgentId)
        ));
      
      // Send system message to chat
      await db.insert(chatbotMessages).values({
        sessionId: assignment.sessionId,
        sender: "system",
        message: "A support agent has joined the chat and will assist you shortly.",
        sourceType: "handover",
      });
      
      res.json({ success: true, message: "Chat accepted" });
    } catch (err) {
      console.error("Error accepting chat:", err);
      res.status(500).json({ message: "Failed to accept chat" });
    }
  });

  // Get full chat history
  app.get("/api/support/agent/chats/:sessionId/messages", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      const sessionId = parseInt(req.params.sessionId);
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Session token required" });
      }
      
      // Verify agent session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Get chat session details
      const [chatSession] = await db.select().from(chatbotSessions)
        .where(eq(chatbotSessions.id, sessionId));
      
      if (!chatSession) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Get all messages
      const messages = await db.select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.sessionId, sessionId))
        .orderBy(asc(chatbotMessages.createdAt));
      
      // Get AI summary from handover log
      const [handoverLog] = await db.select().from(aiHandoverLogs)
        .where(eq(aiHandoverLogs.sessionId, sessionId))
        .orderBy(desc(aiHandoverLogs.handoverAt))
        .limit(1);
      
      res.json({
        session: {
          id: chatSession.id,
          userName: chatSession.userName,
          userEmail: chatSession.userEmail,
          userPhone: chatSession.userPhone,
          startedAt: chatSession.startedAt,
          escalatedAt: chatSession.escalatedAt,
          escalationReason: chatSession.escalationReason,
        },
        messages,
        aiSummary: handoverLog?.aiSummary,
        userContext: handoverLog?.contextData,
      });
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message as agent
  app.post("/api/support/agent/chats/:sessionId/send", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      const sessionId = parseInt(req.params.sessionId);
      const { message } = req.body;
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Session token required" });
      }
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Verify agent session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Verify agent has access to this chat
      const [assignment] = await db.select().from(chatAssignments)
        .where(and(
          eq(chatAssignments.sessionId, sessionId),
          eq(chatAssignments.humanAgentId, session.humanAgentId),
          eq(chatAssignments.status, "active")
        ));
      
      if (!assignment) {
        return res.status(403).json({ message: "Not authorized for this chat" });
      }
      
      // Get agent info
      const [agent] = await db.select().from(humanAgents)
        .where(eq(humanAgents.id, session.humanAgentId));
      
      // Insert message
      const [newMessage] = await db.insert(chatbotMessages).values({
        sessionId,
        sender: "agent",
        message: message.trim(),
        sourceType: "human_agent",
        metadata: { agentId: agent?.id, agentName: agent?.name },
      }).returning();
      
      // Update session last agent message time
      await db.update(chatbotSessions)
        .set({ lastAgentMessageAt: new Date() })
        .where(eq(chatbotSessions.id, sessionId));
      
      res.json({
        success: true,
        message: newMessage,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Close chat with resolution
  app.post("/api/support/agent/chats/:assignmentId/close", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      const assignmentId = parseInt(req.params.assignmentId);
      const { resolutionSummary, issueCategory, internalNotes } = req.body;
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Session token required" });
      }
      
      // Verify agent session
      const [session] = await db.select().from(agentSessions)
        .where(and(
          eq(agentSessions.sessionToken, sessionToken),
          eq(agentSessions.isActive, true)
        ));
      
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      // Get assignment
      const [assignment] = await db.select().from(chatAssignments)
        .where(and(
          eq(chatAssignments.id, assignmentId),
          eq(chatAssignments.humanAgentId, session.humanAgentId)
        ));
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Close assignment
      await db.update(chatAssignments)
        .set({
          status: "completed",
          closedAt: new Date(),
          closedBy: "agent",
          resolutionSummary: resolutionSummary || null,
          issueCategory: issueCategory || null,
          internalNotes: internalNotes || null,
        })
        .where(eq(chatAssignments.id, assignmentId));
      
      // Update chat session
      await db.update(chatbotSessions)
        .set({
          status: "closed_after_human_chat",
          endedAt: new Date(),
          resolutionStatus: "resolved",
          closedReason: "human_closed",
        })
        .where(eq(chatbotSessions.id, assignment.sessionId));
      
      // Decrement agent's active chat count
      await db.update(humanAgents)
        .set({ currentActiveChats: sql`GREATEST(${humanAgents.currentActiveChats} - 1, 0)` })
        .where(eq(humanAgents.id, session.humanAgentId));
      
      // Update handover log as successful
      await db.update(aiHandoverLogs)
        .set({ wasSuccessful: true })
        .where(eq(aiHandoverLogs.sessionId, assignment.sessionId));
      
      // Send closing message
      await db.insert(chatbotMessages).values({
        sessionId: assignment.sessionId,
        sender: "system",
        message: "This chat has been closed. Thank you for contacting Samikaran Olympiad support!",
        sourceType: "close",
      });
      
      res.json({ success: true, message: "Chat closed successfully" });
    } catch (err) {
      console.error("Error closing chat:", err);
      res.status(500).json({ message: "Failed to close chat" });
    }
  });

  // ============================================
  // QUICK REPLIES
  // ============================================

  // Get quick replies for agent
  app.get("/api/support/quick-replies", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers['x-agent-session'] as string;
      let agentId: number | null = null;
      
      if (sessionToken) {
        const [session] = await db.select().from(agentSessions)
          .where(eq(agentSessions.sessionToken, sessionToken));
        agentId = session?.humanAgentId || null;
      }
      
      // Get global and agent-specific quick replies
      const replies = await db.select()
        .from(quickReplies)
        .where(and(
          eq(quickReplies.isActive, true),
          or(
            eq(quickReplies.isGlobal, true),
            agentId ? eq(quickReplies.humanAgentId, agentId) : sql`FALSE`
          )
        ))
        .orderBy(asc(quickReplies.category), desc(quickReplies.usageCount));
      
      res.json(replies);
    } catch (err) {
      console.error("Error fetching quick replies:", err);
      res.status(500).json({ message: "Failed to fetch quick replies" });
    }
  });

  // ============================================
  // ISSUE CATEGORIES
  // ============================================

  app.get("/api/support/issue-categories", requireSupportOrAdmin, async (req: Request, res: Response) => {
    try {
      const categories = await db.select()
        .from(issueCategories)
        .where(eq(issueCategories.isActive, true))
        .orderBy(desc(issueCategories.priority));
      
      res.json(categories);
    } catch (err) {
      console.error("Error fetching issue categories:", err);
      res.status(500).json({ message: "Failed to fetch issue categories" });
    }
  });

  // ============================================
  // SUPPORT SETTINGS
  // ============================================

  app.get("/api/support/settings", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(supportSettings);
      
      // Convert to key-value object
      const settingsObj: Record<string, unknown> = {};
      settings.forEach(s => {
        let value: unknown = s.value;
        if (s.valueType === 'number') value = parseFloat(s.value || '0');
        if (s.valueType === 'boolean') value = s.value === 'true';
        if (s.valueType === 'json') value = JSON.parse(s.value || '{}');
        settingsObj[s.key] = value;
      });
      
      res.json(settingsObj);
    } catch (err) {
      console.error("Error fetching support settings:", err);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/support/settings", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        await db.update(supportSettings)
          .set({ value: String(value), updatedAt: new Date() })
          .where(eq(supportSettings.key, key));
      }
      
      res.json({ success: true, message: "Settings updated" });
    } catch (err) {
      console.error("Error updating support settings:", err);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // ============================================
  // SUPER ADMIN - LIVE MONITORING
  // ============================================

  // Get all active chats (AI + Human)
  app.get("/api/support/admin/live-chats", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const activeChats = await db.select({
        session: chatbotSessions,
        agent: humanAgents,
        assignment: chatAssignments,
      })
      .from(chatbotSessions)
      .leftJoin(humanAgents, eq(chatbotSessions.humanAgentId, humanAgents.id))
      .leftJoin(chatAssignments, eq(chatbotSessions.id, chatAssignments.sessionId))
      .where(or(
        eq(chatbotSessions.status, "active"),
        eq(chatbotSessions.status, "escalated_to_human"),
        eq(chatbotSessions.status, "waiting_for_user")
      ))
      .orderBy(desc(chatbotSessions.lastUserMessageAt));
      
      res.json(activeChats.map(chat => ({
        sessionId: chat.session.id,
        sessionToken: chat.session.sessionToken,
        userName: chat.session.userName || "Anonymous",
        userEmail: chat.session.userEmail,
        status: chat.session.status,
        isWithHuman: chat.session.status === "escalated_to_human",
        humanAgentName: chat.agent?.name,
        humanAgentId: chat.agent?.id,
        assignmentStatus: chat.assignment?.status,
        startedAt: chat.session.startedAt,
        lastMessageAt: chat.session.lastUserMessageAt,
        escalatedAt: chat.session.escalatedAt,
      })));
    } catch (err) {
      console.error("Error fetching live chats:", err);
      res.status(500).json({ message: "Failed to fetch live chats" });
    }
  });

  // Get agent availability board
  app.get("/api/support/admin/agent-availability", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agents = await db.select({
        id: humanAgents.id,
        name: humanAgents.name,
        email: humanAgents.email,
        status: humanAgents.status,
        currentActiveChats: humanAgents.currentActiveChats,
        maxActiveChats: humanAgents.maxActiveChats,
        department: humanAgents.department,
        lastActiveAt: humanAgents.lastActiveAt,
        isActive: humanAgents.isActive,
      })
      .from(humanAgents)
      .where(eq(humanAgents.isActive, true))
      .orderBy(desc(humanAgents.status), asc(humanAgents.name));
      
      const summary = {
        total: agents.length,
        online: agents.filter(a => a.status === "online").length,
        busy: agents.filter(a => a.status === "busy").length,
        offline: agents.filter(a => a.status === "offline").length,
        totalCapacity: agents.reduce((sum, a) => sum + (a.maxActiveChats || 5), 0),
        currentLoad: agents.reduce((sum, a) => sum + (a.currentActiveChats || 0), 0),
      };
      
      res.json({ agents, summary });
    } catch (err) {
      console.error("Error fetching agent availability:", err);
      res.status(500).json({ message: "Failed to fetch agent availability" });
    }
  });

  // Force transfer chat to another agent
  app.post("/api/support/admin/transfer-chat", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { assignmentId, toAgentId, reason } = req.body;
      
      // Get current assignment
      const [assignment] = await db.select().from(chatAssignments)
        .where(eq(chatAssignments.id, assignmentId));
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Close current assignment
      await db.update(chatAssignments)
        .set({ status: "transferred", closedAt: new Date(), closedBy: "admin" })
        .where(eq(chatAssignments.id, assignmentId));
      
      // Decrement old agent's count
      await db.update(humanAgents)
        .set({ currentActiveChats: sql`GREATEST(${humanAgents.currentActiveChats} - 1, 0)` })
        .where(eq(humanAgents.id, assignment.humanAgentId));
      
      // Create new assignment
      const [newAssignment] = await db.insert(chatAssignments).values({
        sessionId: assignment.sessionId,
        humanAgentId: toAgentId,
        status: "pending",
        internalNotes: `Transferred by admin: ${reason || "No reason provided"}`,
      }).returning();
      
      // Increment new agent's count
      await db.update(humanAgents)
        .set({ currentActiveChats: sql`${humanAgents.currentActiveChats} + 1` })
        .where(eq(humanAgents.id, toAgentId));
      
      // Update session
      await db.update(chatbotSessions)
        .set({ humanAgentId: toAgentId })
        .where(eq(chatbotSessions.id, assignment.sessionId));
      
      // Send system message
      await db.insert(chatbotMessages).values({
        sessionId: assignment.sessionId,
        sender: "system",
        message: "You are being transferred to another support specialist. Please wait a moment.",
        sourceType: "transfer",
      });
      
      res.json({ success: true, newAssignmentId: newAssignment.id });
    } catch (err) {
      console.error("Error transferring chat:", err);
      res.status(500).json({ message: "Failed to transfer chat" });
    }
  });

  // Admin takes over a chat
  app.post("/api/support/admin/takeover-chat", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { sessionId, adminId } = req.body;
      
      // Get or create admin as human agent
      let [adminAgent] = await db.select().from(humanAgents)
        .where(eq(humanAgents.userId, adminId));
      
      if (!adminAgent) {
        // Create admin as human agent
        const [admin] = await db.select().from(users).where(eq(users.id, adminId));
        [adminAgent] = await db.insert(humanAgents).values({
          userId: adminId,
          name: `${admin?.firstName || 'Admin'} ${admin?.lastName || ''}`.trim(),
          email: admin?.email || null,
          status: "online",
          department: "Administration",
          isActive: true,
        }).returning();
      }
      
      // Close any existing assignment
      await db.update(chatAssignments)
        .set({ status: "transferred", closedAt: new Date(), closedBy: "admin_takeover" })
        .where(and(
          eq(chatAssignments.sessionId, sessionId),
          or(eq(chatAssignments.status, "pending"), eq(chatAssignments.status, "active"))
        ));
      
      // Create new assignment for admin
      const [newAssignment] = await db.insert(chatAssignments).values({
        sessionId,
        humanAgentId: adminAgent.id,
        status: "active",
        acceptedAt: new Date(),
        internalNotes: "Admin takeover",
      }).returning();
      
      // Update session
      await db.update(chatbotSessions)
        .set({ 
          humanAgentId: adminAgent.id,
          status: "escalated_to_human"
        })
        .where(eq(chatbotSessions.id, sessionId));
      
      // Send system message
      await db.insert(chatbotMessages).values({
        sessionId,
        sender: "system",
        message: "A senior support manager has joined this chat to assist you personally.",
        sourceType: "admin_takeover",
      });
      
      res.json({ success: true, assignmentId: newAssignment.id });
    } catch (err) {
      console.error("Error in admin takeover:", err);
      res.status(500).json({ message: "Failed to take over chat" });
    }
  });

  // ============================================
  // ABUSE REPORTING
  // ============================================

  // Report abusive user
  app.post("/api/support/report-abuse", async (req: Request, res: Response) => {
    try {
      const { 
        sessionId, reportedUserId, reportType, 
        description, evidenceMessageIds, reportedByAgentId, reportedByAdminId 
      } = req.body;
      
      const [report] = await db.insert(abuseReports).values({
        sessionId: sessionId || null,
        reportedUserId: reportedUserId || null,
        reportType,
        description: description || null,
        evidenceMessageIds: evidenceMessageIds || null,
        reportedByAgentId: reportedByAgentId || null,
        reportedByAdminId: reportedByAdminId || null,
        status: "pending",
      }).returning();
      
      res.status(201).json(report);
    } catch (err) {
      console.error("Error reporting abuse:", err);
      res.status(500).json({ message: "Failed to report abuse" });
    }
  });

  // Get abuse reports (admin)
  app.get("/api/support/admin/abuse-reports", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      let query = db.select().from(abuseReports);
      if (status) {
        query = query.where(eq(abuseReports.status, status)) as typeof query;
      }
      
      const reports = await query.orderBy(desc(abuseReports.createdAt));
      res.json(reports);
    } catch (err) {
      console.error("Error fetching abuse reports:", err);
      res.status(500).json({ message: "Failed to fetch abuse reports" });
    }
  });

  // Take action on abuse report
  app.patch("/api/support/admin/abuse-reports/:id", async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status, actionTaken, bannedUntil, isPermanentBan, adminId } = req.body;
      
      await db.update(abuseReports)
        .set({
          status: status || undefined,
          actionTaken: actionTaken || undefined,
          bannedUntil: bannedUntil ? new Date(bannedUntil) : undefined,
          isPermanentBan: isPermanentBan || undefined,
          actionTakenByAdminId: adminId || undefined,
          reviewedAt: new Date(),
        })
        .where(eq(abuseReports.id, reportId));
      
      res.json({ success: true, message: "Report updated" });
    } catch (err) {
      console.error("Error updating abuse report:", err);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // ============================================
  // ANALYTICS
  // ============================================

  // Get support analytics
  app.get("/api/support/admin/analytics", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      // Total chats
      const [totalChats] = await db.select({ count: count() })
        .from(chatbotSessions)
        .where(and(
          gte(chatbotSessions.startedAt, startDate),
          lte(chatbotSessions.startedAt, endDate)
        ));
      
      // AI resolved chats
      const [aiResolved] = await db.select({ count: count() })
        .from(chatbotSessions)
        .where(and(
          gte(chatbotSessions.startedAt, startDate),
          lte(chatbotSessions.startedAt, endDate),
          isNull(chatbotSessions.humanAgentId),
          or(
            eq(chatbotSessions.status, "closed_by_user"),
            eq(chatbotSessions.status, "closed_by_inactivity")
          )
        ));
      
      // Human resolved chats
      const [humanResolved] = await db.select({ count: count() })
        .from(chatbotSessions)
        .where(and(
          gte(chatbotSessions.startedAt, startDate),
          lte(chatbotSessions.startedAt, endDate),
          eq(chatbotSessions.status, "closed_after_human_chat")
        ));
      
      // Escalations
      const [escalations] = await db.select({ count: count() })
        .from(aiHandoverLogs)
        .where(and(
          gte(aiHandoverLogs.handoverAt, startDate),
          lte(aiHandoverLogs.handoverAt, endDate)
        ));
      
      // Average satisfaction
      const [satisfaction] = await db.select({ 
        avg: sql<number>`AVG(${chatbotSessions.satisfactionScore})` 
      })
        .from(chatbotSessions)
        .where(and(
          gte(chatbotSessions.startedAt, startDate),
          lte(chatbotSessions.startedAt, endDate),
          sql`${chatbotSessions.satisfactionScore} IS NOT NULL`
        ));
      
      // Issue category breakdown
      const categoryBreakdown = await db.select({
        category: chatAssignments.issueCategory,
        count: count(),
      })
        .from(chatAssignments)
        .where(and(
          gte(chatAssignments.assignedAt, startDate),
          lte(chatAssignments.assignedAt, endDate)
        ))
        .groupBy(chatAssignments.issueCategory);
      
      res.json({
        period: { startDate, endDate },
        totalChats: totalChats?.count || 0,
        aiResolvedChats: aiResolved?.count || 0,
        humanResolvedChats: humanResolved?.count || 0,
        totalEscalations: escalations?.count || 0,
        aiResolutionRate: totalChats?.count ? 
          ((aiResolved?.count || 0) / (totalChats.count as number) * 100).toFixed(1) : 0,
        averageSatisfaction: satisfaction?.avg?.toFixed(2) || null,
        categoryBreakdown,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  console.log("[Support System] Routes registered successfully");
}
