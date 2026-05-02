import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy-load all non-home pages and heavy widgets
const ChatWidget = lazy(() => import("@/components/ChatWidget"));
const Register = lazy(() => import("@/pages/Register"));
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ServerError = lazy(() => import("@/pages/server-error"));
const Forbidden = lazy(() => import("@/pages/error-403"));
const Unauthorized = lazy(() => import("@/pages/error-401"));
const ServiceUnavailable = lazy(() => import("@/pages/error-503"));
const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("@/pages/TermsAndConditionsPage"));
const RefundPolicyPage = lazy(() => import("@/pages/RefundPolicyPage"));

// Lazy load only heavy dashboard pages
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const SupervisorDashboard = lazy(() => import("@/pages/SupervisorDashboard"));
const SchoolDashboard = lazy(() => import("@/pages/SchoolDashboard"));
const GroupDashboard = lazy(() => import("@/pages/GroupDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const PartnerDashboard = lazy(() => import("@/pages/PartnerDashboard"));
const SecureExam = lazy(() => import("@/pages/SecureExam"));

const ExamTake = lazy(() => import("@/pages/ExamTake"));
const CmsPage = lazy(() => import("@/pages/CmsPage"));
const BlogListPage = lazy(() => import("@/pages/BlogListPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const PartnersPage = lazy(() => import("@/pages/PartnersPage"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminSetup = lazy(() => import("@/pages/AdminSetup"));
const PartnerLogin = lazy(() => import("@/pages/PartnerLogin"));
const EmployeeLogin = lazy(() => import("@/pages/EmployeeLogin"));
const EmployeeDashboard = lazy(() => import("@/pages/EmployeeDashboard"));
const ManualQuestionPage = lazy(() => import("@/pages/ManualQuestionPage"));
const AudioOlympiadDemo = lazy(() => import("@/pages/AudioOlympiadDemo"));
const OlympiadDetail = lazy(() => import("@/pages/OlympiadDetail"));
const PerformanceReport = lazy(() => import("@/pages/PerformanceReport"));
const CertificateDownload = lazy(() => import("@/pages/CertificateDownload"));
const QALogin = lazy(() => import("@/pages/QALogin"));
const QADashboard = lazy(() => import("@/pages/QADashboard"));
const OlympiadRegister = lazy(() => import("@/pages/OlympiadRegister"));
const AllOlympiads = lazy(() => import("@/pages/AllOlympiads"));
const BrandPage = lazy(() => import("@/pages/BrandPage"));
const BrandAssetsPdf = lazy(() => import("@/pages/BrandAssetsPdf"));
const AwardsPage = lazy(() => import("@/pages/AwardsPage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="w-[72px] h-[72px] mb-5" style={{ animation: 'splashPulse 1.5s ease-in-out infinite' }}>
          <defs>
            <linearGradient id="pageGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#9333EA' }} />
              <stop offset="50%" style={{ stopColor: '#C026D3' }} />
              <stop offset="100%" style={{ stopColor: '#EC4899' }} />
            </linearGradient>
            <linearGradient id="pageGradDown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#A855F7' }} />
              <stop offset="100%" style={{ stopColor: '#F472B6' }} />
            </linearGradient>
          </defs>
          <polygon points="36,7 64,54 8,54" fill="url(#pageGradUp)" />
          <polygon points="36,65 8,18 64,18" fill="url(#pageGradDown)" opacity="0.88" />
          <rect x="23" y="32" width="26" height="3.6" rx="1.8" fill="white" />
          <rect x="23" y="38" width="26" height="3.6" rx="1.8" fill="white" />
        </svg>
        <p style={{ color: 'white', fontSize: '32px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '3px', fontFamily: 'Roboto, sans-serif' }}>SAMIKARAN.</p>
        <p style={{ color: '#a855f7', fontSize: '24px', fontWeight: 500, margin: 0, letterSpacing: '5px', textTransform: 'uppercase' as const, fontFamily: 'Roboto, sans-serif' }}>OLYMPIAD</p>
      </div>
    </div>
  );
}

const LAST_VISITED_KEY = "lastVisitedRoute";
const PUBLIC_ROUTES = ["/", "/login", "/register", "/sysctrl/login", "/sysctrl/setup", "/partner/login", "/blog", "/partners", "/become-a-partner", "/maintenance", "/coming-soon", "/olympiads", "/about", "/awards"];
const EXCLUDED_FROM_PERSISTENCE = ["/exam/", "/secure-exam/", "/pre-exam/"];

const ROLE_ROUTE_MAP: Record<string, string[]> = {
  student: ["/dashboard", "/student-dashboard", "/exam/", "/secure-exam/"],
  supervisor: ["/supervisor"],
  group: ["/group"],
  school: ["/school"],
  admin: ["/admin"],
  partner: ["/partner/dashboard"],
  superadmin: ["/sysctrl/console", "/super-admin"],
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/login": "Login",
  "/register": "Register",
  "/dashboard": "Student Dashboard",
  "/student-dashboard": "Student Dashboard",
  "/supervisor": "Supervisor Dashboard",
  "/school": "School Dashboard",
  "/group": "Partner Dashboard",
  "/admin": "Admin Dashboard",
  "/sysctrl/login": "Admin Login",
  "/sysctrl/setup": "Admin Setup",
  "/sysctrl/console": "Super Admin Console",
  "/blog": "Blog",
  "/partners": "Become a Partner",
  "/become-a-partner": "Become a Partner",
  "/partner/login": "Partner Login",
  "/partner/dashboard": "Partner Dashboard",
  "/employee/login": "Employee Login",
  "/employee/dashboard": "Employee Dashboard",
  "/qalogin": "QA Login",
  "/qa-dashboard": "QA Dashboard",
  "/awards": "Awards & Recognition",
  "/brand": "Brand Guidelines",
  "/olympiads": "All Olympiads",
  "/verify": "Certificate Verification",
  "/certificate": "Download Certificate",
  "/maintenance": "Under Maintenance",
  "/coming-soon": "Coming Soon",
  "/404": "Page Not Found",
  "/403": "Access Denied",
  "/401": "Unauthorized",
  "/503": "Service Unavailable",
  "/server-error": "Server Error",
};

function RouteTracker() {
  const [location, setLocation] = useLocation();
  const hasRestored = useRef(false);

  useEffect(() => {
    const isExcluded = EXCLUDED_FROM_PERSISTENCE.some(prefix => location.startsWith(prefix));
    if (!PUBLIC_ROUTES.includes(location) && !location.startsWith("/blog/") && !isExcluded) {
      localStorage.setItem(LAST_VISITED_KEY, location);
    }

    const title = PAGE_TITLES[location];
    if (title) {
      document.title = `${title} | Samikaran Olympiad`;
    } else if (location.startsWith("/blog/")) {
      document.title = "Blog | Samikaran Olympiad";
    } else if (location.startsWith("/olympiad/")) {
      document.title = "Olympiad Details | Samikaran Olympiad";
    } else if (location.startsWith("/exam/") || location.startsWith("/secure-exam/")) {
      document.title = "Exam | Samikaran Olympiad";
    } else {
      document.title = "Samikaran Olympiad";
    }

    // SPA page_view tracking — only for public pages, never for admin/private
    const isPrivate = typeof (window as any)._gaIsPrivate === 'function'
      ? (window as any)._gaIsPrivate(location)
      : false;
    if (!isPrivate && (window as any)._gaLoaded && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const storedUser = localStorage.getItem("samikaran_user");
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      if (!user?.userType) return;

      if (location === "/" || location === "/login") {
        const savedRoute = getSavedRouteForRole(user.userType);
        if (savedRoute) {
          setLocation(savedRoute);
        } else {
          setLocation(getDefaultRouteForRole(user.userType));
        }
      }
    } catch {
      // Invalid stored user, ignore
    }
  }, []);

  return null;
}

function isRouteAllowedForRole(route: string, userType: string): boolean {
  const allowedPrefixes = ROLE_ROUTE_MAP[userType] || [];
  return allowedPrefixes.some(prefix => route.startsWith(prefix));
}

function getDefaultRouteForRole(userType: string): string {
  switch (userType) {
    case "student": return "/dashboard";
    case "supervisor": return "/supervisor";
    case "group": return "/group";
    case "school": return "/school";
    case "admin": return "/admin";
    case "partner": return "/partner/dashboard";
    case "superadmin": return "/sysctrl/console";
    default: return "/";
  }
}

function getSavedRouteForRole(userType: string): string | null {
  const savedRoute = localStorage.getItem(LAST_VISITED_KEY);
  if (!savedRoute || savedRoute === "/" || savedRoute === "/login") return null;
  
  // Don't restore exam routes - always go to dashboard instead
  const isExcludedRoute = EXCLUDED_FROM_PERSISTENCE.some(prefix => savedRoute.startsWith(prefix));
  if (isExcludedRoute) {
    localStorage.removeItem(LAST_VISITED_KEY); // Clear the invalid route
    return null;
  }
  
  if (isRouteAllowedForRole(savedRoute, userType)) {
    return savedRoute;
  }
  return null;
}

function clearLastVisitedRoute() {
  localStorage.removeItem(LAST_VISITED_KEY);
}

export { clearLastVisitedRoute, getSavedRouteForRole, getDefaultRouteForRole };

interface PlatformStatus {
  comingSoonEnabled: boolean;
  maintenanceMode: boolean;
}

const SUPER_ADMIN_ROUTES = [
  "/sysctrl/login",
  "/sysctrl/setup", 
  "/sysctrl/console",
  "/sysctrl/questions",
  "/super-admin",
  "/maintenance",
  "/503",
];

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: status, isLoading } = useQuery<PlatformStatus>({
    queryKey: ["/api/public/platform-status"],
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="w-[72px] h-[72px] mb-5" style={{ animation: 'splashPulse 1.5s ease-in-out infinite' }}>
            <defs>
              <linearGradient id="reactGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#9333EA' }} />
                <stop offset="50%" style={{ stopColor: '#C026D3' }} />
                <stop offset="100%" style={{ stopColor: '#EC4899' }} />
              </linearGradient>
              <linearGradient id="reactGradDown" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#A855F7' }} />
                <stop offset="100%" style={{ stopColor: '#F472B6' }} />
              </linearGradient>
            </defs>
            <polygon points="36,7 64,54 8,54" fill="url(#reactGradUp)" />
            <polygon points="36,65 8,18 64,18" fill="url(#reactGradDown)" opacity="0.88" />
            <rect x="23" y="32" width="26" height="3.6" rx="1.8" fill="white" />
            <rect x="23" y="38" width="26" height="3.6" rx="1.8" fill="white" />
          </svg>
          <p style={{ color: 'white', fontSize: '32px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '3px', fontFamily: 'Roboto, sans-serif' }}>SAMIKARAN.</p>
          <p style={{ color: '#a855f7', fontSize: '24px', fontWeight: 500, margin: 0, letterSpacing: '5px', textTransform: 'uppercase' as const, fontFamily: 'Roboto, sans-serif' }}>OLYMPIAD</p>
        </div>
      </div>
    );
  }

  if (status?.maintenanceMode) {
    const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some(route => 
      location === route || location.startsWith(route + "/")
    );
    
    if (!isSuperAdminRoute) {
      return <MaintenancePage />;
    }
  }

  return <>{children}</>;
}

function HomeWithStatus() {
  const { data: status } = useQuery<PlatformStatus>({
    queryKey: ["/api/public/platform-status"],
    staleTime: 60000,
  });

  if (status?.comingSoonEnabled && !status?.maintenanceMode) {
    return <ComingSoonPage />;
  }

  return <Home />;
}

function SysctrlRedirect() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (location === "/sysctrl" || location === "/sysctrl/") {
      setLocation("/sysctrl/login", { replace: true });
    }
  }, [location, setLocation]);
  return null;
}

function Router() {
  return (
    <MaintenanceGuard>
      <SysctrlRedirect />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={HomeWithStatus} />
          <Route path="/maintenance" component={MaintenancePage} />
          <Route path="/coming-soon" component={ComingSoonPage} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard/:tab?" component={StudentDashboard} />
          <Route path="/student-dashboard/:tab?" component={StudentDashboard} />
          <Route path="/supervisor" component={SupervisorDashboard} />
          <Route path="/school/:tab?" component={SchoolDashboard} />

          <Route path="/group/:tab?" component={GroupDashboard} />
          <Route path="/exam/:id" component={ExamTake} />
          <Route path="/secure-exam/:examId/:attemptId" component={SecureExam} />
          <Route path="/secure-exam/:examId" component={SecureExam} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/sysctrl/login" component={AdminLogin} />
          <Route path="/sysctrl/setup" component={AdminSetup} />
          <Route path="/sysctrl/console" component={SuperAdminDashboard} />
          <Route path="/sysctrl/questions/create" component={ManualQuestionPage} />
          <Route path="/super-admin" component={SuperAdminDashboard} />
          <Route path="/blog" component={BlogListPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/verify" component={PerformanceReport} />
          <Route path="/certificate" component={CertificateDownload} />
          <Route path="/partners" component={PartnersPage} />
          <Route path="/become-a-partner" component={PartnersPage} />
          <Route path="/partner/login" component={PartnerLogin} />
          <Route path="/partner/dashboard/:tab?" component={PartnerDashboard} />
          <Route path="/employee/login" component={EmployeeLogin} />
          <Route path="/employee/dashboard" component={EmployeeDashboard} />
          <Route path="/qalogin" component={QALogin} />
          <Route path="/qa-dashboard" component={QADashboard} />
          <Route path="/server-error" component={ServerError} />
          <Route path="/404" component={NotFound} />
          <Route path="/403" component={Forbidden} />
          <Route path="/401" component={Unauthorized} />
          <Route path="/503" component={ServiceUnavailable} />
          <Route path="/audio-olympiad-demo" component={AudioOlympiadDemo} />
          <Route path="/awards" component={AwardsPage} />
          <Route path="/brand" component={BrandPage} />
          <Route path="/brand/assets" component={BrandAssetsPdf} />
          <Route path="/olympiads" component={AllOlympiads} />
          <Route path="/olympiad/:slug" component={OlympiadDetail} />
          <Route path="/olympiad/:examId/register" component={OlympiadRegister} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/terms-and-conditions" component={TermsAndConditionsPage} />
          <Route path="/refund-policy" component={RefundPolicyPage} />
          <Route path="/:slug" component={CmsPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </MaintenanceGuard>
  );
}

function ChatWidgetWrapper() {
  const [location] = useLocation();
  
  const hiddenPaths = [
    "/sysctrl",
    "/super-admin",
    "/admin",
    "/employee",
    "/exam/",
    "/secure-exam",
    "/maintenance",
    "/coming-soon",
    "/dashboard",
    "/student-dashboard",
    "/partner/dashboard",
    "/school",
    "/supervisor",
    "/group",
    "/profile",
    "/qa-dashboard",
  ];
  
  const shouldHide = hiddenPaths.some(path => location.startsWith(path));
  
  if (shouldHide) return null;
  
  return (
    <Suspense fallback={null}>
      <ChatWidget />
    </Suspense>
  );
}

function App() {
  // Hide splash immediately after first paint
  useEffect(() => {
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined' && (window as any).hideSplash) {
        (window as any).hideSplash();
      }
    });
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <RouteTracker />
            <ScrollToTop />
            <Toaster />
            <Router />
            <PWAInstallPrompt />
            <ChatWidgetWrapper />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
