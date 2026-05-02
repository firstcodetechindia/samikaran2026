import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { getSavedRouteForRole, getDefaultRouteForRole } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Star, LogIn, UserPlus, Eye, EyeOff, ArrowRight, Send, Calculator, Atom, BookText, Brain, Lightbulb, ArrowLeft, Timer, X, CheckCircle2, KeyRound, Smartphone, Mail, GraduationCap, School, Building2, Users, AlertTriangle, Monitor } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type RegisterStep = "role" | "email" | "otp";
type LoginMethod = "password" | "otp";
type LoginStep = "selectType" | "input" | "otp";
type LoginUserType = "student" | "school" | "supervisor" | "group";

const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+49", country: "Germany" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
  
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginCountryCode, setLoginCountryCode] = useState("+91");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [loginStep, setLoginStep] = useState<LoginStep>("selectType");
  const [loginUserType, setLoginUserType] = useState<LoginUserType | null>(null);
  const [password, setPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState(["", "", "", "", "", ""]);
  const [loginResendCountdown, setLoginResendCountdown] = useState(0);
  const [loginAlertMessage, setLoginAlertMessage] = useState<string | null>(null);
  
  const loginUserTypes = [
    { id: "student" as LoginUserType, label: "Student", icon: GraduationCap, description: "Login with your Student ID, Email, or Phone", color: "from-purple-500 to-pink-500" },
    { id: "school" as LoginUserType, label: "School", icon: School, description: "School coordinators and administrators", color: "from-blue-500 to-cyan-500" },
    { id: "supervisor" as LoginUserType, label: "Supervisor", icon: Building2, description: "Exam supervisors and invigilators", color: "from-orange-500 to-amber-500" },
    { id: "group" as LoginUserType, label: "Group/Partner", icon: Users, description: "Partner organizations and groups", color: "from-green-500 to-emerald-500" },
  ];
  
    
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  
  const [activeSessionModal, setActiveSessionModal] = useState(false);
  const [activeSessionInfo, setActiveSessionInfo] = useState<{
    lastLoginDevice: string;
    lastLoginAt: string;
  } | null>(null);
  const [forceLogoutPending, setForceLogoutPending] = useState(false);
  
  const triggerShake = (fieldNames: string[]) => {
    setShakeFields(new Set(fieldNames));
    setErrorFields(new Set(fieldNames));
    setTimeout(() => setShakeFields(new Set()), 500);
  };
  
  const clearFieldError = (fieldName: string) => {
    if (errorFields.has(fieldName)) {
      setErrorFields(prev => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  };
  
  const getInputClass = (fieldName: string, baseClass: string = "h-12") => {
    const isShaking = shakeFields.has(fieldName);
    const hasError = errorFields.has(fieldName);
    return `${baseClass} ${isShaking ? "animate-shake" : ""} ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`;
  };

  const olympiads = [
    { name: "Science", icon: Atom, color: "from-green-500 to-emerald-500" },
    { name: "Math", icon: Calculator, color: "from-blue-500 to-indigo-500" },
    { name: "English", icon: BookText, color: "from-orange-500 to-red-500" },
    { name: "Reasoning", icon: Brain, color: "from-purple-500 to-pink-500" },
    { name: "GK", icon: Lightbulb, color: "from-yellow-500 to-amber-500" },
  ];

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isMobile = (value: string) => /^\d{10}$/.test(value);
  const isStudentId = (value: string) => /^SAM\d{8}$/i.test(value);

  useEffect(() => {
    if (loginResendCountdown > 0) {
      const timer = setTimeout(() => setLoginResendCountdown(loginResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginResendCountdown]);

  useEffect(() => {
    if (loginAlertMessage) {
      const timer = setTimeout(() => setLoginAlertMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [loginAlertMessage]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      if (digits.length > 1) {
        const newOtp = [...loginOtp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = digits[i] || "";
        }
        setLoginOtp(newOtp);
        const focusIdx = Math.min(digits.length, 5);
        const nextInput = document.getElementById(`login-otp-${focusIdx}`);
        nextInput?.focus();
        return;
      }
      value = value[0];
    }
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...loginOtp];
    newOtp[index] = value;
    setLoginOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...loginOtp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setLoginOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    const nextInput = document.getElementById(`login-otp-${focusIdx}`);
    nextInput?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !loginOtp[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const sendLoginOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), userType: loginUserType })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.waitTime) {
          return { rateLimited: true, waitTime: data.waitTime, message: data.message };
        }
        throw new Error(data.message || "Failed to send OTP");
      }
      return { rateLimited: false, contactType: data.contactType };
    },
    onSuccess: (data: { rateLimited: boolean; waitTime?: number; message?: string; contactType?: string }) => {
      if (data.rateLimited && data.waitTime) {
        setLoginResendCountdown(data.waitTime);
        setLoginAlertMessage(`Please wait ${data.waitTime} seconds before requesting a new code`);
        setLoginStep("otp");
      } else {
        toast({ title: "Success", description: `Verification code sent to your registered ${data.contactType || "contact"}` });
        setLoginStep("otp");
        setLoginResendCountdown(90);
        setLoginAlertMessage(null);
      }
    },
    onError: (error: Error) => {
      setLoginAlertMessage(error.message);
    }
  });

  const verifyLoginOtpMutation = useMutation({
    mutationFn: async (forceLogout: boolean = false) => {
      const code = loginOtp.join("");
      const res = await fetch("/api/auth/login-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), code, forceLogout })
      });
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        return { ...data, requiresForceLogout: true };
      }
      if (!res.ok) {
        throw new Error(data.message || "Invalid verification code");
      }
      return data;
    },
    onSuccess: (data: { verified?: boolean; success?: boolean; requiresForceLogout?: boolean; activeSessionDetected?: boolean; lastLoginDevice?: string; lastLoginAt?: string; sessionToken?: string; user?: { id: number; email: string; studentId: string | null; firstName: string; lastName: string; userType: string; schoolName: string; gradeLevel: string } }) => {
      if (data.requiresForceLogout && data.activeSessionDetected) {
        setActiveSessionInfo({
          lastLoginDevice: data.lastLoginDevice || 'another device',
          lastLoginAt: data.lastLoginAt || 'unknown time'
        });
        setActiveSessionModal(true);
        setForceLogoutPending(false);
        return;
      }
      
      if (data.verified && data.user) {
        localStorage.setItem("samikaran_user", JSON.stringify(data.user));
        if (data.sessionToken) {
          localStorage.setItem("samikaran_session_token", data.sessionToken);
        }
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.firstName || "User"}!` });
        const userType = data.user?.userType || "student";
        const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
        if (redirectAfterLogin) {
          localStorage.removeItem("redirectAfterLogin");
          setLocation(redirectAfterLogin);
        } else {
          const savedRoute = getSavedRouteForRole(userType);
          setLocation(savedRoute || getDefaultRouteForRole(userType));
        }
      }
    },
    onError: (error: Error) => {
      setForceLogoutPending(false);
      setLoginAlertMessage(error.message);
    }
  });

  
  const handleLoginWithOtp = () => {
    if (!loginIdentifier) {
      setLoginAlertMessage("Please enter your Student ID, email, or mobile number");
      triggerShake(["loginIdentifier"]);
      return;
    }
    if (!isStudentId(loginIdentifier) && !isEmail(loginIdentifier) && !isMobile(loginIdentifier)) {
      setLoginAlertMessage("Please enter a valid Student ID (SAM26XXXXXX), email, or 10-digit mobile number");
      triggerShake(["loginIdentifier"]);
      return;
    }
    sendLoginOtpMutation.mutate();
  };

  const handleVerifyLoginOtp = () => {
    const code = loginOtp.join("");
    if (code.length !== 6) {
      setLoginAlertMessage("Please enter the complete 6-digit code");
      return;
    }
    verifyLoginOtpMutation.mutate(false);
  };

  const handleResendLoginOtp = () => {
    if (loginResendCountdown > 0) return;
    setLoginOtp(["", "", "", "", "", ""]);
    sendLoginOtpMutation.mutate();
  };

  
  const passwordLoginMutation = useMutation({
    mutationFn: async (forceLogout: boolean = false) => {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginIdentifier.trim(), password, userType: loginUserType, forceLogout })
      });
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        return { ...data, requiresForceLogout: true };
      }
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      return data;
    },
    onSuccess: (data: { success?: boolean; requiresForceLogout?: boolean; activeSessionDetected?: boolean; lastLoginDevice?: string; lastLoginAt?: string; sessionToken?: string; user?: { id: number; email: string; firstName: string; lastName: string; userType: string; schoolName: string; gradeLevel: string } }) => {
      if (data.requiresForceLogout && data.activeSessionDetected) {
        setActiveSessionInfo({
          lastLoginDevice: data.lastLoginDevice || 'another device',
          lastLoginAt: data.lastLoginAt || 'unknown time'
        });
        setActiveSessionModal(true);
        setForceLogoutPending(false);
        return;
      }
      
      if (data.user) {
        localStorage.setItem("samikaran_user", JSON.stringify(data.user));
        if (data.sessionToken) {
          localStorage.setItem("samikaran_session_token", data.sessionToken);
        }
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.firstName || "User"}!` });
        
        const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
        if (redirectAfterLogin) {
          localStorage.removeItem("redirectAfterLogin");
          setLocation(redirectAfterLogin);
        } else {
          const savedRoute = getSavedRouteForRole(data.user.userType);
          setLocation(savedRoute || getDefaultRouteForRole(data.user.userType));
        }
      }
    },
    onError: (error: Error) => {
      setForceLogoutPending(false);
      setLoginAlertMessage(error.message);
    }
  });

  const handlePasswordLogin = (forceLogout: boolean = false) => {
    if (!forceLogout) {
      const errors: string[] = [];
      if (!loginIdentifier) {
        errors.push("loginIdentifier");
      }
      if (!password) {
        errors.push("password");
      }
      if (errors.length > 0) {
        triggerShake(errors);
        if (!loginIdentifier) {
          setLoginAlertMessage("Please enter your Student ID, email, or mobile number");
        } else if (!password) {
          setLoginAlertMessage("Please enter your password");
        }
        return;
      }
    }
    passwordLoginMutation.mutate(forceLogout);
  };
  
  const handleForceLogout = () => {
    setForceLogoutPending(true);
    setActiveSessionModal(false);
    if (loginMethod === "otp") {
      verifyLoginOtpMutation.mutate(true);
    } else {
      handlePasswordLogin(true);
    }
  };

  return (
    <div className="min-h-screen education-pattern">
      <Helmet>
        <title>Login | Samikaran Olympiad</title>
        <meta name="description" content="Login to your Samikaran Olympiad account. Access your student dashboard, exam schedules, results, and certificates." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Star className="text-white w-6 h-6" fill="rgba(255,255,255,0.3)" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold leading-none font-serif uppercase tracking-tight">SAMIKARAN<span className="brand-accent">.</span></span>
              <span className="text-base font-bold uppercase font-serif leading-none">OLYMPIAD</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12 px-4">
        <Card className="w-full max-w-xl mx-4 sm:mx-auto shadow-2xl border-0">
          <CardContent className="p-0">
            <div className="flex border-b border-border">
              <button
                onClick={() => { 
                  setLoginStep("selectType"); 
                  setLoginUserType(null); 
                  window.history.replaceState({}, "", "/login");
                }}
                className="flex-1 py-4 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-all brand-gradient text-white"
                data-testid="tab-login"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>
              <Link
                href="/register"
                className="flex-1 py-4 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-all bg-muted/30 text-muted-foreground hover:bg-muted/50"
                data-testid="tab-register"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>

            <div className="p-4 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                  {loginStep === "selectType" ? (
                    <>
                      <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight brand-text mb-2">Login As</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          Select how you want to log in to <span className="font-bold text-primary underline">Samikaran Olympiad</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {loginUserTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => {
                              setLoginUserType(type.id);
                              setLoginStep("input");
                            }}
                            className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg hover:scale-[1.02] text-left"
                            data-testid={`button-login-type-${type.id}`}
                          >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                              <type.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">{type.label}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{type.description}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : loginStep === "input" ? (
                    <>
                      <div className="text-center mb-6 sm:mb-8">
                        <button 
                          onClick={() => { setLoginStep("selectType"); setLoginUserType(null); }}
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Login Options
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight brand-text mb-2">
                          {loginUserType === "student" ? "Student Login" : 
                           loginUserType === "school" ? "School Login" : 
                           loginUserType === "supervisor" ? "Supervisor Login" : 
                           "Partner Login"}
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          Log into your <span className="font-bold text-primary underline">Samikaran Olympiad</span> {loginUserType} account.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-foreground mb-2 block">
                            {loginUserType === "student" ? "Student ID, Email or Mobile" : "Email"} <span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder={loginUserType === "student" ? "SAM26XXXXXX or Email or Mobile" : "Enter your registered email"}
                            value={loginIdentifier}
                            onChange={(e) => { setLoginIdentifier(e.target.value); clearFieldError("loginIdentifier"); }}
                            className={getInputClass("loginIdentifier", "h-12")}
                            data-testid="input-login-identifier"
                          />
                          {loginUserType === "student" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Your Student ID (e.g., SAM26002697), email, or phone number
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm text-center text-muted-foreground font-medium">
                            Login by <span className="font-bold text-foreground">Password</span> or <span className="font-bold text-foreground">OTP</span>
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setLoginMethod("password")}
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                loginMethod === "password" 
                                  ? "brand-gradient text-white shadow-xl scale-[1.02] ring-4 ring-primary/20" 
                                  : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                              }`}
                              data-testid="button-login-method-password"
                            >
                              <KeyRound className="w-5 h-5" />
                              Password
                            </button>
                            <div className="flex flex-col items-center">
                              <div className="w-px h-3 bg-border"></div>
                              <span className="text-xs font-black text-muted-foreground px-2">OR</span>
                              <div className="w-px h-3 bg-border"></div>
                            </div>
                            <button
                              onClick={() => setLoginMethod("otp")}
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                loginMethod === "otp" 
                                  ? "brand-gradient text-white shadow-xl scale-[1.02] ring-4 ring-primary/20" 
                                  : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                              }`}
                              data-testid="button-login-method-otp"
                            >
                              <Smartphone className="w-5 h-5" />
                              OTP
                            </button>
                          </div>
                        </div>

                        {loginMethod === "password" ? (
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-foreground mb-2 block">
                              Password <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your Password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                                className={getInputClass("password", "h-12 pr-12")}
                                data-testid="input-login-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            <div className="text-right mt-2">
                              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium" data-testid="link-forgot-password">
                                Forgot Password?
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-xl text-center">
                            <p className="text-sm text-muted-foreground">
                              Click the button below to receive a one-time password on your {isEmail(loginIdentifier) ? "email" : "mobile"}.
                            </p>
                          </div>
                        )}
                      </div>

                      {loginMethod === "password" ? (
                        <Button
                          onClick={() => handlePasswordLogin()}
                          disabled={passwordLoginMutation.isPending}
                          className="w-full h-12 brand-button rounded-xl font-black text-sm uppercase tracking-widest"
                          data-testid="button-login-submit"
                        >
                          {passwordLoginMutation.isPending ? "Logging in..." : <>Login <ArrowRight className="ml-2 w-4 h-4" /></>}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleLoginWithOtp}
                          disabled={sendLoginOtpMutation.isPending}
                          className="w-full h-12 brand-button rounded-xl font-black text-sm uppercase tracking-widest"
                          data-testid="button-send-login-otp"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sendLoginOtpMutation.isPending ? "Sending..." : "Send OTP"}
                        </Button>
                      )}

                      {loginAlertMessage && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-login-error">
                          <span className="text-sm text-destructive font-medium">{loginAlertMessage}</span>
                          <button onClick={() => setLoginAlertMessage(null)} className="text-destructive/60 hover:text-destructive ml-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight brand-text mb-2">Verify OTP</h1>
                        <p className="text-muted-foreground text-sm">
                          We've sent a 6-digit code to <span className="font-bold text-primary">{isEmail(loginIdentifier) ? loginIdentifier : `${loginCountryCode}${loginIdentifier}`}</span>
                        </p>
                      </div>

                      <div className="flex justify-center gap-2 mb-6">
                        {loginOtp.map((digit, index) => (
                          <Input
                            key={index}
                            id={`login-otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            className="w-12 h-14 text-center text-2xl font-bold"
                            data-testid={`input-login-otp-${index}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                        <Timer className="w-4 h-4" />
                        {loginResendCountdown > 0 ? (
                          <span>Resend code in {loginResendCountdown}s</span>
                        ) : (
                          <button 
                            onClick={handleResendLoginOtp}
                            className="text-primary hover:underline font-medium"
                            disabled={sendLoginOtpMutation.isPending}
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => { setLoginStep("input"); setLoginOtp(["", "", "", "", "", ""]); }}
                          className="flex-1 h-12 rounded-xl font-bold"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={handleVerifyLoginOtp}
                          disabled={verifyLoginOtpMutation.isPending || loginOtp.join("").length !== 6}
                          className="flex-1 h-12 brand-button rounded-xl font-black text-sm uppercase tracking-widest"
                          data-testid="button-verify-login-otp"
                        >
                          {verifyLoginOtpMutation.isPending ? "Verifying..." : "Login"}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={activeSessionModal} onOpenChange={setActiveSessionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-xl font-black uppercase tracking-tight">
              Already Logged In
            </DialogTitle>
            <DialogDescription className="text-center">
              You are already logged in on another device or browser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Device</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeSessionInfo?.lastLoginDevice || 'Unknown device'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-xs text-muted-foreground">
                  {activeSessionInfo?.lastLoginAt 
                    ? new Date(activeSessionInfo.lastLoginAt).toLocaleString()
                    : 'Unknown time'}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            To continue login here, you must logout from the other session. This will end your session on the other device.
          </p>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveSessionModal(false)}
              className="flex-1"
              data-testid="button-cancel-force-logout"
            >
              Cancel
            </Button>
            <Button
              onClick={handleForceLogout}
              disabled={forceLogoutPending}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              data-testid="button-force-logout"
            >
              {forceLogoutPending ? "Logging out..." : "Logout & Continue Here"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
