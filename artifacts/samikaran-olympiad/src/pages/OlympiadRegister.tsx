import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@shared/schema";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Target, 
  Shield, 
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  User,
  Mail,
  Phone,
  Star,
  Sparkles,
  IndianRupee,
  DollarSign,
  Download,
  FileText
} from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type PaymentStep = 'details' | 'payment' | 'success';

export default function OlympiadRegister() {
  const { examId } = useParams<{ examId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState<'india' | 'international'>('india');

  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: [`/api/public/olympiad/${examId}`],
    enabled: !!examId,
  });

  const { user: authUser, isLoading: userLoading } = useAuth();
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  
  // Get user from localStorage as fallback for immediate display
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('samikaran_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };
  
  // Use authUser if available, otherwise fallback to localStorage
  const user = authUser || getStoredUser();

  // Check if user already paid for this olympiad
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user || !examId) return;
      
      const studentId = (user as any)?.id;
      if (!studentId) return;
      
      try {
        const response = await fetch(`/api/olympiad/${examId}/check-registration/${studentId}`);
        const data = await response.json();
        
        if (data.alreadyPaid) {
          setAlreadyPaid(true);
          setRegistrationMessage(data.message);
          setStep('success'); // Show success page directly
        }
      } catch (error) {
        console.error('Failed to check registration:', error);
      }
    };
    
    checkExistingRegistration();
  }, [user, examId]);

  useEffect(() => {
    const detectRegion = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setDetectedRegion(data.country_code === 'IN' ? 'india' : 'international');
      } catch {
        setDetectedRegion('india');
      }
    };
    detectRegion();
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      // Check if we just came from login to avoid redirect loop
      const justLoggedIn = localStorage.getItem('samikaran_session_token');
      const storedUser = localStorage.getItem('samikaran_user');
      
      // If session exists in localStorage, user is logged in but query hasn't updated yet
      if (justLoggedIn && storedUser) {
        return; // Don't redirect, let the query refetch
      }
      
      localStorage.setItem('redirectAfterLogin', `/olympiad/${examId}/register`);
      navigate('/login');
    }
  }, [user, userLoading, examId, navigate]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/olympiad/${examId}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/olympiads"] });
      setStep('success');
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePayment = async () => {
    // Double-check: Prevent payment if already paid
    if (alreadyPaid) {
      toast({
        title: "Already Registered",
        description: "You have already paid for this olympiad. Duplicate payment is not allowed.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional server-side check before processing
    const studentId = (user as any)?.id;
    if (studentId && examId) {
      try {
        const checkResponse = await fetch(`/api/olympiad/${examId}/check-registration/${studentId}`);
        const checkData = await checkResponse.json();
        
        if (checkData.alreadyPaid) {
          setAlreadyPaid(true);
          setRegistrationMessage(checkData.message);
          toast({
            title: "Payment Already Completed",
            description: checkData.message,
            variant: "destructive",
          });
          setStep('success');
          return;
        }
      } catch (error) {
        console.error('Registration check failed:', error);
      }
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    registerMutation.mutate();
    setIsProcessing(false);
  };

  if (examLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </PublicLayout>
    );
  }

  if (!exam) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-bold mb-2">Olympiad Not Found</h2>
            <p className="text-muted-foreground mb-4">The olympiad you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  const examFee = (exam as any).fee || (exam as any).price || 299;
  const taxAmount = Math.round(examFee * 0.18);
  const totalAmount = examFee + taxAmount;

  return (
    <PublicLayout>
      <Helmet>
        <title>{exam ? `Register for ${exam.title} | Samikaran Olympiad` : 'Olympiad Registration | Samikaran Olympiad'}</title>
        <meta name="description" content={exam ? `Register for ${exam.title} — ${exam.subject} Olympiad by Samikaran. AI-proctored, secure online examination for students.` : 'Register for an olympiad on Samikaran Olympiad platform.'} />
        <meta property="og:title" content={exam ? `Register for ${exam.title} | Samikaran Olympiad` : 'Olympiad Registration | Samikaran Olympiad'} />
        <meta property="og:description" content={exam ? `Register for ${exam.title} — ${exam.subject} Olympiad by Samikaran.` : 'Register for an olympiad on Samikaran Olympiad.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.samikaranolympiad.com/olympiad-register/${exam?.id || ''}`} />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <link rel="canonical" href={`https://www.samikaranolympiad.com/olympiad-register/${exam?.id || ''}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={exam ? `Register for ${exam.title} | Samikaran Olympiad` : 'Olympiad Registration | Samikaran Olympiad'} />
        <meta name="twitter:description" content={exam ? `Register for ${exam.title} — ${exam.subject} Olympiad by Samikaran.` : 'Register for an olympiad on Samikaran Olympiad.'} />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/logo.png" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50/30 dark:from-background dark:via-background dark:to-purple-950/10 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>

          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              {step === 'details' && (
                <Card className="overflow-hidden rounded-3xl border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight font-serif">{exam.title}</h1>
                        <p className="text-sm text-muted-foreground">{exam.subject} Olympiad</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Exam Date</p>
                          <p className="font-bold">{new Date(exam.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                        <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                          <p className="font-bold">{exam.durationMinutes} Minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Eligibility</p>
                          <p className="font-bold">Class {exam.classCategory || `${exam.minClass || 1}-${exam.maxClass || 12}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Marks</p>
                          <p className="font-bold">{exam.totalMarks} Marks</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-6">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        What You'll Get
                      </h3>
                      <ul className="space-y-2">
                        {[
                          "AI-Proctored Secure Examination",
                          "Instant Result & Performance Analytics",
                          "Digital Certificate on Completion",
                          "National & Global Ranking",
                          "Detailed Question-wise Analysis"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      onClick={() => setStep('payment')}
                      className="w-full h-14 rounded-xl brand-button font-black text-sm uppercase tracking-widest"
                      data-testid="button-proceed-payment"
                    >
                      Proceed to Payment <CreditCard className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              )}

              {step === 'payment' && (
                <Card className="overflow-hidden rounded-3xl border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Payment</h2>
                        <p className="text-sm text-muted-foreground">Complete your registration</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                      <Badge variant="outline" className={detectedRegion === 'india' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-blue-100 text-blue-700 border-blue-300'}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {detectedRegion === 'india' ? 'India' : 'International'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Payment via {detectedRegion === 'india' ? 'Razorpay' : 'Stripe'}
                      </span>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Student Name</span>
                        </div>
                        <p className="font-bold pl-7">{user?.firstName} {user?.lastName}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Email Address</span>
                        </div>
                        <p className="font-bold pl-7">{user?.email}</p>
                      </div>
                      {user?.phone && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3 mb-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Phone Number</span>
                          </div>
                          <p className="font-bold pl-7">{user?.phone}</p>
                        </div>
                      )}
                    </div>

                    {detectedRegion === 'india' ? (
                      <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center justify-between mb-4">
                          <img src="https://razorpay.com/assets/razorpay-logo-white.svg" alt="Razorpay" className="h-6 dark:invert" />
                          <Badge className="bg-green-100 text-green-700">Secure</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Pay securely using UPI, Credit/Debit Card, Net Banking, or Wallets
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((method) => (
                            <Badge key={method} variant="secondary" className="text-xs">{method}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="font-bold">Stripe</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Secure</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Pay securely using Credit/Debit Card or Apple Pay/Google Pay
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map((method) => (
                            <Badge key={method} variant="secondary" className="text-xs">{method}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => setStep('details')}
                        className="flex-1 h-14 rounded-xl font-bold"
                        data-testid="button-back-details"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="flex-[2] h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 font-black text-sm uppercase tracking-widest"
                        data-testid="button-pay-now"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Pay {detectedRegion === 'india' ? <IndianRupee className="w-4 h-4 mx-1" /> : <DollarSign className="w-4 h-4 mx-1" />}
                            {detectedRegion === 'india' ? totalAmount : Math.round(totalAmount / 80)}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {step === 'success' && (
                <Card className="overflow-hidden rounded-3xl border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                  <div className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black mb-3 uppercase tracking-tight">
                      {alreadyPaid ? 'Already Registered!' : 'Registration Successful!'}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      {alreadyPaid 
                        ? <span>You have already paid for <span className="font-bold text-foreground">{exam.title}</span>. No further payment is required.</span>
                        : <span>You are now registered for <span className="font-bold text-foreground">{exam.title}</span></span>
                      }
                    </p>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-8 text-left">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        What's Next?
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-300">1</span>
                          </div>
                          <p className="text-sm">Confirmation email sent to <span className="font-semibold">{user?.email}</span></p>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-300">2</span>
                          </div>
                          <p className="text-sm">Practice with sample papers available in your dashboard</p>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-300">3</span>
                          </div>
                          <p className="text-sm">Exam link will be active on <span className="font-semibold">{new Date(exam.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </li>
                      </ul>
                    </div>

                    <div className="mb-6">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/registration/invoice', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
                                studentId: (user as any)?.studentId || 'N/A',
                                studentEmail: user?.email || 'N/A',
                                examTitle: exam.title,
                                examSubject: exam.subject,
                                examDate: new Date(exam.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                                amount: examFee,
                                currency: detectedRegion === 'india' ? 'INR' : 'USD',
                                examId: exam.id
                              })
                            });
                            
                            if (!response.ok) throw new Error('Failed to generate invoice');
                            
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Samikaran_Invoice_${exam.title.replace(/\s+/g, '_')}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (error) {
                            toast({
                              title: "Download Failed",
                              description: "Could not download invoice. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="w-full h-12 rounded-xl font-bold border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        data-testid="button-download-invoice"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Download Invoice (PDF)
                        <Download className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/')}
                        className="flex-1 h-12 rounded-xl font-bold"
                      >
                        Back to Home
                      </Button>
                      <Button 
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 h-12 rounded-xl brand-button font-bold"
                        data-testid="button-go-dashboard"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              <Card className="sticky top-24 overflow-hidden rounded-3xl border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">Order Summary</h3>
                  
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold line-clamp-1">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">{exam.subject}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registration Fee</span>
                      <span className="font-semibold">
                        {detectedRegion === 'india' ? `₹${examFee}` : `$${Math.round(examFee / 80)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span className="font-semibold">
                        {detectedRegion === 'india' ? `₹${taxAmount}` : `$${Math.round(taxAmount / 80)}`}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold">Total</span>
                        <span className="font-black text-xl text-purple-600 dark:text-purple-400">
                          {detectedRegion === 'india' ? `₹${totalAmount}` : `$${Math.round(totalAmount / 80)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold">100% Secure Payment</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Your payment information is encrypted and secure.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
