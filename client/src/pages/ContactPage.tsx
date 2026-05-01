import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { Mail, MessageCircle, Clock, MapPin, Send, CheckCircle, ArrowRight } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.08 },
  }),
};

interface SocialLink {
  id: number; platformCode: string; platformName: string; pageUrl: string; isActive: boolean;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: SiFacebook, instagram: SiInstagram, youtube: SiYoutube, whatsapp: SiWhatsapp,
};
const socialGradients: Record<string, string> = {
  facebook:  "from-blue-500 to-blue-700",
  instagram: "from-purple-500 via-pink-500 to-orange-400",
  youtube:   "from-red-500 to-red-700",
  whatsapp:  "from-green-400 to-emerald-600",
};

const contactCards = [
  { icon: Mail,           label: "Email Us",       value: "support@samikaranolympiad.com", sub: "Reply within 24 hrs", color: "from-violet-500 to-purple-600", href: "mailto:support@samikaranolympiad.com" },
  { icon: MessageCircle,  label: "WhatsApp",        value: "+91 98765 43210",               sub: "Chat with us directly", color: "from-green-400 to-emerald-600",  href: "https://wa.me/919876543210" },
  { icon: Clock,          label: "Support Hours",   value: "Mon – Sat",                    sub: "9 AM – 6 PM IST",       color: "from-orange-400 to-amber-500",  href: null },
  { icon: MapPin,         label: "Location",        value: "Pan India",                    sub: "Students nationwide",   color: "from-sky-400 to-cyan-500",      href: null },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

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

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-2xl text-sm font-medium bg-white/60 dark:bg-white/5 border transition-all duration-300 outline-none placeholder:text-gray-400 dark:placeholder:text-white/30 text-foreground backdrop-blur-sm ${
      focused === field
        ? "border-violet-400 dark:border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] bg-white/90 dark:bg-white/8"
        : "border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
    }`;

  return (
    <PublicLayout>
      <Helmet>
        <title>Contact Us | Samikaran Olympiad</title>
        <meta name="description" content="Get in touch with Samikaran Olympiad for support, queries, and partnerships." />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-28 pb-14 overflow-hidden bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e]">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-violet-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] text-violet-300 mb-5 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25"
          >
            Get In Touch
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
          >
            Contact <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Us</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto"
          >
            Have a question or need help? Our team is ready to assist you.
          </motion.p>
        </div>
      </section>

      {/* ── Glass Contact Cards ───────────────────────────── */}
      <section className="relative -mt-1 pb-8 bg-gradient-to-b from-violet-50/60 to-white dark:from-[#0f0a1e] dark:to-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0f0a1e] to-transparent dark:block hidden" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {contactCards.map((card, i) => {
              const Inner = (
                <>
                  {/* gradient top accent */}
                  <div className={`absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r ${card.color} rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                  {/* corner glow */}
                  <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 rounded-full blur-xl transition-opacity duration-500`} />
                  {/* icon */}
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: 6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg mb-4 relative z-10`}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-gray-400 dark:text-white/40 mb-1">{card.label}</p>
                    <p className="font-bold text-sm sm:text-[15px] text-foreground leading-snug mb-0.5">{card.value}</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/35">{card.sub}</p>
                  </div>
                  {card.href && (
                    <div className="mt-3 relative z-10">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${card.color} bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                        Open <ArrowRight className="w-3 h-3 text-violet-500" />
                      </span>
                    </div>
                  )}
                </>
              );

              const baseClass = "group relative flex flex-col p-5 sm:p-6 rounded-3xl overflow-hidden transition-all duration-300 cursor-default bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/80 dark:border-white/8 shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.14)] dark:hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] hover:-translate-y-1.5";

              return (
                <motion.div
                  key={card.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                >
                  {card.href ? (
                    <a href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={baseClass} data-testid={`link-contact-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      {Inner}
                    </a>
                  ) : (
                    <div className={baseClass}>{Inner}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Form Section ─────────────────────────────────── */}
      <section className="py-8 pb-16 bg-gradient-to-b from-white to-violet-50/40 dark:from-background dark:to-violet-950/10 relative overflow-hidden">
        {/* ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-300/10 dark:bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-fuchsia-300/8 dark:bg-fuchsia-600/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>

            {/* Form Card — Apple glass */}
            <div className="relative rounded-[2rem] overflow-hidden bg-white/75 dark:bg-white/[0.04] backdrop-blur-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_60px_rgba(0,0,0,0.4)]">

              {/* top gradient bar */}
              <div className="h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

              {/* subtle inner glow */}
              <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />

              <div className="relative p-8 sm:p-12">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center justify-center py-16 text-center gap-5"
                    >
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30"
                      >
                        <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground mb-2">Message Sent!</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">Thank you for reaching out. We'll reply within 24 hours.</p>
                      </div>
                      <button
                        onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                        className="mt-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                        data-testid="button-send-another"
                      >
                        Send another message →
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-1.5">Send a Message</h2>
                        <p className="text-sm text-muted-foreground">We typically reply within 24 hours on working days.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name + Email row */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                              Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                              placeholder="Your full name"
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              onFocus={() => setFocused("name")}
                              onBlur={() => setFocused(null)}
                              className={inputClass("name")}
                              data-testid="input-contact-name"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                              Email <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="email"
                              placeholder="you@example.com"
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              onFocus={() => setFocused("email")}
                              onBlur={() => setFocused(null)}
                              className={inputClass("email")}
                              data-testid="input-contact-email"
                            />
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Subject</label>
                          <input
                            placeholder="What is this about?"
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            onFocus={() => setFocused("subject")}
                            onBlur={() => setFocused(null)}
                            className={inputClass("subject")}
                            data-testid="input-contact-subject"
                          />
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                            Message <span className="text-rose-400">*</span>
                          </label>
                          <textarea
                            rows={6}
                            placeholder="Tell us how we can help..."
                            value={form.message}
                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            onFocus={() => setFocused("message")}
                            onBlur={() => setFocused(null)}
                            className={`${inputClass("message")} resize-none`}
                            data-testid="input-contact-message"
                          />
                        </div>

                        {/* Submit */}
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full h-[52px] rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                          data-testid="button-contact-submit"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                          {loading ? (
                            <span className="flex items-center justify-center gap-2.5">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2.5">
                              <Send className="w-4 h-4" />
                              Send Message
                            </span>
                          )}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Social links below form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">Follow Us</p>
            <div className="flex items-center justify-center gap-3">
              {socialLinks.filter(l => l.isActive && l.pageUrl).map(link => {
                const Icon = socialIcons[link.platformCode];
                if (!Icon) return null;
                return (
                  <motion.a
                    key={link.id}
                    href={link.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.12, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${socialGradients[link.platformCode] || "from-violet-500 to-fuchsia-500"} flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300`}
                    title={link.platformName}
                    data-testid={`link-social-${link.platformCode}`}
                  >
                    <Icon className="w-4.5 h-4.5 text-white" style={{ width: "1.1rem", height: "1.1rem" }} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
