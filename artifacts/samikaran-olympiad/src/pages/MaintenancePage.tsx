import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Clock, Mail, Phone, Bot, Cpu, Cog } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiYoutube, SiWhatsapp } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

interface SocialLink {
  id: number;
  platformCode: string;
  platformName: string;
  pageUrl: string | null;
  isActive: boolean;
}

const platformIcons: Record<string, any> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  x: SiX,
  linkedin: FaLinkedin,
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

export default function MaintenancePage() {
  const { data: socialLinks = [] } = useQuery<SocialLink[]>({
    queryKey: ["/api/public/social-links"],
  });

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 brand-gradient rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
            <Star className="text-white w-8 h-8" fill="rgba(255,255,255,0.3)" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-3xl font-bold leading-none font-serif uppercase tracking-tight text-white">
              SAMIKARAN<span className="text-fuchsia-400">.</span>
            </span>
            <span className="text-xl font-bold uppercase font-serif leading-none text-white/80">
              OLYMPIAD
            </span>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
              <Bot className="w-14 h-14 text-violet-300" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2"
              >
                <Cog className="w-7 h-7 text-fuchsia-400" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-2 -left-2"
              >
                <Cog className="w-5 h-5 text-violet-400" />
              </motion.div>
            </div>
          </div>
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm text-violet-300 font-medium text-center leading-relaxed"
          >
            Our team is crafting something amazing
            <br />
            <span className="text-fuchsia-300">for your academic excellence</span>
          </motion.p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-black text-white mb-4 font-serif"
        >
          Under Maintenance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-violet-200 mb-8 leading-relaxed"
        >
          We're enhancing your educational journey with new features.
          <br className="hidden md:block" />
          Excellence takes time - we'll be back shortly!
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 text-violet-300 mb-12"
        >
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Expected to be back online soon</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Need Help?</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-violet-200">
            {(siteSettings?.support_email || "support@samikaranolympiad.com") && (
              <a href={`mailto:${siteSettings?.support_email || "support@samikaranolympiad.com"}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span>{siteSettings?.support_email || "support@samikaranolympiad.com"}</span>
              </a>
            )}
            {siteSettings?.contact_phone && (
              <a href={`tel:${siteSettings.contact_phone.replace(/[\s-]/g, '')}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                <span>{siteSettings.contact_phone}</span>
              </a>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
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
        </motion.div>

        <p className="text-violet-300/60 text-sm mt-8">
          &copy; {new Date().getFullYear()} Samikaran Olympiad. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
