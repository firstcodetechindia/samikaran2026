import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Settings, Coins, Volume2, MessageCircle, Package, Users, 
  TrendingUp, Save, Plus, Trash2, Loader2, Edit, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function getAdminHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const authData = localStorage.getItem("superAdminAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.sessionToken) {
        headers["Authorization"] = `Bearer ${parsed.sessionToken}`;
      }
    }
  } catch {}
  return headers;
}

function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { ...getAdminHeaders(), ...(options?.headers || {}) },
    credentials: "include",
  });
}

interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  priceInr: number;
  priceUsd?: number;
  badgeText?: string;
  badgeColor?: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export function GurujiAdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/guruji/settings"],
    queryFn: async () => {
      const res = await adminFetch("/api/guruji/settings");
      return res.json();
    },
  });

  const { data: packagesData, refetch: refetchPackages } = useQuery({
    queryKey: ["/api/guruji/admin/packages"],
    queryFn: async () => {
      const res = await adminFetch("/api/guruji/admin/packages");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const packages = Array.isArray(packagesData) ? packagesData : [];

  const [formData, setFormData] = useState({
    isEnabled: true,
    responseCredits1To100Words: 2,
    responseCredits101To300Words: 4,
    responseCredits301To500Words: 6,
    responseCreditsAbove500Words: 8,
    baseSttCreditPerQuery: 1,
    voicePremiumPercentage: 20,
    ttsCharacterMultiplier: 20,
    ttsVoiceEnglish: "alloy",
    ttsVoiceHindi: "shimmer",
    ttsSpeechRate: "0.8",
    systemPromptAdditions: "",
    dailyCreditLimit: 100,
    monthlyCreditLimit: 2000,
    examPerformanceReward90Plus: 50,
    examPerformanceReward75To89: 30,
    examPerformanceReward60To74: 15,
    newRegistrationCredits: 200,
    referralCredits: 200,
    aiModel: "gpt-4o-mini",
    maxTokens: 300,
    targetResponseWords: 80,
    aiTemperature: "0.7",
  });

  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [distributeAmount, setDistributeAmount] = useState(200);
  const [distributeReason, setDistributeReason] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);

  const [packageFormData, setPackageFormData] = useState({
    name: "",
    credits: 50,
    priceInr: 49,
    priceUsd: 0.99,
    badgeText: "",
    badgeColor: "purple",
    isPopular: false,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        isEnabled: settings.isEnabled ?? true,
        responseCredits1To100Words: settings.responseCredits1To100Words ?? 2,
        responseCredits101To300Words: settings.responseCredits101To300Words ?? 4,
        responseCredits301To500Words: settings.responseCredits301To500Words ?? 6,
        responseCreditsAbove500Words: settings.responseCreditsAbove500Words ?? 8,
        baseSttCreditPerQuery: settings.baseSttCreditPerQuery ?? 1,
        voicePremiumPercentage: settings.voicePremiumPercentage ?? 20,
        ttsCharacterMultiplier: settings.ttsCharacterMultiplier ?? 20,
        ttsVoiceEnglish: settings.ttsVoiceEnglish ?? "alloy",
        ttsVoiceHindi: settings.ttsVoiceHindi ?? "shimmer",
        ttsSpeechRate: settings.ttsSpeechRate ?? "0.8",
        systemPromptAdditions: settings.systemPromptAdditions ?? "",
        dailyCreditLimit: settings.dailyCreditLimit ?? 100,
        monthlyCreditLimit: settings.monthlyCreditLimit ?? 2000,
        examPerformanceReward90Plus: settings.examPerformanceReward90Plus ?? 50,
        examPerformanceReward75To89: settings.examPerformanceReward75To89 ?? 30,
        examPerformanceReward60To74: settings.examPerformanceReward60To74 ?? 15,
        newRegistrationCredits: settings.newRegistrationCredits ?? 200,
        referralCredits: settings.referralCredits ?? 200,
        aiModel: settings.aiModel ?? "gpt-4o-mini",
        maxTokens: settings.maxTokens ?? 300,
        targetResponseWords: settings.targetResponseWords ?? 80,
        aiTemperature: settings.aiTemperature ?? "0.7",
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/guruji/settings", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings Saved", description: "TARA settings have been updated." });
      refetchSettings();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const savePackageMutation = useMutation({
    mutationFn: async () => {
      const data = editingPackage ? { id: editingPackage.id, ...packageFormData } : packageFormData;
      const res = await apiRequest("POST", "/api/guruji/admin/packages", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Package Saved", description: "Credit package has been updated." });
      setIsPackageDialogOpen(false);
      setEditingPackage(null);
      refetchPackages();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save package.", variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/guruji/admin/packages/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Package Deleted", description: "Credit package has been removed." });
      refetchPackages();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete package.", variant: "destructive" });
    },
  });

  const searchStudents = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await adminFetch(`/api/guruji/admin/search-students?q=${encodeURIComponent(query)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch { /* ignore */ }
    setIsSearching(false);
  };

  const distributeCreditsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/guruji/admin/distribute-credits", {
        studentId: selectedStudent.id,
        amount: distributeAmount,
        reason: distributeReason || `Admin distributed ${distributeAmount} TARA credits`,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Credits Distributed", description: `${distributeAmount} credits sent to ${data.studentName}. New balance: ${data.newBalance}` });
      setSelectedStudent({ ...selectedStudent, currentCredits: data.newBalance });
      setDistributeAmount(200);
      setDistributeReason("");
      loadCreditHistory(selectedStudent.id);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to distribute credits.", variant: "destructive" });
    },
  });

  const loadCreditHistory = async (studentId: number) => {
    try {
      const res = await adminFetch(`/api/guruji/admin/credit-history/${studentId}`);
      if (res.ok) setCreditHistory(await res.json());
    } catch { /* ignore */ }
  };

  const openEditPackage = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      credits: pkg.credits,
      priceInr: pkg.priceInr,
      priceUsd: pkg.priceUsd || 0,
      badgeText: pkg.badgeText || "",
      badgeColor: pkg.badgeColor || "purple",
      isPopular: pkg.isPopular,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    });
    setIsPackageDialogOpen(true);
  };

  const openNewPackage = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: "",
      credits: 50,
      priceInr: 49,
      priceUsd: 0.99,
      badgeText: "",
      badgeColor: "purple",
      isPopular: false,
      isActive: true,
      sortOrder: packages.length,
    });
    setIsPackageDialogOpen(true);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tara-admin-settings">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">TARA Settings</h2>
            <p className="text-muted-foreground">Configure AI assistant settings and credit pricing</p>
          </div>
        </div>
        <Button
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
          data-testid="button-save-tara-settings"
        >
          {saveSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="general" data-testid="tab-general">
            <Settings className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="credits" data-testid="tab-credits">
            <Coins className="w-4 h-4 mr-2" /> Credits
          </TabsTrigger>
          <TabsTrigger value="voice" data-testid="tab-voice">
            <Volume2 className="w-4 h-4 mr-2" /> Voice
          </TabsTrigger>
          <TabsTrigger value="packages" data-testid="tab-packages">
            <Package className="w-4 h-4 mr-2" /> Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Enable or disable the TARA AI assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>TARA Enabled</Label>
                  <p className="text-sm text-muted-foreground">Allow students to use the AI assistant</p>
                </div>
                <Switch
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, isEnabled: checked }))}
                  data-testid="switch-tara-enabled"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-500" />
                Credit Distribution Settings
              </CardTitle>
              <CardDescription>Configure how many TARA credits students receive automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Registration Credits</Label>
                  <Input
                    type="number"
                    value={formData.newRegistrationCredits}
                    onChange={(e) => setFormData(f => ({ ...f, newRegistrationCredits: parseInt(e.target.value) || 0 }))}
                    data-testid="input-registration-credits"
                  />
                  <p className="text-xs text-muted-foreground">Credits given to every new student on registration</p>
                </div>
                <div className="space-y-2">
                  <Label>Referral Credits</Label>
                  <Input
                    type="number"
                    value={formData.referralCredits}
                    onChange={(e) => setFormData(f => ({ ...f, referralCredits: parseInt(e.target.value) || 0 }))}
                    data-testid="input-referral-credits"
                  />
                  <p className="text-xs text-muted-foreground">Credits given to referrer when someone registers using their code</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Distribute Credits to Student
              </CardTitle>
              <CardDescription>Search for a student and manually distribute TARA credits to their account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Student</Label>
                <div className="relative">
                  <Input
                    placeholder="Search by name, email, or Student ID..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      searchStudents(e.target.value);
                    }}
                    data-testid="input-student-search"
                  />
                  {isSearching && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
                </div>
                {searchResults.length > 0 && !selectedStudent && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto mt-1">
                    {searchResults.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch(`${s.firstName} ${s.lastName}`);
                          setSearchResults([]);
                          loadCreditHistory(s.id);
                        }}
                        data-testid={`student-result-${s.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.email} · {s.studentId || "No ID"} · {s.gradeLevel || ""}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{s.currentCredits} credits</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedStudent && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                      <p className="text-sm text-muted-foreground">{selectedStudent.email} · {selectedStudent.studentId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="text-lg font-bold text-purple-600">{selectedStudent.currentCredits} credits</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credits to Distribute</Label>
                      <Input
                        type="number"
                        value={distributeAmount}
                        onChange={(e) => setDistributeAmount(parseInt(e.target.value) || 0)}
                        min={1}
                        data-testid="input-distribute-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason (optional)</Label>
                      <Input
                        placeholder="e.g., Contest reward, Special bonus..."
                        value={distributeReason}
                        onChange={(e) => setDistributeReason(e.target.value)}
                        data-testid="input-distribute-reason"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => distributeCreditsMutation.mutate()}
                      disabled={distributeAmount <= 0 || distributeCreditsMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      data-testid="btn-distribute-credits"
                    >
                      {distributeCreditsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Coins className="w-4 h-4 mr-2" />
                      )}
                      Distribute {distributeAmount} Credits
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearch("");
                        setDistributeAmount(200);
                        setDistributeReason("");
                        setCreditHistory([]);
                      }}
                      data-testid="btn-cancel-distribute"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </div>

                  {creditHistory.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Credit History</p>
                      <div className="max-h-40 overflow-y-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs">Amount</TableHead>
                              <TableHead className="text-xs">Balance</TableHead>
                              <TableHead className="text-xs">Description</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditHistory.map((entry: any) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-xs">
                                  <Badge variant={entry.amount > 0 ? "default" : "destructive"} className="text-[10px]">
                                    {entry.transactionType}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-xs font-medium ${entry.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {entry.amount > 0 ? "+" : ""}{entry.amount}
                                </TableCell>
                                <TableCell className="text-xs">{entry.balanceAfter}</TableCell>
                                <TableCell className="text-xs max-w-[150px] truncate">{entry.description}</TableCell>
                                <TableCell className="text-xs">{entry.createdAt ? format(new Date(entry.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
              <CardDescription>Set daily and monthly credit limits per student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Credit Limit</Label>
                  <Input
                    type="number"
                    value={formData.dailyCreditLimit}
                    onChange={(e) => setFormData(f => ({ ...f, dailyCreditLimit: parseInt(e.target.value) || 0 }))}
                    data-testid="input-daily-limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Credit Limit</Label>
                  <Input
                    type="number"
                    value={formData.monthlyCreditLimit}
                    onChange={(e) => setFormData(f => ({ ...f, monthlyCreditLimit: parseInt(e.target.value) || 0 }))}
                    data-testid="input-monthly-limit"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom System Prompt</CardTitle>
              <CardDescription>Add additional instructions to TARA's behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter additional system prompt instructions..."
                value={formData.systemPromptAdditions}
                onChange={(e) => setFormData(f => ({ ...f, systemPromptAdditions: e.target.value }))}
                rows={4}
                data-testid="input-system-prompt"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Response Configuration</CardTitle>
              <CardDescription>Control AI model, response length, and speed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select
                    value={formData.aiModel}
                    onValueChange={(value) => setFormData(f => ({ ...f, aiModel: value }))}
                  >
                    <SelectTrigger data-testid="select-ai-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Mini is 3x faster, recommended for chat</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData(f => ({ ...f, maxTokens: parseInt(e.target.value) || 300 }))}
                    min={100}
                    max={2000}
                    data-testid="input-max-tokens"
                  />
                  <p className="text-xs text-muted-foreground">Maximum response length (100-2000)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Response Words</Label>
                  <Input
                    type="number"
                    value={formData.targetResponseWords}
                    onChange={(e) => setFormData(f => ({ ...f, targetResponseWords: parseInt(e.target.value) || 80 }))}
                    min={30}
                    max={500}
                    data-testid="input-target-words"
                  />
                  <p className="text-xs text-muted-foreground">AI will try to keep responses under this word count</p>
                </div>
                <div className="space-y-2">
                  <Label>AI Temperature ({formData.aiTemperature})</Label>
                  <Slider
                    value={[parseFloat(formData.aiTemperature) * 100]}
                    onValueChange={(value) => setFormData(f => ({ ...f, aiTemperature: (value[0] / 100).toFixed(1) }))}
                    min={0}
                    max={100}
                    step={10}
                    data-testid="slider-temperature"
                  />
                  <p className="text-xs text-muted-foreground">Higher = more creative, Lower = more focused</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Credit Pricing</CardTitle>
              <CardDescription>Set credit costs based on response word count</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>1-100 Words</Label>
                  <Input
                    type="number"
                    value={formData.responseCredits1To100Words}
                    onChange={(e) => setFormData(f => ({ ...f, responseCredits1To100Words: parseInt(e.target.value) || 0 }))}
                    data-testid="input-credits-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>101-300 Words</Label>
                  <Input
                    type="number"
                    value={formData.responseCredits101To300Words}
                    onChange={(e) => setFormData(f => ({ ...f, responseCredits101To300Words: parseInt(e.target.value) || 0 }))}
                    data-testid="input-credits-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>301-500 Words</Label>
                  <Input
                    type="number"
                    value={formData.responseCredits301To500Words}
                    onChange={(e) => setFormData(f => ({ ...f, responseCredits301To500Words: parseInt(e.target.value) || 0 }))}
                    data-testid="input-credits-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>500+ Words</Label>
                  <Input
                    type="number"
                    value={formData.responseCreditsAbove500Words}
                    onChange={(e) => setFormData(f => ({ ...f, responseCreditsAbove500Words: parseInt(e.target.value) || 0 }))}
                    data-testid="input-credits-above"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice Mode Pricing</CardTitle>
              <CardDescription>Additional costs for voice interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>STT Credit per Query</Label>
                  <Input
                    type="number"
                    value={formData.baseSttCreditPerQuery}
                    onChange={(e) => setFormData(f => ({ ...f, baseSttCreditPerQuery: parseInt(e.target.value) || 0 }))}
                    data-testid="input-stt-credit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Voice Premium (%)</Label>
                  <Input
                    type="number"
                    value={formData.voicePremiumPercentage}
                    onChange={(e) => setFormData(f => ({ ...f, voicePremiumPercentage: parseInt(e.target.value) || 0 }))}
                    data-testid="input-voice-premium"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">TTS Character-Based Costing</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Voice responses are charged based on character count. Higher multiplier = higher cost recovery.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>TTS Character Multiplier (×10)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={50}
                      value={formData.ttsCharacterMultiplier}
                      onChange={(e) => setFormData(f => ({ ...f, ttsCharacterMultiplier: parseInt(e.target.value) || 20 }))}
                      data-testid="input-tts-char-multiplier"
                    />
                    <p className="text-xs text-muted-foreground">
                      Value ÷ 10 = Credits per 100 chars. E.g., 20 = 2.0 credits/100 chars, 25 = 2.5
                    </p>
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-sm font-medium">Current Rate:</p>
                      <p className="text-lg font-bold text-primary">
                        {(formData.ttsCharacterMultiplier / 10).toFixed(1)} credits / 100 chars
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exam Performance Rewards</CardTitle>
              <CardDescription>Bonus credits for exam performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>90%+ Score</Label>
                  <Input
                    type="number"
                    value={formData.examPerformanceReward90Plus}
                    onChange={(e) => setFormData(f => ({ ...f, examPerformanceReward90Plus: parseInt(e.target.value) || 0 }))}
                    data-testid="input-reward-90"
                  />
                </div>
                <div className="space-y-2">
                  <Label>75-89% Score</Label>
                  <Input
                    type="number"
                    value={formData.examPerformanceReward75To89}
                    onChange={(e) => setFormData(f => ({ ...f, examPerformanceReward75To89: parseInt(e.target.value) || 0 }))}
                    data-testid="input-reward-75"
                  />
                </div>
                <div className="space-y-2">
                  <Label>60-74% Score</Label>
                  <Input
                    type="number"
                    value={formData.examPerformanceReward60To74}
                    onChange={(e) => setFormData(f => ({ ...f, examPerformanceReward60To74: parseInt(e.target.value) || 0 }))}
                    data-testid="input-reward-60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Text-to-Speech Configuration</CardTitle>
              <CardDescription>Configure voice settings for TARA responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>English Voice</Label>
                  <Select
                    value={formData.ttsVoiceEnglish}
                    onValueChange={(value) => setFormData(f => ({ ...f, ttsVoiceEnglish: value }))}
                  >
                    <SelectTrigger data-testid="select-voice-en">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova">Nova (Female - Warm, Natural)</SelectItem>
                      <SelectItem value="shimmer">Shimmer (Female - Soft, Expressive)</SelectItem>
                      <SelectItem value="alloy">Alloy (Female - Clear, Balanced)</SelectItem>
                      <SelectItem value="fable">Fable (Male - Warm, British)</SelectItem>
                      <SelectItem value="echo">Echo (Male - Deep, Clear)</SelectItem>
                      <SelectItem value="onyx">Onyx (Male - Authoritative)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Recommended: Nova or Shimmer for TARA's female voice</p>
                </div>
                <div className="space-y-2">
                  <Label>Hindi Voice</Label>
                  <Select
                    value={formData.ttsVoiceHindi}
                    onValueChange={(value) => setFormData(f => ({ ...f, ttsVoiceHindi: value }))}
                  >
                    <SelectTrigger data-testid="select-voice-hi">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova">Nova (Female - Best for Hindi)</SelectItem>
                      <SelectItem value="shimmer">Shimmer (Female - Soft, Expressive)</SelectItem>
                      <SelectItem value="alloy">Alloy (Female - Clear, Balanced)</SelectItem>
                      <SelectItem value="fable">Fable (Male - Warm)</SelectItem>
                      <SelectItem value="echo">Echo (Male - Deep)</SelectItem>
                      <SelectItem value="onyx">Onyx (Male - Authoritative)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Recommended: Nova for natural Hindi pronunciation</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Speech Rate: {formData.ttsSpeechRate}x</Label>
                <Slider
                  value={[parseFloat(formData.ttsSpeechRate)]}
                  onValueChange={([value]) => setFormData(f => ({ ...f, ttsSpeechRate: value.toString() }))}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full max-w-md"
                  data-testid="slider-speech-rate"
                />
                <p className="text-sm text-muted-foreground">Lower = slower, better for young students</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                TARA Voice Provider
                <Badge variant="outline">Centralized</Badge>
              </CardTitle>
              <CardDescription>TTS provider is now managed in Global Settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Voice settings have moved to AI Provider Management
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  To configure TARA's voice (ElevenLabs, OpenAI, etc.), go to:
                </p>
                <p className="text-sm font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded inline-block">
                  Super Admin → Global Settings → AI Provider Management → Text-to-Speech
                </p>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Recommended for TARA:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>ElevenLabs</strong> - Best Indian-accented voices (Priya, Kavya)</li>
                  <li><strong>OpenAI</strong> - Fallback with shimmer voice</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Credit Packages</h3>
              <p className="text-sm text-muted-foreground">Manage purchasable credit packages</p>
            </div>
            <Button onClick={openNewPackage} data-testid="button-add-package">
              <Plus className="w-4 h-4 mr-2" /> Add Package
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Price (INR)</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg: CreditPackage) => (
                  <TableRow key={pkg.id} data-testid={`row-package-${pkg.id}`}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.credits}</TableCell>
                    <TableCell>₹{pkg.priceInr}</TableCell>
                    <TableCell>
                      {pkg.badgeText && (
                        <Badge variant="secondary">{pkg.badgeText}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? "default" : "outline"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPackage(pkg)}
                          data-testid={`button-edit-package-${pkg.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePackageMutation.mutate(pkg.id)}
                          className="text-destructive"
                          data-testid={`button-delete-package-${pkg.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent data-testid="dialog-package">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Package Name</Label>
              <Input
                value={packageFormData.name}
                onChange={(e) => setPackageFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Starter Pack"
                data-testid="input-package-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  value={packageFormData.credits}
                  onChange={(e) => setPackageFormData(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))}
                  data-testid="input-package-credits"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (INR)</Label>
                <Input
                  type="number"
                  value={packageFormData.priceInr}
                  onChange={(e) => setPackageFormData(f => ({ ...f, priceInr: parseInt(e.target.value) || 0 }))}
                  data-testid="input-package-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge Text (optional)</Label>
                <Input
                  value={packageFormData.badgeText}
                  onChange={(e) => setPackageFormData(f => ({ ...f, badgeText: e.target.value }))}
                  placeholder="e.g., Best Value"
                  data-testid="input-package-badge"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={packageFormData.sortOrder}
                  onChange={(e) => setPackageFormData(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-package-sort"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={packageFormData.isPopular}
                  onCheckedChange={(checked) => setPackageFormData(f => ({ ...f, isPopular: checked }))}
                  data-testid="switch-package-popular"
                />
                <Label>Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={packageFormData.isActive}
                  onCheckedChange={(checked) => setPackageFormData(f => ({ ...f, isActive: checked }))}
                  data-testid="switch-package-active"
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => savePackageMutation.mutate()}
              disabled={savePackageMutation.isPending}
              data-testid="button-save-package"
            >
              {savePackageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
