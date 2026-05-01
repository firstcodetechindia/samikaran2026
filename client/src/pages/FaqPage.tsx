import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { HelpCircle, ChevronDown, Search, Mail, MessageCircle, ArrowRight, BookOpen, CreditCard, Shield, Award, Users, Monitor } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const categories = [
  {
    id: "general",
    icon: BookOpen,
    label: "General",
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.2)",
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
    glow: "rgba(56,189,248,0.2)",
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
    glow: "rgba(52,211,153,0.2)",
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
    glow: "rgba(251,146,60,0.2)",
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
    glow: "rgba(232,121,249,0.2)",
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
    glow: "rgba(244,63,94,0.2)",
    faqs: [
      { q: "How is my personal data protected?", a: "We are fully compliant with India's data protection guidelines. Your personal data is encrypted, never sold to third parties, and used only for exam administration and result declaration purposes." },
      { q: "Is my payment information secure?", a: "Yes. We do not store any card or bank details on our servers. All payment processing is handled by PCI-DSS compliant payment gateways. We use SSL/TLS encryption for all transactions." },
      { q: "How is exam integrity maintained?", a: "Our AI proctoring system monitors candidates in real-time using webcam feeds, detects suspicious behaviour, and flags violations. Exam content is randomised for each candidate to prevent paper leaks." },
    ],
  },
];

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

  const activeFiltered = filteredCategories.find(c => c.id === activeCategory) || filteredCategories[0];

  return (
    <PublicLayout>
      <Helmet>
        <title>FAQ | Samikaran Olympiad</title>
        <meta name="description" content="Find answers to frequently asked questions about Samikaran Olympiad — registration, fees, exams, results, and more." />
      </Helmet>

      {/* ══ HERO ══ */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-br from-[#0d0720] via-[#130d2a] to-[#0d0720]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/12 rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={item} className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-300 mb-6 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-400/20">
              <HelpCircle className="w-3.5 h-3.5" /> Help Centre
            </motion.div>
            <motion.h1 variants={item} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.08] tracking-tight">
              Frequently Asked<br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Questions</span>
            </motion.h1>
            <motion.p variants={item} className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed mb-8">
              Everything you need to know about Samikaran Olympiad. Can't find your answer? We're here to help.
            </motion.p>

            {/* Search bar */}
            <motion.div variants={item} className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white placeholder:text-gray-500 text-sm outline-none focus:border-violet-400/60 focus:bg-white/12 transition-all duration-200"
                data-testid="input-faq-search"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ MAIN CONTENT ══ */}
      <section className="bg-white dark:bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[220px_1fr] gap-8">

            {/* ── LEFT: Category sidebar ── */}
            <div className="lg:sticky lg:top-24 self-start">
              {search.trim() ? (
                <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-4 px-1">
                  Search results
                </p>
              ) : (
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4 px-1">
                  Categories
                </p>
              )}
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                {filteredCategories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = (activeCategory === cat.id) || (filteredCategories.length === 1);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 text-left ${
                        isActive
                          ? "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50"
                          : "text-gray-500 dark:text-white/40 hover:text-foreground hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                      }`}
                      data-testid={`button-category-${cat.id}`}
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      {cat.label}
                    </button>
                  );
                })}
              </nav>

              {/* Contact CTA */}
              <div className="hidden lg:block mt-8 p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/15 dark:to-fuchsia-900/10 border border-violet-100 dark:border-violet-800/30">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">Still have questions?</p>
                <p className="text-[11px] text-gray-500 dark:text-white/40 leading-relaxed mb-3">Our support team is here to help you.</p>
                <Link href="/contact">
                  <Button size="sm" className="w-full brand-gradient text-white text-xs rounded-xl h-8 font-bold" data-testid="button-contact-support">
                    Contact Support <ArrowRight className="ml-1.5 w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── RIGHT: FAQ Items ── */}
            <div>
              {search.trim() ? (
                /* Search mode — show all matching across categories */
                <div className="space-y-8">
                  {filteredCategories.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                          <cat.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h2 className="text-sm font-bold text-foreground">{cat.label}</h2>
                      </div>
                      <FaqList cat={cat} openItems={openItems} toggleFaq={toggleFaq} />
                    </div>
                  ))}
                </div>
              ) : (
                /* Category mode */
                activeFiltered && (
                  <motion.div key={activeFiltered.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeFiltered.color} flex items-center justify-center shadow-md`} style={{ boxShadow: `0 4px 16px ${activeFiltered.glow}` }}>
                        <activeFiltered.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-foreground leading-tight">{activeFiltered.label}</h2>
                        <p className="text-[11px] text-muted-foreground">{activeFiltered.faqs.length} questions</p>
                      </div>
                    </div>
                    <FaqList cat={activeFiltered} openItems={openItems} toggleFaq={toggleFaq} />
                  </motion.div>
                )
              )}

              {filteredCategories.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">No results found</h3>
                  <p className="text-sm text-muted-foreground">Try different keywords or browse the categories on the left.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ══ */}
      <section className="bg-gray-50 dark:bg-gray-950/40 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Didn't find your answer?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-7 max-w-md mx-auto leading-relaxed">
              Our support team responds within 24 hours on working days. Reach out and we'll help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button className="brand-gradient text-white rounded-2xl px-7 h-11 font-bold shadow-lg shadow-violet-500/25" data-testid="button-cta-contact">
                  <Mail className="mr-2 w-4 h-4" /> Contact Support
                </Button>
              </Link>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-2xl px-7 h-11 font-bold border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" data-testid="button-cta-whatsapp">
                  <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FaqList({ cat, openItems, toggleFaq }: {
  cat: typeof categories[0];
  openItems: Record<string, number | null>;
  toggleFaq: (catId: string, idx: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      {cat.faqs.map((faq, i) => {
        const isOpen = openItems[cat.id] === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`rounded-2xl border bg-white dark:bg-card transition-all duration-300 overflow-hidden ${
              isOpen
                ? "border-violet-300 dark:border-violet-600 shadow-sm shadow-violet-100 dark:shadow-violet-900/20"
                : "border-gray-100 dark:border-border/50 hover:border-violet-200 dark:hover:border-violet-700/50"
            }`}
          >
            <button
              onClick={() => toggleFaq(cat.id, i)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              data-testid={`button-faq-${cat.id}-${i}`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? `bg-gradient-to-br ${cat.color}` : "bg-violet-50 dark:bg-violet-900/20"}`}>
                <HelpCircle className={`w-3.5 h-3.5 transition-colors ${isOpen ? "text-white" : "text-violet-500 dark:text-violet-400"}`} />
              </div>
              <h3 className="flex-1 text-sm sm:text-[15px] font-semibold leading-snug text-foreground">{faq.q}</h3>
              <ChevronDown className={`shrink-0 w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-violet-600" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-400 leading-[1.8]">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
