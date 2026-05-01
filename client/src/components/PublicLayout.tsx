import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, ArrowRight, Heart, User, ChevronDown, LogOut, LayoutDashboard, Menu, X, Star, Brain, Calculator, Atom, BookOpen, FlaskConical, Dna, Monitor, Globe, Puzzle, Languages, Shield, Sparkles, Bell, Rocket, GraduationCap, School, Handshake, Users, UserCog } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BackToTop } from "@/components/BackToTop";
import type { Exam, Announcement } from "@shared/schema";

interface SocialLink {
  id: number;
  platformCode: string;
  platformName: string;
  pageUrl: string | null;
  isActive: boolean;
}

interface FooterPage {
  id: number;
  title: string;
  slug: string;
  footerColumn: string;
}

const platformIcons: Record<string, any> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  x: SiX,
  linkedin: SiLinkedin,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
};

const platformColors: Record<string, string> = {
  facebook: "hover:bg-blue-600",
  instagram: "hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500",
  x: "hover:bg-gray-700",
  linkedin: "hover:bg-blue-700",
  youtube: "hover:bg-red-600",
  whatsapp: "hover:bg-green-600",
};


function UserProfileMenu({ user }: { user: any }) {
  const userType = user.userType || 'student';
  const displayName = userType === 'school' 
    ? (user.schoolName || user.firstName || 'School')
    : userType === 'partner'
    ? ((user as any).organizationName || user.firstName || 'Partner')
    : userType === 'group'
    ? ((user as any).organizationName || user.firstName || 'Group')
    : userType === 'supervisor'
    ? (user.firstName || 'Supervisor')
    : userType === 'admin' || userType === 'super_admin'
    ? (user.firstName || 'Admin')
    : (user.firstName || user.email?.split('@')[0] || 'Student');
  
  const avatarInitial = displayName[0]?.toUpperCase() || 'U';
  
  const roleLabel = userType === 'school' ? 'School' 
    : userType === 'partner' ? 'Partner' 
    : userType === 'group' ? 'Group Coordinator'
    : userType === 'supervisor' ? 'Supervisor'
    : userType === 'admin' || userType === 'super_admin' ? 'Administrator'
    : 'Student';
  
  const avatarGradient = userType === 'school' 
    ? 'from-blue-500 to-cyan-500'
    : userType === 'partner'
    ? 'from-emerald-500 to-green-500'
    : userType === 'group'
    ? 'from-orange-500 to-amber-500'
    : userType === 'supervisor'
    ? 'from-teal-500 to-cyan-500'
    : userType === 'admin' || userType === 'super_admin'
    ? 'from-red-500 to-rose-500'
    : 'from-purple-500 to-pink-500';
  
  const RoleIcon = userType === 'school' ? School 
    : userType === 'partner' ? Handshake
    : userType === 'group' ? Users
    : userType === 'supervisor' ? UserCog
    : userType === 'admin' || userType === 'super_admin' ? Shield
    : GraduationCap;
  
  const dashboardPath = userType === 'student' ? '/dashboard' 
    : userType === 'school' ? '/school' 
    : userType === 'group' ? '/group' 
    : userType === 'partner' ? '/partner'
    : userType === 'supervisor' ? '/supervisor'
    : '/admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 h-10 rounded-xl border border-transparent hover:border-purple-400/30 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group" data-testid="button-user-menu">
          <div className="relative">
            <Avatar className="h-8 w-8 border-2 border-white/20 group-hover:border-purple-400/50 transition-all duration-300 group-hover:scale-105">
              <AvatarFallback className={`bg-gradient-to-br ${avatarGradient} text-white text-xs font-bold`}>
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br ${avatarGradient} border-2 border-background flex items-center justify-center`}>
              <RoleIcon className="h-2 w-2 text-white" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {(user as any).studentId || roleLabel}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block group-hover:text-purple-400 transition-colors duration-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-2xl p-0 overflow-hidden">
        <div className={`px-4 py-3 bg-gradient-to-r ${avatarGradient}`}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/30 shadow-md">
              <AvatarFallback className={`bg-gradient-to-br ${avatarGradient} text-white text-sm font-bold`}>
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleIcon className="h-3 w-3 text-white/70" />
                <span className="text-[11px] text-white/70 font-medium">{roleLabel}</span>
              </div>
              {(user as any).studentId && (
                <p className="text-[10px] text-white/60 font-mono mt-0.5">{(user as any).studentId}</p>
              )}
            </div>
          </div>
          {user.email && (
            <p className="text-[11px] text-white/50 truncate mt-2 pl-[52px]">{user.email}</p>
          )}
        </div>
        <div className="p-1.5">
          <Link href={dashboardPath}>
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors" data-testid="menu-item-dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2.5 text-purple-500" />
              <span className="font-medium">Dashboard</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem 
            className="cursor-pointer rounded-lg px-3 py-2.5 text-destructive focus:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            data-testid="menu-item-logout"
            onClick={() => {
              localStorage.removeItem('samikaran_user');
              localStorage.removeItem('samikaran_session_token');
              window.location.href = '/';
            }}
          >
            <LogOut className="h-4 w-4 mr-2.5" />
            <span className="font-medium">Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PublicLayoutProps {
  children: React.ReactNode;
  showNotificationBar?: boolean;
}

const navSubjectIcons: Record<string, any> = {
  'Mathematics': Calculator,
  'Science': FlaskConical,
  'English': BookOpen,
  'Hindi': Languages,
  'Reasoning': Brain,
  'General Knowledge': Globe,
  'Computer': Monitor,
  'EVS': Sparkles,
  'Physics': Atom,
  'Chemistry': FlaskConical,
  'Biology': Dna,
  'Cyber Safety': Shield,
  'default': Sparkles
};

export function PublicLayout({ children, showNotificationBar = true }: PublicLayoutProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [olympiadDropdownOpen, setOlympiadDropdownOpen] = useState(false);
  const [mobileOlympiadExpanded, setMobileOlympiadExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: navOlympiads } = useQuery<Exam[]>({
    queryKey: ["/api/public/olympiads"],
  });

  const littleChampsOlympiads = (navOlympiads || []).filter(e => {
    const min = e.minClass || 1, max = e.maxClass || 12;
    if (max <= 5) return true;
    if (min >= 6) return false;
    return (min + max) / 2 < 6;
  });
  const eliteSeniorsOlympiads = (navOlympiads || []).filter(e => {
    const min = e.minClass || 1, max = e.maxClass || 12;
    if (max <= 5) return false;
    if (min >= 6) return true;
    return (min + max) / 2 >= 6;
  });

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOlympiadDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOlympiadDropdownOpen(false);
    }, 200);
  };
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('samikaran_dismissed_notifs') || '[]');
    } catch { return []; }
  });

  const { data: notifications = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/public/notifications"],
    refetchInterval: 60000,
  });

  const activeNotifications = useMemo(() => 
    notifications.filter(n => !dismissedIds.includes(n.id)),
    [notifications, dismissedIds]
  );

  const dismissNotification = (id: number) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('samikaran_dismissed_notifs', JSON.stringify(updated));
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Olympiads', href: '/olympiads', hasDropdown: true },
    { label: 'About', href: '/about' },
    { label: 'Brand', href: '/brand' },
    { label: 'Awards', href: '/awards' },
    { label: 'Blog', href: '/blog' },
    { label: 'Partners', href: '/partners' },
    { label: 'Contact', href: '/contact' },
  ];

  const { data: socialLinksData = [] } = useQuery<SocialLink[]>({
    queryKey: ["/api/public/social-links"],
  });
  
  // Default social links to show the design even when none configured
  const defaultSocialLinks: SocialLink[] = [
    { id: 1, platformCode: "facebook", platformName: "Facebook", pageUrl: "https://facebook.com/samikaranolympiad", isActive: true },
    { id: 2, platformCode: "instagram", platformName: "Instagram", pageUrl: "https://instagram.com/samikaranolympiad", isActive: true },
    { id: 3, platformCode: "youtube", platformName: "YouTube", pageUrl: "https://youtube.com/@samikaranolympiad", isActive: true },
    { id: 4, platformCode: "linkedin", platformName: "LinkedIn", pageUrl: "https://linkedin.com/company/samikaranolympiad", isActive: true },
    { id: 5, platformCode: "x", platformName: "X", pageUrl: "https://x.com/samikaranolympiad", isActive: true },
  ];
  
  // Use database links if available, otherwise show defaults
  const socialLinks = socialLinksData.length > 0 ? socialLinksData : defaultSocialLinks;
  
  const { data: footerPages = [] } = useQuery<FooterPage[]>({
    queryKey: ["/api/public/footer-pages"],
  });
  
  const companyPages = footerPages.filter(p => p.footerColumn === "company");
  const legalPages = footerPages.filter(p => p.footerColumn === "legal");
  const resourcePages = footerPages.filter(p => p.footerColumn === "resources");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary focus:text-white focus:p-4">
        Skip to main content
      </a>
      
      {showNotificationBar && (
        <div className="brand-gradient py-2.5 px-6 overflow-hidden">
          <div className="container mx-auto flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black backdrop-blur-sm">NEW</span>
              <p className="text-xs font-bold tracking-wide">Sample Papers for Class 1-12 now available!</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[10px] font-bold">
              <Link href="/faq" className="hover:underline">FAQS</Link>
              <span className="text-white/40">|</span>
              <Link href="/contact" className="hover:underline">CONTACT</Link>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 py-3 sm:py-4 px-4 sm:px-6">
        <div className="container mx-auto flex justify-between items-center">
          <BrandLogo size="sm" animated={true} linkTo="/" />
          
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((item) => {
              const isActive = item.href === '/' 
                ? location === '/' 
                : location.startsWith(item.href);

              if ((item as any).hasDropdown) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    ref={dropdownRef}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Link href={item.href} className="group relative py-2 flex items-center gap-1">
                      <span className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-primary' : 'hover:text-primary'}`}>
                        {item.label}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${olympiadDropdownOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                      <span className={`absolute bottom-0 left-0 h-0.5 brand-gradient transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </Link>

                    <AnimatePresence>
                      {olympiadDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl p-5 z-50"
                        >
                          <div className="grid grid-cols-2 gap-5">
                            <div>
                              <div className="flex items-center gap-2 mb-3 px-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                  <Rocket className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Little Champs</span>
                                <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Class 1-5</span>
                              </div>
                              <div className="space-y-0.5">
                                {littleChampsOlympiads.map(exam => {
                                  const SubIcon = navSubjectIcons[exam.subject || 'default'] || navSubjectIcons['default'];
                                  return (
                                    <div
                                      key={exam.id}
                                      onClick={() => { navigate(`/olympiad/${exam.id}`); setOlympiadDropdownOpen(false); }}
                                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer transition-colors group/item"
                                      data-testid={`nav-dropdown-olympiad-${exam.id}`}
                                    >
                                      <SubIcon className="w-4 h-4 text-amber-500 group-hover/item:text-amber-600" />
                                      <span className="text-xs font-bold text-foreground truncate">{exam.subject}</span>
                                    </div>
                                  );
                                })}
                                {littleChampsOlympiads.length === 0 && (
                                  <p className="text-xs text-muted-foreground px-2.5 py-2">Coming soon...</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-3 px-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                  <GraduationCap className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Elite Seniors</span>
                                <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Class 6-12</span>
                              </div>
                              <div className="space-y-0.5">
                                {eliteSeniorsOlympiads.map(exam => {
                                  const SubIcon = navSubjectIcons[exam.subject || 'default'] || navSubjectIcons['default'];
                                  return (
                                    <div
                                      key={exam.id}
                                      onClick={() => { navigate(`/olympiad/${exam.id}`); setOlympiadDropdownOpen(false); }}
                                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors group/item"
                                      data-testid={`nav-dropdown-olympiad-${exam.id}`}
                                    >
                                      <SubIcon className="w-4 h-4 text-purple-500 group-hover/item:text-purple-600" />
                                      <span className="text-xs font-bold text-foreground truncate">{exam.subject}</span>
                                    </div>
                                  );
                                })}
                                {eliteSeniorsOlympiads.length === 0 && (
                                  <p className="text-xs text-muted-foreground px-2.5 py-2">Coming soon...</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Link href="/olympiads" onClick={() => setOlympiadDropdownOpen(false)}>
                              <div className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">View All Olympiads</span>
                                <ArrowRight className="w-3 h-3 text-primary" />
                              </div>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link key={item.label} href={item.href} className="group relative py-2">
                  <span className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-primary' : 'hover:text-primary'}`}>
                    {item.label}
                  </span>
                  <span className={`absolute bottom-0 left-0 h-0.5 brand-gradient transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <UserProfileMenu user={user} />
            ) : (
              <Link href="/login">
                <Button className="brand-button rounded-xl px-4 sm:px-8 h-9 sm:h-10 font-black tracking-widest text-[9px] sm:text-[10px]" data-testid="button-login">
                  <span className="hidden sm:inline">LOGIN / REGISTER</span>
                  <span className="sm:hidden">LOGIN</span>
                </Button>
              </Link>
            )}

            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border border-violet-200/60 dark:border-violet-700/40 shadow-md shadow-violet-200/30 dark:shadow-violet-900/20 hover:shadow-lg hover:shadow-violet-300/40 hover:scale-105 transition-all duration-300"
                  data-testid="button-notifications"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400 transition-transform duration-300 hover:rotate-12" />
                  {activeNotifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-1 text-[9px] font-black text-white shadow-md">
                      {activeNotifications.length > 9 ? '9+' : activeNotifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl" data-testid="notification-panel">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  {activeNotifications.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {activeNotifications.length} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Check back later for updates</p>
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const isDismissed = dismissedIds.includes(notif.id);
                      const typeColors: Record<string, string> = {
                        exam: "bg-blue-500",
                        deadline: "bg-red-500",
                        maintenance: "bg-amber-500",
                        general: "bg-violet-500",
                      };
                      const dotColor = typeColors[notif.type || 'general'] || typeColors.general;
                      return (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 transition-colors ${isDismissed ? 'opacity-50' : 'bg-violet-50/30 dark:bg-violet-950/10'}`}
                          data-testid={`notification-item-${notif.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 flex-shrink-0 ${!isDismissed ? 'animate-pulse' : ''}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-foreground leading-tight">{notif.title}</p>
                                {!isDismissed && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                                    className="text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0"
                                    data-testid={`dismiss-notification-${notif.id}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {notif.content && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.content}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{notif.type || 'General'}</span>
                                {notif.important && (
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">Important</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-menu-overlay"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-[380px] bg-background border-l border-border/50 shadow-2xl flex flex-col"
              data-testid="mobile-menu-panel"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <BrandLogo size="sm" animated={false} linkTo="/" />
                <div className="flex items-center gap-2">
                  {!user && (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="brand-button rounded-xl px-5 h-9 font-black tracking-widest text-[10px]" data-testid="mobile-button-login">
                        LOGIN
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="button-close-mobile-menu"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain py-3 px-4">
                <nav className="flex flex-col gap-0.5">
                  {navLinks.map((item) => {
                    const isActive = item.href === '/'
                      ? location === '/'
                      : location.startsWith(item.href);

                    if ((item as any).hasDropdown) {
                      return (
                        <div key={item.label}>
                          <div
                            onClick={() => setMobileOlympiadExpanded(!mobileOlympiadExpanded)}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'}`}
                            data-testid="mobile-nav-olympiads"
                          >
                            <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileOlympiadExpanded ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <AnimatePresence>
                            {mobileOlympiadExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-3 pl-3 border-l-2 border-primary/20 py-2 space-y-3">
                                  <Link href="/olympiads" onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors" data-testid="mobile-nav-all-olympiads">
                                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                                      <span className="text-xs font-black uppercase tracking-wider text-primary">View All Olympiads</span>
                                    </div>
                                  </Link>
                                  {littleChampsOlympiads.length > 0 && (
                                    <div className="px-3 space-y-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                          <Rocket className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Little Champs (1-5)</span>
                                      </div>
                                      {littleChampsOlympiads.map(exam => {
                                        const SubIcon = navSubjectIcons[exam.subject || 'default'] || navSubjectIcons['default'];
                                        return (
                                          <Link key={exam.id} href={`/olympiad/${exam.id}`} onClick={() => setMobileMenuOpen(false)}>
                                            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors" data-testid={`mobile-nav-olympiad-${exam.id}`}>
                                              <SubIcon className="w-3.5 h-3.5 text-amber-500" />
                                              <span className="text-xs font-semibold text-foreground">{exam.subject}</span>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {eliteSeniorsOlympiads.length > 0 && (
                                    <div className="px-3 space-y-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                          <GraduationCap className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Elite Seniors (6-12)</span>
                                      </div>
                                      {eliteSeniorsOlympiads.map(exam => {
                                        const SubIcon = navSubjectIcons[exam.subject || 'default'] || navSubjectIcons['default'];
                                        return (
                                          <Link key={exam.id} href={`/olympiad/${exam.id}`} onClick={() => setMobileMenuOpen(false)}>
                                            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors" data-testid={`mobile-nav-olympiad-${exam.id}`}>
                                              <SubIcon className="w-3.5 h-3.5 text-purple-500" />
                                              <span className="text-xs font-semibold text-foreground">{exam.subject}</span>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={`px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'}`}
                          data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                        >
                          <span className="text-sm font-bold uppercase tracking-wider">
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-border/50 px-5 py-4 space-y-3">
                <div className="flex items-center justify-center gap-6">
                  <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors" data-testid="mobile-nav-faq">FAQs</span>
                  </Link>
                  <span className="w-px h-3 bg-border" />
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors" data-testid="mobile-nav-contact-footer">Contact</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main id="main-content" role="main" className="flex-1 mb-12 sm:mb-20">
        {children}
      </main>

      <footer className="pt-12 sm:pt-20 pb-4 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] text-white" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-6 sm:mb-8">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="mb-6">
                <BrandLogo size="lg" animated={false} linkTo="/" variant="dark" />
              </div>
              <p className="text-lg text-white/60 font-medium leading-relaxed max-w-md italic font-serif">
                "Developing logical reasoning and scientific attitude among school students globally."
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 sm:col-span-2 lg:col-span-2">
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Company</h5>
                <ul className="space-y-2 text-xs font-medium text-white/60">
                  {companyPages.length > 0 ? (
                    companyPages.map(page => (
                      <li key={page.id}>
                        <Link href={`/${page.slug}`} className="hover:text-accent transition-colors" data-testid={`footer-link-${page.slug}`}>
                          {page.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="/about" className="hover:text-accent transition-colors" data-testid="footer-link-about">About Us</Link></li>
                      <li><Link href="/brand" className="hover:text-accent transition-colors" data-testid="footer-link-brand">Brand</Link></li>
                      <li><Link href="/awards" className="hover:text-accent transition-colors" data-testid="footer-link-awards">Awards & Recognition</Link></li>
                      <li><Link href="/faq" className="hover:text-accent transition-colors" data-testid="footer-link-faq">FAQs</Link></li>
                      <li><Link href="/contact" className="hover:text-accent transition-colors" data-testid="footer-link-contact">Contact</Link></li>
                    </>
                  )}
                  <li><Link href="/partners" className="hover:text-accent transition-colors" data-testid="footer-link-partners">Become a Partner</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Legal</h5>
                <ul className="space-y-2 text-xs font-medium text-white/60">
                  {legalPages.length > 0 ? (
                    legalPages.map(page => (
                      <li key={page.id}>
                        <Link href={`/${page.slug}`} className="hover:text-accent transition-colors" data-testid={`footer-link-${page.slug}`}>
                          {page.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="/privacy-policy" className="hover:text-accent transition-colors" data-testid="footer-link-privacy">Privacy Policy</Link></li>
                      <li><Link href="/terms-and-conditions" className="hover:text-accent transition-colors" data-testid="footer-link-terms">Terms & Conditions</Link></li>
                      <li><Link href="/refund-policy" className="hover:text-accent transition-colors" data-testid="footer-link-refund">Refund Policy</Link></li>
                    </>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Resources</h5>
                <ul className="space-y-2 text-xs font-medium text-white/60">
                  {resourcePages.length > 0 ? (
                    resourcePages.map(page => (
                      <li key={page.id}>
                        <Link href={`/${page.slug}`} className="hover:text-accent transition-colors" data-testid={`footer-link-${page.slug}`}>
                          {page.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="#" className="hover:text-accent transition-colors" data-testid="footer-link-calendar">Academic Calendar</Link></li>
                      <li><Link href="#" className="hover:text-accent transition-colors" data-testid="footer-link-hall-of-fame">Hall of Fame</Link></li>
                      <li><Link href="#" className="hover:text-accent transition-colors" data-testid="footer-link-gallery">Gallery</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Social Media & Copyright */}
          <div className="py-2 border-t border-white/10 flex items-center justify-center gap-4">
            <p className="text-xs text-white/40">© 2026 Samikaran Edutech LLP</p>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-3">
              {socialLinks.filter(link => link.pageUrl).map((link) => {
                const IconComponent = platformIcons[link.platformCode];
                const hoverColors: Record<string, string> = {
                  facebook: "hover:text-[#1877F2]",
                  instagram: "hover:text-[#E4405F]",
                  youtube: "hover:text-[#FF0000]",
                  linkedin: "hover:text-[#0A66C2]",
                  x: "hover:text-white",
                  whatsapp: "hover:text-[#25D366]",
                };
                return (
                  <a
                    key={link.id}
                    href={link.pageUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-white/50 ${hoverColors[link.platformCode] || "hover:text-white"} transition-all duration-200 hover:scale-110`}
                    aria-label={link.platformName}
                    data-testid={`social-link-${link.platformCode}`}
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}
