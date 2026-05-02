import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Shield, Star, Home } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function QALogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp] = useState("");

  const [pendingToken, setPendingToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/sysctrl/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.requiresOtp) {
        setPendingToken(data.pendingToken);
        setStep("otp");
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your email.",
        });
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/sysctrl/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, otp }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        sessionStorage.setItem("qaLoggedIn", "true");
        sessionStorage.setItem("qaUserEmail", email);
        sessionStorage.setItem("platformControlOtpVerified", "true");
        if (data.sessionToken) {
          localStorage.setItem("adminSessionToken", data.sessionToken);
        }
        toast({
          title: "Login Successful",
          description: "Welcome to QA & Testing System",
        });
        setLocation("/qa-dashboard");
      } else {
        toast({
          title: "Invalid OTP",
          description: data.message || "The verification code is incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Helmet>
        <title>QA Login | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow">
              <Star className="text-white w-4 h-4" fill="rgba(255,255,255,0.3)" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight font-serif leading-none">SAMIKARAN.</span>
              <span className="text-[10px] font-bold uppercase font-serif leading-none">OLYMPIAD</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
      
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-56px)] relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.3em] text-emerald-600 mb-1">SAMIKARAN.</div>
            <div className="text-[10px] tracking-[0.5em] text-emerald-500">Olympiad</div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">QA & Testing Login</CardTitle>
          <CardDescription>
            {step === "credentials" 
              ? "Sign in to access the Quality Assurance system" 
              : "Enter the verification code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-qa-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-qa-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90"
                disabled={isLoading}
                data-testid="button-qa-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  data-testid="input-qa-otp"
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
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90"
                disabled={isLoading || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setOtp("");
                }}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
