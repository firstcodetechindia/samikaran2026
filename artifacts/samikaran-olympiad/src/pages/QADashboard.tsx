import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import QATestingSection from "@/components/QATestingSection";
import { Star } from "lucide-react";

export default function QADashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("qaLoggedIn") === "true";
    if (!isLoggedIn) {
      toast({
        title: "Access Denied",
        description: "Please login to access the QA Dashboard.",
        variant: "destructive",
      });
      setLocation("/qalogin");
    }
  }, [setLocation, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("qaLoggedIn");
    sessionStorage.removeItem("qaUserEmail");
    sessionStorage.removeItem("platformControlOtpVerified");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    setLocation("/qalogin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <Helmet>
        <title>QA Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest text-emerald-600">SAMIKARAN.</div>
                <div className="text-lg font-semibold text-gray-800">QA & Testing</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {sessionStorage.getItem("qaUserEmail")}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                data-testid="button-qa-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QATestingSection />
      </main>
    </div>
  );
}
