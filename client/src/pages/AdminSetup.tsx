import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Link } from "wouter";

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);

  const handleSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/sysctrl/seed", {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Setup failed");
      }
      
      const data = await response.json();
      setCredentials(data.credentials?.superAdmin);
      setIsComplete(true);
    } catch (err: any) {
      setError(err.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4">
      <Helmet>
        <title>Admin Setup | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-200/40 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Star className="text-white w-7 h-7" fill="rgba(255,255,255,0.3)" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold tracking-tight uppercase leading-none bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                SAMIKARAN<span className="text-fuchsia-500">.</span>
              </span>
              <span className="text-lg font-bold uppercase text-gray-500">OLYMPIAD</span>
            </div>
          </div>
          <p className="text-gray-500 font-medium">Initial Setup</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-xl shadow-violet-500/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-800 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-violet-500" />
              {isComplete ? "Setup Complete!" : "System Setup"}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {isComplete 
                ? "Your admin account has been created successfully"
                : "Click below to initialize the system and create your admin account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isComplete ? (
              <>
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-sm text-violet-700">
                  This will create the super admin account and sample data for testing.
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}
                
                <Button
                  onClick={handleSetup}
                  disabled={isLoading}
                  className="w-full h-12 brand-gradient text-white font-bold"
                  data-testid="button-run-setup"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Run Setup"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Setup completed successfully!</p>
                </div>

                {credentials && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-bold text-gray-700 mb-3">Your Admin Credentials:</p>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-mono text-sm">{credentials.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Password:</span>
                      <span className="font-mono text-sm">{credentials.password}</span>
                    </div>
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      Please change your password after first login for security.
                    </div>
                  </div>
                )}

                <Link href="/sysctrl/login">
                  <Button className="w-full h-12 brand-gradient text-white font-bold" data-testid="button-go-to-login">
                    Go to Admin Login
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
