import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Users, UserCheck, UserX, RefreshCw, Eye, Hash, GraduationCap, Building2, Handshake, UsersRound, Plus, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserDetailView from "./UserDetailView";
import StudentProfileModal from "./StudentProfileModal";

interface UserManagementTabProps {
  userType: "students" | "supervisors" | "schools" | "coordinators" | "partners";
}

const typeConfig: Record<string, { label: string; singular: string; icon: any; gradient: string }> = {
  students: { label: "Students", singular: "Student", icon: GraduationCap, gradient: "from-blue-500 to-indigo-500" },
  supervisors: { label: "Supervisors", singular: "Supervisor", icon: UserCheck, gradient: "from-purple-500 to-violet-500" },
  schools: { label: "Schools", singular: "School", icon: Building2, gradient: "from-emerald-500 to-green-500" },
  coordinators: { label: "Coordinators", singular: "Coordinator", icon: UsersRound, gradient: "from-orange-500 to-amber-500" },
  partners: { label: "Partners", singular: "Partner", icon: Handshake, gradient: "from-pink-500 to-rose-500" },
};

function getName(user: any, type: string): string {
  if (type === "students" || type === "supervisors") {
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
  }
  if (type === "schools") return user.schoolName || user.teacherFirstName || "—";
  if (type === "coordinators") return user.name || "—";
  if (type === "partners") return user.fullName || "—";
  return "—";
}

function getStatus(user: any, type: string): boolean {
  if (type === "partners") return user.status === "active";
  return user.verified === true;
}

function getDisplayId(user: any, type: string): string {
  if (type === "students") return user.studentId || `#${user.id}`;
  if (type === "partners") return user.partnerCode || `#${user.id}`;
  return `#${user.id}`;
}

function getDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function getInitials(user: any, type: string): string {
  const name = getName(user, type);
  if (name === "—") return "?";
  return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

const SCHOOL_BOARDS = ["CBSE", "ICSE", "State Board", "IGCSE", "IB", "Other"];
const PARTNER_TYPES = ["School", "Coaching Center", "NGO", "Franchisee", "Corporate"];

function getEmptyForm(userType: string) {
  if (userType === "schools") return { schoolName: "", principalName: "", email: "", phone: "", city: "", state: "", board: "CBSE", studentCount: "", partnershipType: "Free" };
  if (userType === "supervisors") return { firstName: "", lastName: "", email: "", phone: "", role: "supervisor", assignedSchools: "" };
  if (userType === "coordinators") return { name: "", email: "", phone: "", region: "", assignedSchools: "" };
  if (userType === "partners") return { orgName: "", contactName: "", email: "", phone: "", commissionPct: "10", type: "School" };
  return {};
}

export default function UserManagementTab({ userType }: UserManagementTabProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [studentModalId, setStudentModalId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [addForm, setAddForm] = useState<any>(() => getEmptyForm(userType));
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const config = typeConfig[userType];
  const TypeIcon = config.icon;

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/sysctrl/api/${userType}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType] });
      setShowAdd(false);
      setAddForm(getEmptyForm(userType));
      toast({ title: `${config.singular} added successfully!` });
    },
    onError: (err: any) => toast({ title: `Failed to add ${config.singular}`, variant: "destructive" }),
  });

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setUploading(true);
    setBulkProgress(20);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      formData.append("type", userType);
      setBulkProgress(50);
      const res = await fetch(`/sysctrl/api/bulk-import/${userType}`, { method: "POST", body: formData });
      setBulkProgress(90);
      const data = await res.json();
      setBulkResult({ success: data.success || 0, errors: Array.isArray(data.errors) ? data.errors : [] });
      setBulkProgress(100);
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType] });
    } catch {
      setBulkResult({ success: 0, errors: ["Upload failed — check file format"] });
    } finally {
      setUploading(false);
    }
  };

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/users", userType],
  });

  const filteredUsers = users.filter((user: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = getName(user, userType).toLowerCase();
    const email = (user.email || "").toLowerCase();
    const phone = (user.phone || "").toLowerCase();
    const studentId = (user.studentId || "").toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term) || studentId.includes(term);
  });

  const activeCount = filteredUsers.filter((u: any) => getStatus(u, userType)).length;
  const inactiveCount = filteredUsers.length - activeCount;

  // For non-student users: show the generic detail view full-page
  if (selectedUserId !== null && userType !== "students") {
    return (
      <UserDetailView
        userType={userType}
        userId={selectedUserId}
        onBack={() => {
          setSelectedUserId(null);
          queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
            <TypeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-user-management-title">
              {config.label} Management
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">{filteredUsers.length} total</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-sm text-green-600 font-medium">{activeCount} active</span>
              {inactiveCount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">|</span>
                  <span className="text-sm text-red-500 font-medium">{inactiveCount} inactive</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {userType !== "students" && (
            <Button variant="outline" size="sm" onClick={() => { setBulkFile(null); setBulkResult(null); setBulkProgress(0); setShowBulk(true); }} data-testid="button-bulk-import">
              <Upload className="w-4 h-4 mr-2" /> CSV Import
            </Button>
          )}
          {userType !== "students" && (
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" onClick={() => { setAddForm(getEmptyForm(userType)); setShowAdd(true); }} data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" /> Add {config.singular}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType] })}
            data-testid="button-refresh-users"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Search by name, email, phone${userType === "students" ? ", Student ID" : ""}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-users"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[72px] bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 opacity-30" />
          </div>
          <p className="font-medium text-lg">No {config.label.toLowerCase()} found</p>
          {searchTerm && <p className="text-sm mt-1">Try adjusting your search term</p>}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full" data-testid="table-users">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[140px]">
                  <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> {userType === "students" ? "Student ID" : "ID"}</div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[130px]">Phone</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[120px]">Registered</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[60px]">View</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: any, index: number) => {
                const active = getStatus(user, userType);
                return (
                  <tr
                    key={user.id}
                    className={`border-b transition-colors hover:bg-muted/20 ${index % 2 === 0 ? "" : "bg-muted/5"}`}
                    data-testid={`row-user-${user.id}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-primary/80 bg-primary/5 px-2 py-1 rounded">
                        {getDisplayId(user, userType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {getInitials(user, userType)}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[180px]">{getName(user, userType)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">{user.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{user.phone || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={active ? "default" : "destructive"} className="text-[10px] px-2">
                        {active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{getDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => userType === "students" ? setStudentModalId(user.id) : setSelectedUserId(user.id)}
                              data-testid={`button-view-user-${user.id}`}
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Profile Modal */}
      {studentModalId !== null && (
        <StudentProfileModal
          studentId={studentModalId}
          onClose={() => setStudentModalId(null)}
        />
      )}

      {/* Add User Modal */}
      <Dialog open={showAdd} onOpenChange={open => { if (!open) setShowAdd(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <TypeIcon className="w-4 h-4 text-white" />
              </div>
              Add New {config.singular}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {userType === "schools" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">School Name *</Label><Input value={addForm.schoolName} onChange={e => setAddForm((f: any) => ({ ...f, schoolName: e.target.value }))} className="mt-1" data-testid="input-school-name" /></div>
                  <div><Label className="text-xs">Principal Name</Label><Input value={addForm.principalName} onChange={e => setAddForm((f: any) => ({ ...f, principalName: e.target.value }))} className="mt-1" data-testid="input-principal-name" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm((f: any) => ({ ...f, email: e.target.value }))} className="mt-1" data-testid="input-school-email" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={addForm.phone} onChange={e => setAddForm((f: any) => ({ ...f, phone: e.target.value }))} className="mt-1" data-testid="input-school-phone" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">City</Label><Input value={addForm.city} onChange={e => setAddForm((f: any) => ({ ...f, city: e.target.value }))} className="mt-1" data-testid="input-school-city" /></div>
                  <div><Label className="text-xs">State</Label><Input value={addForm.state} onChange={e => setAddForm((f: any) => ({ ...f, state: e.target.value }))} className="mt-1" data-testid="input-school-state" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Board</Label>
                    <Select value={addForm.board} onValueChange={v => setAddForm((f: any) => ({ ...f, board: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{SCHOOL_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Partnership Type</Label>
                    <Select value={addForm.partnershipType} onValueChange={v => setAddForm((f: any) => ({ ...f, partnershipType: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs">Student Count</Label><Input type="number" value={addForm.studentCount} onChange={e => setAddForm((f: any) => ({ ...f, studentCount: e.target.value }))} className="mt-1" data-testid="input-student-count" /></div>
              </>
            )}

            {userType === "supervisors" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">First Name *</Label><Input value={addForm.firstName} onChange={e => setAddForm((f: any) => ({ ...f, firstName: e.target.value }))} className="mt-1" data-testid="input-supervisor-firstname" /></div>
                  <div><Label className="text-xs">Last Name *</Label><Input value={addForm.lastName} onChange={e => setAddForm((f: any) => ({ ...f, lastName: e.target.value }))} className="mt-1" data-testid="input-supervisor-lastname" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm((f: any) => ({ ...f, email: e.target.value }))} className="mt-1" data-testid="input-supervisor-email" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={addForm.phone} onChange={e => setAddForm((f: any) => ({ ...f, phone: e.target.value }))} className="mt-1" data-testid="input-supervisor-phone" /></div>
                </div>
                <div><Label className="text-xs">Role</Label><Input value={addForm.role} onChange={e => setAddForm((f: any) => ({ ...f, role: e.target.value }))} className="mt-1" placeholder="e.g. Regional Supervisor" data-testid="input-supervisor-role" /></div>
                <div><Label className="text-xs">Assigned School IDs (comma-separated)</Label><Input value={addForm.assignedSchools} onChange={e => setAddForm((f: any) => ({ ...f, assignedSchools: e.target.value }))} className="mt-1" placeholder="e.g. 1,2,5" data-testid="input-assigned-schools" /></div>
              </>
            )}

            {userType === "coordinators" && (
              <>
                <div><Label className="text-xs">Full Name *</Label><Input value={addForm.name} onChange={e => setAddForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1" data-testid="input-coordinator-name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm((f: any) => ({ ...f, email: e.target.value }))} className="mt-1" data-testid="input-coordinator-email" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={addForm.phone} onChange={e => setAddForm((f: any) => ({ ...f, phone: e.target.value }))} className="mt-1" data-testid="input-coordinator-phone" /></div>
                </div>
                <div><Label className="text-xs">Region / Zone</Label><Input value={addForm.region} onChange={e => setAddForm((f: any) => ({ ...f, region: e.target.value }))} className="mt-1" placeholder="e.g. North India" data-testid="input-coordinator-region" /></div>
                <div><Label className="text-xs">Assigned School IDs (comma-separated)</Label><Input value={addForm.assignedSchools} onChange={e => setAddForm((f: any) => ({ ...f, assignedSchools: e.target.value }))} className="mt-1" placeholder="e.g. 1,2,5" data-testid="input-coordinator-schools" /></div>
              </>
            )}

            {userType === "partners" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Organization Name *</Label><Input value={addForm.orgName} onChange={e => setAddForm((f: any) => ({ ...f, orgName: e.target.value }))} className="mt-1" data-testid="input-partner-org" /></div>
                  <div><Label className="text-xs">Contact Person</Label><Input value={addForm.contactName} onChange={e => setAddForm((f: any) => ({ ...f, contactName: e.target.value }))} className="mt-1" data-testid="input-partner-contact" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm((f: any) => ({ ...f, email: e.target.value }))} className="mt-1" data-testid="input-partner-email" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={addForm.phone} onChange={e => setAddForm((f: any) => ({ ...f, phone: e.target.value }))} className="mt-1" data-testid="input-partner-phone" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Partner Type</Label>
                    <Select value={addForm.type} onValueChange={v => setAddForm((f: any) => ({ ...f, type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PARTNER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Commission (%)</Label><Input type="number" value={addForm.commissionPct} onChange={e => setAddForm((f: any) => ({ ...f, commissionPct: e.target.value }))} className="mt-1" data-testid="input-partner-commission" /></div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate(addForm)} disabled={createMut.isPending} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-submit-add-user">
              {createMut.isPending ? "Adding..." : `Add ${config.singular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV Import Modal */}
      <Dialog open={showBulk} onOpenChange={open => { if (!open) { setShowBulk(false); setBulkFile(null); setBulkResult(null); setBulkProgress(0); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-600" /> Bulk CSV Import — {config.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-violet-50 rounded-lg p-3 text-sm text-violet-700 border border-violet-100">
              <p className="font-medium mb-1">CSV Format Required Columns:</p>
              {userType === "schools" && <p className="font-mono text-xs">schoolName, email, phone, city, state, board, studentCount</p>}
              {userType === "supervisors" && <p className="font-mono text-xs">firstName, lastName, email, phone, role</p>}
              {userType === "coordinators" && <p className="font-mono text-xs">name, email, phone, region</p>}
              {userType === "partners" && <p className="font-mono text-xs">orgName, contactName, email, phone, type, commissionPct</p>}
            </div>

            {!bulkResult ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-violet-400 transition-colors ${bulkFile ? "border-violet-400 bg-violet-50" : "border-gray-300"}`}
                onClick={() => fileRef.current?.click()}
                data-testid="dropzone-bulk-csv"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {bulkFile ? (
                  <div>
                    <p className="font-medium text-sm text-violet-700">{bulkFile.name}</p>
                    <p className="text-xs text-gray-500">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm">Click to upload CSV file</p>
                    <p className="text-xs text-gray-400 mt-1">Max 5MB, .csv format</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => setBulkFile(e.target.files?.[0] || null)} data-testid="input-bulk-csv" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-lg p-3 flex items-center gap-3 ${bulkResult.success > 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                  {bulkResult.success > 0 ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <div>
                    <p className="font-medium text-sm">{bulkResult.success} {config.label.toLowerCase()} imported successfully</p>
                    {bulkResult.errors.length > 0 && <p className="text-xs text-red-600">{bulkResult.errors.length} rows had errors</p>}
                  </div>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-2 max-h-24 overflow-y-auto">
                    {bulkResult.errors.map((e: string, i: number) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                  </div>
                )}
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Uploading...</span><span>{bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); setBulkProgress(0); }}>Close</Button>
            {!bulkResult && (
              <Button onClick={handleBulkUpload} disabled={!bulkFile || uploading} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-start-bulk-upload">
                {uploading ? "Uploading..." : "Import CSV"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
