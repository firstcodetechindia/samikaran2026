import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, Trophy, Shield, BookOpen, Users, Globe, 
  Clock, Send, CheckCircle2, Sparkles, Target, Award,
  Mail, Phone, User, MessageSquare, Star
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube, SiWhatsapp } from "react-icons/si";

interface SocialLink {
  id: number;
  platformCode: string;
  platformName: string;
  pageUrl: string | null;
  isActive: boolean;
}

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const features = [
  {
    icon: GraduationCap,
    title: "AI-Powered Exams",
    description: "Smart question generation and adaptive testing for every student's level",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Secure Proctoring",
    description: "Advanced camera monitoring and anti-cheating measures",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: Trophy,
    title: "Global Rankings",
    description: "Compete with students worldwide and earn certificates",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: BookOpen,
    title: "Rich Content",
    description: "Curated questions across Math, Science, and more subjects",
    color: "from-rose-500 to-orange-600"
  },
];

const stats = [
  { value: "42+", label: "Countries", icon: Globe },
  { value: "10K+", label: "Students", icon: Users },
  { value: "500+", label: "Schools", icon: GraduationCap },
  { value: "100+", label: "Exams", icon: Target },
];

export default function ComingSoonPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const { data: socialLinks = [] } = useQuery<SocialLink[]>({
    queryKey: ["/api/public/social-links"],
  });

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const submitEnquiry = useMutation({
    mutationFn: async (data: EnquiryFormValues) => {
      const response = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "coming_soon" }),
      });
      if (!response.ok) throw new Error("Failed to submit");
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      toast({ title: "Thank you! We'll be in touch soon." });
    },
    onError: () => {
      toast({ title: "Failed to submit. Please try again.", variant: "destructive" });
    },
  });

  const platformIcons: Record<string, any> = {
    facebook: SiFacebook,
    instagram: SiInstagram,
    x: SiX,
    linkedin: SiLinkedin,
    youtube: SiYoutube,
    whatsapp: SiWhatsapp,
  };

  const platformColors: Record<string, string> = {
    facebook: "hover:bg-blue-500 hover:text-white",
    instagram: "hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-600 hover:text-white",
    x: "hover:bg-gray-800 hover:text-white",
    linkedin: "hover:bg-blue-600 hover:text-white",
    youtube: "hover:bg-red-600 hover:text-white",
    whatsapp: "hover:bg-green-500 hover:text-white",
  };

  const onSubmit = (data: EnquiryFormValues) => {
    submitEnquiry.mutate(data);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 animate-gradient-shift" />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -100],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Gradient overlay patterns */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
              <Star className="text-white w-9 h-9" fill="rgba(255,255,255,0.3)" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-3xl md:text-4xl font-bold tracking-tight leading-none text-white">SAMIKARAN<span className="text-fuchsia-400">.</span></span>
              <span className="text-2xl md:text-3xl font-bold text-white/80 uppercase">OLYMPIAD</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-6">
            Coming Soon
          </h1>
        </motion.header>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The Future of<br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 text-transparent bg-clip-text">
              Global Olympiad Exams
            </span>
          </h1>
          <p className="text-xl text-violet-100/90 max-w-2xl mx-auto mb-8">
            Prepare for a revolutionary online examination platform powered by AI, 
            featuring secure proctoring, real-time analytics, and worldwide competitions.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <stat.icon className="w-6 h-6 text-violet-300 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-violet-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tabs Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Tabs defaultValue="features" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20" data-testid="tabs-info">
              <TabsTrigger value="features" className="data-[state=active]:bg-white/20 text-white" data-testid="tab-features">
                <Sparkles className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-white/20 text-white" data-testid="tab-about">
                <Award className="w-4 h-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-white/20 text-white" data-testid="tab-contact">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all" data-testid={`feature-card-${index}`}>
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-violet-200 text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">About Samikaran Olympiad</h3>
                  <p className="text-violet-100">
                    Samikaran Olympiad is a next-generation global examination platform designed to nurture and 
                    identify exceptional talent across the world. Our AI-powered system ensures fair, secure, 
                    and engaging assessments for students of all ages.
                  </p>
                  <p className="text-violet-100">
                    With presence in 42+ countries and partnerships with leading educational institutions, 
                    we're building the future of competitive examinations. Our secure proctoring system, 
                    real-time analytics, and comprehensive reporting make us the trusted choice for schools 
                    and students alike.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4">
                    <Badge className="bg-violet-500/30 text-violet-100 border-violet-400/30">AI-Powered</Badge>
                    <Badge className="bg-purple-500/30 text-purple-100 border-purple-400/30">Secure</Badge>
                    <Badge className="bg-fuchsia-500/30 text-fuchsia-100 border-fuchsia-400/30">Global</Badge>
                    <Badge className="bg-pink-500/30 text-pink-100 border-pink-400/30">Innovative</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Get in Touch</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-violet-100">
                        <Mail className="w-5 h-5 text-violet-300" />
                        <span>support@samikaranolympiad.com</span>
                      </div>
                      <div className="flex items-center gap-3 text-violet-100">
                        <Phone className="w-5 h-5 text-violet-300" />
                        <span>{siteSettings?.contact_phone || siteSettings?.support_phone || ""}</span>
                      </div>
                      <div className="flex items-center gap-3 text-violet-100">
                        <Globe className="w-5 h-5 text-violet-300" />
                        <span>www.samikaranolympiad.com</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-violet-200 text-sm">
                        Have questions about the upcoming launch? Want to register your school early? 
                        Fill out the enquiry form below and our team will get back to you within 24 hours.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Enquiry Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Stay Updated</h2>
              <p className="text-violet-200 text-center mb-6">Be the first to know when we launch!</p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
                  <p className="text-violet-200">We've received your enquiry. Our team will contact you soon.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-white/30 text-white hover:bg-white/20"
                    onClick={() => setSubmitted(false)}
                    data-testid="button-submit-another"
                  >
                    Submit Another Enquiry
                  </Button>
                </motion.div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-violet-200">Full Name *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                                <Input 
                                  {...field} 
                                  placeholder="Ananya Singh"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-violet-300/50"
                                  data-testid="input-name"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-violet-200">Email Address *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                                <Input 
                                  {...field} 
                                  type="email"
                                  placeholder="ananya@example.com"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-violet-300/50"
                                  data-testid="input-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-violet-200">Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                                <Input 
                                  {...field} 
                                  placeholder="+91 9876543210"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-violet-300/50"
                                  data-testid="input-phone"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-violet-200">Subject</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="General Inquiry"
                                className="bg-white/10 border-white/20 text-white placeholder:text-violet-300/50"
                                data-testid="input-subject"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Message *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-violet-400" />
                              <Textarea 
                                {...field} 
                                placeholder="Tell us what you're interested in..."
                                className="pl-10 min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-violet-300/50"
                                data-testid="input-message"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                      disabled={submitEnquiry.isPending}
                      data-testid="button-submit-enquiry"
                    >
                      {submitEnquiry.isPending ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Enquiry
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Social Media Links */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pb-8"
        >
          <p className="text-violet-200 mb-4">Follow us for updates</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {socialLinks.filter(link => link.pageUrl).map((link) => {
              const IconComponent = platformIcons[link.platformCode];
              const colorClass = platformColors[link.platformCode] || "hover:bg-white/30";
              
              return (
                <a
                  key={link.id}
                  href={link.pageUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all ${colorClass}`}
                  data-testid={`social-link-${link.platformCode}`}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                </a>
              );
            })}
          </div>
          <p className="text-violet-300/60 text-sm mt-8">
            &copy; {new Date().getFullYear()} Samikaran Olympiad. All rights reserved.
          </p>
        </motion.footer>
      </div>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
