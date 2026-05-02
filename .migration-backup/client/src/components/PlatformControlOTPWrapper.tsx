import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Send, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlatformControlOTPWrapperProps {
  children: React.ReactNode;
  sectionName: string;
  sectionIcon?: React.ReactNode;
}

const SESSION_KEY = "platformControlOtpVerified";

export function PlatformControlOTPWrapper({ 
  children, 
  sectionName,
  sectionIcon 
}: PlatformControlOTPWrapperProps) {
  const { toast } = useToast();
  
  const [otpVerified, setOtpVerified] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpError("");
    try {
      await apiRequest("POST", "/sysctrl/api/platform-otp/send");
      setOtpSent(true);
      toast({ 
        title: "OTP Sent", 
        description: "A verification code has been sent to the super admin's registered email." 
      });
    } catch (error: any) {
      setOtpError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setVerifyingOtp(true);
    try {
      await apiRequest("POST", "/sysctrl/api/platform-otp/verify", { otp: otpValue });
      setOtpVerified(true);
      sessionStorage.setItem(SESSION_KEY, "true");
      toast({ 
        title: "Verified", 
        description: `OTP verified successfully. You can now access ${sectionName}.` 
      });
    } catch (error: any) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!otpVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
              {sectionIcon || <Shield className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className="text-xl text-gray-800">Platform Control Verification</CardTitle>
            <CardDescription>
              Enter the OTP sent to super admin's registered email to access {sectionName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                  <Lock className="w-8 h-8 mx-auto text-violet-500 mb-2" />
                  <p className="text-sm text-gray-600">
                    Platform Control sections are protected for security. Click below to receive a verification code.
                  </p>
                </div>
                <Button 
                  onClick={handleSendOtp} 
                  disabled={sendingOtp}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-send-platform-otp"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    data-testid="input-platform-otp"
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
                
                {otpError && (
                  <p className="text-sm text-red-500 text-center">{otpError}</p>
                )}
                
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={otpValue.length !== 6 || verifyingOtp}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-verify-platform-otp"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>Verify & Access {sectionName}</>
                  )}
                </Button>
                
                <div className="text-center">
                  <button 
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-sm text-violet-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function clearPlatformControlOTP() {
  sessionStorage.removeItem(SESSION_KEY);
}
