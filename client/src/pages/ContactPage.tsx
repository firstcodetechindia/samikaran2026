import { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface SocialLink {
  id: number;
  platformCode: string;
  platformName: string;
  pageUrl: string;
  isActive: boolean;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
};

const socialColors: Record<string, string> = {
  facebook: "hover:bg-blue-600",
  instagram: "hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500",
  youtube: "hover:bg-red-600",
  whatsapp: "hover:bg-green-600",
};

export default function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const { data: socialLinksData = [] } = useQuery<SocialLink[]>({
    queryKey: ["/api/public/social-links"],
  });

  const defaultSocialLinks: SocialLink[] = [
    { id: 1, platformCode: "facebook",  platformName: "Facebook",  pageUrl: "https://facebook.com/samikaranolympiad",  isActive: true },
    { id: 2, platformCode: "instagram", platformName: "Instagram", pageUrl: "https://instagram.com/samikaranolympiad", isActive: true },
    { id: 3, platformCode: "youtube",   platformName: "YouTube",   pageUrl: "https://youtube.com/@samikaranolympiad",  isActive: true },
    { id: 4, platformCode: "whatsapp",  platformName: "WhatsApp",  pageUrl: "https://wa.me/919876543210",              isActive: true },
  ];
  const socialLinks = socialLinksData.length > 0 ? socialLinksData : defaultSocialLinks;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
  };

  const contactCards = [
    {
      icon: Mail,
      title: "Email Us",
      value: "support@samikaranolympiad.com",
      sub: "We reply within 24 hours",
      color: "from-violet-500 to-purple-600",
      href: "mailto:support@samikaranolympiad.com",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+91 98765 43210",
      sub: "Chat with us directly",
      color: "from-green-500 to-emerald-600",
      href: "https://wa.me/919876543210",
    },
    {
      icon: Clock,
      title: "Support Hours",
      value: "Mon – Sat",
      sub: "9:00 AM – 6:00 PM IST",
      color: "from-orange-500 to-amber-500",
      href: null,
    },
    {
      icon: MapPin,
      title: "Location",
      value: "India",
      sub: "Serving students nationwide",
      color: "from-blue-500 to-cyan-500",
      href: null,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | Samikaran Olympiad</title>
        <meta name="description" content="Get in touch with Samikaran Olympiad. Contact us for support, queries, partnerships, or any assistance regarding our online olympiad exams." />
      </Helmet>

      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-fuchsia-700/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
              Get In Touch
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Contact <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Us</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto">
              Have a question or need help? We're here for you. Reach out and our team will respond promptly.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact Cards ────────────────────────────── */}
      <section className="py-10 bg-white dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {contactCards.map((card) => (
              <motion.div key={card.title} variants={fadeUp}>
                {card.href ? (
                  <a
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex flex-col gap-3 p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                    data-testid={`link-contact-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground mb-0.5">{card.title}</p>
                      <p className="font-bold text-sm sm:text-base text-foreground leading-snug">{card.value}</p>
                      <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">{card.sub}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex flex-col gap-3 p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-border/50 shadow-sm h-full">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground mb-0.5">{card.title}</p>
                      <p className="font-bold text-sm sm:text-base text-foreground leading-snug">{card.value}</p>
                      <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">{card.sub}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Form + Info ──────────────────────────────── */}
      <section className="py-10 pb-16 bg-white dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-start">

            {/* Contact Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="bg-white dark:bg-card rounded-3xl border border-gray-100 dark:border-border/50 shadow-sm p-7 sm:p-9">
                <h2 className="text-xl sm:text-2xl font-black text-foreground mb-1">Send a Message</h2>
                <p className="text-sm text-muted-foreground mb-7">Fill the form below and we'll get back to you soon.</p>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-14 text-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Message Sent!</h3>
                    <p className="text-muted-foreground max-w-xs text-sm">Thank you for reaching out. Our team will respond within 24 hours.</p>
                    <Button
                      variant="outline"
                      onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                      data-testid="button-send-another"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name <span className="text-rose-500">*</span></Label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          data-testid="input-contact-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email <span className="text-rose-500">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          data-testid="input-contact-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What is this regarding?"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message <span className="text-rose-500">*</span></Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        rows={5}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        data-testid="input-contact-message"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold h-11 rounded-xl shadow-lg"
                      data-testid="button-contact-submit"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> Sending...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Message</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Right Info Panel */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55 } } }} className="space-y-5">

              {/* Quick Info */}
              <div className="rounded-3xl bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#160d30] border border-white/10 p-7">
                <h3 className="text-sm font-bold uppercase tracking-widest text-violet-400 mb-5">Quick Info</h3>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "Email", value: "support@samikaranolympiad.com" },
                    { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                    { icon: Clock, label: "Hours", value: "Mon–Sat, 9 AM – 6 PM IST" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">{item.label}</p>
                        <p className="text-sm text-white/80 leading-snug">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="rounded-3xl bg-white dark:bg-card border border-gray-100 dark:border-border/50 p-7">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">Follow Us</h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.filter(l => l.isActive && l.pageUrl).map(link => {
                    const Icon = socialIcons[link.platformCode];
                    if (!Icon) return null;
                    return (
                      <a
                        key={link.id}
                        href={link.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-muted/30 border border-gray-100 dark:border-border/40 text-sm font-semibold text-foreground transition-all duration-200 ${socialColors[link.platformCode] || "hover:bg-violet-600"} hover:text-white hover:border-transparent hover:shadow-md group`}
                        data-testid={`link-social-${link.platformCode}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{link.platformName}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* FAQ nudge */}
              <div className="rounded-3xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200/60 dark:border-violet-700/30 p-6 text-center">
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1">Looking for quick answers?</p>
                <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mb-4">Browse our Frequently Asked Questions.</p>
                <a
                  href="/faq"
                  className="inline-block text-xs font-bold uppercase tracking-widest text-white bg-violet-600 hover:bg-violet-700 px-5 py-2.5 rounded-xl transition-colors"
                  data-testid="link-faq"
                >
                  View FAQs
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
