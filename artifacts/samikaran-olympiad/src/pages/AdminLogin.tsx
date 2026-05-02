import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Mail, Eye, EyeOff, KeyRound, ArrowRight, Loader2, Fingerprint, AlertTriangle, CheckCircle2, Server, Cpu, Radio, Star, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type LoginStep = "credentials" | "otp";

export default function AdminLogin() {
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
  const [adminInfo, setAdminInfo] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/sysctrl/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({ title: "Login Failed", description: data.message || "Invalid credentials", variant: "destructive" });
        return;
      }
      
      if (data.requiresOtp) {
        setPendingToken(data.pendingToken);
        setAdminInfo({ firstName: data.firstName, lastName: data.lastName });
        setStep("otp");
        toast({ title: "Verification Required", description: "Please enter the OTP sent to your device" });
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
      const response = await fetch("/sysctrl/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({ title: "Verification Failed", description: data.message || "Invalid OTP", variant: "destructive" });
        return;
      }
      
      localStorage.setItem("superAdminAuth", JSON.stringify({
        id: data.admin.id,
        role: data.admin.role,
        email: data.admin.email,
        firstName: data.admin.firstName,
        lastName: data.admin.lastName,
        sessionToken: data.sessionToken
      }));
      
      toast({ title: "Welcome!", description: "Login successful" });
      setLocation("/sysctrl/console");
    } catch (err) {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Admin Login | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Animated glow orbs */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-400/30 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-400/25 rounded-full blur-[100px]"
      />

      {/* Top status bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-red-200 z-50 shadow-sm">
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
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-600 font-mono uppercase tracking-wider font-semibold">Restricted Access</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-gray-500">
              <Server className="w-3 h-3" />
              <span className="text-xs font-mono">SYS_CTRL</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900" data-testid="button-back-home">
                <Home className="w-3 h-3" />
                Home
              </button>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-gray-500">
              <Cpu className="w-3 h-3" />
              <span className="text-xs font-mono">ENCRYPTED</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <Radio className="w-3 h-3" />
              <span className="text-xs font-mono font-semibold">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mt-12"
      >
        {/* Logo and header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6">
              {/* Outer rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-2 border-dashed border-violet-400/50 rounded-full"
              />
              {/* Inner pulsing shield */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-red-500 via-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/30 relative"
              >
                <Shield className="text-white w-10 h-10" />
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-white/30 rounded-2xl"
                />
              </motion.div>
            </div>
            
            <div className="space-y-1">
              <span className="text-3xl font-black tracking-[0.2em] text-gray-800">
                SAMIKARAN<span className="text-red-500">.</span>
              </span>
              <div className="text-sm font-bold tracking-[0.5em] text-violet-600">OLYMPIAD</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-amber-600 font-mono text-sm uppercase tracking-wider font-semibold">Super Admin Portal</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </motion.div>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          {/* Card border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-red-400 via-violet-400 to-red-400 rounded-2xl opacity-40 blur-sm" />
          
          <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
            {/* Card header with security level */}
            <div className="bg-gradient-to-r from-red-50 via-violet-50 to-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 font-bold">
                      {step === "credentials" ? "Identity Verification" : "2FA Authentication"}
                    </h2>
                    <p className="text-xs text-gray-500">Security Level: Maximum</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 h-4 bg-red-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === "credentials" ? (
                  <motion.form
                    key="credentials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handlePasswordLogin}
                    className="space-y-5"
                    noValidate
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium text-sm flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-violet-600" />
                        Administrator ID
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 h-12 font-mono"
                          data-testid="input-email"
                        />
                        <div className="absolute inset-0 rounded-md border border-violet-500/0 group-focus-within:border-violet-500/50 pointer-events-none transition-colors" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium text-sm flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-violet-600" />
                        Access Key
                      </Label>
                      <div className="relative group">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 h-12 font-mono pr-12"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Security indicators */}
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>256-bit SSL</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>2FA Enabled</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Encrypted</span>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-red-600 via-violet-600 to-red-600 hover:from-red-700 hover:via-violet-700 hover:to-red-700 text-white font-bold uppercase tracking-wider shadow-lg shadow-violet-500/25 border-0"
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Authenticate</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {adminInfo && (
                      <div className="text-center p-4 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-xl border border-violet-200">
                        <div className="w-12 h-12 bg-violet-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Identity Confirmed</p>
                        <p className="font-bold text-gray-800 text-lg">{adminInfo.firstName} {adminInfo.lastName}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-center text-gray-500 text-sm mb-4">Enter 6-digit verification code</p>
                      <div className="flex justify-center">
                        <InputOTP
                          value={otp}
                          onChange={setOtp}
                          maxLength={6}
                          data-testid="input-otp"
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className="w-12 h-14 text-xl bg-gray-50 border-gray-300 text-gray-800 focus:border-violet-500 focus:ring-violet-500/20 font-mono"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-violet-500 flex-shrink-0" />
                      <p className="text-violet-700 text-xs">
                        A verification code has been sent to your registered email address.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("credentials")}
                        className="flex-1 h-12 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white"
                        data-testid="button-back-to-login"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleOtpVerify}
                        disabled={isLoading || otp.length !== 6}
                        className="flex-1 h-12 bg-gradient-to-r from-red-600 via-violet-600 to-red-600 hover:from-red-700 hover:via-violet-700 hover:to-red-700 text-white font-bold uppercase tracking-wider border-0"
                        data-testid="button-verify-otp"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected Access Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-600 font-mono font-semibold">SECURE</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 text-xs font-mono font-semibold">
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
          </p>
          <p className="text-gray-400 text-xs mt-1">
            All activities are monitored and logged
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
