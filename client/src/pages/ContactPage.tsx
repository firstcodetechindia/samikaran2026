import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { Mail, MessageCircle, Clock, MapPin, Send, CheckCircle, Sparkles } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";

/* ── animation variants ── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay } },
});
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const item    = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

/* ── types ── */
interface SocialLink { id: number; platformCode: string; platformName: string; pageUrl: string; isActive: boolean; }
const socialIcons: Record<string, React.ElementType> = { facebook: SiFacebook, instagram: SiInstagram, youtube: SiYoutube, whatsapp: SiWhatsapp };
const socialGrad: Record<string, string> = {
  facebook: "from-[#1877F2] to-[#0d5ec4]",
  instagram: "from-[#f09433] via-[#e6683c] to-[#dc2743]",
  youtube: "from-[#FF0000] to-[#cc0000]",
  whatsapp: "from-[#25D366] to-[#128C7E]",
};

/* ── contact info cards ── */
const cards = [
  { icon: Mail,          label: "Email",          value: "support@samikaranolympiad.com", sub: "Reply within 24 hrs",    color: "from-violet-500 to-purple-600",  glow: "rgba(139,92,246,0.25)", href: "mailto:support@samikaranolympiad.com" },
  { icon: MessageCircle, label: "WhatsApp",        value: "+91 98765 43210",               sub: "Chat with us directly",  color: "from-emerald-400 to-green-600",  glow: "rgba(52,211,153,0.25)", href: "https://wa.me/919876543210" },
  { icon: Clock,         label: "Support Hours",   value: "Mon – Sat",                    sub: "9 AM – 6 PM IST",         color: "from-orange-400 to-amber-500",   glow: "rgba(251,146,60,0.25)", href: null },
  { icon: MapPin,        label: "Location",        value: "Pan India",                    sub: "Students nationwide",     color: "from-sky-400 to-blue-500",       glow: "rgba(56,189,248,0.25)", href: null },
];

/* ── inline SVG illustration ── */
function ContactIllustration() {
  return (
    <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-sm mx-auto">
      {/* Background blob */}
      <ellipse cx="210" cy="170" rx="190" ry="140" fill="url(#blobGrad)" opacity="0.12" />

      {/* Main envelope */}
      <rect x="80" y="100" width="200" height="140" rx="18" fill="url(#envGrad)" />
      <path d="M80 118 L180 178 L280 118" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <line x1="80" y1="200" x2="140" y2="155" stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <line x1="280" y1="200" x2="220" y2="155" stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round" />

      {/* Chat bubble 1 */}
      <rect x="270" y="70" width="110" height="60" rx="16" fill="url(#chatGrad1)" />
      <path d="M290 130 L275 148 L310 130" fill="url(#chatGrad1)" />
      <rect x="282" y="86" width="50" height="6" rx="3" fill="white" opacity="0.7" />
      <rect x="282" y="100" width="72" height="6" rx="3" fill="white" opacity="0.5" />
      <rect x="282" y="114" width="40" height="6" rx="3" fill="white" opacity="0.4" />

      {/* Chat bubble 2 */}
      <rect x="42" y="58" width="95" height="52" rx="14" fill="url(#chatGrad2)" />
      <path d="M55 110 L42 126 L78 110" fill="url(#chatGrad2)" />
      <rect x="54" y="72" width="44" height="5" rx="2.5" fill="white" opacity="0.7" />
      <rect x="54" y="84" width="64" height="5" rx="2.5" fill="white" opacity="0.5" />
      <rect x="54" y="96" width="34" height="5" rx="2.5" fill="white" opacity="0.4" />

      {/* Floating dots */}
      <circle cx="48" cy="190" r="8" fill="#8B5CF6" opacity="0.5" />
      <circle cx="346" cy="210" r="6" fill="#EC4899" opacity="0.45" />
      <circle cx="320" cy="58" r="5" fill="#06B6D4" opacity="0.5" />
      <circle cx="70" cy="52" r="4" fill="#F59E0B" opacity="0.6" />
      <circle cx="356" cy="148" r="10" fill="#7C3AED" opacity="0.15" />
      <circle cx="38" cy="155" r="7" fill="#10B981" opacity="0.2" />

      {/* Star sparkles */}
      <path d="M360 85 L363 96 L374 99 L363 102 L360 113 L357 102 L346 99 L357 96Z" fill="#A78BFA" opacity="0.6" />
      <path d="M52 225 L54 231 L60 233 L54 235 L52 241 L50 235 L44 233 L50 231Z" fill="#34D399" opacity="0.55" />
      <path d="M330 258 L332 263 L337 265 L332 267 L330 272 L328 267 L323 265 L328 263Z" fill="#F472B6" opacity="0.5" />

      {/* Defs */}
      <defs>
        <linearGradient id="blobGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="envGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="chatGrad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="chatGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── main component ── */
export default function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [focused, setFocused]       = useState<string | null>(null);
  const [form, setForm]             = useState({ name: "", email: "", subject: "", message: "" });

  const { data: socialLinksData = [] } = useQuery<SocialLink[]>({ queryKey: ["/api/public/social-links"] });
  const defaultSocial: SocialLink[] = [
    { id: 1, platformCode: "facebook",  platformName: "Facebook",  pageUrl: "https://facebook.com/samikaranolympiad",  isActive: true },
    { id: 2, platformCode: "instagram", platformName: "Instagram", pageUrl: "https://instagram.com/samikaranolympiad", isActive: true },
    { id: 3, platformCode: "youtube",   platformName: "YouTube",   pageUrl: "https://youtube.com/@samikaranolympiad",  isActive: true },
    { id: 4, platformCode: "whatsapp",  platformName: "WhatsApp",  pageUrl: "https://wa.me/919876543210",              isActive: true },
  ];
  const socialLinks = socialLinksData.length > 0 ? socialLinksData : defaultSocial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll reply within 24 hours." });
  };

  const fieldClass = (f: string) => [
    "w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none",
    "placeholder:text-gray-400 dark:placeholder:text-white/25 text-foreground",
    "bg-gray-50 dark:bg-white/[0.05] border",
    focused === f
      ? "border-violet-500 dark:border-violet-400 shadow-[0_0_0_3.5px_rgba(139,92,246,0.18)] bg-white dark:bg-white/[0.08]"
      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/18",
  ].join(" ");

  return (
    <PublicLayout>
      <Helmet>
        <title>Contact Us | Samikaran Olympiad</title>
        <meta name="description" content="Get in touch with Samikaran Olympiad for support, queries, and partnerships." />
      </Helmet>

      {/* ══════ HERO ══════════════════════════════════════ */}
      <section className="relative pt-24 pb-0 overflow-hidden bg-gradient-to-br from-[#0d0720] via-[#130d2a] to-[#0d0720]">
        {/* mesh glows */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-violet-600/15 rounded-full blur-[160px] -translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[130px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center pb-16 pt-4">

            {/* Left: text */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center lg:text-left">
              <motion.div variants={item} className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-300 mb-6 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-400/20">
                <Sparkles className="w-3 h-3" /> Get In Touch
              </motion.div>
              <motion.h1 variants={item} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.08] tracking-tight">
                We'd love to<br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  hear from you
                </span>
              </motion.h1>
              <motion.p variants={item} className="text-base sm:text-lg text-gray-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Whether you have a question, need support, or want to partner with us — our team is always here to help.
              </motion.p>
            </motion.div>

            {/* Right: illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 rounded-3xl blur-2xl" />
                <ContactIllustration />
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* ══════ CONTACT CARDS ═════════════════════════════ */}
      <section className="bg-white dark:bg-background pt-10 pb-6">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {cards.map((card) => {
              const content = (
                <motion.div
                  key={card.label} variants={item}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="h-full"
                >
                  <div
                    className={`relative h-full flex flex-col p-5 sm:p-6 rounded-2xl overflow-hidden border transition-shadow duration-300 group
                      bg-white dark:bg-[#0f0d1a]
                      border-gray-100/80 dark:border-white/[0.07]
                      shadow-[0_1px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)]
                      hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}
                  >
                    {/* top gradient line */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

                    {/* icon with glow */}
                    <div className="relative mb-4">
                      <div className={`absolute inset-0 w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                      <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                        <card.icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-gray-400 dark:text-white/35 mb-1">{card.label}</p>
                    <p className="font-bold text-[13px] sm:text-sm text-foreground leading-snug mb-1 break-all sm:break-normal">{card.value}</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mt-auto pt-1">{card.sub}</p>
                  </div>
                </motion.div>
              );
              return card.href ? (
                <a key={card.label} href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block h-full" data-testid={`link-contact-${card.label.toLowerCase()}`}>
                  {content}
                </a>
              ) : (
                <div key={card.label} className="h-full">{content}</div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════ SOCIAL STRIP ══════════════════════════════ */}
      <section className="bg-white dark:bg-background py-5">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
          >
            <p className="text-sm font-semibold text-gray-500 dark:text-white/40 shrink-0">Follow us on social media</p>
            <div className="flex items-center gap-3">
              {socialLinks.filter(l => l.isActive && l.pageUrl).map((link, i) => {
                const Icon = socialIcons[link.platformCode];
                if (!Icon) return null;
                return (
                  <motion.a
                    key={link.id} href={link.pageUrl} target="_blank" rel="noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.4 }}
                    whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.92 }}
                    className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${socialGrad[link.platformCode] || "from-violet-500 to-fuchsia-500"} shadow-md hover:shadow-lg transition-shadow duration-300`}
                    title={link.platformName} data-testid={`link-social-${link.platformCode}`}
                  >
                    <Icon style={{ width: "0.95rem", height: "0.95rem", color: "white" }} />
                    <span className="text-white text-xs font-bold hidden sm:block">{link.platformName}</span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════ FORM ══════════════════════════════════════ */}
      <section className="py-12 pb-20 bg-white dark:bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-400/5 dark:bg-violet-500/6 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">

          {/* section label */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.16em] text-violet-500 dark:text-violet-400 px-4 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20">
              Send a Message
            </span>
          </motion.div>

          {/* form card */}
          <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <div className="relative rounded-3xl overflow-hidden border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#0f0d1a] shadow-[0_4px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_60px_rgba(0,0,0,0.5)]">

              {/* decorative gradient top strip */}
              <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

              {/* inner ambient */}
              <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-violet-500/[0.04] via-transparent to-transparent pointer-events-none" />

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative flex flex-col items-center justify-center py-24 px-8 text-center gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/40"
                    >
                      <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Message Sent! 🎉</h3>
                      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">Thank you for reaching out. We'll get back to you within 24 hours on working days.</p>
                    </div>
                    <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                      className="mt-1 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                      data-testid="button-send-another"
                    >
                      ← Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative p-8 sm:p-12 lg:p-14">
                    <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16 items-start">

                      {/* Left info panel */}
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 leading-tight">Let's talk.</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">Fill the form and our team will respond within 24 hours on working days.</p>
                        </div>

                        <div className="space-y-5">
                          {[
                            { icon: Mail,          label: "Email us",       value: "support@samikaranolympiad.com", color: "from-violet-500 to-purple-600" },
                            { icon: MessageCircle, label: "WhatsApp",       value: "+91 98765 43210",               color: "from-emerald-400 to-green-600"  },
                            { icon: Clock,         label: "Working hours",  value: "Mon–Sat, 9 AM – 6 PM",          color: "from-orange-400 to-amber-500"   },
                          ].map(r => (
                            <div key={r.label} className="flex items-center gap-3.5">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-sm shrink-0`}>
                                <r.icon className="w-4 h-4 text-white" strokeWidth={2} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 leading-none mb-0.5">{r.label}</p>
                                <p className="text-sm font-semibold text-foreground">{r.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Right: form fields */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {[
                            { id: "name",  label: "Your Name",  type: "text",  ph: "John Doe",            req: true },
                            { id: "email", label: "Email",       type: "email", ph: "you@example.com",     req: true },
                          ].map(f => (
                            <div key={f.id} className="space-y-1.5">
                              <label className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-white/40">
                                {f.label} {f.req && <span className="text-rose-400 not-italic">*</span>}
                              </label>
                              <input
                                type={f.type}
                                placeholder={f.ph}
                                value={form[f.id as keyof typeof form]}
                                onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                                onFocus={() => setFocused(f.id)}
                                onBlur={() => setFocused(null)}
                                className={fieldClass(f.id)}
                                data-testid={`input-contact-${f.id}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-white/40">Subject</label>
                          <input
                            placeholder="What is this about?"
                            value={form.subject}
                            onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                            onFocus={() => setFocused("subject")}
                            onBlur={() => setFocused(null)}
                            className={fieldClass("subject")}
                            data-testid="input-contact-subject"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-white/40">
                            Message <span className="text-rose-400">*</span>
                          </label>
                          <textarea
                            rows={6}
                            placeholder="Tell us how we can help you..."
                            value={form.message}
                            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                            onFocus={() => setFocused("message")}
                            onBlur={() => setFocused(null)}
                            className={`${fieldClass("message")} resize-none`}
                            data-testid="input-contact-message"
                          />
                        </div>

                        <motion.button
                          type="submit" disabled={loading}
                          whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="relative w-full h-[50px] rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                          data-testid="button-contact-submit"
                        >
                          {/* shimmer */}
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending…
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Send className="w-4 h-4" />
                              Send Message
                            </span>
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
