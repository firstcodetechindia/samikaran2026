import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Handshake, Lock, Mail, ArrowRight, Eye, EyeOff, Star, Home } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PartnerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/partner/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresAgreement) {
        setLocation("/partner/agreement");
      } else {
        setLocation("/partner/dashboard");
      }
      toast({
        title: "Login Successful",
        description: "Welcome back to your partner dashboard!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Helmet>
        <title>Partner Login | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Star className="text-white w-6 h-6" fill="rgba(255,255,255,0.3)" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black uppercase tracking-tight font-serif leading-none">SAMIKARAN.</span>
              <span className="text-sm font-bold uppercase font-serif leading-none">OLYMPIAD</span>
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
      
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-gray-100 dark:border-gray-800">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Partner Login</CardTitle>
              <CardDescription>
                Access your partner dashboard to track earnings and manage students
              </CardDescription>
            </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input 
                            type="email" 
                            placeholder="partner@example.com" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-partner-login-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            className="pl-10 pr-10"
                            {...field} 
                            data-testid="input-partner-login-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  disabled={loginMutation.isPending}
                  data-testid="button-partner-login-submit"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Don't have an account?{" "}
                <a href="/partners" className="text-violet-600 hover:underline font-medium">
                  Apply to become a partner
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}
