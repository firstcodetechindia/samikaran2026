import { db } from "./db";
import { sql } from "drizzle-orm";
import { getSupportWebSocket } from "./support-websocket";

interface AssignmentResult {
  success: boolean;
  assignedAgentId?: number;
  assignedAgentName?: string;
  assignmentId?: number;
  message: string;
  waitingInQueue?: boolean;
}

interface HandoverContext {
  sessionId: number;
  reason: string;
  aiConfidenceScore?: number;
  userFrustrationLevel?: number;
  aiSummary?: string;
  contextData?: Record<string, unknown>;
  issueCategory?: string;
}

export class AgentAssignmentService {
  private assignmentMethod: "round_robin" | "random" | "least_busy" = "round_robin";
  private lastAssignedAgentId: number = 0;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const result = await db.execute(sql`SELECT value FROM support_settings WHERE key = 'chat_assignment_method' LIMIT 1`);
      const methodSetting = result.rows?.[0] as any;
      if (methodSetting?.value) {
        this.assignmentMethod = methodSetting.value as "round_robin" | "random" | "least_busy";
      }
    } catch (err) {
      console.error("[Assignment] Failed to load settings:", err);
    }
  }

  async getAvailableAgents(): Promise<Array<{
    id: number;
    name: string;
    currentActiveChats: number;
    maxActiveChats: number;
    languagesSupported: unknown;
    skills: unknown;
    department: string | null;
  }>> {
    try {
      const result = await db.execute(sql`SELECT id, name, current_active_chats, max_active_chats, languages_supported, skills, department FROM human_agents WHERE status = 'online' AND is_active = true AND current_active_chats < max_active_chats ORDER BY current_active_chats ASC`);
      return (result.rows || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        currentActiveChats: a.current_active_chats || 0,
        maxActiveChats: a.max_active_chats || 5,
        languagesSupported: a.languages_supported,
        skills: a.skills,
        department: a.department,
      }));
    } catch (e) {
      console.error("[Assignment] getAvailableAgents error:", e);
      return [];
    }
  }

  private async selectAgent(
    availableAgents: Array<{ id: number; name: string; currentActiveChats: number | null }>,
    _preferredLanguage?: string,
    _issueCategory?: string
  ): Promise<{ id: number; name: string } | null> {
    if (availableAgents.length === 0) return null;

    switch (this.assignmentMethod) {
      case "round_robin": {
        // Find next agent after lastAssignedAgentId
        const sortedAgents = availableAgents.sort((a, b) => a.id - b.id);
        const nextAgentIndex = sortedAgents.findIndex(a => a.id > this.lastAssignedAgentId);
        const selectedAgent = nextAgentIndex >= 0 
          ? sortedAgents[nextAgentIndex] 
          : sortedAgents[0];
        
        this.lastAssignedAgentId = selectedAgent.id;
        return { id: selectedAgent.id, name: selectedAgent.name };
      }

      case "random": {
        const randomIndex = Math.floor(Math.random() * availableAgents.length);
        const selectedAgent = availableAgents[randomIndex];
        return { id: selectedAgent.id, name: selectedAgent.name };
      }

      case "least_busy": {
        // Agents are already sorted by currentActiveChats (ascending)
        const selectedAgent = availableAgents[0];
        return { id: selectedAgent.id, name: selectedAgent.name };
      }

      default:
        return { id: availableAgents[0].id, name: availableAgents[0].name };
    }
  }

  async assignChatToAgent(context: HandoverContext): Promise<AssignmentResult> {
    try {
      // Get available agents
      const availableAgents = await this.getAvailableAgents();

      if (availableAgents.length === 0) {
        // No agents available - user will wait in queue
        return {
          success: false,
          message: "All our support specialists are currently busy. You'll be connected to the next available agent.",
          waitingInQueue: true,
        };
      }

      // Get session info for language preference
      let sessionLang = "en";
      try {
        const sessResult = await db.execute(sql`SELECT language FROM chatbot_sessions WHERE id = ${context.sessionId} LIMIT 1`);
        sessionLang = sessResult.rows?.[0]?.language || "en";
      } catch (e) { /* ignore */ }

      // Select agent based on assignment method
      const selectedAgent = await this.selectAgent(
        availableAgents,
        sessionLang,
        context.issueCategory
      );

      if (!selectedAgent) {
        return {
          success: false,
          message: "Unable to assign agent at this time.",
          waitingInQueue: true,
        };
      }

      // Create assignment
      let assignmentId: number | null = null;
      try {
        const assignResult = await db.execute(sql`INSERT INTO chat_assignments (session_id, human_agent_id, status, issue_category) VALUES (${context.sessionId}, ${selectedAgent.id}, 'pending', ${context.issueCategory || null}) RETURNING id`);
        assignmentId = assignResult.rows?.[0]?.id;
      } catch (e) { console.error("[Assignment] Create assignment error:", e); }

      // Update session with human agent
      try {
        await db.execute(sql`UPDATE chatbot_sessions SET status = 'escalated_to_human', human_agent_id = ${selectedAgent.id}, escalated_at = NOW(), escalation_reason = ${context.reason} WHERE id = ${context.sessionId}`);
      } catch (e) { console.error("[Assignment] Update session error:", e); }

      // Increment agent's active chat count
      try {
        await db.execute(sql`UPDATE human_agents SET current_active_chats = COALESCE(current_active_chats, 0) + 1 WHERE id = ${selectedAgent.id}`);
      } catch (e) { /* ignore */ }

      // Create handover log
      try {
        await db.execute(sql`INSERT INTO ai_handover_logs (session_id, from_agent_type, to_agent_type, human_agent_id, handover_reason, ai_confidence_score, user_frustration_level, ai_summary) VALUES (${context.sessionId}, 'ai', 'human', ${selectedAgent.id}, ${context.reason}, ${context.aiConfidenceScore || null}, ${context.userFrustrationLevel || null}, ${context.aiSummary || null})`);
      } catch (e) { /* ignore */ }
      
      const assignment = { id: assignmentId };

      // Notify agent via WebSocket
      const supportWs = getSupportWebSocket();
      if (supportWs) {
        supportWs.notifyNewAssignment(selectedAgent.id, {
          assignmentId: assignment.id,
          sessionId: context.sessionId,
          userName: session?.userName || "Anonymous",
          issueCategory: context.issueCategory,
          escalationReason: context.reason,
          aiSummary: context.aiSummary,
        });
      }

      return {
        success: true,
        assignedAgentId: selectedAgent.id,
        assignedAgentName: selectedAgent.name,
        assignmentId: assignment.id,
        message: `Connecting you with ${selectedAgent.name}...`,
      };

    } catch (err) {
      console.error("[Assignment] Error assigning chat:", err);
      return {
        success: false,
        message: "An error occurred while connecting you to support. Please try again.",
      };
    }
  }

  async reassignChat(assignmentId: number, reason: string): Promise<AssignmentResult> {
    try {
      const caResult = await db.execute(sql`SELECT id, session_id, human_agent_id, issue_category FROM chat_assignments WHERE id = ${assignmentId} LIMIT 1`);
      const currentAssignment = caResult.rows?.[0] as any;

      if (!currentAssignment) {
        return { success: false, message: "Assignment not found" };
      }
      currentAssignment.humanAgentId = currentAssignment.human_agent_id;
      currentAssignment.sessionId = currentAssignment.session_id;
      currentAssignment.issueCategory = currentAssignment.issue_category;

      const availableAgents = await this.getAvailableAgents();
      const filteredAgents = availableAgents.filter(a => a.id !== currentAssignment.humanAgentId);

      if (filteredAgents.length === 0) {
        return { success: false, message: "No other agents available for reassignment", waitingInQueue: true };
      }

      const newAgent = await this.selectAgent(filteredAgents);
      if (!newAgent) {
        return { success: false, message: "Unable to find available agent" };
      }

      await db.execute(sql`UPDATE chat_assignments SET status = 'transferred', closed_at = NOW(), closed_by = 'system' WHERE id = ${assignmentId}`);
      await db.execute(sql`UPDATE human_agents SET current_active_chats = GREATEST(COALESCE(current_active_chats, 0) - 1, 0) WHERE id = ${currentAssignment.humanAgentId}`);

      const newAssignResult = await db.execute(sql`INSERT INTO chat_assignments (session_id, human_agent_id, status, internal_notes, issue_category) VALUES (${currentAssignment.sessionId}, ${newAgent.id}, 'pending', ${`Reassigned: ${reason}`}, ${currentAssignment.issueCategory || null}) RETURNING id`);
      const newAssignment = { id: newAssignResult.rows?.[0]?.id };

      await db.execute(sql`UPDATE chatbot_sessions SET human_agent_id = ${newAgent.id} WHERE id = ${currentAssignment.sessionId}`);
      await db.execute(sql`UPDATE human_agents SET current_active_chats = COALESCE(current_active_chats, 0) + 1 WHERE id = ${newAgent.id}`);

      const supportWs = getSupportWebSocket();
      if (supportWs) {
        supportWs.notifyNewAssignment(newAgent.id, {
          assignmentId: newAssignment.id,
          sessionId: currentAssignment.sessionId,
          reason: `Reassigned: ${reason}`,
        });
      }

      return {
        success: true,
        assignedAgentId: newAgent.id,
        assignedAgentName: newAgent.name,
        assignmentId: newAssignment.id,
        message: `Chat reassigned to ${newAgent.name}`,
      };

    } catch (err) {
      console.error("[Assignment] Reassignment error:", err);
      return { success: false, message: "Reassignment failed" };
    }
  }

  async checkIdleAgents(idleTimeoutSeconds: number = 300): Promise<void> {
    try {
      const idleThreshold = new Date(Date.now() - idleTimeoutSeconds * 1000);

      const idleResult = await db.execute(sql`SELECT id, name FROM human_agents WHERE status = 'online' AND last_active_at < ${idleThreshold}`);
      const idleAgents = idleResult.rows || [];

      for (const agent of idleAgents as any[]) {
        console.log(`[Assignment] Agent ${agent.name} (${agent.id}) is idle, setting to offline`);
        
        await db.execute(sql`UPDATE human_agents SET status = 'offline' WHERE id = ${agent.id}`);

        const activeResult = await db.execute(sql`SELECT id FROM chat_assignments WHERE human_agent_id = ${agent.id} AND (status = 'pending' OR status = 'active')`);
        for (const assignment of (activeResult.rows || []) as any[]) {
          await this.reassignChat(assignment.id, "Agent became idle/offline");
        }
      }
    } catch (err) {
      console.error("[Assignment] Idle check error:", err);
    }
  }

  async processQueuedChats(): Promise<void> {
    try {
      const waitingResult = await db.execute(sql`SELECT id, escalation_reason FROM chatbot_sessions WHERE status = 'escalated_to_human' AND human_agent_id IS NULL ORDER BY escalated_at ASC`);
      const waitingChats = waitingResult.rows || [];

      for (const chat of waitingChats as any[]) {
        const result = await this.assignChatToAgent({
          sessionId: chat.id,
          reason: chat.escalation_reason || "Queued escalation",
        });

        if (result.success) {
          console.log(`[Assignment] Queued chat ${chat.id} assigned to agent ${result.assignedAgentId}`);
        }
      }
    } catch (err) {
      console.error("[Assignment] Queue processing error:", err);
    }
  }
}

// Singleton instance
let assignmentService: AgentAssignmentService | null = null;

export function getAssignmentService(): AgentAssignmentService {
  if (!assignmentService) {
    assignmentService = new AgentAssignmentService();
  }
  return assignmentService;
}

// Auto-detect issue category from message
export async function detectIssueCategory(message: string): Promise<string | null> {
  try {
    const catResult = await db.execute(sql`SELECT name, keywords FROM issue_categories WHERE is_active = true`);
    const categories = catResult.rows || [];

    const messageLower = message.toLowerCase();

    for (const category of categories as any[]) {
      const keywords = category.keywords as string[];
      if (keywords && keywords.some(kw => messageLower.includes(kw.toLowerCase()))) {
        return category.name;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Generate AI summary of conversation for handover
export async function generateHandoverSummary(sessionId: number): Promise<string> {
  try {
    const msgResult = await db.execute(sql`SELECT sender, message FROM chatbot_messages WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT 20`);
    const messages = msgResult.rows || [];

    // Simple summary
    const userMessages = (messages as any[])
      .filter((m: any) => m.sender === "user")
      .map((m: any) => m.message)
      .slice(-5);

    if (userMessages.length === 0) {
      return "User initiated support chat.";
    }

    return `User queries: ${userMessages.join(" | ")}`;
  } catch {
    return "Unable to generate summary.";
  }
}
