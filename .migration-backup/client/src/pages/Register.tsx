import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Country, State, City } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Phone, ArrowLeft, ArrowRight, Check, GraduationCap, 
  Users, Building2, Eye, EyeOff, Loader2, CheckCircle2, Star, Timer, X,
  Atom, Calculator, BookOpen, Brain, Lightbulb, LogIn, UserPlus
} from "lucide-react";

type RegistrationStep = "contact" | "otp" | "role" | "form" | "review";
type RoleType = "student" | "supervisor" | "school";
type StudentFormStep = 1 | 2 | 3;

const grades = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12"
];

const branches = [
  "Science", "Commerce", "Arts", "Engineering", "Medical", "Other"
];

const categoryRanges = [
  "Less than 50 students", "50-99 students", "100-149 students", "150+ students"
];

const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+49", country: "Germany" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Always start from role selection for fresh registration
  const [step, setStep] = useState<RegistrationStep>("role");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [emailValue, setEmailValue] = useState(() => sessionStorage.getItem("verifiedEmail") || "");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const contact = contactType === "email" ? emailValue : `${phoneCountryCode}${phoneValue}`;
  const [verificationToken, setVerificationToken] = useState(() => sessionStorage.getItem("verificationToken") || "");
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      sessionStorage.setItem("partnerReferralCode", ref);
    } else {
      const savedRef = sessionStorage.getItem("partnerReferralCode");
      if (savedRef) setReferralCode(savedRef);
    }
    // Handle role from URL parameter (e.g., from School Registration button on homepage)
    const roleParam = urlParams.get("role") as RoleType | null;
    if (roleParam && ["student", "supervisor", "school"].includes(roleParam)) {
      setSelectedRole(roleParam);
      // Clear URL parameter after reading
      window.history.replaceState({}, "", "/register");
    }
  }, []);
  
  // Persist step to sessionStorage for HMR survival
  useEffect(() => {
    sessionStorage.setItem("registrationStep", step);
  }, [step]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") === "true") {
      const token = sessionStorage.getItem("verificationToken");
      // Check both keys for compatibility (Login uses verifiedContact, Register OTP uses verifiedEmail)
      const verifiedContact = sessionStorage.getItem("verifiedContact") || sessionStorage.getItem("verifiedEmail");
      const verifiedType = sessionStorage.getItem("verifiedContactType");
      const savedRole = sessionStorage.getItem("selectedRole") as RoleType | null;
      if (token && verifiedContact) {
        setVerificationToken(token);
        // Parse phone vs email based on stored type or content
        if (verifiedType === "phone" || (verifiedContact.startsWith("+") && !verifiedContact.includes("@"))) {
          // It's a phone number
          const match = verifiedContact.match(/^(\+\d+)(\d{10})$/);
          if (match) {
            setPhoneCountryCode(match[1]);
            setPhoneValue(match[2]);
          }
          setContactType("phone");
        } else {
          setEmailValue(verifiedContact);
          setContactType("email");
        }
        // If role was already selected in Login, go directly to form
        if (savedRole && ["student", "supervisor", "school"].includes(savedRole)) {
          setSelectedRole(savedRole);
          setStep("form");
          sessionStorage.removeItem("selectedRole");
        } else {
          setStep("role");
        }
        // Don't clear storage here - it's needed for registration
        window.history.replaceState({}, "", "/register");
      }
    }
  }, []);
  const [studentFormStep, setStudentFormStep] = useState<StudentFormStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  
  const triggerShake = (fieldNames: string[]) => {
    setShakeFields(fieldNames);
    setErrorFields(new Set(fieldNames));
    setTimeout(() => setShakeFields([]), 500);
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
  
  const getFieldClass = (fieldName: string, baseClass: string = "h-12") => {
    const isShaking = shakeFields.includes(fieldName);
    const hasError = errorFields.has(fieldName);
    return `${baseClass} ${isShaking ? "animate-shake" : ""} ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`;
  };
  
  const getSelectClass = (fieldName: string) => {
    const isShaking = shakeFields.includes(fieldName);
    const hasError = errorFields.has(fieldName);
    return `h-12 ${isShaking ? "animate-shake" : ""} ${hasError ? "border-destructive" : ""}`;
  };
  
  const getCheckboxContainerClass = (fieldName: string) => {
    const isShaking = shakeFields.includes(fieldName);
    const hasError = errorFields.has(fieldName);
    return `flex items-start gap-3 p-2 rounded-md ${isShaking ? "animate-shake" : ""} ${hasError ? "border border-destructive bg-destructive/5" : ""}`;
  };
  
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one capital letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    return { valid: true, message: "" };
  };
  
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);
  
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);
  
  const [studentData, setStudentData] = useState({
    firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "", parentName: "",
    countryId: null as number | null, stateId: null as number | null, cityId: null as number | null,
    addressLine1: "", pincode: "", schoolName: "", gradeLevel: "",
    countryCode: "+91", phone: "", email: "", password: "", retypePassword: "",
    termsAccepted: false, emailConsent: false, promotionalConsent: false
  });

  const { data: countriesList = [] } = useQuery<Country[]>({
    queryKey: ["/api/regions/countries"],
  });

  const { data: statesList = [] } = useQuery<State[]>({
    queryKey: ["/api/regions/states", studentData.countryId],
    enabled: !!studentData.countryId,
  });

  const { data: citiesList = [] } = useQuery<City[]>({
    queryKey: ["/api/regions/cities", studentData.stateId],
    enabled: !!studentData.stateId,
  });
  
  const [supervisorData, setSupervisorData] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "",
    countryCode: "+91", phone: "", schoolLocation: "", schoolCity: "",
    schoolName: "", branch: "", secondaryEmail: "", password: "", retypePassword: "",
    termsAccepted: false, emailConsent: false, promotionalConsent: false
  });
  
  const [schoolData, setSchoolData] = useState({
    teacherFirstName: "", teacherLastName: "", teacherEmail: sessionStorage.getItem("verifiedEmail") || "",
    password: "", retypePassword: "",
    country: "", schoolName: "", schoolCity: "", schoolAddress: "",
    principalName: "", boardAffiliation: "", contactPhone: "",
    expectedStudents: "", categoryRange: "", message: "", termsAccepted: false
  });
  const [showSchoolPassword, setShowSchoolPassword] = useState(false);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const checkRes = await fetch("/api/auth/check-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, type: contactType })
      });
      if (!checkRes.ok && checkRes.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          const label = contactType === "email" ? "email" : "mobile number";
          throw new Error(`This ${label} is already registered as a ${checkData.accountType}. Please login instead.`);
        }
      } else {
        throw new Error("Unable to verify your contact. Please try again.");
      }

      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, type: contactType })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.waitTime) {
          return { rateLimited: true, waitTime: data.waitTime, message: data.message };
        }
        throw new Error(data.message || "Failed to send verification code");
      }
      return { rateLimited: false };
    },
    onSuccess: (data: { rateLimited: boolean; waitTime?: number; message?: string }) => {
      if (data.rateLimited && data.waitTime) {
        setResendCountdown(data.waitTime);
        setAlertMessage(`Please wait ${data.waitTime} seconds before requesting a new code`);
        setStep("otp");
      } else {
        toast({ title: "Success", description: `Verification code sent to your ${contactType}` });
        setStep("otp");
        setResendCountdown(90);
        setAlertMessage(null);
      }
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
      if (error.message?.includes("already registered")) {
        toast({ title: "Already Registered", description: "Redirecting you to login...", variant: "destructive" });
        setTimeout(() => {
          setLocation("/login");
        }, 2500);
      }
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const code = otp.join("");
      const res = await apiRequest("POST", "/api/otp/verify", { contact, code });
      return res.json();
    },
    onSuccess: (data: { verified: boolean; token?: string }) => {
      if (data.verified && data.token) {
        setVerificationToken(data.token);
        sessionStorage.setItem("verificationToken", data.token);
        sessionStorage.setItem("verifiedEmail", contact);
        setSchoolData(prev => ({ ...prev, teacherEmail: contact }));
        toast({ title: "Verified", description: "Your contact has been verified successfully!" });
        if (selectedRole) {
          setStep("form");
        } else {
          setStep("role");
        }
      }
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const studentRegistrationMutation = useMutation({
    mutationFn: async () => {
      const token = verificationToken || sessionStorage.getItem("verificationToken") || "";
      const verifiedContactValue = sessionStorage.getItem("verifiedContact") || sessionStorage.getItem("verifiedEmail") || contact;
      const verifiedType = sessionStorage.getItem("verifiedContactType") || contactType;
      
      let emailValue: string;
      let phoneValue: string;
      let phoneCountryCodeValue: string;
      
      if (verifiedType === "phone") {
        emailValue = studentData.email;
        const match = verifiedContactValue.match(/^(\+\d+)(\d{10})$/);
        if (match) {
          phoneCountryCodeValue = match[1];
          phoneValue = match[2];
        } else {
          phoneCountryCodeValue = studentData.countryCode;
          phoneValue = verifiedContactValue.replace(/^\+\d+/, "");
        }
      } else {
        emailValue = verifiedContactValue;
        phoneCountryCodeValue = studentData.countryCode;
        phoneValue = studentData.phone;
      }
      
      const res = await fetch("/api/registration/student", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          email: emailValue,
          firstName: studentData.firstName,
          middleName: studentData.middleName || null,
          lastName: studentData.lastName,
          dateOfBirth: studentData.dateOfBirth,
          gender: studentData.gender,
          countryCode: phoneCountryCodeValue,
          phone: phoneValue,
          countryId: studentData.countryId,
          stateId: studentData.stateId,
          cityId: studentData.cityId,
          addressLine1: studentData.addressLine1,
          pincode: studentData.pincode,
          schoolName: studentData.schoolName,
          gradeLevel: studentData.gradeLevel,
          password: studentData.password,
          termsAccepted: studentData.termsAccepted,
          emailConsent: studentData.emailConsent,
          promotionalConsent: studentData.promotionalConsent,
          partnerReferralCode: referralCode || sessionStorage.getItem("partnerReferralCode") || null
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem("verificationToken");
      sessionStorage.removeItem("verifiedEmail");
      sessionStorage.removeItem("verifiedContact");
      sessionStorage.removeItem("verifiedContactType");
      sessionStorage.removeItem("registrationStep");
      sessionStorage.removeItem("partnerReferralCode");
      toast({ title: "Success", description: "Registration completed successfully! Please login to continue." });
      setLocation("/login");
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const supervisorRegistrationMutation = useMutation({
    mutationFn: async () => {
      const token = verificationToken || sessionStorage.getItem("verificationToken") || "";
      const verifiedContactValue = sessionStorage.getItem("verifiedContact") || sessionStorage.getItem("verifiedEmail") || contact;
      const res = await fetch("/api/registration/supervisor", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          email: verifiedContactValue,
          ...supervisorData
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem("verificationToken");
      sessionStorage.removeItem("verifiedEmail");
      sessionStorage.removeItem("verifiedContact");
      sessionStorage.removeItem("verifiedContactType");
      sessionStorage.removeItem("registrationStep");
      toast({ title: "Success", description: "Supervisor registration completed! Please login to continue." });
      setLocation("/login");
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const schoolRegistrationMutation = useMutation({
    mutationFn: async () => {
      const token = verificationToken || sessionStorage.getItem("verificationToken") || "";
      const verifiedContactValue = sessionStorage.getItem("verifiedContact") || sessionStorage.getItem("verifiedEmail") || contact;
      const res = await fetch("/api/registration/school", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          email: verifiedContactValue,
          ...schoolData
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem("verificationToken");
      sessionStorage.removeItem("verifiedEmail");
      sessionStorage.removeItem("verifiedContact");
      sessionStorage.removeItem("verifiedContactType");
      sessionStorage.removeItem("registrationStep");
      toast({ title: "School Registered Successfully!", description: "Your school portal is ready. Login at the School Teacher/Staff Portal with your email and password." });
      setLocation("/login");
    },
    onError: (error: Error) => {
      setAlertMessage(error.message);
    }
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      if (digits.length > 1) {
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = digits[i] || "";
        }
        setOtp(newOtp);
        const focusIdx = Math.min(digits.length, 5);
        const nextInput = document.getElementById(`otp-${focusIdx}`);
        nextInput?.focus();
        return;
      }
      value = value[0];
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    const nextInput = document.getElementById(`otp-${focusIdx}`);
    nextInput?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const renderStepIndicator = (currentStep: number, labels: string[]) => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              i + 1 <= currentStep 
                ? "brand-gradient text-white" 
                : "bg-muted text-muted-foreground"
            }`}>
              {i + 1 < currentStep ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span className="text-xs mt-1 text-muted-foreground whitespace-nowrap">{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div className={`w-12 h-0.5 mb-6 ${i + 1 < currentStep ? "brand-gradient" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderAlertMessage = () => alertMessage && (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="max-w-md mx-auto mt-4"
    >
      <div className="alert-error">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{alertMessage}</span>
        </div>
        <button 
          onClick={() => setAlertMessage(null)} 
          className="p-1 hover:bg-white/20 rounded transition-colors"
          data-testid="button-close-alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderContactStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <Card className="max-w-md mx-auto border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold brand-text">
            Get Started
          </CardTitle>
          <CardDescription>Enter your email or phone to begin registration</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={contactType} onValueChange={(v) => setContactType(v as "email" | "phone")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="gap-2" data-testid="tab-email">
                <Mail className="w-4 h-4" /> Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2" data-testid="tab-phone">
                <Phone className="w-4 h-4" /> Phone
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tara@gmail.com"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="h-12"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="phone">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex gap-2">
                    <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                      <SelectTrigger className="w-28 h-12" data-testid="select-country-code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ""))}
                      className="h-12 flex-1"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => setStep("role")}
              data-testid="button-back-contact"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              className="flex-1 h-12 brand-button font-bold tracking-widest uppercase"
              onClick={() => sendOtpMutation.mutate()}
              disabled={!contact || sendOtpMutation.isPending}
              data-testid="button-send-otp"
            >
              {sendOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Code <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="brand-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderOtpStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <Card className="max-w-md mx-auto border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verify Your {contactType === "email" ? "Email" : "Phone"}</CardTitle>
          <CardDescription>Enter the 6-digit code sent to {contact}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, i) => (
              <Input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
                className="w-12 h-14 text-center text-2xl font-bold"
                data-testid={`input-otp-${i}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("contact")} className="flex-1 h-12" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => verifyOtpMutation.mutate()}
              disabled={otp.some(d => !d) || verifyOtpMutation.isPending}
              className="flex-1 h-12 brand-button font-bold"
              data-testid="button-verify-otp"
            >
              {verifyOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify
            </Button>
          </div>
          <div className="text-center mt-4">
            {resendCountdown > 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>Resend code in <span className="font-semibold brand-accent">{resendCountdown}s</span></span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  className="brand-accent hover:underline font-medium"
                  onClick={() => {
                    sendOtpMutation.mutate();
                    setResendCountdown(90);
                  }}
                  disabled={sendOtpMutation.isPending}
                  data-testid="button-resend-otp"
                >
                  {sendOtpMutation.isPending ? "Sending..." : "Resend"}
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const olympiadCategories = [
    { name: "SCIENCE", Icon: Atom, color: "bg-teal-500" },
    { name: "MATH", Icon: Calculator, color: "bg-blue-500" },
    { name: "ENGLISH", Icon: BookOpen, color: "bg-red-500" },
    { name: "REASONING", Icon: Brain, color: "bg-purple-500" },
    { name: "GK", Icon: Lightbulb, color: "bg-amber-500" },
  ];

  const renderRoleSelection = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="max-w-lg mx-auto">
        {/* Welcome Message with Olympiad Categories */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-0 text-foreground">
            Welcome to the
          </h1>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Samikaran Olympiad
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            You are currently registering for the Samikaran Olympiad. With your account you will also be able to sign in to other Olympiads listed below.
          </p>
          
          {/* Olympiad Category Icons */}
          <div className="flex justify-center gap-3 mt-4">
            {olympiadCategories.map((cat) => (
              <div key={cat.name} className="flex flex-col items-center">
                <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center shadow-md`}>
                  <cat.Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold mb-1 uppercase tracking-tight">Register As</h2>
          <p className="text-muted-foreground text-sm">Choose how you want to register with Samikaran Olympiad</p>
        </div>
        <div className="space-y-3">
          {[
            { id: "student", icon: GraduationCap, title: "SCHOOL STUDENT (CLASS 1–12)", desc: "Olympiad exams in Math, Science, English & more", color: "from-purple-500 to-pink-500" },
            { id: "supervisor", icon: Users, title: "SUPERVISOR / PARENT", desc: "Register as a supervisor or parent", color: "from-orange-500 to-amber-500" },
            { id: "school", icon: Building2, title: "SCHOOL", desc: "Partner your school for group benefits", color: "from-teal-500 to-cyan-500" },
          ].map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover-elevate border-2 ${
                selectedRole === role.id 
                  ? "border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))]/5" 
                  : "border-transparent"
              }`}
              onClick={() => setSelectedRole(role.id as RoleType)}
              data-testid={`card-role-${role.id}`}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br ${role.color}`}>
                  <role.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base tracking-tight">{role.title}</h3>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
                {selectedRole === role.id && (
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={() => setLocation("/")} className="min-h-[44px] px-5" data-testid="button-back-role">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={() => setStep("contact")}
            disabled={!selectedRole}
            className="flex-1 min-h-[44px] brand-button font-bold tracking-widest uppercase"
            data-testid="button-continue"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderStudentForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">SIGN UP</h2>
          <p className="text-muted-foreground">Create your student account</p>
        </div>
        
        {renderStepIndicator(studentFormStep, ["Personal Details", "Location & School", "Account Setup"])}
        
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            {studentFormStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Your name will appear on certificates exactly as entered below.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      placeholder="First name"
                      value={studentData.firstName}
                      onChange={(e) => { setStudentData({...studentData, firstName: e.target.value}); clearFieldError("student-firstName"); }}
                      className={getFieldClass("student-firstName")}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input
                      placeholder="Middle name (optional)"
                      value={studentData.middleName}
                      onChange={(e) => setStudentData({...studentData, middleName: e.target.value})}
                      className="h-12"
                      data-testid="input-middle-name"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      placeholder="Last name"
                      value={studentData.lastName}
                      onChange={(e) => { setStudentData({...studentData, lastName: e.target.value}); clearFieldError("student-lastName"); }}
                      className={getFieldClass("student-lastName")}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      value={studentData.dateOfBirth}
                      onChange={(e) => { setStudentData({...studentData, dateOfBirth: e.target.value}); clearFieldError("student-dateOfBirth"); }}
                      className={getFieldClass("student-dateOfBirth")}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0]}
                      data-testid="input-dob"
                    />
                    {studentData.dateOfBirth && calculateAge(studentData.dateOfBirth) !== null && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Age: <span className="font-semibold text-foreground">{calculateAge(studentData.dateOfBirth)} years</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select value={studentData.gender} onValueChange={(v) => { setStudentData({...studentData, gender: v}); clearFieldError("student-gender"); }}>
                      <SelectTrigger className={getSelectClass("student-gender")} data-testid="select-gender">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Parent/Guardian Name *</Label>
                  <Input
                    placeholder="Enter parent or guardian's full name"
                    value={studentData.parentName}
                    onChange={(e) => { setStudentData({...studentData, parentName: e.target.value}); clearFieldError("student-parentName"); }}
                    className={getFieldClass("student-parentName")}
                    data-testid="input-parent-name"
                  />
                </div>
              </div>
            )}
            
            {studentFormStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Country *</Label>
                    <SearchableSelect
                      options={countriesList.map(c => ({ id: c.id, name: c.name, code: c.code }))}
                      value={studentData.countryId}
                      onSelect={(v) => { 
                        setStudentData({...studentData, countryId: v, stateId: null, cityId: null}); 
                        clearFieldError("student-countryId"); 
                      }}
                      placeholder="Select country"
                      searchPlaceholder="Search countries..."
                      emptyMessage="No countries found."
                      className={getSelectClass("student-countryId")}
                      data-testid="select-country"
                    />
                  </div>
                  <div>
                    <Label>State/Province *</Label>
                    <SearchableSelect
                      options={statesList.map(s => ({ id: s.id, name: s.name }))}
                      value={studentData.stateId}
                      onSelect={(v) => { 
                        setStudentData({...studentData, stateId: v, cityId: null}); 
                        clearFieldError("student-stateId"); 
                      }}
                      placeholder={studentData.countryId ? "Select state" : "Select country first"}
                      searchPlaceholder="Search states..."
                      emptyMessage="No states found."
                      disabled={!studentData.countryId}
                      className={getSelectClass("student-stateId")}
                      data-testid="select-state"
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <SearchableSelect
                      options={citiesList.map(c => ({ id: c.id, name: c.name }))}
                      value={studentData.cityId}
                      onSelect={(v) => { 
                        setStudentData({...studentData, cityId: v}); 
                        clearFieldError("student-cityId"); 
                      }}
                      placeholder={studentData.stateId ? "Select city" : "Select state first"}
                      searchPlaceholder="Search cities..."
                      emptyMessage="No cities found."
                      disabled={!studentData.stateId}
                      className={getSelectClass("student-cityId")}
                      data-testid="select-city"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      placeholder="Enter your address"
                      value={studentData.addressLine1}
                      onChange={(e) => setStudentData({...studentData, addressLine1: e.target.value})}
                      className={getFieldClass("student-address")}
                      data-testid="input-address"
                    />
                  </div>
                  <div>
                    <Label>Pincode/Zipcode</Label>
                    <Input
                      placeholder="Enter pincode"
                      value={studentData.pincode}
                      onChange={(e) => setStudentData({...studentData, pincode: e.target.value})}
                      className={getFieldClass("student-pincode")}
                      data-testid="input-pincode"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>School Name *</Label>
                    <Input
                      placeholder="Enter your school name"
                      value={studentData.schoolName}
                      onChange={(e) => { setStudentData({...studentData, schoolName: e.target.value}); clearFieldError("student-schoolName"); }}
                      className={getFieldClass("student-schoolName")}
                      data-testid="input-school-name"
                    />
                  </div>
                  <div>
                    <Label>Grade Level *</Label>
                    <Select value={studentData.gradeLevel} onValueChange={(v) => { setStudentData({...studentData, gradeLevel: v}); clearFieldError("student-gradeLevel"); }}>
                      <SelectTrigger className={getSelectClass("student-gradeLevel")} data-testid="select-grade">
                        <SelectValue placeholder="Select your grade level" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {studentFormStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Password *</Label>
                    <div className={`relative ${shakeFields.includes("student-password") ? "animate-shake" : ""}`}>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Type Password"
                        value={studentData.password}
                        onChange={(e) => { setStudentData({...studentData, password: e.target.value}); clearFieldError("student-password"); }}
                        className={`h-12 pr-10 ${errorFields.has("student-password") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Min 8 characters, 1 uppercase, 1 number, 1 special character</p>
                  </div>
                  <div>
                    <Label>Retype Password *</Label>
                    <div className={`relative ${shakeFields.includes("student-retype-password") ? "animate-shake" : ""}`}>
                      <Input
                        type={showRetypePassword ? "text" : "password"}
                        placeholder="Retype password"
                        value={studentData.retypePassword}
                        onChange={(e) => { setStudentData({...studentData, retypePassword: e.target.value}); clearFieldError("student-retype-password"); }}
                        className={`h-12 pr-10 ${errorFields.has("student-retype-password") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        data-testid="input-retype-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowRetypePassword(!showRetypePassword)}
                      >
                        {showRetypePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {contactType === "phone" ? (
                  <div>
                    <Label>Parent Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="Enter parent's email address"
                      value={studentData.email}
                      onChange={(e) => { setStudentData({...studentData, email: e.target.value}); clearFieldError("student-email"); }}
                      className={getFieldClass("student-email")}
                      data-testid="input-student-email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Required for password reset and communication with parents</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Country Code</Label>
                      <Select value={studentData.countryCode} onValueChange={(v) => setStudentData({...studentData, countryCode: v})}>
                        <SelectTrigger className="h-12" data-testid="select-country-code">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.code} {c.country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Phone Number *</Label>
                      <Input
                        placeholder="Enter phone number"
                        value={studentData.phone}
                        onChange={(e) => { setStudentData({...studentData, phone: e.target.value}); clearFieldError("student-phone"); }}
                        className={getFieldClass("student-phone")}
                        data-testid="input-student-phone"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 pt-4 border-t">
                  <div className={getCheckboxContainerClass("student-email-consent")}>
                    <Checkbox
                      id="terms"
                      checked={studentData.emailConsent}
                      onCheckedChange={(c) => { setStudentData({...studentData, emailConsent: c as boolean}); clearFieldError("student-email-consent"); }}
                      data-testid="checkbox-email-consent"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I understand that a valid email is required for password reset and communication. <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <div className={getCheckboxContainerClass("student-terms")}>
                    <Checkbox
                      id="terms-accept"
                      checked={studentData.termsAccepted}
                      onCheckedChange={(c) => { setStudentData({...studentData, termsAccepted: c as boolean}); clearFieldError("student-terms"); }}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="terms-accept" className="text-sm leading-relaxed cursor-pointer">
                      I accept the terms and conditions of Samikaran Olympiad. <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <div className={getCheckboxContainerClass("student-promo-consent")}>
                    <Checkbox
                      id="promo"
                      checked={studentData.promotionalConsent}
                      onCheckedChange={(c) => { setStudentData({...studentData, promotionalConsent: c as boolean}); clearFieldError("student-promo-consent"); }}
                      data-testid="checkbox-promo"
                    />
                    <Label htmlFor="promo" className="text-sm leading-relaxed cursor-pointer">
                      I agree to receive promotional emails and updates from Samikaran Olympiad. <span className="text-destructive">*</span>
                    </Label>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => {
                  if (studentFormStep === 1) setStep("role");
                  else setStudentFormStep((studentFormStep - 1) as StudentFormStep);
                }}
                data-testid="button-prev"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Prev
              </Button>
              <Button
                onClick={() => {
                  const emptyFields: string[] = [];
                  
                  if (studentFormStep === 1) {
                    if (!studentData.firstName) emptyFields.push("student-firstName");
                    if (!studentData.lastName) emptyFields.push("student-lastName");
                    if (!studentData.dateOfBirth) emptyFields.push("student-dateOfBirth");
                    if (!studentData.gender) emptyFields.push("student-gender");
                    if (!studentData.parentName) emptyFields.push("student-parentName");
                    if (emptyFields.length > 0) {
                      triggerShake(emptyFields);
                      setAlertMessage("Please fill in all required fields");
                      return;
                    }
                    setStudentFormStep(2);
                  } else if (studentFormStep === 2) {
                    if (!studentData.countryId) emptyFields.push("student-countryId");
                    if (!studentData.stateId) emptyFields.push("student-stateId");
                    if (!studentData.cityId) emptyFields.push("student-cityId");
                    if (!studentData.schoolName) emptyFields.push("student-schoolName");
                    if (!studentData.gradeLevel) emptyFields.push("student-gradeLevel");
                    if (emptyFields.length > 0) {
                      triggerShake(emptyFields);
                      setAlertMessage("Please fill in all required fields");
                      return;
                    }
                    const age = calculateAge(studentData.dateOfBirth);
                    if (age !== null) {
                      if (age < 5) {
                        triggerShake(["student-dateOfBirth"]);
                        setAlertMessage("Student must be at least 5 years old");
                        return;
                      }
                      if (age > 19) {
                        triggerShake(["student-dateOfBirth"]);
                        setAlertMessage("Student must be 19 years old or younger");
                        return;
                      }
                    }
                    setStudentFormStep(3);
                  } else {
                    if (!studentData.password) emptyFields.push("student-password");
                    if (!studentData.retypePassword) emptyFields.push("student-retype-password");
                    if (contactType === "phone") {
                      if (!studentData.email) emptyFields.push("student-email");
                    } else {
                      if (!studentData.phone) emptyFields.push("student-phone");
                    }
                    if (emptyFields.length > 0) {
                      triggerShake(emptyFields);
                      setAlertMessage("Please fill in all required fields");
                      return;
                    }
                    if (contactType === "phone" && studentData.email) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(studentData.email)) {
                        triggerShake(["student-email"]);
                        setAlertMessage("Please enter a valid email address");
                        return;
                      }
                    }
                    const passwordValidation = validatePassword(studentData.password);
                    if (!passwordValidation.valid) {
                      triggerShake(["student-password"]);
                      setAlertMessage(passwordValidation.message);
                      return;
                    }
                    if (studentData.password !== studentData.retypePassword) {
                      triggerShake(["student-password", "student-retype-password"]);
                      setAlertMessage("Passwords do not match");
                      return;
                    }
                    const uncheckedBoxes: string[] = [];
                    if (!studentData.emailConsent) uncheckedBoxes.push("student-email-consent");
                    if (!studentData.termsAccepted) uncheckedBoxes.push("student-terms");
                    if (!studentData.promotionalConsent) uncheckedBoxes.push("student-promo-consent");
                    if (uncheckedBoxes.length > 0) {
                      triggerShake(uncheckedBoxes);
                      setAlertMessage("Please accept all required agreements to continue");
                      return;
                    }
                    setStep("review");
                  }
                }}
                className="flex-1 h-12 brand-button font-bold tracking-widest uppercase"
                disabled={studentRegistrationMutation.isPending}
                data-testid="button-next"
              >
                {studentRegistrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {studentFormStep < 3 ? <>Next <ArrowRight className="w-4 h-4 ml-2" /></> : "Review Registration"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          If you already have an account, please{" "}
          <Link href="/login" className="brand-accent hover:underline font-medium">log in here</Link>
        </p>
      </div>
    </motion.div>
  );

  const renderSupervisorForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">SUPERVISOR / PARENT REGISTRATION</h2>
          <p className="text-muted-foreground">Create your supervisor account</p>
        </div>
        
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  placeholder="Enter your first name"
                  value={supervisorData.firstName}
                  onChange={(e) => { setSupervisorData({...supervisorData, firstName: e.target.value}); clearFieldError("supervisor-firstName"); }}
                  className={getFieldClass("supervisor-firstName")}
                  data-testid="input-supervisor-first-name"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  placeholder="Enter your last name"
                  value={supervisorData.lastName}
                  onChange={(e) => { setSupervisorData({...supervisorData, lastName: e.target.value}); clearFieldError("supervisor-lastName"); }}
                  className={getFieldClass("supervisor-lastName")}
                  data-testid="input-supervisor-last-name"
                />
              </div>
              <div>
                <Label>Date of Birth (DD/MM/YYYY) *</Label>
                <Input
                  type="date"
                  value={supervisorData.dateOfBirth}
                  onChange={(e) => { setSupervisorData({...supervisorData, dateOfBirth: e.target.value}); clearFieldError("supervisor-dateOfBirth"); }}
                  className={getFieldClass("supervisor-dateOfBirth")}
                  data-testid="input-supervisor-dob"
                />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={supervisorData.gender} onValueChange={(v) => { setSupervisorData({...supervisorData, gender: v}); clearFieldError("supervisor-gender"); }}>
                  <SelectTrigger className={getSelectClass("supervisor-gender")} data-testid="select-supervisor-gender">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Country Code</Label>
                <Select value={supervisorData.countryCode} onValueChange={(v) => setSupervisorData({...supervisorData, countryCode: v})}>
                  <SelectTrigger className="h-12" data-testid="select-supervisor-country-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} {c.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Phone Number *</Label>
                <Input
                  placeholder="Enter phone number"
                  value={supervisorData.phone}
                  onChange={(e) => { setSupervisorData({...supervisorData, phone: e.target.value}); clearFieldError("supervisor-phone"); }}
                  className={getFieldClass("supervisor-phone")}
                  data-testid="input-supervisor-phone"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>School Location *</Label>
                <Select value={supervisorData.schoolLocation} onValueChange={(v) => { setSupervisorData({...supervisorData, schoolLocation: v}); clearFieldError("supervisor-schoolLocation"); }}>
                  <SelectTrigger className={getSelectClass("supervisor-schoolLocation")} data-testid="select-supervisor-location">
                    <SelectValue placeholder="Select school location" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesList.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>School City *</Label>
                <Input
                  placeholder="Enter your school city"
                  value={supervisorData.schoolCity}
                  onChange={(e) => { setSupervisorData({...supervisorData, schoolCity: e.target.value}); clearFieldError("supervisor-schoolCity"); }}
                  className={getFieldClass("supervisor-schoolCity")}
                  data-testid="input-supervisor-school-city"
                />
              </div>
              <div>
                <Label>School Name *</Label>
                <Input
                  placeholder="Enter your school name"
                  value={supervisorData.schoolName}
                  onChange={(e) => { setSupervisorData({...supervisorData, schoolName: e.target.value}); clearFieldError("supervisor-schoolName"); }}
                  className={getFieldClass("supervisor-schoolName")}
                  data-testid="input-supervisor-school-name"
                />
              </div>
              <div>
                <Label>Branch *</Label>
                <Select value={supervisorData.branch} onValueChange={(v) => { setSupervisorData({...supervisorData, branch: v}); clearFieldError("supervisor-branch"); }}>
                  <SelectTrigger className={getSelectClass("supervisor-branch")} data-testid="select-supervisor-branch">
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Secondary Email</Label>
              <Input
                type="email"
                placeholder="Enter your secondary email"
                value={supervisorData.secondaryEmail}
                onChange={(e) => setSupervisorData({...supervisorData, secondaryEmail: e.target.value})}
                className="h-12"
                data-testid="input-supervisor-secondary-email"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Password *</Label>
                <div className={`relative ${shakeFields.includes("supervisor-password") ? "animate-shake" : ""}`}>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Type Password"
                    value={supervisorData.password}
                    onChange={(e) => { setSupervisorData({...supervisorData, password: e.target.value}); clearFieldError("supervisor-password"); }}
                    className={`h-12 pr-10 ${errorFields.has("supervisor-password") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    data-testid="input-supervisor-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Min 8 characters, 1 uppercase, 1 number, 1 special character</p>
              </div>
              <div>
                <Label>Retype Password *</Label>
                <div className={`relative ${shakeFields.includes("supervisor-retype-password") ? "animate-shake" : ""}`}>
                  <Input
                    type={showRetypePassword ? "text" : "password"}
                    placeholder="Retype password"
                    value={supervisorData.retypePassword}
                    onChange={(e) => { setSupervisorData({...supervisorData, retypePassword: e.target.value}); clearFieldError("supervisor-retype-password"); }}
                    className={`h-12 pr-10 ${errorFields.has("supervisor-retype-password") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    data-testid="input-supervisor-retype-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                  >
                    {showRetypePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div className={getCheckboxContainerClass("supervisor-email-consent")}>
                <Checkbox
                  id="sup-terms"
                  checked={supervisorData.emailConsent}
                  onCheckedChange={(c) => { setSupervisorData({...supervisorData, emailConsent: c as boolean}); clearFieldError("supervisor-email-consent"); }}
                  data-testid="checkbox-supervisor-email-consent"
                />
                <Label htmlFor="sup-terms" className="text-sm leading-relaxed cursor-pointer">
                  I understand that a valid email is required for password reset and communication. <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className={getCheckboxContainerClass("supervisor-terms")}>
                <Checkbox
                  id="sup-terms-accept"
                  checked={supervisorData.termsAccepted}
                  onCheckedChange={(c) => { setSupervisorData({...supervisorData, termsAccepted: c as boolean}); clearFieldError("supervisor-terms"); }}
                  data-testid="checkbox-supervisor-terms"
                />
                <Label htmlFor="sup-terms-accept" className="text-sm leading-relaxed cursor-pointer">
                  I accept the terms and conditions of Samikaran Olympiad. <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className={getCheckboxContainerClass("supervisor-promo-consent")}>
                <Checkbox
                  id="sup-promo"
                  checked={supervisorData.promotionalConsent}
                  onCheckedChange={(c) => { setSupervisorData({...supervisorData, promotionalConsent: c as boolean}); clearFieldError("supervisor-promo-consent"); }}
                  data-testid="checkbox-supervisor-promo"
                />
                <Label htmlFor="sup-promo" className="text-sm leading-relaxed cursor-pointer">
                  I agree to receive promotional emails and updates from Samikaran Olympiad. <span className="text-destructive">*</span>
                </Label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("role")} className="h-12" data-testid="button-supervisor-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => {
                  const emptyFields: string[] = [];
                  if (!supervisorData.firstName) emptyFields.push("supervisor-firstName");
                  if (!supervisorData.lastName) emptyFields.push("supervisor-lastName");
                  if (!supervisorData.dateOfBirth) emptyFields.push("supervisor-dateOfBirth");
                  if (!supervisorData.gender) emptyFields.push("supervisor-gender");
                  if (!supervisorData.phone) emptyFields.push("supervisor-phone");
                  if (!supervisorData.schoolLocation) emptyFields.push("supervisor-schoolLocation");
                  if (!supervisorData.schoolCity) emptyFields.push("supervisor-schoolCity");
                  if (!supervisorData.schoolName) emptyFields.push("supervisor-schoolName");
                  if (!supervisorData.branch) emptyFields.push("supervisor-branch");
                  if (!supervisorData.password) emptyFields.push("supervisor-password");
                  if (!supervisorData.retypePassword) emptyFields.push("supervisor-retype-password");
                  if (emptyFields.length > 0) {
                    triggerShake(emptyFields);
                    setAlertMessage("Please fill in all required fields");
                    return;
                  }
                  const passwordValidation = validatePassword(supervisorData.password);
                  if (!passwordValidation.valid) {
                    triggerShake(["supervisor-password"]);
                    setAlertMessage(passwordValidation.message);
                    return;
                  }
                  if (supervisorData.password !== supervisorData.retypePassword) {
                    triggerShake(["supervisor-password", "supervisor-retype-password"]);
                    setAlertMessage("Passwords do not match");
                    return;
                  }
                  const uncheckedBoxes: string[] = [];
                  if (!supervisorData.emailConsent) uncheckedBoxes.push("supervisor-email-consent");
                  if (!supervisorData.termsAccepted) uncheckedBoxes.push("supervisor-terms");
                  if (!supervisorData.promotionalConsent) uncheckedBoxes.push("supervisor-promo-consent");
                  if (uncheckedBoxes.length > 0) {
                    triggerShake(uncheckedBoxes);
                    setAlertMessage("Please accept all required agreements to continue");
                    return;
                  }
                  setStep("review");
                }}
                className="flex-1 h-12 brand-button font-bold tracking-widest uppercase"
                disabled={supervisorRegistrationMutation.isPending}
                data-testid="button-supervisor-submit"
              >
                {supervisorRegistrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Review Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderSchoolForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">SCHOOL COLLABORATION</h2>
          <p className="text-muted-foreground">Partner your school with Samikaran Olympiad</p>
        </div>
        
        <Card className="mb-6 border-[hsl(var(--brand-primary))]/20 bg-[hsl(var(--brand-primary))]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Discounted Registration Offer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Get bulk registration discounts for your school:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>50-99 students: Special group discount</li>
              <li>100-149 students: Enhanced discount</li>
              <li>150+ students: Maximum discount tier</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>School Head First Name *</Label>
                <Input
                  placeholder="Enter first name"
                  value={schoolData.teacherFirstName}
                  onChange={(e) => { setSchoolData({...schoolData, teacherFirstName: e.target.value}); clearFieldError("school-teacherFirstName"); }}
                  className={getFieldClass("school-teacherFirstName")}
                  data-testid="input-teacher-first-name"
                />
              </div>
              <div>
                <Label>School Head Last Name *</Label>
                <Input
                  placeholder="Enter last name"
                  value={schoolData.teacherLastName}
                  onChange={(e) => { setSchoolData({...schoolData, teacherLastName: e.target.value}); clearFieldError("school-teacherLastName"); }}
                  className={getFieldClass("school-teacherLastName")}
                  data-testid="input-teacher-last-name"
                />
              </div>
            </div>
            
            <div>
              <Label>School Head Email *</Label>
              <Input
                type="email"
                placeholder="Enter school head email"
                value={schoolData.teacherEmail}
                readOnly
                className={`${getFieldClass("school-teacherEmail")} bg-muted cursor-not-allowed`}
                data-testid="input-teacher-email"
              />
              <p className="text-xs text-muted-foreground mt-1">Verified email from previous step</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Create Password *</Label>
                <div className={`relative ${shakeFields.includes("school-password") ? "animate-shake" : ""}`}>
                  <Input
                    type={showSchoolPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={schoolData.password}
                    onChange={(e) => { setSchoolData({...schoolData, password: e.target.value}); clearFieldError("school-password"); }}
                    className={getFieldClass("school-password")}
                    data-testid="input-school-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowSchoolPassword(!showSchoolPassword)}>
                    {showSchoolPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Min 8 chars, 1 uppercase, 1 number, 1 special</p>
              </div>
              <div>
                <Label>Confirm Password *</Label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={schoolData.retypePassword}
                  onChange={(e) => { setSchoolData({...schoolData, retypePassword: e.target.value}); clearFieldError("school-retypePassword"); }}
                  className={getFieldClass("school-retypePassword")}
                  data-testid="input-school-retype-password"
                />
              </div>
            </div>

            <div>
              <Label>Contact Phone</Label>
              <Input
                placeholder="e.g. +91 9876543210"
                value={schoolData.contactPhone}
                onChange={(e) => setSchoolData({...schoolData, contactPhone: e.target.value})}
                data-testid="input-school-phone"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Select value={schoolData.country} onValueChange={(v) => { setSchoolData({...schoolData, country: v}); clearFieldError("school-country"); }}>
                  <SelectTrigger className={getSelectClass("school-country")} data-testid="select-school-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesList.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>School City *</Label>
                <Input
                  placeholder="Enter school city"
                  value={schoolData.schoolCity}
                  onChange={(e) => { setSchoolData({...schoolData, schoolCity: e.target.value}); clearFieldError("school-schoolCity"); }}
                  className={getFieldClass("school-schoolCity")}
                  data-testid="input-school-collab-city"
                />
              </div>
            </div>
            
            <div>
              <Label>School Name *</Label>
              <Input
                placeholder="Enter school name"
                value={schoolData.schoolName}
                onChange={(e) => { setSchoolData({...schoolData, schoolName: e.target.value}); clearFieldError("school-schoolName"); }}
                className={getFieldClass("school-schoolName")}
                data-testid="input-school-collab-name"
              />
            </div>
            
            <div>
              <Label>School Address</Label>
              <Input
                placeholder="Enter school address"
                value={schoolData.schoolAddress}
                onChange={(e) => setSchoolData({...schoolData, schoolAddress: e.target.value})}
                className="h-12"
                data-testid="input-school-address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Principal Name</Label>
                <Input
                  placeholder="Enter principal name"
                  value={schoolData.principalName}
                  onChange={(e) => setSchoolData({...schoolData, principalName: e.target.value})}
                  data-testid="input-principal-name"
                />
              </div>
              <div>
                <Label>Board Affiliation</Label>
                <Select value={schoolData.boardAffiliation} onValueChange={(v) => setSchoolData({...schoolData, boardAffiliation: v})}>
                  <SelectTrigger data-testid="select-board-affiliation">
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="State Board">State Board</SelectItem>
                    <SelectItem value="IB">IB</SelectItem>
                    <SelectItem value="IGCSE">IGCSE</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Expected Number of Students *</Label>
              <Input
                type="number"
                placeholder="e.g., 75"
                value={schoolData.expectedStudents}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = parseInt(val);
                  const range = !val ? "" : num < 50 ? "Less than 50 students" : num < 100 ? "50-99 students" : num < 150 ? "100-149 students" : "150+ students";
                  setSchoolData({...schoolData, expectedStudents: val, categoryRange: range});
                  clearFieldError("school-expectedStudents");
                }}
                className={getFieldClass("school-expectedStudents")}
                data-testid="input-expected-students"
              />
            </div>
            
            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Any additional information..."
                value={schoolData.message}
                onChange={(e) => setSchoolData({...schoolData, message: e.target.value})}
                rows={3}
                data-testid="textarea-message"
              />
            </div>
            
            <div className={getCheckboxContainerClass("school-terms") + " pt-4 border-t"}>
              <Checkbox
                id="school-terms"
                checked={schoolData.termsAccepted}
                onCheckedChange={(c) => { setSchoolData({...schoolData, termsAccepted: c as boolean}); clearFieldError("school-terms"); }}
                data-testid="checkbox-school-terms"
              />
              <Label htmlFor="school-terms" className="text-sm leading-relaxed cursor-pointer">
                I accept the terms and conditions of Samikaran Olympiad school collaboration program.
              </Label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("role")} className="h-12" data-testid="button-school-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => {
                  const emptyFields: string[] = [];
                  if (!schoolData.teacherFirstName) emptyFields.push("school-teacherFirstName");
                  if (!schoolData.teacherLastName) emptyFields.push("school-teacherLastName");
                  if (!schoolData.teacherEmail) emptyFields.push("school-teacherEmail");
                  if (!schoolData.password) emptyFields.push("school-password");
                  if (!schoolData.retypePassword) emptyFields.push("school-retypePassword");
                  if (!schoolData.country) emptyFields.push("school-country");
                  if (!schoolData.schoolCity) emptyFields.push("school-schoolCity");
                  if (!schoolData.schoolName) emptyFields.push("school-schoolName");
                  if (!schoolData.expectedStudents) emptyFields.push("school-expectedStudents");
                  if (emptyFields.length > 0) {
                    triggerShake(emptyFields);
                    setAlertMessage("Please fill in all required fields");
                    return;
                  }
                  const pwdCheck = validatePassword(schoolData.password);
                  if (!pwdCheck.valid) {
                    triggerShake(["school-password"]);
                    setAlertMessage(pwdCheck.message);
                    return;
                  }
                  if (schoolData.password !== schoolData.retypePassword) {
                    triggerShake(["school-retypePassword"]);
                    setAlertMessage("Passwords do not match");
                    return;
                  }
                  if (!schoolData.termsAccepted) {
                    triggerShake(["school-terms"]);
                    setAlertMessage("Please accept the terms and conditions");
                    return;
                  }
                  setStep("review");
                }}
                className="flex-1 h-12 brand-button font-bold tracking-widest uppercase"
                disabled={schoolRegistrationMutation.isPending}
                data-testid="button-school-submit"
              >
                {schoolRegistrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Register School
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderReviewStep = () => {
    const isSubmitting = selectedRole === "student" 
      ? studentRegistrationMutation.isPending 
      : selectedRole === "supervisor" 
        ? supervisorRegistrationMutation.isPending 
        : schoolRegistrationMutation.isPending;

    const handleConfirmSubmit = () => {
      if (selectedRole === "student") {
        studentRegistrationMutation.mutate();
      } else if (selectedRole === "supervisor") {
        supervisorRegistrationMutation.mutate();
      } else if (selectedRole === "school") {
        schoolRegistrationMutation.mutate();
      }
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const SummaryRow = ({ label, value }: { label: string; value: string }) => (
      <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-medium text-sm text-right max-w-[60%]">{value || "-"}</span>
      </div>
    );

    const roleTitle = selectedRole === "student" 
      ? "Student Registration" 
      : selectedRole === "supervisor" 
        ? "Supervisor / Parent Registration" 
        : "School Collaboration";

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Review Your Details</h2>
            <p className="text-muted-foreground">{roleTitle} - Please verify all information before submitting</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              {selectedRole === "student" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Personal Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="Full Name" value={`${studentData.firstName}${studentData.middleName ? ` ${studentData.middleName}` : ''} ${studentData.lastName}`} />
                      <SummaryRow label="Date of Birth" value={formatDate(studentData.dateOfBirth)} />
                      <SummaryRow label="Gender" value={studentData.gender ? studentData.gender.charAt(0).toUpperCase() + studentData.gender.slice(1) : "-"} />
                      <SummaryRow label="Parent/Guardian Name" value={studentData.parentName} />
                      <SummaryRow label="Primary Contact" value={contactType === "email" ? emailValue : `${phoneCountryCode}${phoneValue}`} />
                      <SummaryRow label="Phone Number" value={`${studentData.countryCode} ${studentData.phone}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Location & School Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="Country" value={countriesList.find(c => c.id === studentData.countryId)?.name || "-"} />
                      <SummaryRow label="State" value={statesList.find(s => s.id === studentData.stateId)?.name || "-"} />
                      <SummaryRow label="City" value={citiesList.find(c => c.id === studentData.cityId)?.name || "-"} />
                      <SummaryRow label="School Name" value={studentData.schoolName} />
                      <SummaryRow label="Grade Level" value={studentData.gradeLevel} />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === "supervisor" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Personal Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="Full Name" value={`${supervisorData.firstName} ${supervisorData.lastName}`} />
                      <SummaryRow label="Date of Birth" value={formatDate(supervisorData.dateOfBirth)} />
                      <SummaryRow label="Gender" value={supervisorData.gender ? supervisorData.gender.charAt(0).toUpperCase() + supervisorData.gender.slice(1) : "-"} />
                      <SummaryRow label="Primary Contact" value={contactType === "email" ? emailValue : `${phoneCountryCode}${phoneValue}`} />
                      <SummaryRow label="Phone Number" value={`${supervisorData.countryCode} ${supervisorData.phone}`} />
                      {supervisorData.secondaryEmail && <SummaryRow label="Secondary Email" value={supervisorData.secondaryEmail} />}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">School Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="School Name" value={supervisorData.schoolName} />
                      <SummaryRow label="School Location" value={supervisorData.schoolLocation} />
                      <SummaryRow label="City" value={supervisorData.schoolCity} />
                      <SummaryRow label="Branch" value={supervisorData.branch} />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === "school" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">School Head Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="Full Name" value={`${schoolData.teacherFirstName} ${schoolData.teacherLastName}`} />
                      <SummaryRow label="Email" value={schoolData.teacherEmail} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">School Details</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <SummaryRow label="School Name" value={schoolData.schoolName} />
                      <SummaryRow label="Country" value={schoolData.country} />
                      <SummaryRow label="City" value={schoolData.schoolCity} />
                      {schoolData.schoolAddress && <SummaryRow label="Address" value={schoolData.schoolAddress} />}
                      {schoolData.principalName && <SummaryRow label="Principal" value={schoolData.principalName} />}
                      {schoolData.boardAffiliation && <SummaryRow label="Board" value={schoolData.boardAffiliation} />}
                      {schoolData.contactPhone && <SummaryRow label="Phone" value={schoolData.contactPhone} />}
                      <SummaryRow label="Expected Students" value={`${schoolData.expectedStudents}${schoolData.categoryRange ? ` (${schoolData.categoryRange})` : ""}`} />
                    </div>
                  </div>
                  {schoolData.message && (
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Message</h3>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm">{schoolData.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  className="flex-1 h-12"
                  data-testid="button-edit-details"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 brand-button font-bold tracking-widest uppercase"
                  data-testid="button-confirm-submit"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {selectedRole === "school" ? "Register School" : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-4">
            If you already have an account, please{" "}
            <Link href="/login" className="brand-accent hover:underline font-medium">log in here</Link>
          </p>
        </div>
      </motion.div>
    );
  };

  const renderFormStep = () => {
    if (selectedRole === "student") return renderStudentForm();
    if (selectedRole === "supervisor") return renderSupervisorForm();
    if (selectedRole === "school") return renderSchoolForm();
    return null;
  };

  return (
    <div className="min-h-screen education-pattern">
      <Helmet>
        <title>Register | Samikaran Olympiad — Join India's Top Olympiad Platform</title>
        <meta name="description" content="Register for Samikaran Olympiad — India's leading AI-powered online olympiad platform for Class 1-12. Sign up as a Student, School, or Supervisor." />
        <link rel="canonical" href="https://www.samikaranolympiad.com/register" />
        <meta property="og:title" content="Register | Samikaran Olympiad — Join India's Top Olympiad Platform" />
        <meta property="og:description" content="Register for Samikaran Olympiad — India's leading AI-powered online olympiad platform for Class 1-12. Sign up as a Student, School, or Supervisor." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/register" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Register | Samikaran Olympiad — Join India's Top Olympiad Platform" />
        <meta name="twitter:description" content="Register for Samikaran Olympiad — India's leading AI-powered online olympiad platform for Class 1-12." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/logo.png" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
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
      
      <main className="flex items-center justify-center py-6 sm:py-8 px-4">
        <Card className="w-full max-w-2xl mx-4 sm:mx-auto shadow-2xl border-0">
          <CardContent className="p-0">
            <div className="flex border-b border-border">
              <Link
                href="/login"
                className="flex-1 py-4 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-all bg-muted/30 text-muted-foreground hover:bg-muted/50"
                data-testid="tab-login"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <button
                className="flex-1 py-4 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide transition-all brand-gradient text-white"
                data-testid="tab-register"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {step === "contact" && renderContactStep()}
                {step === "otp" && renderOtpStep()}
                {step === "role" && renderRoleSelection()}
                {step === "form" && renderFormStep()}
                {step === "review" && renderReviewStep()}
              </AnimatePresence>
              <AnimatePresence>
                {renderAlertMessage()}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
