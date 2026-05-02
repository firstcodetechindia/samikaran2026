import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle2, ShieldCheck, X, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.waitTime) {
          return { rateLimited: true, waitTime: data.waitTime };
        }
        if (res.status === 404) {
          throw new Error("NOT_REGISTERED");
        }
        throw new Error(data.message || "Failed to send verification code");
      }
      return { rateLimited: false };
    },
    onSuccess: (data) => {
      setNotRegistered(false);
      if (data.rateLimited && data.waitTime) {
        setResendCountdown(data.waitTime);
        setStep("otp");
      } else {
        toast({ title: "Code Sent", description: "Verification code sent to your email" });
        setStep("otp");
        setResendCountdown(90);
      }
      setAlertMessage(null);
    },
    onError: (error: Error) => {
      if (error.message === "NOT_REGISTERED") {
        setNotRegistered(true);
        setAlertMessage(null);
      } else {
        setNotRegistered(false);
        setAlertMessage(error.message);
      }
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const code = otp.join("");
      if (code.length !== 6) throw new Error("Please enter the complete 6-digit code");

      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid verification code");
      return data;
    },
    onSuccess: (data: any) => {
      setAlertMessage(null);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
      setStep("newPassword");
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      return data;
    },
    onSuccess: () => {
      setStep("success");
      setAlertMessage(null);
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const passwordChecks = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Number", met: /\d/.test(newPassword) },
    { label: "Special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];
  const allPasswordChecksMet = passwordChecks.every(c => c.met);

  const renderEmailStep = () => (
    <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold" data-testid="text-forgot-title">Forgot Password?</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your registered email to receive a verification code</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold uppercase tracking-wide">Email Address *</label>
          <Input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setNotRegistered(false); setAlertMessage(null); }}
            className="mt-1"
            data-testid="input-forgot-email"
          />
        </div>
        <Button
          className="w-full brand-gradient text-white font-bold py-6"
          onClick={() => {
            if (!email.trim() || !email.includes("@")) {
              setAlertMessage("Please enter a valid email address");
              setNotRegistered(false);
              return;
            }
            setAlertMessage(null);
            setNotRegistered(false);
            sendOtpMutation.mutate();
          }}
          disabled={sendOtpMutation.isPending}
          data-testid="button-send-code"
        >
          {sendOtpMutation.isPending ? "Checking..." : "Send Verification Code"}
        </Button>

        {notRegistered && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200" data-testid="text-not-registered">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <X className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">No account found</p>
                <p className="text-xs text-amber-700 mt-1">
                  This email is not registered on Samikaran Olympiad. Please register first to create your account.
                </p>
                <Link href="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold"
                    data-testid="button-go-register"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {alertMessage && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-alert">
            <span className="text-sm text-destructive font-medium">{alertMessage}</span>
            <button onClick={() => setAlertMessage(null)} className="text-destructive/60 hover:text-destructive ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="text-sm text-primary hover:underline font-medium" data-testid="link-back-login">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );

  const renderOtpStep = () => (
    <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold">Verify Your Email</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit code sent to <strong>{email}</strong></p>
      </div>

      {alertMessage && (
        <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-alert">
          <span className="text-sm text-destructive font-medium">{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-destructive/60 hover:text-destructive ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className="w-12 h-14 text-center text-xl font-bold"
            data-testid={`input-otp-${i}`}
          />
        ))}
      </div>

      <Button
        className="w-full brand-gradient text-white font-bold py-6 mb-3"
        onClick={() => {
          const code = otp.join("");
          if (code.length !== 6) {
            setAlertMessage("Please enter the complete 6-digit code");
            return;
          }
          setAlertMessage(null);
          verifyOtpMutation.mutate();
        }}
        disabled={verifyOtpMutation.isPending}
        data-testid="button-verify-code"
      >
        {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Continue"}
      </Button>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => { setStep("email"); setAlertMessage(null); setOtp(["", "", "", "", "", ""]); }} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          {resendCountdown > 0 ? (
            <span>Resend code in <strong className="text-primary">{resendCountdown}s</strong></span>
          ) : (
            <button onClick={() => { setOtp(["", "", "", "", "", ""]); setAlertMessage(null); sendOtpMutation.mutate(); }} className="text-primary hover:underline font-medium" disabled={sendOtpMutation.isPending} data-testid="button-resend">
              Resend Code
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderNewPasswordStep = () => (
    <motion.div key="newPassword" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold">Set New Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Create a strong password for your account</p>
      </div>

      {alertMessage && (
        <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-alert">
          <span className="text-sm text-destructive font-medium">{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-destructive/60 hover:text-destructive ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold uppercase tracking-wide">New Password *</label>
          <div className="relative mt-1">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {passwordChecks.map((check, i) => (
            <div key={i} className={`text-xs flex items-center gap-1 ${check.met ? "text-green-600" : "text-muted-foreground"}`}>
              <CheckCircle2 className={`w-3 h-3 ${check.met ? "text-green-600" : "text-gray-300"}`} />
              {check.label}
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-semibold uppercase tracking-wide">Confirm Password *</label>
          <div className="relative mt-1">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
          )}
        </div>

        <Button
          className="w-full brand-gradient text-white font-bold py-6"
          onClick={() => {
            setAlertMessage(null);
            resetPasswordMutation.mutate();
          }}
          disabled={resetPasswordMutation.isPending || !allPasswordChecksMet || newPassword !== confirmPassword}
          data-testid="button-reset-password"
        >
          {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
        </Button>

        <div className="text-center">
          <Button variant="outline" onClick={() => { setStep("otp"); setAlertMessage(null); }} data-testid="button-back-otp">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-700">Password Reset Successful!</h2>
        <p className="text-sm text-muted-foreground mt-2">Your password has been updated. You can now login with your new password.</p>
        <Button
          className="mt-6 brand-gradient text-white font-bold py-6 px-8"
          onClick={() => setLocation("/login")}
          data-testid="button-go-login"
        >
          Go to Login
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[url('/pattern-bg.svg')] bg-repeat bg-[length:200px_200px]">
      <Helmet>
        <title>Reset Password | Samikaran Olympiad</title>
        <meta name="description" content="Reset your Samikaran Olympiad account password. Recover access to your student, school, or supervisor account." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center">
            <Star className="w-6 h-6 text-white" fill="white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-wide leading-none">SAMIKARAN.</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Olympiad</span>
          </div>
        </Link>
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground tracking-wide" data-testid="link-home">
          BACK TO HOME
        </Link>
      </header>

      <main className="flex items-center justify-center py-6 sm:py-8 px-4">
        <Card className="w-full max-w-md mx-4 sm:mx-auto shadow-2xl border-0">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === "email" && renderEmailStep()}
              {step === "otp" && renderOtpStep()}
              {step === "newPassword" && renderNewPasswordStep()}
              {step === "success" && renderSuccessStep()}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
