import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, RefreshCw, Upload, Download, CheckCircle, AlertCircle, 
  Loader2, Server, Link2, Unlink, Eye, EyeOff, ArrowRight,
  Table as TableIcon, Columns, Plus, Minus, Trash2, HardDrive, Save
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SchemaComparison {
  tableName: string;
  status: "match" | "missing_in_prod" | "missing_in_dev" | "column_diff";
  devColumns: string[];
  prodColumns: string[];
  missingColumns?: string[];
  extraColumns?: string[];
}

interface TableDataCount {
  tableName: string;
  devCount: number;
  prodCount: number;
}

// Tables that contain sensitive user data - show warning when syncing
const DANGEROUS_TABLES = [
  'users', 'students', 'schools', 'partners', 'group_partners', 'super_admins',
  'sessions', 'exam_submissions', 'student_answers', 'payments', 'invoices'
];

interface SavedDatabase {
  name: string;
  url: string;
  type: "development" | "production" | "backup";
}

export default function DatabaseSyncTab() {
  const { toast } = useToast();
  const [databases, setDatabases] = useState<SavedDatabase[]>([]);
  const [devDbUrl, setDevDbUrl] = useState("");
  const [editingDevDb, setEditingDevDb] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbUrl, setNewDbUrl] = useState("");
  const [newDbType, setNewDbType] = useState<"production" | "backup">("production");
  const [showUrls, setShowUrls] = useState<Record<string, boolean>>({});
  const [sourceDb, setSourceDb] = useState<string>("development");
  const [targetDb, setTargetDb] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [syncType, setSyncType] = useState<"schema" | "data">("schema");
  const [showAddDb, setShowAddDb] = useState(false);

  // Load saved databases on mount
  const { data: savedDbsData, refetch: refetchSavedDbs } = useQuery<{ databases: SavedDatabase[]; devDbUrl?: string }>({
    queryKey: ["/api/admin/db-sync/saved-databases"],
  });

  useEffect(() => {
    if (savedDbsData?.databases) {
      setDatabases(savedDbsData.databases);
      // Auto-select first production db as target
      const prodDb = savedDbsData.databases.find(d => d.type === "production");
      if (prodDb && !targetDb) {
        setTargetDb(prodDb.name);
      }
    }
    if (savedDbsData?.devDbUrl) {
      setDevDbUrl(savedDbsData.devDbUrl);
    }
  }, [savedDbsData]);

  const saveDevDbMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/db-sync/save-dev-url", { url: devDbUrl });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Saved!", description: "Development database URL saved." });
        setEditingDevDb(false);
        refetchSavedDbs();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    },
  });

  const { data: schemaComparison, isLoading: loadingSchema, isFetching: fetchingSchema, refetch: refetchSchema } = useQuery<SchemaComparison[]>({
    queryKey: ["/api/admin/db-sync/compare-schema"],
    enabled: isConnected,
  });

  const { data: dataComparison, isLoading: loadingData, isFetching: fetchingData, refetch: refetchData } = useQuery<TableDataCount[]>({
    queryKey: ["/api/admin/db-sync/compare-data"],
    enabled: isConnected,
  });

  // Get FK dependencies for sync ordering
  const { data: dependenciesData } = useQuery<{ dependencies: Record<string, string[]> }>({
    queryKey: ["/api/admin/db-sync/table-dependencies"],
    enabled: isConnected,
  });
  const tableDependencies = dependenciesData?.dependencies || {};

  // Get missing parent tables for a given table
  const getMissingParents = (tableName: string): string[] => {
    const parents = tableDependencies[tableName] || [];
    return parents.filter(p => !selectedTables.includes(p) && dataComparison?.some(d => d.tableName === p && d.devCount !== d.prodCount));
  };

  // Auto-sort tables by dependency order (parents first)
  const getSortedTables = (tables: string[]): string[] => {
    const sorted: string[] = [];
    const visited = new Set<string>();
    
    const visit = (table: string) => {
      if (visited.has(table)) return;
      visited.add(table);
      const parents = tableDependencies[table] || [];
      for (const parent of parents) {
        if (tables.includes(parent)) {
          visit(parent);
        }
      }
      sorted.push(table);
    };
    
    for (const table of tables) {
      visit(table);
    }
    return sorted;
  };

  // Get the URL for a database name
  const getDbUrl = (dbName: string): string => {
    if (dbName === "development") return "DEVELOPMENT"; // Backend will use DATABASE_URL
    const db = databases.find(d => d.name === dbName);
    return db?.url || "";
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      const targetUrl = getDbUrl(targetDb);
      if (!targetUrl) throw new Error("Target database not found");
      const res = await apiRequest("POST", "/api/admin/db-sync/connect", { prodDbUrl: targetUrl });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.connected) {
        setIsConnected(true);
        toast({ title: "Connected!", description: `Connected to ${targetDb} database.` });
        refetchSchema();
        refetchData();
      } else {
        toast({ title: "Connection Failed", description: data.error || "Could not connect to database.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to connect to database.", variant: "destructive" });
    },
  });

  const saveDbMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/db-sync/save-database", { 
        name: newDbName, 
        url: newDbUrl, 
        type: newDbType 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Saved!", description: `Database "${newDbName}" saved successfully.` });
        setNewDbName("");
        setNewDbUrl("");
        setShowAddDb(false);
        refetchSavedDbs();
      } else {
        toast({ title: "Error", description: data.error || "Failed to save database.", variant: "destructive" });
      }
    },
  });

  const deleteDbMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/admin/db-sync/delete-database", { name });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Deleted!", description: "Database removed." });
        refetchSavedDbs();
      }
    },
  });

  const syncDirection = sourceDb === "development" ? "dev_to_prod" : "prod_to_dev";

  const syncSchemaMutation = useMutation({
    mutationFn: async () => {
      const targetUrl = getDbUrl(targetDb);
      const res = await apiRequest("POST", "/api/admin/db-sync/sync-schema", { prodDbUrl: targetUrl, direction: syncDirection });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Schema Synced!", description: `${data.changesApplied || 0} changes applied successfully.` });
        refetchSchema();
      } else {
        toast({ title: "Sync Failed", description: data.error || "Schema sync failed.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Schema sync failed.", variant: "destructive" });
    },
  });

  const syncDataMutation = useMutation({
    mutationFn: async () => {
      const targetUrl = getDbUrl(targetDb);
      // Auto-sort tables by dependency order (parents first)
      const sortedTables = getSortedTables(selectedTables);
      console.log('[Sync] Tables sorted by dependency:', sortedTables);
      const res = await apiRequest("POST", "/api/admin/db-sync/sync-data", { 
        prodDbUrl: targetUrl, 
        tables: sortedTables,
        direction: syncDirection 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const failedCount = data.details?.reduce((acc: number, d: any) => acc + (d.failed || 0), 0) || 0;
        if (failedCount > 0) {
          toast({ 
            title: "Sync Completed with Warnings", 
            description: `${data.rowsSynced || 0} rows synced, ${failedCount} rows failed (FK constraints). Sync related parent tables first.`,
            variant: "destructive"
          });
        } else {
          toast({ title: "Data Synced!", description: `${data.rowsSynced || 0} rows synced across ${selectedTables.length} tables.` });
        }
        refetchData();
        setSelectedTables([]);
      } else {
        toast({ title: "Sync Failed", description: data.error || "Data sync failed.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Data sync failed.", variant: "destructive" });
    },
  });

  const handleConnect = () => {
    if (!targetDb) {
      toast({ title: "Error", description: "Please select a target database.", variant: "destructive" });
      return;
    }
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedTables([]);
  };

  const handleSaveDatabase = () => {
    if (!newDbName.trim() || !newDbUrl.trim()) {
      toast({ title: "Error", description: "Please enter database name and URL.", variant: "destructive" });
      return;
    }
    saveDbMutation.mutate();
  };

  const handleSync = () => {
    setConfirmDialog(false);
    if (syncType === "schema") {
      syncSchemaMutation.mutate();
    } else {
      syncDataMutation.mutate();
    }
  };

  const toggleTableSelection = (tableName: string) => {
    if (DANGEROUS_TABLES.includes(tableName)) {
      toast({ title: "Warning", description: `Table "${tableName}" contains sensitive data. Sync with caution.`, variant: "destructive" });
    }
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAllTables = () => {
    if (dataComparison) {
      // Only select tables that have data differences
      setSelectedTables(dataComparison.filter(t => t.devCount !== t.prodCount).map(t => t.tableName));
    }
  };

  const deselectAllTables = () => {
    setSelectedTables([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "match":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Match</Badge>;
      case "missing_in_prod":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Plus className="w-3 h-3 mr-1" /> Missing in Prod</Badge>;
      case "missing_in_dev":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Minus className="w-3 h-3 mr-1" /> Missing in Dev</Badge>;
      case "column_diff":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><Columns className="w-3 h-3 mr-1" /> Column Diff</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Database Sync Tool
          </h2>
          <p className="text-muted-foreground">Sync schema and data between development and production databases</p>
        </div>
        {isConnected && (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
            <Server className="w-4 h-4 mr-2" />
            Production Connected
          </Badge>
        )}
      </div>

      {/* Database Connections Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Database Connections
          </CardTitle>
          <CardDescription>
            Manage your development, production, and backup database connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Database */}
          <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Development Database</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type={showUrls['development'] ? "text" : "password"}
                      value={devDbUrl}
                      onChange={(e) => { setDevDbUrl(e.target.value); setEditingDevDb(true); }}
                      placeholder="Enter development database URL"
                      className="text-xs h-8 w-96"
                      data-testid="input-dev-db-url"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowUrls(prev => ({ ...prev, 'development': !prev['development'] }))}
                    >
                      {showUrls['development'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" onClick={() => saveDevDbMutation.mutate()} disabled={saveDevDbMutation.isPending}>
                      {saveDevDbMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {devDbUrl ? "Custom development database URL" : "Leave empty to use default environment database"}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Active</Badge>
            </div>
          </div>

          {/* Saved Databases List */}
          {databases.map((db) => (
            <div key={db.name} className={`p-4 border rounded-lg ${db.type === 'production' ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className={`w-5 h-5 ${db.type === 'production' ? 'text-green-500' : 'text-orange-500'}`} />
                  <div>
                    <p className="font-medium">{db.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type={showUrls[db.name] ? "text" : "password"}
                        value={db.url}
                        readOnly
                        className="text-xs h-7 w-80 bg-background/50"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowUrls(prev => ({ ...prev, [db.name]: !prev[db.name] }))}
                      >
                        {showUrls[db.name] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={db.type === 'production' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}>
                    {db.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteDbMutation.mutate(db.name)}
                    data-testid={`button-delete-db-${db.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Database */}
          {showAddDb ? (
            <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Database Name</Label>
                  <Input
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    placeholder="e.g., Production, Backup"
                    data-testid="input-new-db-name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newDbType} onValueChange={(v: "production" | "backup") => setNewDbType(v)}>
                    <SelectTrigger data-testid="select-db-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleSaveDatabase} disabled={saveDbMutation.isPending} data-testid="button-save-db">
                    {saveDbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDb(false)}>Cancel</Button>
                </div>
              </div>
              <div>
                <Label>Database URL</Label>
                <div className="relative">
                  <Input
                    type={showUrls['new'] ? "text" : "password"}
                    value={newDbUrl}
                    onChange={(e) => setNewDbUrl(e.target.value)}
                    placeholder="postgresql://user:password@host:5432/database"
                    data-testid="input-new-db-url"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowUrls(prev => ({ ...prev, 'new': !prev['new'] }))}
                  >
                    {showUrls['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowAddDb(true)} data-testid="button-add-db">
              <Plus className="w-4 h-4 mr-2" />
              Add Database Connection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sync Direction Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Sync Configuration
          </CardTitle>
          <CardDescription>
            Select source and target databases, then connect to compare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4 items-end">
            <div className="col-span-2">
              <Label>Source Database</Label>
              <Select value={sourceDb} onValueChange={setSourceDb} disabled={isConnected}>
                <SelectTrigger data-testid="select-source-db">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development (Current)</SelectItem>
                  {databases.map(db => (
                    <SelectItem key={db.name} value={db.name}>{db.name} ({db.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <div className="col-span-2">
              <Label>Target Database</Label>
              <Select value={targetDb} onValueChange={setTargetDb} disabled={isConnected}>
                <SelectTrigger data-testid="select-target-db">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {sourceDb !== "development" && (
                    <SelectItem value="development">Development (Current)</SelectItem>
                  )}
                  {databases.filter(db => db.name !== sourceDb).map(db => (
                    <SelectItem key={db.name} value={db.name}>{db.name} ({db.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sourceDb || "Source"}</Badge>
              <ArrowRight className="w-4 h-4" />
              <Badge variant="outline">{targetDb || "Target"}</Badge>
            </div>
            {isConnected ? (
              <Button variant="destructive" onClick={handleDisconnect} data-testid="button-disconnect-db">
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={connectMutation.isPending || !targetDb} data-testid="button-connect-db">
                {connectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Connect & Compare
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Columns className="w-5 h-5" />
                  Schema Comparison
                </CardTitle>
                <CardDescription>Compare table structures between databases</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/db-sync/compare-schema"] });
                  }} disabled={fetchingSchema} data-testid="button-refresh-schema">
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchingSchema ? 'animate-spin' : ''}`} />
                  {fetchingSchema ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => { setSyncType("schema"); setConfirmDialog(true); }}
                  disabled={syncSchemaMutation.isPending || !schemaComparison?.some(s => s.status !== "match")}
                  data-testid="button-sync-schema"
                >
                  {syncSchemaMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Sync Schema
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchema ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : schemaComparison && schemaComparison.length > 0 ? (
                (() => {
                  const tablesWithDifferences = schemaComparison.filter(t => t.status !== "match");
                  const matchingCount = schemaComparison.length - tablesWithDifferences.length;
                  
                  return tablesWithDifferences.length > 0 ? (
                    <div className="space-y-3">
                      {matchingCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-500/10 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{matchingCount} tables are in sync (hidden)</span>
                        </div>
                      )}
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Table</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Dev Columns</TableHead>
                              <TableHead>Prod Columns</TableHead>
                              <TableHead>Differences</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tablesWithDifferences.map((table) => (
                              <TableRow key={table.tableName}>
                                <TableCell className="font-mono text-sm">{table.tableName}</TableCell>
                                <TableCell>{getStatusBadge(table.status)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{table.devColumns?.length || 0}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{table.prodColumns?.length || 0}</TableCell>
                                <TableCell className="text-sm">
                                  {table.missingColumns && table.missingColumns.length > 0 && (
                                    <span className="text-yellow-600">Missing: {table.missingColumns.join(", ")}</span>
                                  )}
                                  {table.extraColumns && table.extraColumns.length > 0 && (
                                    <span className="text-blue-600">Extra: {table.extraColumns.join(", ")}</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-medium">All {schemaComparison.length} tables are in sync!</p>
                      <p className="text-sm text-muted-foreground mt-1">No schema differences found between databases</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No schema comparison data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5" />
                  Data Comparison
                </CardTitle>
                <CardDescription>Compare row counts between development and production databases (read-only view).</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/db-sync/compare-data"] });
                  }} disabled={fetchingData} data-testid="button-refresh-data">
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchingData ? 'animate-spin' : ''}`} />
                  {fetchingData ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : dataComparison && dataComparison.length > 0 ? (
                (() => {
                  const tablesWithDifferences = dataComparison.filter(t => t.devCount !== t.prodCount);
                  const matchingCount = dataComparison.length - tablesWithDifferences.length;
                  
                  return tablesWithDifferences.length > 0 ? (
                    <div className="space-y-3">
                      {matchingCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-500/10 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{matchingCount} tables have matching data (hidden)</span>
                        </div>
                      )}
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Table</TableHead>
                              <TableHead className="text-right">Dev Rows</TableHead>
                              <TableHead className="text-right">Prod Rows</TableHead>
                              <TableHead className="text-right">Difference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tablesWithDifferences.map((table) => (
                              <TableRow key={table.tableName} className={DANGEROUS_TABLES.includes(table.tableName) ? "bg-destructive/5" : ""}>
                                <TableCell className="font-mono text-sm">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      {table.tableName}
                                      {DANGEROUS_TABLES.includes(table.tableName) && (
                                        <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                                      )}
                                    </div>
                                    {tableDependencies[table.tableName]?.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        Depends on: {tableDependencies[table.tableName].slice(0, 3).join(', ')}
                                        {tableDependencies[table.tableName].length > 3 && ` +${tableDependencies[table.tableName].length - 3} more`}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{table.devCount.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono">{table.prodCount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={table.devCount > table.prodCount ? "default" : "secondary"}>
                                    {table.devCount > table.prodCount ? "+" : ""}{(table.devCount - table.prodCount).toLocaleString()}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-medium">All {dataComparison.length} tables have matching data!</p>
                      <p className="text-sm text-muted-foreground mt-1">No data differences found between databases</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data comparison available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Confirm {syncType === "schema" ? "Schema" : "Data"} Sync
            </DialogTitle>
            <DialogDescription>
              {syncType === "schema" ? (
                <>
                  This will sync the database schema from <strong>{syncDirection === "dev_to_prod" ? "Development" : "Production"}</strong> to <strong>{syncDirection === "dev_to_prod" ? "Production" : "Development"}</strong>.
                  <br /><br />
                  This may add or modify tables and columns. Are you sure?
                </>
              ) : (
                <>
                  This will sync data for <strong>{selectedTables.length} table(s)</strong> from <strong>{syncDirection === "dev_to_prod" ? "Development" : "Production"}</strong> to <strong>{syncDirection === "dev_to_prod" ? "Production" : "Development"}</strong>.
                  <br /><br />
                  Existing data may be overwritten. Are you sure?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)} data-testid="button-cancel-sync">
              Cancel
            </Button>
            <Button onClick={handleSync} data-testid="button-confirm-sync">
              Yes, Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
