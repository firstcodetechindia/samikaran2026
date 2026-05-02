import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, Palette, Bell, Download, Wifi, WifiOff, 
  RefreshCw, Save, Eye, Settings2, Loader2, CheckCircle,
  Monitor, Tablet, Image, Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PWASettings {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: string;
  orientation: string;
  startUrl: string;
  splashDuration: string;
  splashLogoText: string;
  splashSubtext: string;
  installPromptEnabled: boolean;
  offlinePageEnabled: boolean;
  serviceWorkerEnabled: boolean;
  cacheStrategy: string;
}

const defaultSettings: PWASettings = {
  appName: "Samikaran Olympiad",
  shortName: "Samikaran",
  description: "World-class AI-powered Olympiad examination platform",
  themeColor: "#8A2BE2",
  backgroundColor: "#0f172a",
  display: "standalone",
  orientation: "portrait-primary",
  startUrl: "/",
  splashDuration: "900",
  splashLogoText: "SAMIKARAN.",
  splashSubtext: "Olympiad",
  installPromptEnabled: true,
  offlinePageEnabled: true,
  serviceWorkerEnabled: true,
  cacheStrategy: "network-first",
};

export default function PWAManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PWASettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState("general");

  const { data: fetchedSettings, isLoading, isError } = useQuery<PWASettings>({
    queryKey: ["/api/sysctrl/pwa-settings"],
    queryFn: async () => {
      const res = await fetch("/api/sysctrl/pwa-settings", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PWASettings) => {
      const res = await fetch("/api/sysctrl/pwa-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/pwa-settings"] });
      toast({
        title: "Settings Saved",
        description: "PWA settings have been updated successfully. Changes will apply on next app reload.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save PWA settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (fetchedSettings && !saveMutation.isPending) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings, saveMutation.isPending]);

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof PWASettings>(key: K, value: PWASettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer" />
            <div className="h-4 w-72 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-gradient-to-r from-purple-200 via-purple-100 to-purple-200 rounded-full animate-shimmer" />
            <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-shimmer" />
          </div>
        </div>

        {/* Navigation tabs skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"
              style={{ width: `${80 + (i % 3) * 20}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Content card skeleton */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-200 via-purple-100 to-purple-200 rounded-lg animate-shimmer" />
              <div className="space-y-2">
                <div className="h-5 w-36 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
                <div className="h-3 w-56 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form fields skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
                <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-shimmer" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-sm text-muted-foreground">Loading PWA settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PWA Management</h2>
          <p className="text-muted-foreground">
            Configure Progressive Web App settings for mobile experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Smartphone className="w-3 h-3" />
            PWA Active
          </Badge>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="splash" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Splash</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                App Identity
              </CardTitle>
              <CardDescription>
                Configure how your app appears when installed on devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) => updateSetting("appName", e.target.value)}
                    placeholder="Samikaran Olympiad"
                    data-testid="input-pwa-app-name"
                  />
                  <p className="text-xs text-muted-foreground">Full name displayed in app stores</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Short Name</Label>
                  <Input
                    id="shortName"
                    value={settings.shortName}
                    onChange={(e) => updateSetting("shortName", e.target.value)}
                    placeholder="Samikaran"
                    maxLength={12}
                    data-testid="input-pwa-short-name"
                  />
                  <p className="text-xs text-muted-foreground">Displayed under app icon (max 12 chars)</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">App Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => updateSetting("description", e.target.value)}
                  placeholder="World-class AI-powered Olympiad examination platform"
                  rows={3}
                  data-testid="input-pwa-description"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startUrl">Start URL</Label>
                  <Input
                    id="startUrl"
                    value={settings.startUrl}
                    onChange={(e) => updateSetting("startUrl", e.target.value)}
                    placeholder="/"
                    data-testid="input-pwa-start-url"
                  />
                  <p className="text-xs text-muted-foreground">Page shown when app launches</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display">Display Mode</Label>
                  <Select 
                    value={settings.display} 
                    onValueChange={(v) => updateSetting("display", v)}
                  >
                    <SelectTrigger id="display" data-testid="select-pwa-display">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone (No browser UI)</SelectItem>
                      <SelectItem value="fullscreen">Fullscreen</SelectItem>
                      <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                      <SelectItem value="browser">Browser</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Screen Orientation</Label>
                <Select 
                  value={settings.orientation} 
                  onValueChange={(v) => updateSetting("orientation", v)}
                >
                  <SelectTrigger id="orientation" data-testid="select-pwa-orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait-primary">Portrait (Primary)</SelectItem>
                    <SelectItem value="portrait">Portrait (Any)</SelectItem>
                    <SelectItem value="landscape-primary">Landscape (Primary)</SelectItem>
                    <SelectItem value="landscape">Landscape (Any)</SelectItem>
                    <SelectItem value="any">Any Orientation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme Colors
              </CardTitle>
              <CardDescription>
                Customize the color scheme of your PWA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 cursor-pointer shadow-sm"
                      style={{ backgroundColor: settings.themeColor }}
                    />
                    <Input
                      id="themeColor"
                      type="color"
                      value={settings.themeColor}
                      onChange={(e) => updateSetting("themeColor", e.target.value)}
                      className="w-20 h-10 p-1 cursor-pointer"
                      data-testid="input-pwa-theme-color"
                    />
                    <Input
                      value={settings.themeColor}
                      onChange={(e) => updateSetting("themeColor", e.target.value)}
                      className="flex-1"
                      placeholder="#8A2BE2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Browser toolbar and status bar color</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 cursor-pointer shadow-sm"
                      style={{ backgroundColor: settings.backgroundColor }}
                    />
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                      className="w-20 h-10 p-1 cursor-pointer"
                      data-testid="input-pwa-bg-color"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                      className="flex-1"
                      placeholder="#0f172a"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">App background and splash screen color</p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-16 h-28 rounded-lg border shadow-md flex flex-col overflow-hidden"
                      style={{ backgroundColor: settings.backgroundColor }}
                    >
                      <div 
                        className="h-4 w-full"
                        style={{ backgroundColor: settings.themeColor }}
                      />
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">{settings.shortName}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Mobile</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-24 h-16 rounded-md border shadow-md flex flex-col overflow-hidden"
                      style={{ backgroundColor: settings.backgroundColor }}
                    >
                      <div 
                        className="h-3 w-full"
                        style={{ backgroundColor: settings.themeColor }}
                      />
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">{settings.appName}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Tablet</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="splash" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Splash Screen
              </CardTitle>
              <CardDescription>
                Configure the loading screen shown when the app starts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="splashLogoText">Logo Text</Label>
                  <Input
                    id="splashLogoText"
                    value={settings.splashLogoText}
                    onChange={(e) => updateSetting("splashLogoText", e.target.value)}
                    placeholder="SAMIKARAN."
                    data-testid="input-pwa-splash-logo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splashSubtext">Subtext</Label>
                  <Input
                    id="splashSubtext"
                    value={settings.splashSubtext}
                    onChange={(e) => updateSetting("splashSubtext", e.target.value)}
                    placeholder="Olympiad"
                    data-testid="input-pwa-splash-subtext"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Splash Duration: {settings.splashDuration}ms</Label>
                  <span className="text-sm text-muted-foreground">
                    {parseInt(settings.splashDuration) / 1000}s
                  </span>
                </div>
                <Slider
                  value={[parseInt(settings.splashDuration) || 900]}
                  onValueChange={([v]) => updateSetting("splashDuration", v.toString())}
                  min={300}
                  max={2000}
                  step={100}
                  data-testid="slider-pwa-splash-duration"
                />
                <p className="text-xs text-muted-foreground">
                  Time before redirecting to the app (respects reduced motion)
                </p>
              </div>

              <div 
                className="h-48 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: settings.backgroundColor }}
              >
                <div className="text-center animate-fade-in">
                  <div 
                    className="text-3xl font-black tracking-tight mb-1"
                    style={{ 
                      background: `linear-gradient(135deg, ${settings.themeColor}, #FF2FBF)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
                    {settings.splashLogoText}
                  </div>
                  <div 
                    className="text-sm font-medium tracking-widest"
                    style={{ color: settings.themeColor }}
                  >
                    {settings.splashSubtext}
                  </div>
                </div>
                <div className="absolute bottom-4 flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: settings.themeColor }}
                  />
                  <span className="text-xs text-white/60">Loading...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Install & Offline Features
              </CardTitle>
              <CardDescription>
                Control PWA installation prompts and offline capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    <span className="font-medium">Install Prompt</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show custom install prompt to users on supported devices
                  </p>
                </div>
                <Switch
                  checked={settings.installPromptEnabled}
                  onCheckedChange={(v) => updateSetting("installPromptEnabled", v)}
                  data-testid="switch-pwa-install-prompt"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-primary" />
                    <span className="font-medium">Offline Page</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show a custom page when the user is offline
                  </p>
                </div>
                <Switch
                  checked={settings.offlinePageEnabled}
                  onCheckedChange={(v) => updateSetting("offlinePageEnabled", v)}
                  data-testid="switch-pwa-offline-page"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <span className="font-medium">Service Worker</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable caching and background sync
                  </p>
                </div>
                <Switch
                  checked={settings.serviceWorkerEnabled}
                  onCheckedChange={(v) => updateSetting("serviceWorkerEnabled", v)}
                  data-testid="switch-pwa-sw"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cacheStrategy">Cache Strategy</Label>
                <Select 
                  value={settings.cacheStrategy} 
                  onValueChange={(v) => updateSetting("cacheStrategy", v)}
                  disabled={!settings.serviceWorkerEnabled}
                >
                  <SelectTrigger id="cacheStrategy" data-testid="select-pwa-cache-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network-first">Network First (Fresh content)</SelectItem>
                    <SelectItem value="cache-first">Cache First (Fast loading)</SelectItem>
                    <SelectItem value="stale-while-revalidate">Stale While Revalidate (Balanced)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How the app handles caching and network requests
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                PWA Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Manifest</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Service Worker</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Icons</p>
                    <p className="text-xs text-muted-foreground">8 sizes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
