import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Users, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Building2, Star, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type LoginStep = "credentials" | "otp";

export default function EmployeeLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<{ firstName: string; lastName: string; role?: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("employeeAuth");
    if (stored) {
      setLocation("/employee/dashboard");
    }
  }, [setLocation]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/employee/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({ title: "Login Failed", description: data.message || "Invalid credentials", variant: "destructive" });
        return;
      }
      
      if (data.requiresOtp) {
        setPendingToken(data.pendingToken);
        setAdminInfo({ firstName: data.firstName, lastName: data.lastName, role: data.roleName });
        setStep("otp");
        toast({ title: "Verification Required", description: "Please enter the OTP" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Login failed. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/employee/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, otp }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({ title: "Verification Failed", description: data.message || "Invalid OTP", variant: "destructive" });
        return;
      }
      
      localStorage.setItem("employeeAuth", JSON.stringify({
        id: data.admin.id,
        role: data.admin.role,
        roleName: data.admin.roleName,
        email: data.admin.email,
        firstName: data.admin.firstName,
        lastName: data.admin.lastName,
        sessionToken: data.sessionToken
      }));
      
      toast({ title: "Welcome!", description: `Logged in as ${data.admin.roleName || "Employee"}` });
      setLocation("/employee/dashboard");
    } catch (err) {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Employee Login | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-400/20 rounded-full blur-[80px]"
      />

      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-indigo-100 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
              <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow">
                <Star className="text-white w-4 h-4" fill="rgba(255,255,255,0.3)" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight font-serif leading-none">SAMIKARAN.</span>
                <span className="text-[10px] font-bold uppercase font-serif leading-none">OLYMPIAD</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-indigo-700 font-semibold">Employee Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900" data-testid="button-back-home">
                <Home className="w-3 h-3" />
                Home
              </button>
            </Link>
            <span className="text-xs font-mono text-gray-500">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30"
          >
            <Users className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
          <p className="text-gray-500 mt-1">Samikaran Olympiad Platform</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === "credentials" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="input-employee-email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    data-testid="input-employee-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
                data-testid="button-employee-login"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Welcome, {adminInfo?.firstName}!
                </h3>
                {adminInfo?.role && (
                  <p className="text-sm text-indigo-600 font-medium mt-1">{adminInfo.role}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Enter the 6-digit verification code</p>
              </div>
              
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  data-testid="input-employee-otp"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <Button
                onClick={handleOtpVerify}
                disabled={isLoading || otp.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600"
                data-testid="button-employee-verify-otp"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify & Login"
                )}
              </Button>
              
              <button
                onClick={() => { setStep("credentials"); setOtp(""); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </button>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
