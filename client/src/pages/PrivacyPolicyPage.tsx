import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FileText, Clock, ArrowUp, ChevronRight, Shield, Lock, Eye, Database, Bell, Mail } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";

const sections = [
  {
    id: "information-collect",
    icon: Database,
    title: "Information We Collect",
    content: [
      { type: "p", text: "When you register or use Samikaran Olympiad, we collect the following types of information:" },
      { type: "ul", items: [
        "Personal identification information: Full name, date of birth, class/grade, school name, city, and state.",
        "Contact information: Email address and mobile number provided during registration.",
        "Academic information: Class, board, subjects opted for olympiad participation.",
        "Payment information: Transaction IDs and payment status (we do not store card or bank details).",
        "Device and technical information: IP address, browser type, device type, and operating system for proctoring purposes.",
        "Exam data: Responses, timing, webcam snapshots (during proctored exams), and AI proctoring logs.",
      ]},
    ],
  },
  {
    id: "how-we-use",
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      { type: "p", text: "We use the information collected to:" },
      { type: "ul", items: [
        "Create and manage your student account on our platform.",
        "Process your olympiad registrations and exam fees.",
        "Administer exams and generate results, rank cards, and certificates.",
        "Communicate exam schedules, results, and important updates via email and SMS.",
        "Conduct AI-based proctoring to ensure exam integrity.",
        "Provide customer support and respond to your queries.",
        "Improve our platform, content, and services based on usage analytics.",
        "Comply with legal and regulatory obligations.",
      ]},
    ],
  },
  {
    id: "data-sharing",
    icon: Shield,
    title: "Data Sharing & Disclosure",
    content: [
      { type: "p", text: "We respect your privacy and do not sell, rent, or trade your personal information to third parties. We may share your information only in the following limited circumstances:" },
      { type: "ul", items: [
        "With your school or group coordinator (only name, class, result, and certificate) for institutional reporting.",
        "With our payment gateway partners for processing transactions securely.",
        "With AI proctoring service providers under strict data processing agreements.",
        "With government or regulatory authorities when required by applicable law.",
        "With cloud hosting providers who process data on our behalf under confidentiality agreements.",
      ]},
      { type: "p", text: "All third-party partners are required to maintain the confidentiality and security of your data." },
    ],
  },
  {
    id: "data-security",
    icon: Lock,
    title: "Data Security",
    content: [
      { type: "p", text: "We take the security of your personal information seriously. The following security measures are in place:" },
      { type: "ul", items: [
        "All data is transmitted over HTTPS using SSL/TLS encryption.",
        "Passwords are hashed using industry-standard bcrypt algorithm and never stored in plain text.",
        "Payment data is handled by PCI-DSS compliant payment gateways; we do not store card details.",
        "Access to personal data is restricted to authorised team members on a need-to-know basis.",
        "Regular security audits and vulnerability assessments are conducted.",
        "Exam webcam data is stored securely and deleted after the review period.",
      ]},
    ],
  },
  {
    id: "cookies",
    icon: Bell,
    title: "Cookies & Tracking",
    content: [
      { type: "p", text: "We use cookies and similar tracking technologies to enhance your experience on our platform:" },
      { type: "ul", items: [
        "Session cookies: Required to keep you logged in during an active session.",
        "Preference cookies: To remember your language and display preferences.",
        "Analytics cookies: To understand how users interact with our platform (e.g., Google Analytics).",
        "Security cookies: To detect and prevent fraudulent activity.",
      ]},
      { type: "p", text: "You can disable cookies through your browser settings, though this may affect the functionality of some features." },
    ],
  },
  {
    id: "your-rights",
    icon: Shield,
    title: "Your Rights",
    content: [
      { type: "p", text: "You have the following rights with respect to your personal data:" },
      { type: "ul", items: [
        "Access: You may request a copy of the personal data we hold about you.",
        "Correction: You may request correction of inaccurate or incomplete data.",
        "Deletion: You may request deletion of your account and associated data, subject to legal retention requirements.",
        "Objection: You may object to certain uses of your data, such as marketing communications.",
        "Portability: You may request your data in a structured, machine-readable format.",
      ]},
      { type: "p", text: "To exercise any of these rights, please contact us at privacy@samikaranolympiad.com." },
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact Us",
    content: [
      { type: "p", text: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:" },
      { type: "ul", items: [
        "Email: privacy@samikaranolympiad.com",
        "Support: support@samikaranolympiad.com",
        "Address: Samikaran Olympiad, India",
      ]},
      { type: "p", text: "We will respond to all privacy-related queries within 7 business days." },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>Privacy Policy | Samikaran Olympiad</title>
        <meta name="description" content="Learn how Samikaran Olympiad collects, uses, and protects your personal information." />
      </Helmet>
      <LegalPageLayout
        icon={Shield}
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information."
        effectiveDate="Effective: 1 January 2025 · Last updated: May 2026"
        sections={sections}
      />
    </PublicLayout>
  );
}

/* ─── Shared layout ─── */
export function LegalPageLayout({ icon: Icon, title, subtitle, effectiveDate, sections }: {
  icon: any;
  title: string;
  subtitle: string;
  effectiveDate: string;
  sections: { id: string; icon: any; title: string; content: any[] }[];
}) {
  return (
    <>
      {/* ══ HERO ══ */}
      <section className="relative pt-14 pb-12 overflow-hidden bg-gradient-to-br from-[#0d0720] via-[#130d2a] to-[#0d0720]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/12 rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/40 mb-5">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{title}</span>
          </motion.nav>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-5">
            <Icon className="w-5 h-5 text-white" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
            {title}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-gray-400 max-w-lg mx-auto leading-relaxed mb-5">
            {subtitle}
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-[11px] font-medium text-white/30">
            <Clock className="w-3 h-3" /> {effectiveDate}
          </motion.div>
        </div>
      </section>

      {/* ══ CONTENT ══ */}
      <div className="bg-gray-50 dark:bg-background py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white dark:bg-card rounded-3xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden"
          >
            {/* TOC */}
            <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-gray-100 dark:border-white/8 bg-gray-50/60 dark:bg-white/2">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground mb-3">Table of Contents</p>
              <div className="flex flex-wrap gap-2">
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-700/50">
                    <span className="text-violet-400 font-black">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="px-6 sm:px-8 py-8 space-y-10">
              {sections.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    id={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="scroll-mt-24"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                        <SIcon className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-black text-foreground">{s.title}</h2>
                    </div>

                    <div className="pl-3 space-y-3 text-[15.5px] text-gray-600 dark:text-gray-400 leading-[1.9]">
                      {s.content.map((block, bi) =>
                        block.type === "p" ? (
                          <p key={bi}>{block.text}</p>
                        ) : (
                          <ul key={bi} className="space-y-2.5 list-none">
                            {block.items.map((item: string, ii: number) => (
                              <li key={ii} className="flex items-start gap-3">
                                <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )
                      )}
                    </div>

                    {i < sections.length - 1 && (
                      <div className="mt-8 border-b border-gray-100 dark:border-white/6" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer strip */}
            <div className="border-t border-gray-100 dark:border-white/8 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60 dark:bg-white/2">
              <p className="text-[11px] text-muted-foreground">
                Questions? Email us at <a href="mailto:support@samikaranolympiad.com" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">support@samikaranolympiad.com</a>
              </p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">
                <ArrowUp className="w-3 h-3" /> Back to top
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
