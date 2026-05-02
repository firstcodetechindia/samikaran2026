import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star, Gift, Crown, Sparkles, BadgeCheck, GraduationCap, BookOpen, Target, TrendingUp, Users, IndianRupee, FileText, Heart, Zap, Shield, ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const medalTiers = [
  {
    tier: "Gold",
    icon: Crown,
    criteria: "Score ≥ 90%",
    color: "from-amber-400 via-yellow-500 to-amber-600",
    glow: "shadow-amber-500/30",
    border: "border-amber-400/40",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-600",
    textColor: "text-amber-700 dark:text-amber-300",
    rewards: [
      "Gold Medal of Excellence",
      "Premium Certificate with Gold Seal",
      "Cash Prize & Scholarship",
      "Letter of Recommendation",
      "Featured in Hall of Fame",
      "Trophy for Top 3 Rankers"
    ]
  },
  {
    tier: "Silver",
    icon: Medal,
    criteria: "Score ≥ 75%",
    color: "from-slate-300 via-gray-400 to-slate-500",
    glow: "shadow-slate-400/30",
    border: "border-slate-300/40",
    bg: "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30",
    iconBg: "bg-gradient-to-br from-slate-400 to-gray-500",
    textColor: "text-slate-700 dark:text-slate-300",
    rewards: [
      "Silver Medal of Merit",
      "Premium Certificate with Silver Seal",
      "Scholarship Eligibility",
      "Letter of Recommendation",
      "Special Mention on Website"
    ]
  },
  {
    tier: "Bronze",
    icon: Award,
    criteria: "Score ≥ 60%",
    color: "from-orange-400 via-amber-600 to-orange-700",
    glow: "shadow-orange-500/30",
    border: "border-orange-400/40",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-700",
    textColor: "text-orange-700 dark:text-orange-300",
    rewards: [
      "Bronze Medal of Achievement",
      "Premium Certificate with Bronze Seal",
      "Scholarship Eligibility",
      "Encouragement Award"
    ]
  },
  {
    tier: "Participant",
    icon: BadgeCheck,
    criteria: "All Participants",
    color: "from-violet-400 via-purple-500 to-fuchsia-600",
    glow: "shadow-violet-500/30",
    border: "border-violet-400/40",
    bg: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
    textColor: "text-violet-700 dark:text-violet-300",
    rewards: [
      "Official Participation Certificate",
      "Performance Report Card",
      "Subject-wise Analysis",
      "Improvement Recommendations"
    ]
  }
];

const prizeBreakdown = [
  { rank: "Rank 1 (National)", prize: "₹25,000", extra: "+ Gold Medal + Trophy + LOR", icon: Crown, color: "text-amber-500" },
  { rank: "Rank 2 (National)", prize: "₹15,000", extra: "+ Gold Medal + Trophy + LOR", icon: Trophy, color: "text-amber-400" },
  { rank: "Rank 3 (National)", prize: "₹10,000", extra: "+ Gold Medal + Trophy + LOR", icon: Medal, color: "text-amber-400" },
  { rank: "Rank 4-10 (National)", prize: "₹5,000", extra: "+ Gold Medal + Certificate", icon: Star, color: "text-yellow-500" },
  { rank: "State Toppers", prize: "₹2,000", extra: "+ Gold Medal + Certificate", icon: Target, color: "text-emerald-500" },
  { rank: "City Toppers", prize: "₹1,000", extra: "+ Silver Medal + Certificate", icon: Zap, color: "text-blue-500" },
];

const uniqueFeatures = [
  {
    icon: Shield,
    title: "Verified Digital Certificates",
    desc: "Each certificate has a unique QR code and verification ID. Anyone can verify authenticity online — tamper-proof and globally recognized.",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: TrendingUp,
    title: "Detailed Performance Report",
    desc: "Every participant receives a comprehensive subject-wise and topic-wise analysis report, helping identify strengths and areas for improvement.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: GraduationCap,
    title: "Scholarship Opportunities",
    desc: "Top performers get exclusive scholarship offers for higher education, coaching institutes, and partner organizations nationwide.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Users,
    title: "School Recognition",
    desc: "Schools with outstanding student performance receive Best School Award plaques and recognition on our national platform.",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: FileText,
    title: "Letters of Recommendation",
    desc: "Exceptional performers receive official LORs from Samikaran Foundation — valuable for school admissions and academic portfolios.",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: Heart,
    title: "Encouragement for All",
    desc: "Every single participant is valued. All students receive participation certificates and personalized improvement guidance.",
    color: "from-red-500 to-pink-600"
  }
];

const evaluationProcess = [
  { step: 1, title: "Exam Completion", desc: "Students complete their olympiad exam within the scheduled window with AI-powered proctoring.", icon: BookOpen },
  { step: 2, title: "Automated Scoring", desc: "Answers are evaluated instantly with our secure automated scoring system. No human bias involved.", icon: Target },
  { step: 3, title: "Ranking & Tie-breaking", desc: "Students are ranked nationally, state-wise, and city-wise using fair tie-breaking criteria — fewer mistakes, less time taken.", icon: TrendingUp },
  { step: 4, title: "Result Publication", desc: "Results are published with detailed performance analytics, subject-wise scores, and percentile rankings.", icon: FileText },
  { step: 5, title: "Certificate Generation", desc: "Certificates are auto-generated based on performance tier — Gold, Silver, Bronze, or Participant — each with unique verification.", icon: BadgeCheck },
  { step: 6, title: "Prize Distribution", desc: "Cash prizes, medals, and trophies are dispatched to winners. Digital certificates are available for instant download.", icon: Gift },
];

export default function AwardsPage() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Awards & Recognition | Samikaran Olympiad</title>
        <meta name="description" content="Discover the awards, medals, certificates, cash prizes, and scholarships offered by Samikaran Olympiad. Gold, Silver, Bronze medals and participation certificates for all students." />
        <link rel="canonical" href="https://www.samikaranolympiad.com/awards" />
        <meta property="og:title" content="Awards & Recognition | Samikaran Olympiad" />
        <meta property="og:description" content="₹50 Lakh+ in prizes and scholarships. Gold, Silver, Bronze medals with verified digital certificates for every participant." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/awards" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="keywords" content="olympiad awards, medals, certificates, cash prizes, scholarships, samikaran olympiad recognition" />
        <meta name="robots" content="index, follow" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="Awards & Recognition | Samikaran Olympiad" />
        <meta name="twitter:description" content="₹50 Lakh+ in prizes and scholarships. Gold, Silver, Bronze medals with verified digital certificates for every participant." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Awards & Recognition", url: `${BASE_URL}/awards` }
        ]))}</script>
      </Helmet>

      <section className="relative overflow-hidden pt-8 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-amber-200/30 to-yellow-300/20 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-violet-200/30 to-purple-300/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-pink-200/20 to-rose-300/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 mb-6">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">₹50 Lakh+ in Prizes & Scholarships</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
              Awards &{" "}
              <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Recognition
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Every effort counts. From national gold medals to participation certificates — we celebrate every student's journey towards excellence.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-20"
            initial="hidden"
            animate="visible"
          >
            {[
              { value: "₹50L+", label: "Total Prize Pool", icon: IndianRupee, color: "from-emerald-500 to-green-600" },
              { value: "24", label: "Olympiad Subjects", icon: BookOpen, color: "from-blue-500 to-indigo-600" },
              { value: "4", label: "Medal Categories", icon: Medal, color: "from-amber-500 to-yellow-600" },
              { value: "100%", label: "Students Recognized", icon: Heart, color: "from-pink-500 to-rose-600" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={scaleIn}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
                <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mb-24"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                Medal <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Categories</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Performance-based recognition with transparent criteria. No subjectivity — just merit.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {medalTiers.map((medal, i) => (
                <motion.div
                  key={medal.tier}
                  custom={i}
                  variants={scaleIn}
                  className="group relative"
                  data-testid={`medal-tier-${medal.tier.toLowerCase()}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${medal.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className={`relative ${medal.bg} backdrop-blur-sm border ${medal.border} rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${medal.glow}`}>
                    <div className={`w-14 h-14 rounded-2xl ${medal.iconBg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <medal.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${medal.textColor}`}>{medal.tier}</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      <Sparkles className="w-3 h-3" />
                      {medal.criteria}
                    </div>
                    <ul className="space-y-2.5">
                      {medal.rewards.map((reward, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span>{reward}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mb-24"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                Cash Prize <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Breakdown</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Per olympiad subject. Prizes awarded at National, State, and City levels.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="grid grid-cols-3 gap-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4">
                  <span className="text-sm font-bold text-white/90">Rank</span>
                  <span className="text-sm font-bold text-white/90 text-center">Cash Prize</span>
                  <span className="text-sm font-bold text-white/90 text-right">Additional Rewards</span>
                </div>
                {prizeBreakdown.map((item, i) => (
                  <motion.div
                    key={item.rank}
                    custom={i}
                    variants={fadeUp}
                    className={`grid grid-cols-3 gap-0 px-6 py-4 items-center ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : ''} border-b border-gray-100 dark:border-white/5 last:border-b-0 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors`}
                    data-testid={`prize-row-${i}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.rank}</span>
                    </div>
                    <span className="text-center text-lg font-black text-emerald-600 dark:text-emerald-400">{item.prize}</span>
                    <span className="text-right text-xs text-gray-500 dark:text-gray-400">{item.extra}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                * Prizes are per olympiad subject. Total pool across all 24 subjects exceeds ₹50 Lakhs annually.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mb-24"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                How We <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Evaluate</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                A completely transparent, automated, and bias-free evaluation process.
              </p>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              <div className="hidden md:block absolute left-[28px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-400 via-purple-400 to-fuchsia-400 opacity-30" />
              <div className="space-y-6">
                {evaluationProcess.map((item, i) => (
                  <motion.div
                    key={item.step}
                    custom={i}
                    variants={fadeUp}
                    className="relative flex gap-5 items-start"
                    data-testid={`evaluation-step-${item.step}`}
                  >
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 rounded-xl p-5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Step {item.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mb-24"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                What Makes Us <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Different</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Every student who participates walks away with something valuable.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {uniqueFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  variants={scaleIn}
                  className="group bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mb-24"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                Tie-Breaking <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Criteria</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                When two students score the same, here's how we determine rankings — fairly and transparently.
              </p>
            </motion.div>

            <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
              {[
                { priority: "1st", rule: "Less Time Taken", desc: "Student who finished faster ranks higher", icon: Zap, color: "from-amber-500 to-orange-600" },
                { priority: "2nd", rule: "More Correct Answers", desc: "Higher count of correct responses wins", icon: Target, color: "from-emerald-500 to-green-600" },
                { priority: "3rd", rule: "Age-based Priority", desc: "Younger students get priority for encouragement", icon: GraduationCap, color: "from-violet-500 to-purple-600" },
              ].map((item, i) => (
                <motion.div
                  key={item.priority}
                  custom={i}
                  variants={fadeUp}
                  className="flex gap-4 items-start bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 rounded-xl p-5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">{item.priority} Priority</div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.rule}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 sm:p-12 text-center shadow-2xl shadow-violet-600/20">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Ready to Compete & Win?
                </h2>
                <p className="text-white/70 max-w-lg mx-auto mb-8 text-sm sm:text-base">
                  Register for Samikaran Olympiad 2026 and showcase your talent. Every participant gets recognized — because every effort matters.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/olympiads">
                    <button className="bg-white text-violet-700 font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm" data-testid="button-explore-olympiads">
                      Explore Olympiads
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="bg-white/15 backdrop-blur-sm text-white font-bold px-8 py-3 rounded-xl border border-white/20 hover:bg-white/25 transition-all text-sm" data-testid="button-register-now">
                      Register Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
