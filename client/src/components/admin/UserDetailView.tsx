import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft, UserCheck, UserX, KeyRound, Clock, Mail, Phone, MapPin,
  GraduationCap, Building2, Calendar, Shield, Eye, EyeOff, Activity,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, BookOpen, Globe,
  Fingerprint, Monitor, Hash, CreditCard, Users, Percent, Wallet
} from "lucide-react";

interface UserDetailViewProps {
  userType: "students" | "supervisors" | "schools" | "coordinators" | "partners";
  userId: number;
  onBack: () => void;
}

const typeConfig: Record<string, { label: string; gradient: string }> = {
  students: { label: "Student", gradient: "from-blue-500 to-indigo-500" },
  supervisors: { label: "Supervisor", gradient: "from-purple-500 to-violet-500" },
  schools: { label: "School", gradient: "from-emerald-500 to-green-500" },
  coordinators: { label: "Coordinator", gradient: "from-orange-500 to-amber-500" },
  partners: { label: "Partner", gradient: "from-pink-500 to-rose-500" },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getActivityIcon(action: string) {
  switch (action) {
    case "password_reset": return <KeyRound className="w-4 h-4 text-orange-500" />;
    case "account_activated": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "account_deactivated": return <XCircle className="w-4 h-4 text-red-500" />;
    case "profile_updated": return <RefreshCw className="w-4 h-4 text-blue-500" />;
    case "login": return <Shield className="w-4 h-4 text-purple-500" />;
    default: return <Activity className="w-4 h-4 text-gray-500" />;
  }
}

function InfoField({ icon: Icon, label, value, fullWidth, highlight }: { icon?: any; label: string; value: any; fullWidth?: boolean; highlight?: "green" | "red" }) {
  const colorClass = highlight === "green" ? "text-green-600 font-medium" : highlight === "red" ? "text-red-500 font-medium" : "text-foreground";
  return (
    <div className={`py-2.5 px-3 ${fullWidth ? "col-span-full" : ""}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm break-words pl-[18px] ${colorClass}`}>{value || "—"}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, gradient }: { title: string; icon: any; children: any; gradient?: string }) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className={`px-5 py-2.5 border-b flex items-center gap-2.5 ${gradient ? `bg-gradient-to-r ${gradient} text-white` : "bg-muted/30"}`}>
        <Icon className={`w-4 h-4 ${gradient ? "text-white/90" : "text-muted-foreground"}`} />
        <h3 className={`text-sm font-semibold ${gradient ? "text-white" : ""}`}>{title}</h3>
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 divide-y md:divide-y-0">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserDetailView({ userType, userId, onBack }: UserDetailViewProps) {
  const { toast } = useToast();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const config = typeConfig[userType];

  const { data, isLoading } = useQuery<{ user: any; enrollments: any[]; activityLogs: any[] }>({
    queryKey: ["/sysctrl/api/users", userType, userId],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (active: boolean) => {
      await apiRequest("PATCH", `/sysctrl/api/users/${userType}/${userId}/status`, { active });
    },
    onSuccess: (_, active) => {
      toast({ title: active ? "Account Activated" : "Account Deactivated" });
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType, userId] });
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/sysctrl/api/users/${userType}/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: "Password has been updated successfully" });
      setResetDialogOpen(false);
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/users", userType, userId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-list">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { user, enrollments, activityLogs } = data;
  const isActive = userType === "partners" ? user.status === "active" : user.verified === true;

  const getName = () => {
    if (userType === "students" || userType === "supervisors")
      return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "—";
    if (userType === "schools") return user.schoolName || "—";
    if (userType === "coordinators") return user.name || "—";
    if (userType === "partners") return user.fullName || "—";
    return "—";
  };

  const getSubtitle = () => {
    if (userType === "students") return user.studentId || "";
    if (userType === "partners") return user.partnerCode || "";
    return user.email || "";
  };

  const getInitials = () => {
    const name = getName();
    if (name === "—") return "?";
    return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-list">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold border-2 border-white/30">
                {getInitials()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" data-testid="text-user-detail-title">{getName()}</h2>
                <p className="text-white/80 text-sm font-mono">{getSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isActive ? "default" : "destructive"} className="text-sm px-3 py-1 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                {isActive ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Inactive</>}
              </Badge>
              <Button
                variant={isActive ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleStatusMutation.mutate(!isActive)}
                disabled={toggleStatusMutation.isPending}
                data-testid="button-toggle-status"
              >
                {isActive ? <><UserX className="w-4 h-4 mr-1" /> Deactivate</> : <><UserCheck className="w-4 h-4 mr-1" /> Activate</>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => setResetDialogOpen(true)}
                data-testid="button-reset-password"
              >
                <KeyRound className="w-4 h-4 mr-1" /> Reset Password
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Registered</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(user.createdAt)}</p>
            </div>
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last Login</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(user.lastLoginAt)}</p>
            </div>
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Email Verified</p>
              <p className={`text-sm font-semibold mt-0.5 ${user.emailVerified ? "text-green-600" : "text-red-500"}`}>{user.emailVerified ? "Yes" : "No"}</p>
            </div>
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Password</p>
              <p className={`text-sm font-semibold mt-0.5 ${user.hasPassword ? "text-green-600" : "text-red-500"}`}>{user.hasPassword ? "Set" : "Not Set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {userType === "students" && (
        <>
          <SectionCard title="Personal Information" icon={GraduationCap} gradient="from-blue-500/80 to-indigo-500/80">
            <InfoField icon={Fingerprint} label="Student ID" value={user.studentId} />
            <InfoField label="First Name" value={user.firstName} />
            <InfoField label="Middle Name" value={user.middleName} />
            <InfoField label="Last Name" value={user.lastName} />
            <InfoField icon={Mail} label="Email" value={user.email} />
            <InfoField icon={Phone} label="Phone" value={`${user.countryCode || ""}${user.phone || ""}`} />
            <InfoField icon={Calendar} label="Date of Birth" value={user.dateOfBirth} />
            <InfoField label="Gender" value={user.gender} />
            <InfoField icon={GraduationCap} label="Grade / Class" value={user.gradeLevel} />
          </SectionCard>

          <SectionCard title="School & Location" icon={Building2}>
            <InfoField icon={Building2} label="School Name" value={user.schoolName} />
            <InfoField icon={MapPin} label="Address Line 1" value={user.addressLine1} />
            <InfoField label="Address Line 2" value={user.addressLine2} />
            <InfoField label="Pincode" value={user.pincode} />
            <InfoField label="Registration Type" value={user.registrationType} />
            <InfoField icon={Hash} label="Referral Code" value={user.myReferralCode} />
            <InfoField label="Used Referral Code" value={user.usedReferralCode} />
          </SectionCard>

          <SectionCard title="Account & Security" icon={Shield}>
            <InfoField icon={CheckCircle2} label="Account Verified" value={user.verified ? "Yes" : "No"} highlight={user.verified ? "green" : "red"} />
            <InfoField icon={Mail} label="Email Verified" value={user.emailVerified ? "Yes" : "No"} highlight={user.emailVerified ? "green" : "red"} />
            <InfoField icon={Phone} label="Phone Verified" value={user.phoneVerified ? "Yes" : "No"} highlight={user.phoneVerified ? "green" : "red"} />
            <InfoField icon={KeyRound} label="Password Set" value={user.hasPassword ? "Yes" : "No"} highlight={user.hasPassword ? "green" : "red"} />
            <InfoField label="Profile Status" value={user.profileStatus} />
            <InfoField label="Terms Accepted" value={user.termsAccepted ? "Yes" : "No"} />
            <InfoField icon={Calendar} label="Profile Completed" value={formatDate(user.profileCompletedAt)} />
            <InfoField icon={Clock} label="Last Login" value={formatDate(user.lastLoginAt)} />
            <InfoField icon={Monitor} label="Last Device / Browser" value={user.lastLoginDevice} fullWidth />
          </SectionCard>

          <SectionCard title="IP & Geo Location" icon={Globe} gradient="from-teal-500/80 to-cyan-500/80">
            <InfoField icon={Globe} label="Registration IP" value={user.registrationIp} />
            <InfoField icon={Globe} label="Last Login IP" value={user.lastLoginIp} />
            {user.geoData ? (
              <>
                <InfoField icon={MapPin} label="Location" value={[user.geoData.city, user.geoData.region, user.geoData.country].filter(Boolean).join(", ")} />
                <InfoField icon={Clock} label="Timezone" value={user.geoData.timezone} />
                <InfoField icon={Globe} label="ISP" value={user.geoData.isp} />
              </>
            ) : (
              <div className="col-span-full text-center py-3 text-xs text-muted-foreground italic">
                Geo data will be captured on next login.
              </div>
            )}
          </SectionCard>
        </>
      )}

      {userType === "supervisors" && (
        <>
          <SectionCard title="Personal Information" icon={UserCheck} gradient="from-purple-500/80 to-violet-500/80">
            <InfoField label="First Name" value={user.firstName} />
            <InfoField label="Last Name" value={user.lastName} />
            <InfoField icon={Mail} label="Email" value={user.email} />
            <InfoField icon={Phone} label="Phone" value={`${user.countryCode || ""}${user.phone || ""}`} />
            <InfoField icon={Calendar} label="Date of Birth" value={user.dateOfBirth} />
            <InfoField label="Gender" value={user.gender} />
            <InfoField icon={Mail} label="Secondary Email" value={user.secondaryEmail} />
          </SectionCard>
          <SectionCard title="School & Account" icon={Building2}>
            <InfoField icon={Building2} label="School Name" value={user.schoolName} />
            <InfoField label="Branch" value={user.branch} />
            <InfoField icon={MapPin} label="School City" value={user.schoolCity} />
            <InfoField icon={CheckCircle2} label="Verified" value={user.verified ? "Yes" : "No"} highlight={user.verified ? "green" : "red"} />
            <InfoField icon={KeyRound} label="Password Set" value={user.hasPassword ? "Yes" : "No"} highlight={user.hasPassword ? "green" : "red"} />
          </SectionCard>
        </>
      )}

      {userType === "schools" && (
        <SectionCard title="School Details" icon={Building2} gradient="from-emerald-500/80 to-green-500/80">
          <InfoField icon={Building2} label="School Name" value={user.schoolName} />
          <InfoField icon={Mail} label="Email" value={user.email} />
          <InfoField label="Teacher Name" value={[user.teacherFirstName, user.teacherLastName].filter(Boolean).join(" ")} />
          <InfoField icon={Mail} label="Teacher Email" value={user.teacherEmail} />
          <InfoField icon={MapPin} label="City" value={user.schoolCity} />
          <InfoField icon={MapPin} label="Address" value={user.schoolAddress} />
          <InfoField icon={Globe} label="Country" value={user.country} />
          <InfoField icon={Users} label="Expected Students" value={user.expectedStudents} />
          <InfoField label="Category Range" value={user.categoryRange} />
          <InfoField icon={CheckCircle2} label="Verified" value={user.verified ? "Yes" : "No"} highlight={user.verified ? "green" : "red"} />
          <InfoField icon={KeyRound} label="Password Set" value={user.hasPassword ? "Yes" : "No"} highlight={user.hasPassword ? "green" : "red"} />
        </SectionCard>
      )}

      {userType === "coordinators" && (
        <SectionCard title="Coordinator Details" icon={Users} gradient="from-orange-500/80 to-amber-500/80">
          <InfoField label="Name" value={user.name} />
          <InfoField icon={Mail} label="Email" value={user.email} />
          <InfoField icon={Phone} label="Phone" value={user.phone} />
          <InfoField label="Type" value={user.type} />
          <InfoField label="Department" value={user.department} />
          <InfoField icon={Building2} label="Organization" value={user.organizationName} />
          <InfoField icon={MapPin} label="City" value={user.city} />
          <InfoField label="State" value={user.state} />
          <InfoField icon={Globe} label="Country" value={user.country} />
          <InfoField label="Assigned Grades" value={user.assignedGrades} />
          <InfoField icon={CheckCircle2} label="Verified" value={user.verified ? "Yes" : "No"} highlight={user.verified ? "green" : "red"} />
          <InfoField icon={KeyRound} label="Password Set" value={user.hasPassword ? "Yes" : "No"} highlight={user.hasPassword ? "green" : "red"} />
        </SectionCard>
      )}

      {userType === "partners" && (
        <>
          <SectionCard title="Partner Information" icon={CreditCard} gradient="from-pink-500/80 to-rose-500/80">
            <InfoField label="Full Name" value={user.fullName} />
            <InfoField icon={Mail} label="Email" value={user.email} />
            <InfoField icon={Phone} label="Phone" value={user.phone} />
            <InfoField icon={Building2} label="Organization" value={user.organizationName} />
            <InfoField label="Organization Type" value={user.organizationType} />
            <InfoField label="Partnership Type" value={user.partnershipType} />
            <InfoField icon={Hash} label="Partner Code" value={user.partnerCode} />
            <InfoField label="Status" value={user.status} highlight={user.status === "active" ? "green" : "red"} />
            <InfoField icon={Percent} label="Commission Rate" value={user.commissionRate ? `${user.commissionRate}%` : "—"} />
          </SectionCard>
          <SectionCard title="Stats & Earnings" icon={Wallet}>
            <InfoField icon={Users} label="Total Students" value={user.totalStudents} />
            <InfoField icon={Wallet} label="Total Earnings" value={user.totalEarnings ? `₹${(user.totalEarnings / 100).toFixed(2)}` : "₹0"} />
            <InfoField label="Pending Payout" value={user.pendingPayout ? `₹${(user.pendingPayout / 100).toFixed(2)}` : "₹0"} />
            <InfoField icon={KeyRound} label="Password Set" value={user.hasPassword ? "Yes" : "No"} highlight={user.hasPassword ? "green" : "red"} />
            <InfoField label="Agreement Accepted" value={user.agreementAccepted ? "Yes" : "No"} />
            <InfoField icon={Clock} label="Last Login" value={formatDate(user.lastLoginAt)} />
          </SectionCard>
        </>
      )}

      {userType === "students" && enrollments.length > 0 && (
        <Card className="overflow-hidden border shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Exam Enrollments</h3>
            </div>
            <Badge variant="outline">{enrollments.length}</Badge>
          </div>
          <CardContent className="p-0">
            <table className="w-full" data-testid="table-enrollments">
              <thead>
                <tr className="bg-muted/20 border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">Exam ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">Enrolled At</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-sm font-mono">{e.examId}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-xs">{e.status || "enrolled"}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatDate(e.createdAt || e.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border shadow-sm">
        <div className="px-5 py-2.5 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Activity History</h3>
          </div>
          {activityLogs.length > 0 && <Badge variant="outline" className="text-[10px] px-2 py-0">{activityLogs.length}</Badge>}
        </div>
        <CardContent className="p-0">
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors" data-testid={`activity-log-${log.id}`}>
                  {getActivityIcon(log.action)}
                  <span className="text-[13px] flex-1 min-w-0 truncate">{log.details || log.action.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-4">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{getName()}</strong>. They will need to use this new password to log in.
            </p>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  data-testid="input-admin-new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialogOpen(false); setNewPassword(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
