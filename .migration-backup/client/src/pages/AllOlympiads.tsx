import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import type { Exam, OlympiadCategory } from "@shared/schema";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Calendar, Clock, Users, ArrowRight, Filter, GraduationCap, Target,
  Calculator, Atom, BookOpen, Brain, Globe, Zap, FlaskConical, Dna,
  Monitor, Server, Cpu, TrendingUp, Briefcase, Landmark, Map,
  Shield, Heart, Rocket, Sparkles, ShoppingCart, Car, Wrench, Languages,
  Star, Crown
} from "lucide-react";

const iconMap: Record<string, any> = {
  Calculator, Atom, BookOpen, Brain, Globe, Zap, FlaskConical, Dna,
  Monitor, Server, Cpu, TrendingUp, Briefcase, Landmark, Map,
  Shield, Heart, Rocket, Sparkles, ShoppingCart, Car, Wrench, Languages
};

const subjectIcons: Record<string, any> = {
  'Mathematics': Calculator,
  'Science': Atom,
  'English': BookOpen,
  'Reasoning': Brain,
  'General Knowledge': Globe,
  'Computer': Monitor,
  'Hindi': Languages,
  'Cyber': Shield,
  'default': Sparkles
};

const subjectColors: Record<string, string> = {
  'Mathematics': 'from-blue-500 to-indigo-600',
  'Science': 'from-emerald-500 to-teal-600',
  'English': 'from-purple-500 to-pink-600',
  'Reasoning': 'from-amber-500 to-orange-600',
  'General Knowledge': 'from-cyan-500 to-blue-600',
  'Computer': 'from-violet-500 to-purple-600',
  'Hindi': 'from-rose-500 to-pink-600',
  'Cyber': 'from-red-500 to-rose-600',
  'default': 'from-gray-500 to-gray-600'
};

export default function AllOlympiads() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState<"all" | "little" | "elite">("all");

  const { data: olympiads, isLoading: loadingOlympiads } = useQuery<Exam[]>({
    queryKey: ["/api/public/olympiads"],
  });

  const { data: categories } = useQuery<(OlympiadCategory & { categoryGroup?: string; themeColor?: string; iconName?: string; eligibleClasses?: string })[]>({
    queryKey: ["/api/public/olympiad-categories"],
  });

  const filteredOlympiads = useMemo(() => {
    if (!olympiads || !categories) return [];
    
    return olympiads.filter(exam => {
      const category = categories.find(c => c.id === exam.categoryId);
      
      if (selectedLevel !== "all") {
        const minClass = exam.minClass || 1;
        const maxClass = exam.maxClass || 12;
        let isLittle: boolean;
        if (maxClass <= 5) isLittle = true;
        else if (minClass >= 6) isLittle = false;
        else isLittle = (minClass + maxClass) / 2 < 6;
        if (selectedLevel === "little" && !isLittle) return false;
        if (selectedLevel === "elite" && isLittle) return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!exam.title.toLowerCase().includes(query) && 
            !exam.subject?.toLowerCase().includes(query) &&
            !category?.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      if (selectedClass !== "all") {
        const classNum = parseInt(selectedClass);
        const minClass = exam.minClass || 1;
        const maxClass = exam.maxClass || 12;
        if (classNum < minClass || classNum > maxClass) {
          return false;
        }
      }
      
      return true;
    });
  }, [olympiads, categories, searchQuery, selectedClass, selectedLevel]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, { category: OlympiadCategory & { categoryGroup?: string; themeColor?: string; iconName?: string }; exams: Exam[] }> = {};
    
    filteredOlympiads.forEach(exam => {
      const category = categories?.find(c => c.id === exam.categoryId);
      if (category) {
        if (!groups[category.id]) {
          groups[category.id] = { category, exams: [] };
        }
        groups[category.id].exams.push(exam);
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      (a.category.displayOrder || 0) - (b.category.displayOrder || 0)
    );
  }, [filteredOlympiads, categories]);

  const getRegistrationStatus = (exam: Exam) => {
    const now = new Date();
    const regOpen = exam.registrationOpenDate ? new Date(exam.registrationOpenDate) : null;
    const regClose = exam.registrationCloseDate ? new Date(exam.registrationCloseDate) : null;
    
    if (regOpen && now < regOpen) return { status: "upcoming", label: "Coming Soon", color: "bg-amber-500" };
    if (regClose && now > regClose) return { status: "closed", label: "Closed", color: "bg-gray-500" };
    return { status: "open", label: "Register Now", color: "bg-green-500" };
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getMonthYear = (date: Date | string) => {
    const d = new Date(date);
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
      year: d.getFullYear().toString()
    };
  };

  const handleRegisterClick = (examId: number) => {
    navigate(`/olympiad/${examId}/register`);
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>All Olympiads 2026 - Samikaran Olympiad | Science, Math, English, Reasoning</title>
        <meta name="description" content="Explore and register for Samikaran Olympiad 2026 exams. Compete in Science, Mathematics, English, Reasoning, GK and more. Open for Class 1-12 students across India." />
        <meta name="keywords" content="olympiad 2026, science olympiad, math olympiad, english olympiad, reasoning olympiad, samikaran olympiad, student competition, academic olympiad, India olympiad" />
        <link rel="canonical" href="https://www.samikaranolympiad.com/olympiads" />
        <meta property="og:title" content="All Olympiads 2026 - Samikaran Olympiad" />
        <meta property="og:description" content="Register for world-class olympiad examinations. Science, Math, English, Reasoning & more. Class 1-12 students." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/olympiads" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="robots" content="index, follow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="All Olympiads 2026 - Samikaran Olympiad" />
        <meta name="twitter:description" content="Register for world-class olympiad examinations across multiple disciplines." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Olympiads", url: `${BASE_URL}/olympiads` }
        ]))}</script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Samikaran Olympiad 2026 Examinations",
            "description": "List of all olympiad examinations available for registration",
            "itemListElement": filteredOlympiads.slice(0, 10).map((exam, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Event",
                "name": exam.title,
                "description": exam.description || `Olympiad examination in ${exam.subject}`,
                "startDate": exam.startTime,
                "organizer": {
                  "@type": "Organization",
                  "name": "Samikaran Olympiad"
                }
              }
            }))
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-pink-600/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4">
                All <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Olympiads</span> 2026
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover and register for world-class olympiad examinations across multiple disciplines
              </p>
            </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button
                variant={selectedLevel === "all" ? "default" : "outline"}
                onClick={() => setSelectedLevel("all")}
                className={`rounded-full px-6 ${
                  selectedLevel === "all"
                    ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-violet-600"
                    : ""
                }`}
                data-testid="button-level-all"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                All Levels
              </Button>
              <Button
                variant={selectedLevel === "little" ? "default" : "outline"}
                onClick={() => setSelectedLevel("little")}
                className={`rounded-full px-4 sm:px-6 min-h-[44px] ${
                  selectedLevel === "little"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500"
                    : ""
                }`}
                data-testid="button-level-little"
              >
                <Rocket className="w-4 h-4 mr-2 shrink-0" />
                <span className="sm:hidden">Class 1–5</span>
                <span className="hidden sm:inline">Little Champs (Class 1–5)</span>
              </Button>
              <Button
                variant={selectedLevel === "elite" ? "default" : "outline"}
                onClick={() => setSelectedLevel("elite")}
                className={`rounded-full px-4 sm:px-6 min-h-[44px] ${
                  selectedLevel === "elite"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600"
                    : ""
                }`}
                data-testid="button-level-elite"
              >
                <GraduationCap className="w-4 h-4 mr-2 shrink-0" />
                <span className="sm:hidden">Class 6–12</span>
                <span className="hidden sm:inline">Elite Seniors (Class 6–12)</span>
              </Button>
            </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search olympiads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-violet-200 dark:border-violet-800"
                data-testid="input-search-olympiads"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-40 h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" data-testid="select-class-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>Class {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loadingOlympiads ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl overflow-hidden bg-white/70 dark:bg-gray-900/70">
                <div className="h-44 bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOlympiads.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No olympiads found</h3>
            <p className="text-muted-foreground/70">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOlympiads.map((exam) => {
              const IconComponent = subjectIcons[exam.subject || 'default'] || subjectIcons['default'];
              const colorClass = subjectColors[exam.subject || 'default'] || subjectColors['default'];
              const regStatus = getRegistrationStatus(exam);
              const { month, year } = getMonthYear(exam.startTime);
              
              return (
                <div
                  key={exam.id}
                  className="group"
                  data-testid={`card-olympiad-${exam.id}`}
                >
                  <div className="relative h-full rounded-3xl overflow-hidden bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className={`relative h-40 bg-gradient-to-br ${colorClass} overflow-hidden`}>
                      <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"}} />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg text-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">{year}</span>
                          <span className="text-sm font-black font-serif text-foreground">{month}</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest">
                          {exam.subject}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full ${regStatus.color} text-white text-[9px] font-black uppercase tracking-widest`}>
                          {regStatus.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-base font-black mb-2 uppercase tracking-tight font-serif group-hover:text-primary transition-colors line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {exam.description || `Test your knowledge in ${exam.subject}`}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-semibold">Class {exam.minClass || 1}-{exam.maxClass || 12}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-pink-500" />
                          <span className="font-semibold">{exam.durationMinutes} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold">{exam.totalMarks || 100} marks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold">{formatDate(exam.startTime).split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/olympiad/${exam.slug}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            className="w-full min-h-[44px] rounded-xl font-bold text-xs uppercase tracking-widest"
                            data-testid={`button-view-olympiad-${exam.id}`}
                          >
                            View Details
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleRegisterClick(exam.id)}
                          disabled={regStatus.status === 'closed'}
                          className={`flex-1 min-h-[44px] rounded-xl font-bold text-xs uppercase tracking-widest ${
                            regStatus.status === 'open'
                              ? "brand-button"
                              : regStatus.status === 'upcoming'
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                          data-testid={`button-register-olympiad-${exam.id}`}
                        >
                          {regStatus.status === 'open' && <>Register <ArrowRight className="ml-1 w-3 h-3" /></>}
                          {regStatus.status === 'upcoming' && <>Soon</>}
                          {regStatus.status === 'closed' && <>Closed</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </PublicLayout>
  );
}
