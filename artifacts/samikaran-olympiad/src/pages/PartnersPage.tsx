import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Users, TrendingUp, Globe, Zap, Shield, IndianRupee, CheckCircle, ArrowRight,
  Building2, GraduationCap, MapPin, Rocket, Handshake, BarChart3, HeadphonesIcon,
  School, Briefcase, Users2, Laptop, ChevronRight, Star, Award, Play, BadgeCheck,
  Target, Sparkles, Crown, Trophy
} from "lucide-react";

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  countryCode: z.string().default("+91"),
  organizationName: z.string().optional(),
  organizationType: z.string().min(1, "Organization type is required"),
  website: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  partnershipType: z.string().min(1, "Partnership type is required"),
  expectedStudentsPerMonth: z.string().optional(),
  targetGeography: z.string().optional(),
  marketingChannels: z.string().optional(),
  teamSize: z.string().optional(),
  whyPartner: z.string().min(10, "Please tell us why you want to partner"),
  priorEdtechExperience: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept terms"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function PartnersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const partnerStatsData = (() => {
    try {
      const parsed = JSON.parse(siteSettings?.partner_stats || "{}");
      return parsed;
    } catch { return {}; }
  })();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      countryCode: "+91",
      organizationName: "",
      organizationType: "",
      website: "",
      partnershipType: "",
      expectedStudentsPerMonth: "",
      targetGeography: "",
      marketingChannels: "",
      teamSize: "",
      whyPartner: "",
      priorEdtechExperience: "",
      termsAccepted: false,
    },
  });


  const submitApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const res = await apiRequest("POST", "/api/partner/apply", data);
      return res.json();
    },
    onSuccess: () => {
      setApplicationSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    submitApplication.mutate(data);
  };

  const benefits = [
    { icon: IndianRupee, title: "Transparent Commissions", desc: "Earn up to 20% on every student registration" },
    { icon: BarChart3, title: "Real-time Dashboards", desc: "Track your earnings and students instantly" },
    { icon: Zap, title: "Automated Payouts", desc: "Get paid automatically every month" },
    { icon: Shield, title: "Zero Tech Overhead", desc: "We handle all the technology" },
    { icon: Globe, title: "Global Platform", desc: "Access students from 50+ countries" },
    { icon: HeadphonesIcon, title: "Dedicated Support", desc: "Priority partner support team" },
  ];

  const partnerTypes = [
    { 
      icon: Users, 
      title: "Commission Partner", 
      desc: "Earn per student registration",
      features: ["10-20% commission", "No monthly fees", "Unlimited earnings"],
      color: "from-violet-500 to-purple-500"
    },
    { 
      icon: School, 
      title: "School / Institute Partner", 
      desc: "Onboard your institution's students",
      features: ["Bulk registration", "Institutional pricing", "Certificate branding"],
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: MapPin, 
      title: "Regional Partner", 
      desc: "Manage a territory exclusively",
      features: ["Exclusive territory", "Higher commissions", "Local marketing support"],
      color: "from-emerald-500 to-teal-500"
    },
    { 
      icon: Laptop, 
      title: "SaaS / White-Label Partner", 
      desc: "Run your own Olympiad business",
      features: ["Your branding", "Custom domain", "Full control"],
      color: "from-orange-500 to-red-500"
    },
  ];

  const whoCanApply = [
    { icon: GraduationCap, text: "Teachers & Educators" },
    { icon: Building2, text: "Coaching Institutes" },
    { icon: School, text: "School Groups" },
    { icon: Briefcase, text: "Education Entrepreneurs" },
    { icon: Rocket, text: "EdTech Startups" },
    { icon: Users2, text: "NGOs & Non-profits" },
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Become a Partner | Samikaran Olympiad — School & Institutional Partnerships</title>
        <meta name="description" content="Join Samikaran Olympiad Partner Program. Earn 10-20% commission, get exclusive territory rights, white-label solutions for schools & institutes. 500+ active partners. Apply now!" />
        <link rel="canonical" href="https://www.samikaranolympiad.com/become-a-partner" />
        <meta property="og:title" content="Become a Partner | Samikaran Olympiad — School & Institutional Partnerships" />
        <meta property="og:description" content="Join our global Olympiad platform and earn recurring revenue. 500+ partners, commission rates up to 20%." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/become-a-partner" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Become a Partner | Samikaran Olympiad" />
        <meta name="twitter:description" content="Earn recurring revenue by partnering with India's leading Olympiad platform. Schools, institutes, and individuals welcome." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/logo.png" />
      </Helmet>
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        
        {/* Animated gradient orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[100px]"
        />
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-white/20 backdrop-blur-sm text-white mb-8 text-sm px-6 py-2 border border-white/30">
                <Crown className="w-4 h-4 mr-2" />
                Global Partnership Program
              </Badge>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-8 leading-tight tracking-tight">
              Partner With Us.
              <br />
              <span className="bg-gradient-to-r from-violet-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                Build a Global Education Empire.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the world's fastest-growing Olympiad platform. Earn recurring revenue, 
              get exclusive territories, and scale with enterprise-grade technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  className="bg-white text-violet-600 hover:bg-gray-50 font-bold px-10 py-6 text-lg shadow-2xl shadow-black/20"
                  onClick={() => setShowApplicationForm(true)}
                  data-testid="button-apply-partner"
                >
                  Apply to Become a Partner
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/50 text-white hover:bg-white/10 font-bold px-10 py-6 text-lg backdrop-blur-sm"
                  onClick={() => setLocation("/partner/login")}
                  data-testid="button-partner-login"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Partner Login
                </Button>
              </motion.div>
            </div>
            
            {/* Trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { value: partnerStatsData.activePartners || "0", label: "Active Partners", icon: Users },
                { value: partnerStatsData.countries || "0", label: "Countries", icon: Globe },
                { value: partnerStatsData.paidOut || "₹0", label: "Paid Out", icon: IndianRupee },
                { value: partnerStatsData.satisfaction || "0%", label: "Satisfaction", icon: Trophy },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                >
                  <stat.icon className="w-6 h-6 text-amber-300 mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Premium Glassmorphism */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Partner Benefits
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Why <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Partner</span> With Us?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join a growing global ecosystem of education partners earning sustainable, recurring income
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="h-full p-8 rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-100 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-violet-500/25">
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types Section - Premium Cards */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Target className="w-3 h-3 mr-1" />
              Partnership Models
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Choose Your <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Partnership</span> Model
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Multiple ways to partner with us based on your capacity, goals, and market reach
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {partnerTypes.map((type, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="h-full overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-100 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className={`h-2 bg-gradient-to-r ${type.color}`}></div>
                  <div className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                      <type.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{type.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{type.desc}</p>
                    <ul className="space-y-3">
                      {type.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Apply Section - Light Blue Gradient */}
      <section className="py-24 bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-violet-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-violet-950/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Users className="w-3 h-3 mr-1" />
              Eligibility
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Who Can <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Apply?</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We welcome partners from diverse educational backgrounds across the globe
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {whoCanApply.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group"
              >
                <div className="text-center p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-blue-100 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Gradient */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600"></div>
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-pink-300/20 rounded-full blur-[80px]"
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-7 h-7 text-amber-300 fill-amber-300" />
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Ready to Start Your Partnership Journey?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join hundreds of successful partners earning sustainable income with Samikaran Olympiad
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                className="bg-white text-violet-600 hover:bg-gray-50 font-bold px-12 py-6 text-lg shadow-2xl shadow-black/20"
                onClick={() => setShowApplicationForm(true)}
              >
                Apply Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Application Form Dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl">Partner Application</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          
          {applicationSubmitted ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for your interest. Our team will review your application and contact you within 2-3 business days.
              </p>
              <Button onClick={() => { setShowApplicationForm(false); setApplicationSubmitted(false); }}>
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-500" />
                    Basic Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ananya Singh" {...field} data-testid="input-partner-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ananya@gmail.com" {...field} data-testid="input-partner-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} data-testid="input-partner-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country Code</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-country-code">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="+91">+91 (India)</SelectItem>
                              <SelectItem value="+1">+1 (USA)</SelectItem>
                              <SelectItem value="+44">+44 (UK)</SelectItem>
                              <SelectItem value="+971">+971 (UAE)</SelectItem>
                              <SelectItem value="+65">+65 (Singapore)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Organization Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-violet-500" />
                    Organization Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Education" {...field} data-testid="input-org-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-org-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="institute">Institute / Coaching</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Partnership Type */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-violet-500" />
                    Partnership Type *
                  </h3>
                  <FormField
                    control={form.control}
                    name="partnershipType"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-partnership-type">
                              <SelectValue placeholder="Select partnership type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="commission">Commission Partner - Earn per student</SelectItem>
                            <SelectItem value="school_institute">School / Institute Partner</SelectItem>
                            <SelectItem value="regional">Regional Partner - Manage a territory</SelectItem>
                            <SelectItem value="saas_whitelabel">SaaS / White-Label Partner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Capacity */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Business Capacity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expectedStudentsPerMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Students/Month</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-students-month">
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-50">1-50 students</SelectItem>
                              <SelectItem value="51-200">51-200 students</SelectItem>
                              <SelectItem value="201-500">201-500 students</SelectItem>
                              <SelectItem value="500+">500+ students</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-team-size">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="just_me">Just me</SelectItem>
                              <SelectItem value="2-5">2-5 people</SelectItem>
                              <SelectItem value="6-20">6-20 people</SelectItem>
                              <SelectItem value="20+">20+ people</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="targetGeography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Geography</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Maharashtra, India or Pan India" {...field} data-testid="input-geography" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-violet-500" />
                    Additional Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="whyPartner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to partner with us? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your motivation and goals..."
                            rows={3}
                            {...field}
                            data-testid="input-why-partner"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priorEdtechExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prior EdTech Experience (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any prior experience in education technology..."
                            rows={2}
                            {...field}
                            data-testid="input-prior-exp"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Terms */}
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the <a href="/terms" className="text-violet-600 hover:underline">Terms of Service</a> and <a href="/privacy-policy" className="text-violet-600 hover:underline">Privacy Policy</a> *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  disabled={submitApplication.isPending}
                  data-testid="button-submit-application"
                >
                  {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PublicLayout>
  );
}
