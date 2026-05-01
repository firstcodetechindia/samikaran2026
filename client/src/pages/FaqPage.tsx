import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { HelpCircle, ChevronDown, Search, Mail, MessageCircle, ArrowRight, BookOpen, CreditCard, Shield, Award, Users, Monitor, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "general",
    icon: BookOpen,
    label: "General",
    color: "from-violet-500 to-purple-600",
    lightColor: "bg-violet-50 dark:bg-violet-900/20",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-700/40",
    glow: "rgba(139,92,246,0.3)",
    faqs: [
      { q: "What is Samikaran Olympiad?", a: "Samikaran Olympiad is India's leading AI-proctored online olympiad platform for students from Class 1 to Class 12. We offer competitive exams in subjects like Mathematics, Science, English, Reasoning, GK, Hindi, and Computers." },
      { q: "Who can participate in Samikaran Olympiad exams?", a: "Students from Class 1 to Class 12 enrolled in any recognised school in India — CBSE, ICSE, State Boards, or IGCSE — can participate. Students from schools abroad are also welcome." },
      { q: "How many subjects are available?", a: "We currently offer olympiad exams in 10+ subjects including Mathematics, Science, English, Reasoning, General Knowledge, Hindi Sahitya, Computers, Cyber, EVS, and Social Science. More subjects are added regularly." },
      { q: "Can I participate in multiple olympiads?", a: "Yes! You can register for as many olympiad subjects as you like. Each olympiad is a separate exam with its own results, certificate, and ranking." },
    ],
  },
  {
    id: "registration",
    icon: Users,
    label: "Registration",
    color: "from-sky-500 to-blue-600",
    lightColor: "bg-sky-50 dark:bg-sky-900/20",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-700/40",
    glow: "rgba(56,189,248,0.3)",
    faqs: [
      { q: "How do I register for an olympiad exam?", a: "Create a free account on samikaranolympiad.com, complete your profile with personal and school details, browse the available olympiads, select your preferred exam, and pay the registration fee online. You'll receive a confirmation email with your exam schedule." },
      { q: "Is registration free?", a: "Creating your student account on Samikaran Olympiad is completely free. Individual olympiad exams have a small registration fee (typically ₹100–₹500 per subject) to cover exam operations and prize distribution." },
      { q: "Can schools register students in bulk?", a: "Yes! Schools can register through our dedicated School Registration portal. We offer bulk registration discounts and a dedicated school coordinator dashboard for managing student registrations." },
      { q: "What is the registration deadline?", a: "Registration deadlines vary by olympiad. Each exam listing shows its specific registration window. We recommend registering at least 3 days before the deadline to avoid last-minute issues." },
    ],
  },
  {
    id: "payment",
    icon: CreditCard,
    label: "Fees & Payment",
    color: "from-emerald-500 to-green-600",
    lightColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-700/40",
    glow: "rgba(52,211,153,0.3)",
    faqs: [
      { q: "What payment methods are accepted?", a: "We accept all major UPI apps (GPay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), net banking, and wallets. All payments are processed through a secure payment gateway." },
      { q: "Is the exam fee refundable?", a: "Exam fees are non-refundable once the registration is confirmed, except in cases where the exam is cancelled by us. In such cases, a full refund is processed within 5–7 working days." },
      { q: "Are there any discounts available?", a: "Yes! Schools registering 10+ students get bulk discounts. Siblings registering together also get a discount. Watch out for early-bird offers announced on our website and social media." },
      { q: "Will I receive a payment receipt?", a: "Yes, a payment confirmation and receipt are sent to your registered email immediately after successful payment. You can also download receipts from your student dashboard." },
    ],
  },
  {
    id: "exam",
    icon: Monitor,
    label: "Exam & Proctoring",
    color: "from-orange-500 to-amber-500",
    lightColor: "bg-orange-50 dark:bg-orange-900/20",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-700/40",
    glow: "rgba(251,146,60,0.3)",
    faqs: [
      { q: "Are the exams AI-proctored and secure?", a: "Yes. All Samikaran olympiad exams use advanced AI proctoring with real-time facial recognition, tab-switch detection, multiple-face alerts, and live monitoring to ensure 100% exam integrity." },
      { q: "What device do I need for the exam?", a: "A desktop or laptop computer with a working webcam, microphone, and a stable internet connection is required. The exam is not supported on mobile phones or tablets to ensure proper proctoring." },
      { q: "What is the exam format?", a: "Exams consist of multiple-choice questions (MCQs), some with image-based options. Duration varies from 45 to 90 minutes depending on the subject and class. There is no negative marking for most olympiads." },
      { q: "Can I pause the exam once started?", a: "No, once the exam begins the timer cannot be paused. Switching tabs, minimising the browser window, or navigating away will be recorded as a proctoring violation. Ensure a quiet, distraction-free environment before starting." },
      { q: "What happens if my internet disconnects during the exam?", a: "Your progress is auto-saved every 60 seconds. If you disconnect and reconnect within the remaining exam duration, you can resume from where you left off. We recommend a stable broadband or 4G connection." },
    ],
  },
  {
    id: "results",
    icon: Award,
    label: "Results & Certificates",
    color: "from-fuchsia-500 to-pink-600",
    lightColor: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
    borderColor: "border-fuchsia-200 dark:border-fuchsia-700/40",
    glow: "rgba(232,121,249,0.3)",
    faqs: [
      { q: "When will I receive my results?", a: "Results are generated instantly upon exam submission. Your score, rank, and detailed performance report are available immediately on your dashboard after the exam window closes for all participants." },
      { q: "When are certificates issued?", a: "Digital certificates are available for download within 24 hours of the exam. Physical medals and trophies for top rankers are dispatched within 15–30 days of the result declaration." },
      { q: "What types of certificates are awarded?", a: "All participants receive a Participation Certificate. Students scoring above 60% receive a Certificate of Excellence. Top 10% get Merit Certificates. Top 5% receive Silver Medals, and Top 1% receive Gold Medals with cash prizes." },
      { q: "Can I verify my certificate?", a: "Yes, every certificate has a unique QR code and verification ID. Anyone can verify your certificate at samikaranolympiad.com/verify using your certificate number." },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Privacy & Security",
    color: "from-rose-500 to-red-600",
    lightColor: "bg-rose-50 dark:bg-rose-900/20",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-700/40",
    glow: "rgba(244,63,94,0.3)",
    faqs: [
      { q: "How is my personal data protected?", a: "We are fully compliant with India's data protection guidelines. Your personal data is encrypted, never sold to third parties, and used only for exam administration and result declaration purposes." },
      { q: "Is my payment information secure?", a: "Yes. We do not store any card or bank details on our servers. All payment processing is handled by PCI-DSS compliant payment gateways. We use SSL/TLS encryption for all transactions." },
      { q: "How is exam integrity maintained?", a: "Our AI proctoring system monitors candidates in real-time using webcam feeds, detects suspicious behaviour, and flags violations. Exam content is randomised for each candidate to prevent paper leaks." },
    ],
  },
];

const totalFaqs = categories.reduce((acc, c) => acc + c.faqs.length, 0);

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({});
  const [activeCategory, setActiveCategory] = useState("general");
  const [search, setSearch] = useState("");

  const toggleFaq = (catId: string, idx: number) => {
    setOpenItems(prev => ({ ...prev, [catId]: prev[catId] === idx ? null : idx }));
  };

  const filteredCategories = search.trim()
    ? categories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(f =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.faqs.length > 0)
    : categories;

  const activeCat = filteredCategories.find(c => c.id === activeCategory) || filteredCategories[0];

  return (
    <PublicLayout>
      <Helmet>
        <title>FAQ | Samikaran Olympiad</title>
        <meta name="description" content="Find answers to frequently asked questions about Samikaran Olympiad — registration, fees, exams, results, and more." />
      </Helmet>

      {/* ══ HERO ══ */}
      <section className="relative pt-16 pb-10 overflow-hidden bg-gradient-to-br from-[#0d0720] via-[#130d2a] to-[#0d0720]">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-violet-600/14 rounded-full blur-[160px] -translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[130px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        {/* grid lines overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300 mb-4 px-4 py-2 rounded-full bg-violet-500/12 border border-violet-400/20 backdrop-blur-sm">
              <HelpCircle className="w-3.5 h-3.5" /> Help Centre
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-[1.08] tracking-tight">
              Frequently Asked<br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Questions</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed mb-6">
              Everything you need to know about Samikaran Olympiad. Can't find your answer? We're here to help.
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white/8 border border-white/10 rounded-2xl backdrop-blur-sm group-focus-within:border-violet-400/50 transition-colors duration-300">
                <Search className="absolute left-4 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search questions, topics, keywords..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder:text-gray-500 text-sm outline-none"
                  data-testid="input-faq-search"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="pr-4 text-gray-500 hover:text-white transition-colors text-xs font-medium">
                    Clear
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* ══ MAIN ══ */}
      <section className="bg-gray-50 dark:bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[260px_1fr] gap-8">

            {/* ── LEFT SIDEBAR ── */}
            <aside className="lg:sticky lg:top-24 self-start space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-white/30 mb-4 px-1">Browse by category</p>

              {categories.map((cat, i) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id && !search.trim();
                const matchCount = search.trim()
                  ? cat.faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())).length
                  : cat.faqs.length;

                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 text-left group border ${
                      isActive
                        ? "bg-white dark:bg-card shadow-lg border-gray-100 dark:border-white/8 text-foreground"
                        : "border-transparent text-gray-500 dark:text-white/40 hover:bg-white dark:hover:bg-card hover:text-foreground hover:border-gray-100 dark:hover:border-white/8 hover:shadow-sm"
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105 ${isActive ? "shadow-lg" : ""}`}
                      style={{ boxShadow: isActive ? `0 4px 14px ${cat.glow}` : "" }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1">{cat.label}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center transition-all ${
                      isActive
                        ? `${cat.lightColor} ${cat.textColor}`
                        : "bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-white/30"
                    }`}>
                      {matchCount}
                    </span>
                  </motion.button>
                );
              })}

              {/* Contact card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/8 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-black text-white mb-1">Still have questions?</p>
                  <p className="text-[11px] text-white/70 leading-relaxed mb-4">Our team replies within 24 hours on working days.</p>
                  <Link href="/contact">
                    <button className="w-full bg-white text-violet-700 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors" data-testid="button-contact-support">
                      Contact Support <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            </aside>

            {/* ── RIGHT: FAQ PANEL ── */}
            <div>
              <AnimatePresence mode="wait">
                {search.trim() ? (
                  /* Search results */
                  <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {filteredCategories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-5">
                          <Search className="w-7 h-7 text-gray-400" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-2">No results for "{search}"</h3>
                        <p className="text-sm text-muted-foreground mb-5">Try different keywords or browse the categories.</p>
                        <button onClick={() => setSearch("")} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                          Clear search
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <p className="text-sm text-muted-foreground">
                          Found <span className="font-bold text-foreground">{filteredCategories.reduce((a, c) => a + c.faqs.length, 0)}</span> results for "<span className="font-bold text-violet-600 dark:text-violet-400">{search}</span>"
                        </p>
                        {filteredCategories.map(cat => (
                          <div key={cat.id}>
                            <div className="flex items-center gap-2.5 mb-4">
                              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                                <cat.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <h2 className="text-sm font-bold text-foreground">{cat.label}</h2>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${cat.lightColor} ${cat.textColor}`}>{cat.faqs.length}</span>
                            </div>
                            <FaqList cat={cat} openItems={openItems} toggleFaq={toggleFaq} />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Category view */
                  activeCat && (
                    <motion.div key={activeCat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                      {/* Category header card */}
                      <div className={`relative rounded-2xl p-5 mb-6 border ${activeCat.lightColor} ${activeCat.borderColor} overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                          <activeCat.icon className="w-full h-full" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeCat.color} flex items-center justify-center shadow-lg`}
                            style={{ boxShadow: `0 6px 20px ${activeCat.glow}` }}>
                            <activeCat.icon className="w-5.5 h-5.5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-foreground leading-tight">{activeCat.label}</h2>
                            <p className={`text-xs font-semibold ${activeCat.textColor} mt-0.5`}>{activeCat.faqs.length} questions in this category</p>
                          </div>
                        </div>
                      </div>

                      <FaqList cat={activeCat} openItems={openItems} toggleFaq={toggleFaq} />

                      {/* Next category prompt */}
                      {categories.indexOf(activeCat) < categories.length - 1 && (
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/8">
                          <p className="text-sm text-muted-foreground">Not what you were looking for?</p>
                          <button
                            onClick={() => setActiveCategory(categories[categories.indexOf(activeCat) + 1].id)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                            data-testid="button-next-category"
                          >
                            Next: {categories[categories.indexOf(activeCat) + 1].label} <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ══ */}
      <section className="bg-white dark:bg-background py-12 sm:py-16 border-t border-gray-100 dark:border-white/8">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden brand-gradient p-10 sm:p-14 text-center"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Didn't find your answer?</h2>
              <p className="text-sm sm:text-base text-white/75 mb-8 max-w-md mx-auto leading-relaxed">
                Our support team responds within 24 hours on working days. Reach out — we'd love to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact">
                  <Button className="bg-white text-violet-700 hover:bg-white/90 rounded-2xl px-7 h-11 font-black shadow-xl text-sm" data-testid="button-cta-contact">
                    <Mail className="mr-2 w-4 h-4" /> Email Support
                  </Button>
                </Link>
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent rounded-2xl px-7 h-11 font-black text-sm" data-testid="button-cta-whatsapp">
                    <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp Us
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}

/* ── Reusable FAQ List ── */
function FaqList({ cat, openItems, toggleFaq }: {
  cat: typeof categories[0];
  openItems: Record<string, number | null>;
  toggleFaq: (catId: string, idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      {cat.faqs.map((faq, i) => {
        const isOpen = openItems[cat.id] === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`group rounded-2xl bg-white dark:bg-card border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "border-transparent shadow-lg dark:shadow-black/30"
                : "border-gray-100 dark:border-white/8 hover:border-gray-200 dark:hover:border-white/12 hover:shadow-md"
            }`}
            style={isOpen ? { boxShadow: `0 4px 30px ${cat.glow}`, borderColor: "transparent" } : {}}
          >
            {/* colored top stripe when open */}
            {isOpen && <div className={`h-0.5 bg-gradient-to-r ${cat.color}`} />}

            <button
              onClick={() => toggleFaq(cat.id, i)}
              className="w-full flex items-start gap-4 px-5 py-4 sm:py-5 text-left"
              aria-expanded={isOpen}
              data-testid={`button-faq-${cat.id}-${i}`}
            >
              {/* Number badge */}
              <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300 mt-0.5 ${
                isOpen ? `bg-gradient-to-br ${cat.color} text-white shadow-md` : "bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-white/30"
              }`}>
                {String(i + 1).padStart(2, "0")}
              </div>

              <h3 className={`flex-1 text-sm sm:text-[15px] font-semibold leading-snug transition-colors duration-200 ${isOpen ? `${cat.textColor}` : "text-foreground"}`}>
                {faq.q}
              </h3>

              <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 transition-all duration-300 ${
                isOpen ? `bg-gradient-to-br ${cat.color} shadow-md` : "bg-gray-100 dark:bg-white/8"
              }`}>
                {isOpen
                  ? <Minus className="w-3.5 h-3.5 text-white" />
                  : <Plus className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                }
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className={`pl-4 border-l-2 border-gradient`} style={{ borderLeftColor: `${cat.glow.replace("0.3", "0.6")}` }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.85]">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
