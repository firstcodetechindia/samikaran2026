import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { 
  systemRoles, systemPermissions, rolePermissions, userRoles, 
  permissionAuditLogs, roleTemplates, superAdmins
} from "@workspace/db";
import { eq, and, or, inArray, sql, desc, asc } from "drizzle-orm";

interface PermissionCheckResult {
  hasPermission: boolean;
  dataScope?: string;
  dataScopeValues?: unknown;
}

export class RBACService {
  private permissionCache: Map<string, { permissions: string[]; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async getUserPermissions(userId?: string, superAdminId?: number): Promise<string[]> {
    const cacheKey = userId ? `user:${userId}` : `admin:${superAdminId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.permissions;
    }
    
    const userRoleRecords = await db.select({
      roleId: userRoles.roleId,
      isActive: userRoles.isActive,
    })
    .from(userRoles)
    .where(
      and(
        userId ? eq(userRoles.userId, userId) : eq(userRoles.superAdminId, superAdminId!),
        eq(userRoles.isActive, true),
        or(
          sql`${userRoles.expiresAt} IS NULL`,
          sql`${userRoles.expiresAt} > NOW()`
        )
      )
    );
    
    if (userRoleRecords.length === 0) {
      if (superAdminId) {
        const admin = await db.select().from(superAdmins).where(eq(superAdmins.id, superAdminId)).limit(1);
        if (admin.length > 0 && admin[0].role === "super_admin") {
          return ["*"];
        }
      }
      return [];
    }
    
    const roleIds = userRoleRecords.map(r => r.roleId);
    
    const activeRoles = await db.select()
      .from(systemRoles)
      .where(and(
        inArray(systemRoles.id, roleIds),
        eq(systemRoles.isActive, true)
      ));
    
    const superAdminRole = activeRoles.find(r => r.slug === "super_admin");
    if (superAdminRole) {
      return ["*"];
    }
    
    const permissions = await db.select({
      permissionKey: systemPermissions.permissionKey,
      dataScope: rolePermissions.dataScope,
      dataScopeValues: rolePermissions.dataScopeValues,
    })
    .from(rolePermissions)
    .innerJoin(systemPermissions, eq(rolePermissions.permissionId, systemPermissions.id))
    .where(inArray(rolePermissions.roleId, activeRoles.map(r => r.id)));
    
    const permissionKeys = Array.from(new Set(permissions.map(p => p.permissionKey)));
    
    this.permissionCache.set(cacheKey, {
      permissions: permissionKeys,
      expiry: Date.now() + this.CACHE_TTL,
    });
    
    return permissionKeys;
  }

  async checkPermission(
    permissionKey: string,
    userId?: string,
    superAdminId?: number
  ): Promise<PermissionCheckResult> {
    const permissions = await this.getUserPermissions(userId, superAdminId);
    
    if (permissions.includes("*")) {
      return { hasPermission: true, dataScope: "all" };
    }
    
    const hasExact = permissions.includes(permissionKey);
    if (hasExact) {
      return { hasPermission: true };
    }
    
    const parts = permissionKey.split(".");
    for (let i = parts.length - 1; i >= 0; i--) {
      const wildcardKey = [...parts.slice(0, i), "*"].join(".");
      if (permissions.includes(wildcardKey)) {
        return { hasPermission: true };
      }
    }
    
    return { hasPermission: false };
  }

  invalidateCache(userId?: string, superAdminId?: number) {
    const cacheKey = userId ? `user:${userId}` : `admin:${superAdminId}`;
    this.permissionCache.delete(cacheKey);
  }

  invalidateAllCache() {
    this.permissionCache.clear();
  }
}

export const rbacService = new RBACService();

export function requirePermission(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const superAdminId = (req.session as any)?.superAdminId;
      const userId = (req.user as any)?.id;
      
      if (!superAdminId && !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await rbacService.checkPermission(permissionKey, userId, superAdminId);
      
      if (!result.hasPermission) {
        return res.status(403).json({ 
          message: "Access denied",
          requiredPermission: permissionKey 
        });
      }
      
      (req as any).permissionContext = result;
      next();
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const superAdminId = (req.session as any)?.superAdminId;
      const userId = (req.user as any)?.id;
      
      if (!superAdminId && !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      for (const key of permissionKeys) {
        const result = await rbacService.checkPermission(key, userId, superAdminId);
        if (result.hasPermission) {
          (req as any).permissionContext = result;
          return next();
        }
      }
      
      return res.status(403).json({ 
        message: "Access denied",
        requiredPermissions: permissionKeys 
      });
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

async function requireSuperAdminForRBAC(req: Request, res: Response, next: NextFunction) {
  const superAdminId = (req.session as any)?.superAdminId;
  if (!superAdminId) {
    return res.status(401).json({ message: "Super Admin access required" });
  }
  
  const admin = await db.select().from(superAdmins).where(eq(superAdmins.id, superAdminId)).limit(1);
  if (admin.length === 0) {
    return res.status(401).json({ message: "Invalid admin session" });
  }
  
  (req as any).superAdmin = admin[0];
  next();
}

async function logAudit(
  entityType: string,
  entityId: number,
  action: string,
  performedBy: number,
  performedByEmail: string,
  previousValue?: unknown,
  newValue?: unknown,
  changedFields?: string[],
  reason?: string,
  req?: Request
) {
  await db.insert(permissionAuditLogs).values({
    entityType,
    entityId,
    action,
    previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
    newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    changedFields: changedFields || null,
    performedBy,
    performedByEmail,
    reason: reason || null,
    ipAddress: req?.ip || null,
    userAgent: req?.headers["user-agent"] || null,
  });
}

export function registerRBACRoutes(app: Express) {
  
  app.get("/api/rbac/permissions", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const permissions = await db.select().from(systemPermissions).orderBy(asc(systemPermissions.category), asc(systemPermissions.sortOrder));
      
      const grouped = permissions.reduce((acc, p) => {
        const category = p.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
      }, {} as Record<string, typeof permissions>);
      
      res.json({ permissions, grouped });
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/rbac/roles", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const roles = await db.select().from(systemRoles).orderBy(desc(systemRoles.priority));
      
      const rolesWithCounts = await Promise.all(roles.map(async (role) => {
        const [permCount] = await db.select({ count: sql<number>`count(*)` })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
        
        const [userCount] = await db.select({ count: sql<number>`count(*)` })
          .from(userRoles)
          .where(and(eq(userRoles.roleId, role.id), eq(userRoles.isActive, true)));
        
        return {
          ...role,
          permissionCount: Number(permCount?.count || 0),
          userCount: Number(userCount?.count || 0),
        };
      }));
      
      res.json(rolesWithCounts);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/rbac/roles/:id", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const [role] = await db.select().from(systemRoles).where(eq(systemRoles.id, roleId)).limit(1);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const permissions = await db.select({
        id: rolePermissions.id,
        permissionId: rolePermissions.permissionId,
        permissionKey: systemPermissions.permissionKey,
        displayName: systemPermissions.displayName,
        module: systemPermissions.module,
        page: systemPermissions.page,
        action: systemPermissions.action,
        category: systemPermissions.category,
        dataScope: rolePermissions.dataScope,
        dataScopeValues: rolePermissions.dataScopeValues,
      })
      .from(rolePermissions)
      .innerJoin(systemPermissions, eq(rolePermissions.permissionId, systemPermissions.id))
      .where(eq(rolePermissions.roleId, roleId));
      
      res.json({ role, permissions });
    } catch (err) {
      console.error("Failed to fetch role:", err);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/rbac/roles", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const { name, slug, description, color, icon, priority, permissionIds } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }
      
      const existing = await db.select().from(systemRoles).where(
        or(eq(systemRoles.name, name), eq(systemRoles.slug, slug))
      ).limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "Role with this name or slug already exists" });
      }
      
      const [role] = await db.insert(systemRoles).values({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        description: description || null,
        color: color || "#6366f1",
        icon: icon || "Shield",
        priority: priority || 100,
        isSystemRole: false,
        isActive: true,
        createdBy: admin.id,
      }).returning();
      
      if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
        for (const permId of permissionIds) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: permId,
            grantedBy: admin.id,
          });
        }
      }
      
      await logAudit("role", role.id, "create", admin.id, admin.email, null, role, undefined, undefined, req);
      
      rbacService.invalidateAllCache();
      
      res.status(201).json(role);
    } catch (err) {
      console.error("Failed to create role:", err);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/rbac/roles/:id", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const roleId = parseInt(req.params.id);
      const { name, description, color, icon, priority, isActive, permissionIds } = req.body;
      
      const [existingRole] = await db.select().from(systemRoles).where(eq(systemRoles.id, roleId)).limit(1);
      
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      const changedFields: string[] = [];
      
      if (name !== undefined && name !== existingRole.name) {
        updateData.name = name;
        changedFields.push("name");
      }
      if (description !== undefined && description !== existingRole.description) {
        updateData.description = description;
        changedFields.push("description");
      }
      if (color !== undefined && color !== existingRole.color) {
        updateData.color = color;
        changedFields.push("color");
      }
      if (icon !== undefined && icon !== existingRole.icon) {
        updateData.icon = icon;
        changedFields.push("icon");
      }
      if (priority !== undefined && priority !== existingRole.priority) {
        updateData.priority = priority;
        changedFields.push("priority");
      }
      if (isActive !== undefined && isActive !== existingRole.isActive) {
        updateData.isActive = isActive;
        changedFields.push("isActive");
      }
      
      const [updatedRole] = await db.update(systemRoles)
        .set(updateData)
        .where(eq(systemRoles.id, roleId))
        .returning();
      
      if (permissionIds !== undefined && Array.isArray(permissionIds)) {
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
        
        for (const permId of permissionIds) {
          await db.insert(rolePermissions).values({
            roleId: roleId,
            permissionId: permId,
            grantedBy: admin.id,
          });
        }
        changedFields.push("permissions");
      }
      
      await logAudit("role", roleId, "update", admin.id, admin.email, existingRole, updatedRole, changedFields, undefined, req);
      
      rbacService.invalidateAllCache();
      
      res.json(updatedRole);
    } catch (err) {
      console.error("Failed to update role:", err);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.post("/api/rbac/roles/:id/clone", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const roleId = parseInt(req.params.id);
      const { newName, newSlug } = req.body;
      
      const [sourceRole] = await db.select().from(systemRoles).where(eq(systemRoles.id, roleId)).limit(1);
      
      if (!sourceRole) {
        return res.status(404).json({ message: "Source role not found" });
      }
      
      const [newRole] = await db.insert(systemRoles).values({
        name: newName || `${sourceRole.name} (Copy)`,
        slug: newSlug || `${sourceRole.slug}_copy_${Date.now()}`,
        description: sourceRole.description,
        color: sourceRole.color,
        icon: sourceRole.icon,
        priority: sourceRole.priority,
        isSystemRole: false,
        isActive: true,
        createdBy: admin.id,
      }).returning();
      
      const sourcePermissions = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      for (const perm of sourcePermissions) {
        await db.insert(rolePermissions).values({
          roleId: newRole.id,
          permissionId: perm.permissionId,
          dataScope: perm.dataScope,
          dataScopeValues: perm.dataScopeValues,
          grantedBy: admin.id,
        });
      }
      
      await logAudit("role", newRole.id, "clone", admin.id, admin.email, { sourceRoleId: roleId }, newRole, undefined, `Cloned from role ${sourceRole.name}`, req);
      
      res.status(201).json(newRole);
    } catch (err) {
      console.error("Failed to clone role:", err);
      res.status(500).json({ message: "Failed to clone role" });
    }
  });

  app.delete("/api/rbac/roles/:id", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const roleId = parseInt(req.params.id);
      
      const [role] = await db.select().from(systemRoles).where(eq(systemRoles.id, roleId)).limit(1);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      if (role.isSystemRole) {
        return res.status(400).json({ message: "Cannot delete system roles. Disable instead." });
      }
      
      await db.delete(systemRoles).where(eq(systemRoles.id, roleId));
      
      await logAudit("role", roleId, "delete", admin.id, admin.email, role, null, undefined, undefined, req);
      
      rbacService.invalidateAllCache();
      
      res.json({ message: "Role deleted successfully" });
    } catch (err) {
      console.error("Failed to delete role:", err);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  app.get("/api/rbac/user-roles/:userId", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      
      let query = db.select({
        id: userRoles.id,
        roleId: userRoles.roleId,
        roleName: systemRoles.name,
        roleSlug: systemRoles.slug,
        roleColor: systemRoles.color,
        roleIcon: systemRoles.icon,
        isActive: userRoles.isActive,
        isPrimary: userRoles.isPrimary,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        notes: userRoles.notes,
      })
      .from(userRoles)
      .innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id));
      
      if (type === "admin") {
        query = query.where(eq(userRoles.superAdminId, parseInt(userId))) as any;
      } else {
        query = query.where(eq(userRoles.userId, userId)) as any;
      }
      
      const roles = await query;
      res.json(roles);
    } catch (err) {
      console.error("Failed to fetch user roles:", err);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.post("/api/rbac/user-roles", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const { userId, superAdminId, roleId, isPrimary, expiresAt, notes } = req.body;
      
      if (!roleId || (!userId && !superAdminId)) {
        return res.status(400).json({ message: "Role ID and user/admin ID are required" });
      }
      
      const [role] = await db.select().from(systemRoles).where(eq(systemRoles.id, roleId)).limit(1);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const existing = await db.select().from(userRoles).where(
        and(
          userId ? eq(userRoles.userId, userId) : eq(userRoles.superAdminId, superAdminId),
          eq(userRoles.roleId, roleId)
        )
      ).limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "User already has this role" });
      }
      
      const [assignment] = await db.insert(userRoles).values({
        userId: userId || null,
        superAdminId: superAdminId || null,
        roleId,
        isActive: true,
        isPrimary: isPrimary || false,
        assignedBy: admin.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
      }).returning();
      
      await logAudit("user_role", assignment.id, "assign", admin.id, admin.email, null, { userId, superAdminId, roleId, roleName: role.name }, undefined, undefined, req);
      
      rbacService.invalidateCache(userId, superAdminId);
      
      res.status(201).json(assignment);
    } catch (err) {
      console.error("Failed to assign role:", err);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  app.put("/api/rbac/user-roles/:id", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const assignmentId = parseInt(req.params.id);
      const { isActive, isPrimary, expiresAt, notes } = req.body;
      
      const [existing] = await db.select().from(userRoles).where(eq(userRoles.id, assignmentId)).limit(1);
      
      if (!existing) {
        return res.status(404).json({ message: "Role assignment not found" });
      }
      
      const updateData: Record<string, unknown> = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (notes !== undefined) updateData.notes = notes;
      
      const [updated] = await db.update(userRoles)
        .set(updateData)
        .where(eq(userRoles.id, assignmentId))
        .returning();
      
      await logAudit("user_role", assignmentId, "update", admin.id, admin.email, existing, updated, Object.keys(updateData), undefined, req);
      
      rbacService.invalidateCache(existing.userId || undefined, existing.superAdminId || undefined);
      
      res.json(updated);
    } catch (err) {
      console.error("Failed to update role assignment:", err);
      res.status(500).json({ message: "Failed to update role assignment" });
    }
  });

  app.delete("/api/rbac/user-roles/:id", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const admin = (req as any).superAdmin;
      const assignmentId = parseInt(req.params.id);
      
      const [existing] = await db.select().from(userRoles).where(eq(userRoles.id, assignmentId)).limit(1);
      
      if (!existing) {
        return res.status(404).json({ message: "Role assignment not found" });
      }
      
      await db.delete(userRoles).where(eq(userRoles.id, assignmentId));
      
      await logAudit("user_role", assignmentId, "revoke", admin.id, admin.email, existing, null, undefined, undefined, req);
      
      rbacService.invalidateCache(existing.userId || undefined, existing.superAdminId || undefined);
      
      res.json({ message: "Role revoked successfully" });
    } catch (err) {
      console.error("Failed to revoke role:", err);
      res.status(500).json({ message: "Failed to revoke role" });
    }
  });

  app.get("/api/rbac/my-permissions", async (req, res) => {
    try {
      const superAdminId = (req.session as any)?.superAdminId;
      const userId = (req.user as any)?.id;
      
      if (!superAdminId && !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const permissions = await rbacService.getUserPermissions(userId, superAdminId);
      
      const userRoleRecords = await db.select({
        roleName: systemRoles.name,
        roleSlug: systemRoles.slug,
        roleColor: systemRoles.color,
        roleIcon: systemRoles.icon,
        isPrimary: userRoles.isPrimary,
      })
      .from(userRoles)
      .innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id))
      .where(
        and(
          userId ? eq(userRoles.userId, userId) : eq(userRoles.superAdminId, superAdminId!),
          eq(userRoles.isActive, true)
        )
      );
      
      res.json({
        permissions,
        roles: userRoleRecords,
        isSuperAdmin: permissions.includes("*"),
      });
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/rbac/check-permission/:permissionKey", async (req, res) => {
    try {
      const superAdminId = (req.session as any)?.superAdminId;
      const userId = (req.user as any)?.id;
      
      if (!superAdminId && !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await rbacService.checkPermission(req.params.permissionKey, userId, superAdminId);
      res.json(result);
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ message: "Permission check failed" });
    }
  });

  app.get("/api/rbac/templates", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const templates = await db.select().from(roleTemplates).where(eq(roleTemplates.isActive, true));
      res.json(templates);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/rbac/audit-logs", requireSuperAdminForRBAC, async (req, res) => {
    try {
      const { entityType, entityId, limit = 100, offset = 0 } = req.query;
      
      let query = db.select().from(permissionAuditLogs);
      
      if (entityType) {
        query = query.where(eq(permissionAuditLogs.entityType, entityType as string)) as any;
      }
      if (entityId) {
        query = query.where(eq(permissionAuditLogs.entityId, parseInt(entityId as string))) as any;
      }
      
      const logs = await query
        .orderBy(desc(permissionAuditLogs.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(logs);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/rbac/sidebar-config", async (req, res) => {
    try {
      const superAdminId = (req.session as any)?.superAdminId;
      const userId = (req.user as any)?.id;
      
      if (!superAdminId && !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const permissions = await rbacService.getUserPermissions(userId, superAdminId);
      const isSuperAdmin = permissions.includes("*");
      
      const checkPerm = (key: string) => isSuperAdmin || permissions.some(p => 
        p === key || p.startsWith(key.split(".").slice(0, 2).join("."))
      );
      
      const sidebarConfig = {
        dashboard: {
          visible: checkPerm("dashboard.live_dashboard.view") || checkPerm("dashboard.analytics.view"),
          items: {
            liveDashboard: checkPerm("dashboard.live_dashboard.view"),
            analytics: checkPerm("dashboard.analytics.view"),
            systemHealth: checkPerm("dashboard.system_health.view"),
            reports: checkPerm("dashboard.reports.view"),
          }
        },
        examManagement: {
          visible: checkPerm("exam_management.olympiads.view"),
          items: {
            olympiads: checkPerm("exam_management.olympiads.view"),
            questions: checkPerm("exam_management.questions.view"),
            categories: checkPerm("exam_management.categories.view"),
            aiGeneration: checkPerm("exam_management.ai_generation.view"),
          }
        },
        proctoring: {
          visible: checkPerm("proctoring.live_monitoring.view"),
          items: {
            liveMonitoring: checkPerm("proctoring.live_monitoring.view"),
            violations: checkPerm("proctoring.violations.view"),
            aiLogs: checkPerm("proctoring.ai_logs.view"),
            settings: checkPerm("proctoring.settings.view"),
          }
        },
        results: {
          visible: checkPerm("results.results_list.view"),
          items: {
            resultsList: checkPerm("results.results_list.view"),
            publication: checkPerm("results.publication.view"),
            certificates: checkPerm("results.certificates.view"),
          }
        },
        finance: {
          visible: checkPerm("finance.payments.view"),
          items: {
            payments: checkPerm("finance.payments.view"),
            refunds: checkPerm("finance.refunds.view"),
            invoices: checkPerm("finance.invoices.view"),
            revenueReports: checkPerm("finance.revenue_reports.view"),
            partnerPayouts: checkPerm("finance.partner_payouts.view"),
            taxSettings: checkPerm("finance.tax_settings.view"),
          }
        },
        marketing: {
          visible: checkPerm("marketing.social_media.view") || checkPerm("marketing.email_campaigns.view"),
          items: {
            socialMedia: checkPerm("marketing.social_media.view"),
            emailCampaigns: checkPerm("marketing.email_campaigns.view"),
            segments: checkPerm("marketing.segments.view"),
            analytics: checkPerm("marketing.analytics.view"),
          }
        },
        content: {
          visible: checkPerm("content.cms.view") || checkPerm("content.blog.view"),
          items: {
            cms: checkPerm("content.cms.view"),
            blog: checkPerm("content.blog.view"),
            mediaLibrary: checkPerm("content.media_library.view"),
            seo: checkPerm("content.seo.view"),
          }
        },
        aiChatbot: {
          visible: checkPerm("ai_chatbot.agents.view"),
          items: {
            agents: checkPerm("ai_chatbot.agents.view"),
            knowledgeBase: checkPerm("ai_chatbot.knowledge_base.view"),
            flows: checkPerm("ai_chatbot.flows.view"),
            analytics: checkPerm("ai_chatbot.analytics.view"),
          }
        },
        support: {
          visible: checkPerm("support.live_chats.view"),
          items: {
            liveChats: checkPerm("support.live_chats.view"),
            handover: checkPerm("support.handover.view"),
            tickets: checkPerm("support.tickets.view"),
            humanAgents: checkPerm("support.human_agents.view"),
          }
        },
        users: {
          visible: checkPerm("users.students.view"),
          items: {
            students: checkPerm("users.students.view"),
            supervisors: checkPerm("users.supervisors.view"),
            admins: checkPerm("users.admins.view"),
          }
        },
        partners: {
          visible: checkPerm("partners.list.view"),
          items: {
            applications: checkPerm("partners.applications.view"),
            list: checkPerm("partners.list.view"),
            analytics: checkPerm("partners.analytics.view"),
            settings: checkPerm("partners.settings.view"),
          }
        },
        schools: {
          visible: checkPerm("schools.list.view"),
          items: {
            list: checkPerm("schools.list.view"),
            applications: checkPerm("schools.applications.view"),
          }
        },
        settings: {
          visible: checkPerm("settings.global.view"),
          items: {
            global: checkPerm("settings.global.view"),
            pwa: checkPerm("settings.pwa.view"),
            emailSmtp: checkPerm("settings.email_smtp.view"),
            sms: checkPerm("settings.sms.view"),
            languages: checkPerm("settings.languages.view"),
          }
        },
        system: {
          visible: checkPerm("system.roles.view"),
          items: {
            roles: checkPerm("system.roles.view"),
            permissions: checkPerm("system.permissions.view"),
            userRoles: checkPerm("system.user_roles.view"),
            auditLogs: checkPerm("system.audit_logs.view"),
            database: checkPerm("system.database.export"),
          }
        },
        isSuperAdmin,
      };
      
      res.json(sidebarConfig);
    } catch (err) {
      console.error("Failed to generate sidebar config:", err);
      res.status(500).json({ message: "Failed to generate sidebar config" });
    }
  });
  
  console.log("[RBAC] Routes registered successfully");
}
