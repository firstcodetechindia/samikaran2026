import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Key, Clock, Plus, Edit, Trash2, Copy, Search,
  ChevronDown, ChevronRight, CheckCircle, XCircle, Eye, History,
  UserCheck, AlertTriangle, RefreshCw, Filter, Download, LayoutDashboard,
  BookOpen, Award, IndianRupee, Megaphone, FileText, Bot, Headphones,
  Handshake, School, Settings, Wrench, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Permission {
  id: number;
  permissionKey: string;
  name: string;
  description: string;
  module: string;
  category: string;
}

interface RolePermission {
  permissionId: number;
  permissionKey: string;
  dataScope: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isSystemRole: boolean;
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  permissions?: RolePermission[];
}

interface UserRole {
  id: number;
  userId: number | null;
  superAdminId: number | null;
  roleId: number;
  isActive: boolean;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  role?: Role;
  user?: { id: number; email: string; fullName: string };
  superAdmin?: { id: number; email: string; fullName: string };
}

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: number;
  performedByEmail: string;
  oldValue: any;
  newValue: any;
  changedFields: string[] | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

import type { LucideIcon } from "lucide-react";

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  exam_management: BookOpen,
  proctoring: Shield,
  results: Award,
  finance: IndianRupee,
  marketing: Megaphone,
  content: FileText,
  ai_chatbot: Bot,
  support: Headphones,
  users: Users,
  partners: Handshake,
  schools: School,
  settings: Settings,
  system: Wrench,
};

interface PermissionsResponse {
  permissions: Permission[];
  grouped: Record<string, Permission[]>;
}

export default function RBACManagementTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloneNewName, setCloneNewName] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    slug: "",
    description: "",
    priority: 500,
    isEnabled: true,
  });

  const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useQuery<PermissionsResponse>({
    queryKey: ["/api/rbac/permissions"],
  });
  const permissions = permissionsData?.permissions || [];

  const { data: roles = [], isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useQuery<Role[]>({
    queryKey: ["/api/rbac/roles"],
  });

  const { data: userRoles = [], isLoading: userRolesLoading, error: userRolesError, refetch: refetchUserRoles } = useQuery<UserRole[]>({
    queryKey: ["/api/rbac/user-roles"],
  });

  const { data: auditLogs = [], isLoading: auditLoading, error: auditError, refetch: refetchAuditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/rbac/audit-logs"],
  });

  const getModuleIcon = (module: string) => {
    const IconComponent = MODULE_ICONS[module] || FolderOpen;
    return <IconComponent className="w-5 h-5 text-muted-foreground" />;
  };

  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/rbac/roles", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      setIsRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create role", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/rbac/roles/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      setIsRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update role", variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/rbac/roles/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete role", variant: "destructive" });
    },
  });

  const cloneRoleMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: number; newName: string }) => {
      return apiRequest("POST", `/api/rbac/roles/${id}/clone`, { newName });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role cloned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      setIsCloneDialogOpen(false);
      setCloneNewName("");
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to clone role", variant: "destructive" });
    },
  });

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      slug: "",
      description: "",
      priority: 500,
      isEnabled: true,
    });
    setSelectedPermissions(new Set());
    setSelectedRole(null);
  };

  const openCreateRoleDialog = () => {
    resetRoleForm();
    setIsRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      priority: role.priority,
      isEnabled: role.isEnabled,
    });
    const permIds = new Set(role.permissions?.map(p => p.permissionId) || []);
    setSelectedPermissions(permIds);
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    const permissionIds = Array.from(selectedPermissions);
    const data = {
      ...roleFormData,
      permissionIds,
    };

    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const togglePermission = (permId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permId)) {
      newSelected.delete(permId);
    } else {
      newSelected.add(permId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleModulePermissions = (module: string, perms: Permission[]) => {
    const modulePermIds = perms.map(p => p.id);
    const allSelected = modulePermIds.every(id => selectedPermissions.has(id));
    const newSelected = new Set(selectedPermissions);
    
    if (allSelected) {
      modulePermIds.forEach(id => newSelected.delete(id));
    } else {
      modulePermIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
  };

  const groupPermissionsByModule = (perms: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    perms.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });
    return grouped;
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performedByEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedPermissions = groupPermissionsByModule(permissions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-rbac-title">
            <Shield className="w-6 h-6 text-purple-500" />
            Role-Based Access Control
          </h2>
          <p className="text-muted-foreground">Manage roles, permissions, and user access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchRoles()} data-testid="button-refresh-rbac">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roles.length}</p>
                <p className="text-sm text-muted-foreground">Total Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{permissions.length}</p>
                <p className="text-sm text-muted-foreground">Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userRoles.filter(ur => ur.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <History className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
                <p className="text-sm text-muted-foreground">Audit Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2" data-testid="tab-roles">
            <Shield className="w-4 h-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2" data-testid="tab-permissions">
            <Key className="w-4 h-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2" data-testid="tab-assignments">
            <Users className="w-4 h-4" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2" data-testid="tab-audit">
            <History className="w-4 h-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-roles"
              />
            </div>
            <Button onClick={openCreateRoleDialog} data-testid="button-create-role">
              <Plus className="w-4 h-4 mr-2" /> Create Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : rolesError ? (
            <Card className="border-destructive">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="text-destructive font-medium">Failed to load roles</p>
                <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchRoles()}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRoles.map((role) => (
                <Card key={role.id} className={`transition-all ${!role.isEnabled ? "opacity-60" : ""}`} data-testid={`card-role-${role.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${role.isSystemRole ? "bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                          <Shield className={`w-5 h-5 ${role.isSystemRole ? "text-purple-600" : "text-gray-600"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {role.name}
                            {role.isSystemRole && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                            {!role.isEnabled && (
                              <Badge variant="outline" className="text-xs text-amber-600">Disabled</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {role.description || `Priority: ${role.priority}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {role.slug}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {role.permissions?.length || 0} permissions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.slice(0, 5).map((perm) => (
                          <Badge key={perm.permissionId} variant="outline" className="text-xs">
                            {perm.permissionKey.split(".")[0]}
                          </Badge>
                        ))}
                        {(role.permissions?.length || 0) > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{(role.permissions?.length || 0) - 5} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setCloneNewName(`${role.name} (Copy)`);
                            setIsCloneDialogOpen(true);
                          }}
                          data-testid={`button-clone-role-${role.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRoleDialog(role)}
                          data-testid={`button-edit-role-${role.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setRoleToDelete(role);
                              setIsDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-role-${role.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-permissions"
            />
          </div>

          {permissionsLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : permissionsError ? (
            <Card className="border-destructive">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="text-destructive font-medium">Failed to load permissions</p>
                <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([module, perms]) => {
                const filteredPerms = perms.filter(p =>
                  (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.permissionKey || "").toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filteredPerms.length === 0 && searchQuery) return null;
                
                return (
                  <Collapsible key={module} open={expandedModules.has(module)} onOpenChange={() => toggleModule(module)}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover-elevate" data-testid={`card-module-${module}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {getModuleIcon(module)}
                              <div>
                                <CardTitle className="text-base capitalize">
                                  {module.replace(/_/g, " ")}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  {perms.length} permissions
                                </CardDescription>
                              </div>
                            </div>
                            {expandedModules.has(module) ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Permission Key</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(searchQuery ? filteredPerms : perms).map((perm) => (
                                <TableRow key={perm.id}>
                                  <TableCell className="font-mono text-xs">{perm.permissionKey}</TableCell>
                                  <TableCell>{perm.name}</TableCell>
                                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                    {perm.description}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{perm.category}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>View and manage role assignments for users and admins</CardDescription>
            </CardHeader>
            <CardContent>
              {userRolesLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : userRoles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No role assignments found</p>
                  <p className="text-sm">Assign roles to users from the Users section</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Assigned On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((ur) => (
                      <TableRow key={ur.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                              {(ur.user?.fullName || ur.superAdmin?.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{ur.user?.fullName || ur.superAdmin?.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {ur.userId ? "User" : "Admin"} #{ur.userId || ur.superAdminId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ur.role?.name || `Role #${ur.roleId}`}</Badge>
                        </TableCell>
                        <TableCell>
                          {ur.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {ur.expiresAt ? (
                            <span className="text-sm">{format(new Date(ur.expiresAt), "MMM d, yyyy")}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ur.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-audit"
              />
            </div>
            <Button variant="outline" onClick={() => refetchAuditLogs()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {auditLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : auditError ? (
                <div className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium">Failed to load audit logs</p>
                  <Button variant="outline" className="mt-4" onClick={() => refetchAuditLogs()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.createdAt), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.action === "create" ? "bg-green-100 text-green-700" :
                                log.action === "delete" ? "bg-red-100 text-red-700" :
                                log.action === "update" ? "bg-blue-100 text-blue-700" :
                                "bg-purple-100 text-purple-700"
                              }
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{log.entityType} #{log.entityId}</span>
                          </TableCell>
                          <TableCell className="text-sm">{log.performedByEmail}</TableCell>
                          <TableCell className="max-w-xs">
                            {log.changedFields && (
                              <span className="text-xs text-muted-foreground">
                                Changed: {log.changedFields.join(", ")}
                              </span>
                            )}
                            {log.reason && (
                              <span className="text-xs text-muted-foreground block">
                                {log.reason}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {selectedRole ? "Update role details and permissions" : "Define a new role with specific permissions"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({
                      ...roleFormData,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                    })}
                    placeholder="e.g., Content Editor"
                    data-testid="input-role-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-slug">Slug</Label>
                  <Input
                    id="role-slug"
                    value={roleFormData.slug}
                    onChange={(e) => setRoleFormData({ ...roleFormData, slug: e.target.value })}
                    placeholder="content_editor"
                    className="font-mono"
                    data-testid="input-role-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    placeholder="Role description..."
                    rows={3}
                    data-testid="input-role-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-priority">Priority (higher = more important)</Label>
                  <Input
                    id="role-priority"
                    type="number"
                    value={roleFormData.priority}
                    onChange={(e) => setRoleFormData({ ...roleFormData, priority: parseInt(e.target.value) || 0 })}
                    data-testid="input-role-priority"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="role-enabled"
                    checked={roleFormData.isEnabled}
                    onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, isEnabled: checked })}
                    data-testid="switch-role-enabled"
                  />
                  <Label htmlFor="role-enabled">Role is enabled</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Permissions ({selectedPermissions.size} selected)</Label>
                <ScrollArea className="h-[400px] border rounded-lg p-2">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const modulePermIds = perms.map(p => p.id);
                    const selectedCount = modulePermIds.filter(id => selectedPermissions.has(id)).length;
                    const allSelected = selectedCount === perms.length;
                    const someSelected = selectedCount > 0 && selectedCount < perms.length;

                    return (
                      <div key={module} className="mb-3">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-1">
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) (el as any).indeterminate = someSelected;
                            }}
                            onCheckedChange={() => toggleModulePermissions(module, perms)}
                            data-testid={`checkbox-module-${module}`}
                          />
                          {getModuleIcon(module)}
                          <span className="font-medium text-sm capitalize">{module.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {selectedCount}/{perms.length}
                          </Badge>
                        </div>
                        <div className="pl-6 space-y-1">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2 py-1">
                              <Checkbox
                                checked={selectedPermissions.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                data-testid={`checkbox-perm-${perm.id}`}
                              />
                              <span className="text-sm">{perm.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveRole}
              disabled={!roleFormData.name || !roleFormData.slug || createRoleMutation.isPending || updateRoleMutation.isPending}
              data-testid="button-save-role"
            >
              {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{roleToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.id)}
              disabled={deleteRoleMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteRoleMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Role</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedRole?.name}" with all its permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="clone-name">New Role Name</Label>
            <Input
              id="clone-name"
              value={cloneNewName}
              onChange={(e) => setCloneNewName(e.target.value)}
              placeholder="Enter new role name"
              data-testid="input-clone-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedRole && cloneRoleMutation.mutate({ id: selectedRole.id, newName: cloneNewName })}
              disabled={!cloneNewName || cloneRoleMutation.isPending}
              data-testid="button-confirm-clone"
            >
              {cloneRoleMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Clone Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
