import { db } from "../db";
import { systemRoles, systemPermissions, rolePermissions, roleTemplates } from "@workspace/db";
import { eq } from "drizzle-orm";

interface PermissionDef {
  module: string;
  page?: string;
  action: string;
  displayName: string;
  description?: string;
  category: string;
  requiresDataScope?: boolean;
}

const PERMISSIONS: PermissionDef[] = [
  // ========================
  // DASHBOARD & INSIGHTS
  // ========================
  { module: "dashboard", page: "live_dashboard", action: "view", displayName: "View Live Dashboard", category: "Dashboard & Insights" },
  { module: "dashboard", page: "analytics", action: "view", displayName: "View Analytics", category: "Dashboard & Insights" },
  { module: "dashboard", page: "system_health", action: "view", displayName: "View System Health", category: "Dashboard & Insights" },
  { module: "dashboard", page: "reports", action: "view", displayName: "View Reports", category: "Dashboard & Insights" },
  { module: "dashboard", page: "reports", action: "export", displayName: "Export Reports", category: "Dashboard & Insights" },

  // ========================
  // EXAM MANAGEMENT
  // ========================
  { module: "exam_management", page: "olympiads", action: "view", displayName: "View Olympiads", category: "Exam Management", requiresDataScope: true },
  { module: "exam_management", page: "olympiads", action: "create", displayName: "Create Olympiads", category: "Exam Management" },
  { module: "exam_management", page: "olympiads", action: "edit", displayName: "Edit Olympiads", category: "Exam Management", requiresDataScope: true },
  { module: "exam_management", page: "olympiads", action: "delete", displayName: "Delete Olympiads", category: "Exam Management" },
  { module: "exam_management", page: "olympiads", action: "publish", displayName: "Publish Olympiads", category: "Exam Management" },
  
  { module: "exam_management", page: "questions", action: "view", displayName: "View Questions", category: "Exam Management" },
  { module: "exam_management", page: "questions", action: "create", displayName: "Create Questions", category: "Exam Management" },
  { module: "exam_management", page: "questions", action: "edit", displayName: "Edit Questions", category: "Exam Management" },
  { module: "exam_management", page: "questions", action: "delete", displayName: "Delete Questions", category: "Exam Management" },
  { module: "exam_management", page: "questions", action: "import", displayName: "Import Questions", category: "Exam Management" },
  { module: "exam_management", page: "questions", action: "export", displayName: "Export Questions", category: "Exam Management" },
  
  { module: "exam_management", page: "categories", action: "view", displayName: "View Categories", category: "Exam Management" },
  { module: "exam_management", page: "categories", action: "manage", displayName: "Manage Categories", category: "Exam Management" },
  
  { module: "exam_management", page: "ai_generation", action: "view", displayName: "View AI Question Generation", category: "Exam Management" },
  { module: "exam_management", page: "ai_generation", action: "create", displayName: "Generate AI Questions", category: "Exam Management" },

  // ========================
  // PROCTORING
  // ========================
  { module: "proctoring", page: "live_monitoring", action: "view", displayName: "View Live Proctoring", category: "Proctoring", requiresDataScope: true },
  { module: "proctoring", page: "live_monitoring", action: "manage", displayName: "Manage Live Sessions", category: "Proctoring" },
  { module: "proctoring", page: "violations", action: "view", displayName: "View Violations", category: "Proctoring" },
  { module: "proctoring", page: "violations", action: "manage", displayName: "Manage Violations", category: "Proctoring" },
  { module: "proctoring", page: "candidate_termination", action: "manage", displayName: "Terminate Candidates", category: "Proctoring" },
  { module: "proctoring", page: "ai_logs", action: "view", displayName: "View AI Proctoring Logs", category: "Proctoring" },
  { module: "proctoring", page: "settings", action: "view", displayName: "View Proctoring Settings", category: "Proctoring" },
  { module: "proctoring", page: "settings", action: "edit", displayName: "Edit Proctoring Settings", category: "Proctoring" },

  // ========================
  // RESULTS
  // ========================
  { module: "results", page: "results_list", action: "view", displayName: "View Results", category: "Results", requiresDataScope: true },
  { module: "results", page: "results_list", action: "export", displayName: "Export Results", category: "Results" },
  { module: "results", page: "publication", action: "view", displayName: "View Result Publications", category: "Results" },
  { module: "results", page: "publication", action: "publish", displayName: "Publish Results", category: "Results" },
  { module: "results", page: "re_exam", action: "approve", displayName: "Approve Re-Exams", category: "Results" },
  { module: "results", page: "certificates", action: "view", displayName: "View Certificates", category: "Results" },
  { module: "results", page: "certificates", action: "manage", displayName: "Manage Certificates", category: "Results" },

  // ========================
  // FINANCE
  // ========================
  { module: "finance", page: "payments", action: "view", displayName: "View Payments", category: "Finance" },
  { module: "finance", page: "payments", action: "manage", displayName: "Manage Payments", category: "Finance" },
  { module: "finance", page: "refunds", action: "view", displayName: "View Refunds", category: "Finance" },
  { module: "finance", page: "refunds", action: "approve", displayName: "Approve Refunds", category: "Finance" },
  { module: "finance", page: "refunds", action: "reject", displayName: "Reject Refunds", category: "Finance" },
  { module: "finance", page: "invoices", action: "view", displayName: "View Invoices", category: "Finance" },
  { module: "finance", page: "invoices", action: "create", displayName: "Create Invoices", category: "Finance" },
  { module: "finance", page: "invoices", action: "export", displayName: "Export Invoices", category: "Finance" },
  { module: "finance", page: "revenue_reports", action: "view", displayName: "View Revenue Reports", category: "Finance" },
  { module: "finance", page: "partner_payouts", action: "view", displayName: "View Partner Payouts", category: "Finance" },
  { module: "finance", page: "partner_payouts", action: "approve", displayName: "Approve Partner Payouts", category: "Finance" },
  { module: "finance", page: "tax_settings", action: "view", displayName: "View Tax Settings", category: "Finance" },
  { module: "finance", page: "tax_settings", action: "edit", displayName: "Edit Tax Settings", category: "Finance" },
  { module: "finance", page: "payment_gateways", action: "view", displayName: "View Payment Gateways", category: "Finance" },
  { module: "finance", page: "payment_gateways", action: "manage", displayName: "Manage Payment Gateways", category: "Finance" },

  // ========================
  // MARKETING
  // ========================
  { module: "marketing", page: "social_media", action: "view", displayName: "View Social Media", category: "Marketing" },
  { module: "marketing", page: "social_media", action: "manage", displayName: "Manage Social Media", category: "Marketing" },
  { module: "marketing", page: "email_campaigns", action: "view", displayName: "View Email Campaigns", category: "Marketing" },
  { module: "marketing", page: "email_campaigns", action: "create", displayName: "Create Email Campaigns", category: "Marketing" },
  { module: "marketing", page: "email_campaigns", action: "edit", displayName: "Edit Email Campaigns", category: "Marketing" },
  { module: "marketing", page: "email_campaigns", action: "delete", displayName: "Delete Email Campaigns", category: "Marketing" },
  { module: "marketing", page: "email_templates", action: "view", displayName: "View Email Templates", category: "Marketing" },
  { module: "marketing", page: "email_templates", action: "manage", displayName: "Manage Email Templates", category: "Marketing" },
  { module: "marketing", page: "segments", action: "view", displayName: "View Audience Segments", category: "Marketing" },
  { module: "marketing", page: "segments", action: "manage", displayName: "Manage Audience Segments", category: "Marketing" },
  { module: "marketing", page: "analytics", action: "view", displayName: "View Marketing Analytics", category: "Marketing" },
  { module: "marketing", page: "leads", action: "view", displayName: "View Leads", category: "Marketing" },
  { module: "marketing", page: "leads", action: "manage", displayName: "Manage Leads", category: "Marketing" },

  // ========================
  // CONTENT MANAGEMENT
  // ========================
  { module: "content", page: "cms", action: "view", displayName: "View CMS Pages", category: "Content Management" },
  { module: "content", page: "cms", action: "create", displayName: "Create CMS Pages", category: "Content Management" },
  { module: "content", page: "cms", action: "edit", displayName: "Edit CMS Pages", category: "Content Management" },
  { module: "content", page: "cms", action: "delete", displayName: "Delete CMS Pages", category: "Content Management" },
  { module: "content", page: "cms", action: "publish", displayName: "Publish CMS Pages", category: "Content Management" },
  
  { module: "content", page: "blog", action: "view", displayName: "View Blog Posts", category: "Content Management" },
  { module: "content", page: "blog", action: "create", displayName: "Create Blog Posts", category: "Content Management" },
  { module: "content", page: "blog", action: "edit", displayName: "Edit Blog Posts", category: "Content Management" },
  { module: "content", page: "blog", action: "delete", displayName: "Delete Blog Posts", category: "Content Management" },
  { module: "content", page: "blog", action: "publish", displayName: "Publish Blog Posts", category: "Content Management" },
  
  { module: "content", page: "media_library", action: "view", displayName: "View Media Library", category: "Content Management" },
  { module: "content", page: "media_library", action: "create", displayName: "Upload Media", category: "Content Management" },
  { module: "content", page: "media_library", action: "delete", displayName: "Delete Media", category: "Content Management" },
  
  { module: "content", page: "seo", action: "view", displayName: "View SEO Settings", category: "Content Management" },
  { module: "content", page: "seo", action: "edit", displayName: "Edit SEO Settings", category: "Content Management" },

  // ========================
  // AI CHATBOT
  // ========================
  { module: "ai_chatbot", page: "agents", action: "view", displayName: "View Chatbot Agents", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "agents", action: "create", displayName: "Create Chatbot Agents", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "agents", action: "edit", displayName: "Edit Chatbot Agents", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "agents", action: "delete", displayName: "Delete Chatbot Agents", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "knowledge_base", action: "view", displayName: "View Knowledge Base", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "knowledge_base", action: "manage", displayName: "Manage Knowledge Base", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "flows", action: "view", displayName: "View Conversation Flows", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "flows", action: "manage", displayName: "Manage Conversation Flows", category: "AI Chatbot" },
  { module: "ai_chatbot", page: "analytics", action: "view", displayName: "View Chatbot Analytics", category: "AI Chatbot" },

  // ========================
  // SUPPORT
  // ========================
  { module: "support", page: "live_chats", action: "view", displayName: "View Live Chats", category: "Support" },
  { module: "support", page: "live_chats", action: "manage", displayName: "Manage Live Chats", category: "Support" },
  { module: "support", page: "handover", action: "view", displayName: "View AI Handovers", category: "Support" },
  { module: "support", page: "handover", action: "manage", displayName: "Handle Escalations", category: "Support" },
  { module: "support", page: "tickets", action: "view", displayName: "View Tickets", category: "Support" },
  { module: "support", page: "tickets", action: "manage", displayName: "Manage Tickets", category: "Support" },
  { module: "support", page: "human_agents", action: "view", displayName: "View Support Agents", category: "Support" },
  { module: "support", page: "human_agents", action: "manage", displayName: "Manage Support Agents", category: "Support" },

  // ========================
  // USER MANAGEMENT
  // ========================
  { module: "users", page: "students", action: "view", displayName: "View Students", category: "User Management" },
  { module: "users", page: "students", action: "create", displayName: "Create Students", category: "User Management" },
  { module: "users", page: "students", action: "edit", displayName: "Edit Students", category: "User Management" },
  { module: "users", page: "students", action: "delete", displayName: "Delete Students", category: "User Management" },
  { module: "users", page: "students", action: "export", displayName: "Export Students", category: "User Management" },
  
  { module: "users", page: "supervisors", action: "view", displayName: "View Supervisors", category: "User Management" },
  { module: "users", page: "supervisors", action: "manage", displayName: "Manage Supervisors", category: "User Management" },
  
  { module: "users", page: "admins", action: "view", displayName: "View Admins", category: "User Management" },
  { module: "users", page: "admins", action: "manage", displayName: "Manage Admins", category: "User Management" },

  // ========================
  // PARTNERS
  // ========================
  { module: "partners", page: "applications", action: "view", displayName: "View Partner Applications", category: "Partners" },
  { module: "partners", page: "applications", action: "approve", displayName: "Approve Partner Applications", category: "Partners" },
  { module: "partners", page: "applications", action: "reject", displayName: "Reject Partner Applications", category: "Partners" },
  { module: "partners", page: "list", action: "view", displayName: "View Partners", category: "Partners", requiresDataScope: true },
  { module: "partners", page: "list", action: "edit", displayName: "Edit Partners", category: "Partners" },
  { module: "partners", page: "analytics", action: "view", displayName: "View Partner Analytics", category: "Partners" },
  { module: "partners", page: "settings", action: "view", displayName: "View Partner Settings", category: "Partners" },
  { module: "partners", page: "settings", action: "edit", displayName: "Edit Partner Settings", category: "Partners" },

  // ========================
  // SCHOOLS
  // ========================
  { module: "schools", page: "list", action: "view", displayName: "View Schools", category: "Schools", requiresDataScope: true },
  { module: "schools", page: "list", action: "create", displayName: "Create Schools", category: "Schools" },
  { module: "schools", page: "list", action: "edit", displayName: "Edit Schools", category: "Schools" },
  { module: "schools", page: "list", action: "delete", displayName: "Delete Schools", category: "Schools" },
  { module: "schools", page: "applications", action: "view", displayName: "View School Applications", category: "Schools" },
  { module: "schools", page: "applications", action: "approve", displayName: "Approve School Applications", category: "Schools" },

  // ========================
  // SETTINGS
  // ========================
  { module: "settings", page: "global", action: "view", displayName: "View Global Settings", category: "Platform Control" },
  { module: "settings", page: "global", action: "edit", displayName: "Edit Global Settings", category: "Platform Control" },
  { module: "settings", page: "pwa", action: "view", displayName: "View PWA Settings", category: "Platform Control" },
  { module: "settings", page: "pwa", action: "edit", displayName: "Edit PWA Settings", category: "Platform Control" },
  { module: "settings", page: "email_smtp", action: "view", displayName: "View Email Settings", category: "Platform Control" },
  { module: "settings", page: "email_smtp", action: "edit", displayName: "Edit Email Settings", category: "Platform Control" },
  { module: "settings", page: "sms", action: "view", displayName: "View SMS Settings", category: "Platform Control" },
  { module: "settings", page: "sms", action: "edit", displayName: "Edit SMS Settings", category: "Platform Control" },
  { module: "settings", page: "languages", action: "view", displayName: "View Languages", category: "Platform Control" },
  { module: "settings", page: "languages", action: "manage", displayName: "Manage Languages", category: "Platform Control" },

  // ========================
  // SYSTEM
  // ========================
  { module: "system", page: "roles", action: "view", displayName: "View Roles", category: "System" },
  { module: "system", page: "roles", action: "create", displayName: "Create Roles", category: "System" },
  { module: "system", page: "roles", action: "edit", displayName: "Edit Roles", category: "System" },
  { module: "system", page: "roles", action: "delete", displayName: "Delete Roles", category: "System" },
  { module: "system", page: "permissions", action: "view", displayName: "View Permissions", category: "System" },
  { module: "system", page: "permissions", action: "manage", displayName: "Manage Permissions", category: "System" },
  { module: "system", page: "user_roles", action: "view", displayName: "View User Roles", category: "System" },
  { module: "system", page: "user_roles", action: "assign", displayName: "Assign User Roles", category: "System" },
  { module: "system", page: "audit_logs", action: "view", displayName: "View Audit Logs", category: "System" },
  { module: "system", page: "database", action: "export", displayName: "Export Database", category: "System" },
  { module: "system", page: "database", action: "import", displayName: "Import Database", category: "System" },
  { module: "system", page: "impersonation", action: "manage", displayName: "Impersonate Roles", category: "System" },
];

interface RoleDef {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  isSystemRole: boolean;
  priority: number;
  permissionPatterns: string[];
}

const DEFAULT_ROLES: RoleDef[] = [
  {
    name: "Super Admin",
    slug: "super_admin",
    description: "Full access to all system features. God mode with no restrictions.",
    color: "#dc2626",
    icon: "Shield",
    isSystemRole: true,
    priority: 1000,
    permissionPatterns: ["*"],
  },
  {
    name: "Controller of Examination (COE)",
    slug: "coe",
    description: "Manages exams, proctoring, results, scheduling, termination, and re-exam approvals.",
    color: "#7c3aed",
    icon: "GraduationCap",
    isSystemRole: true,
    priority: 900,
    permissionPatterns: [
      "exam_management.*",
      "proctoring.*",
      "results.*",
      "dashboard.live_dashboard.view",
      "dashboard.analytics.view",
    ],
  },
  {
    name: "Proctoring Admin",
    slug: "proctoring_admin",
    description: "Live proctoring monitoring, violation reports, candidate termination, AI logs.",
    color: "#0891b2",
    icon: "Eye",
    isSystemRole: true,
    priority: 800,
    permissionPatterns: [
      "proctoring.*",
      "dashboard.live_dashboard.view",
    ],
  },
  {
    name: "Finance Department",
    slug: "finance",
    description: "Payments, refunds, invoices, revenue reports, partner payouts, tax settings.",
    color: "#16a34a",
    icon: "Wallet",
    isSystemRole: true,
    priority: 800,
    permissionPatterns: [
      "finance.*",
      "dashboard.analytics.view",
      "dashboard.reports.view",
      "dashboard.reports.export",
    ],
  },
  {
    name: "Marketing Manager",
    slug: "marketing_manager",
    description: "Social media, email marketing, campaign analytics, lead tracking.",
    color: "#ea580c",
    icon: "Megaphone",
    isSystemRole: true,
    priority: 700,
    permissionPatterns: [
      "marketing.*",
      "dashboard.analytics.view",
    ],
  },
  {
    name: "Content Manager",
    slug: "content_manager",
    description: "CMS pages, blog posts, media library, SEO content management.",
    color: "#ca8a04",
    icon: "FileText",
    isSystemRole: true,
    priority: 700,
    permissionPatterns: [
      "content.*",
    ],
  },
  {
    name: "Support Agent",
    slug: "support_agent",
    description: "AI chatbot handover, user support chats, ticket resolution.",
    color: "#0ea5e9",
    icon: "HeadphonesIcon",
    isSystemRole: true,
    priority: 600,
    permissionPatterns: [
      "support.*",
      "ai_chatbot.knowledge_base.view",
    ],
  },
  {
    name: "Analytics / MIS Team",
    slug: "analytics_mis",
    description: "Read-only access to analytics, reports, and dashboards.",
    color: "#6366f1",
    icon: "BarChart3",
    isSystemRole: true,
    priority: 500,
    permissionPatterns: [
      "dashboard.*.view",
      "dashboard.reports.export",
      "exam_management.olympiads.view",
      "results.results_list.view",
      "results.results_list.export",
      "finance.revenue_reports.view",
      "marketing.analytics.view",
    ],
  },
];

function generatePermissionKey(p: PermissionDef): string {
  return [p.module, p.page, p.action].filter(Boolean).join(".");
}

function matchesPattern(permissionKey: string, pattern: string): boolean {
  if (pattern === "*") return true;
  
  const patternParts = pattern.split(".");
  const keyParts = permissionKey.split(".");
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "*") {
      if (i === patternParts.length - 1) return true;
      continue;
    }
    if (patternParts[i] !== keyParts[i]) return false;
  }
  
  return patternParts.length <= keyParts.length;
}

export async function seedRBAC() {
  console.log("[RBAC Seed] Starting RBAC seeding...");
  
  const existingPermissions = await db.select().from(systemPermissions);
  if (existingPermissions.length > 0) {
    console.log(`[RBAC Seed] Found ${existingPermissions.length} existing permissions. Skipping seed.`);
    return { permissions: existingPermissions.length, roles: 0 };
  }
  
  console.log("[RBAC Seed] Inserting permissions...");
  const insertedPermissions = [];
  for (let i = 0; i < PERMISSIONS.length; i++) {
    const p = PERMISSIONS[i];
    const permissionKey = generatePermissionKey(p);
    const [inserted] = await db.insert(systemPermissions).values({
      module: p.module,
      page: p.page || null,
      action: p.action,
      permissionKey,
      displayName: p.displayName,
      description: p.description || null,
      category: p.category,
      sortOrder: i,
      isSystemPermission: true,
      requiresDataScope: p.requiresDataScope || false,
    }).returning();
    insertedPermissions.push(inserted);
  }
  console.log(`[RBAC Seed] Inserted ${insertedPermissions.length} permissions`);
  
  console.log("[RBAC Seed] Inserting default roles...");
  for (const roleDef of DEFAULT_ROLES) {
    const existingRole = await db.select().from(systemRoles).where(eq(systemRoles.slug, roleDef.slug)).limit(1);
    if (existingRole.length > 0) {
      console.log(`[RBAC Seed] Role "${roleDef.name}" already exists. Skipping.`);
      continue;
    }
    
    const [role] = await db.insert(systemRoles).values({
      name: roleDef.name,
      slug: roleDef.slug,
      description: roleDef.description,
      color: roleDef.color,
      icon: roleDef.icon,
      isSystemRole: roleDef.isSystemRole,
      priority: roleDef.priority,
      isActive: true,
    }).returning();
    
    const matchingPermissions = insertedPermissions.filter(p => 
      roleDef.permissionPatterns.some(pattern => matchesPattern(p.permissionKey, pattern))
    );
    
    for (const permission of matchingPermissions) {
      await db.insert(rolePermissions).values({
        roleId: role.id,
        permissionId: permission.id,
        dataScope: "all",
      });
    }
    
    console.log(`[RBAC Seed] Created role "${roleDef.name}" with ${matchingPermissions.length} permissions`);
  }
  
  console.log("[RBAC Seed] Inserting role templates...");
  const templates = [
    {
      name: "Read-Only Viewer",
      description: "View-only access across all modules",
      permissionKeys: PERMISSIONS.filter(p => p.action === "view").map(generatePermissionKey),
    },
    {
      name: "Content Editor",
      description: "Full content management capabilities",
      permissionKeys: PERMISSIONS.filter(p => p.module === "content").map(generatePermissionKey),
    },
    {
      name: "Exam Coordinator",
      description: "Exam management without administrative controls",
      permissionKeys: PERMISSIONS.filter(p => 
        p.module === "exam_management" && ["view", "edit"].includes(p.action)
      ).map(generatePermissionKey),
    },
  ];
  
  for (const template of templates) {
    const existing = await db.select().from(roleTemplates).where(eq(roleTemplates.name, template.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(roleTemplates).values({
        name: template.name,
        description: template.description,
        permissionKeys: template.permissionKeys,
        isActive: true,
      });
    }
  }
  
  console.log("[RBAC Seed] RBAC seeding completed!");
  return { permissions: insertedPermissions.length, roles: DEFAULT_ROLES.length };
}
