import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import { PublicLayout } from "@/components/PublicLayout";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function BrandPage() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Our Brand | SAMIKARAN Olympiad - The Symbol of SAMIKARAN & Excellence</title>
        <meta name="description" content="Discover the story behind SAMIKARAN Olympiad's iconic hexagram logo. Learn how two triangles and the equals sign represent balance, equation, and academic excellence." />
        <link rel="canonical" href="https://www.samikaranolympiad.com/brand" />
        <meta property="og:title" content="Our Brand | SAMIKARAN Olympiad - The Symbol of Excellence" />
        <meta property="og:description" content="Discover the story behind SAMIKARAN Olympiad's iconic hexagram logo and brand identity." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/brand" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="keywords" content="samikaran brand, olympiad logo, hexagram design, brand identity, samikaran olympiad" />
        <meta name="robots" content="index, follow" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="Our Brand | SAMIKARAN Olympiad" />
        <meta name="twitter:description" content="Discover the story behind SAMIKARAN Olympiad's iconic hexagram logo and brand identity." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Our Brand", url: `${BASE_URL}/brand` }
        ]))}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-12 md:pt-16 pb-10 md:pb-14">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 text-center px-4">
          {/* 3D Animated Hexagram Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, type: "spring", stiffness: 100 }}
            className="mb-10 relative"
            style={{ perspective: '1000px' }}
          >
            {/* Outer glow ring */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border border-white/10" />
            </motion.div>
            
            {/* Pulsing glow behind logo */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-violet-500/50 to-pink-500/50 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* The Sharp 3D Hexagram Logo */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <svg viewBox="0 0 200 200" className="w-56 h-56 md:w-72 md:h-72 mx-auto" style={{ filter: 'drop-shadow(0 25px 50px rgba(138, 43, 226, 0.4))' }}>
                <defs>
                  {/* Sharp gradient for upward triangle */}
                  <linearGradient id="triUp" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="50%" stopColor="#C026D3" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                  {/* Sharp gradient for downward triangle */}
                  <linearGradient id="triDown" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                  {/* 3D shadow filter */}
                  <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
                  </filter>
                  {/* Inner shadow for depth */}
                  <filter id="innerGlow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                    <feOffset dx="0" dy="2" result="offsetBlur"/>
                    <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
                  </filter>
                </defs>
                
                {/* Background shadow layer */}
                <polygon 
                  points="100,22 172,145 28,145" 
                  fill="rgba(0,0,0,0.2)"
                  transform="translate(4, 6)"
                />
                <polygon 
                  points="100,178 28,55 172,55" 
                  fill="rgba(0,0,0,0.15)"
                  transform="translate(4, 6)"
                />
                
                {/* Upward triangle - Aspiration (sharp edges) */}
                <polygon 
                  points="100,18 175,148 25,148" 
                  fill="url(#triUp)"
                  filter="url(#shadow3d)"
                />
                {/* Highlight on upward triangle */}
                <polygon 
                  points="100,18 137,83 63,83" 
                  fill="rgba(255,255,255,0.15)"
                />
                
                {/* Downward triangle - Foundation (sharp edges) */}
                <polygon 
                  points="100,182 25,52 175,52" 
                  fill="url(#triDown)"
                  opacity="0.85"
                />
                {/* Highlight on downward triangle */}
                <polygon 
                  points="100,182 63,117 137,117" 
                  fill="rgba(255,255,255,0.1)"
                />
                
                {/* Equals sign with 3D effect */}
                <g filter="url(#shadow3d)">
                  {/* Shadow for equals */}
                  <rect x="62" y="90" width="76" height="12" rx="6" fill="rgba(0,0,0,0.2)" transform="translate(2, 2)"/>
                  <rect x="62" y="108" width="76" height="12" rx="6" fill="rgba(0,0,0,0.2)" transform="translate(2, 2)"/>
                  {/* Main equals bars */}
                  <rect x="62" y="88" width="76" height="12" rx="6" fill="white"/>
                  <rect x="62" y="106" width="76" height="12" rx="6" fill="white"/>
                  {/* Shine on equals */}
                  <rect x="62" y="88" width="76" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
                  <rect x="62" y="106" width="76" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
                </g>
              </svg>
            </motion.div>

            {/* Orbiting particles */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/80"
              animate={{ 
                rotate: 360,
                x: [0, 100, 0, -100, 0],
                y: [-100, 0, 100, 0, -100]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '0 0' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-pink-400/80"
              animate={{ 
                rotate: -360,
                x: [0, -80, 0, 80, 0],
                y: [80, 0, -80, 0, 80]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '0 0' }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 mt-16 tracking-tight"
          >
            The Symbol of{" "}
            <motion.span 
              className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              SAMIKARAN
            </motion.span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-light mb-[-10px]"
          >
            Where two forces meet in perfect balance, excellence is born.
          </motion.p>
        </div>

      </section>

      {/* The Name: SAMIKARAN */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              The Name That Speaks{" "}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Balance in Learning
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              In Sanskrit and Hindi, <strong className="text-violet-600">समीकरण (Samikaran)</strong> means <em>"Equation"</em> — the fundamental principle that governs balance in mathematics and life.
            </p>
          </motion.div>

          {/* Letter breakdown - Periodic Table Style */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-3 md:grid-cols-9 gap-3 md:gap-4"
          >
            {[
              { letter: "S", meaning: "Success", num: "01", desc: "The summit every student aspires to reach" },
              { letter: "A", meaning: "Aspiration", num: "02", desc: "Dreams that fuel the journey forward" },
              { letter: "M", meaning: "Mastery", num: "03", desc: "Deep understanding beyond memorization" },
              { letter: "I", meaning: "Intelligence", num: "04", desc: "The spark that ignites innovation" },
              { letter: "K", meaning: "Knowledge", num: "05", desc: "The foundation of all achievement" },
              { letter: "A", meaning: "Achievement", num: "06", desc: "Milestones that mark progress" },
              { letter: "R", meaning: "Reasoning", num: "07", desc: "Logic that illuminates solutions" },
              { letter: "A", meaning: "Advancement", num: "08", desc: "Continuous growth and evolution" },
              { letter: "N", meaning: "Nurturing", num: "09", desc: "Caring support for every learner" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative"
              >
                {/* 3D Card with depth effect */}
                <div 
                  className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    boxShadow: '0 4px 0 0 rgba(139, 92, 246, 0.3), 0 8px 20px -4px rgba(139, 92, 246, 0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)'
                  }}
                >
                  {/* Gradient border */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-violet-500 to-pink-500 opacity-100" style={{ padding: '2px', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                  
                  {/* Content */}
                  <div className="relative p-3 md:p-4 flex flex-col items-center justify-center min-h-[100px] md:min-h-[110px]">
                    {/* Atomic number style */}
                    <span className="absolute top-1.5 left-2 text-[8px] md:text-[10px] font-bold text-violet-400/70">{item.num}</span>
                    
                    {/* Main letter */}
                    <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
                      {item.letter}
                    </span>
                    
                    {/* Meaning label */}
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider text-center">
                      {item.meaning}
                    </p>
                  </div>
                  
                  {/* Bottom shine effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-80" />
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                  {item.desc}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-600 dark:text-gray-400 mt-12 text-lg max-w-3xl mx-auto"
          >
            Each letter is a pillar of our philosophy — together, they form <strong className="text-violet-600">SAMIKARAN</strong>, the equation of academic excellence.
          </motion.p>
        </div>
      </section>

      {/* The Hexagram Philosophy */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Logo visualization */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative w-80 h-80 mx-auto">
                {/* Animated hexagram */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="triangleUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8A2BE2" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                    <linearGradient id="triangleDown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#FF2FBF" />
                    </linearGradient>
                  </defs>
                  
                  {/* Upward triangle with animation */}
                  <motion.polygon 
                    points="100,20 175,150 25,150" 
                    fill="url(#triangleUp)"
                    initial={{ y: -20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  />
                  
                  {/* Downward triangle with animation */}
                  <motion.polygon 
                    points="100,180 25,50 175,50" 
                    fill="url(#triangleDown)"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  />
                  
                  {/* Equals sign */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                  >
                    <rect x="70" y="88" width="60" height="10" rx="5" fill="white" />
                    <rect x="70" y="106" width="60" height="10" rx="5" fill="white" />
                  </motion.g>
                </svg>

                {/* Labels */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-sm font-bold text-violet-600 dark:text-violet-400"
                >
                  Aspiration
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-sm font-bold text-pink-600 dark:text-pink-400"
                >
                  Foundation
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                  className="absolute top-1/2 right-0 translate-x-8 -translate-y-1/2 text-sm font-bold text-gray-600 dark:text-gray-300"
                >
                  = Balance
                </motion.div>
              </div>
            </motion.div>

            {/* Philosophy text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6">
                Why the Hexagram?
              </h2>
              
              <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Two Triangles, One Unity</h3>
                    <p className="text-sm">The upward triangle symbolizes <strong>aspiration</strong> — the student's drive to reach new heights. The downward triangle represents <strong>foundation</strong> — the knowledge base that supports growth. Together, they create perfect symmetry.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">The Equals Sign = Samikaran</h3>
                    <p className="text-sm">At the heart lies the <strong>equals sign (=)</strong>, the universal symbol of equation and balance. It represents fairness, equality of opportunity, and the mathematical precision we bring to every examination.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Sacred Geometry of Excellence</h3>
                    <p className="text-sm">The hexagram (Star of David / Shatkona) appears across cultures as a symbol of <strong>harmony between opposing forces</strong>. In our context, it represents the balance between challenge and capability, effort and reward.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Science Behind */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              The Psychology of Trust
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Every element of our logo is designed to inspire confidence and credibility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Color Psychology */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Color Psychology</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                <strong className="text-violet-600">Purple (#8A2BE2)</strong> represents wisdom, creativity, and academic excellence. <strong className="text-pink-600">Pink (#FF2FBF)</strong> adds warmth, approachability, and youthful energy.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Research shows purple is associated with intelligence and higher learning, while pink creates emotional connection and trust.
              </p>
            </motion.div>

            {/* Geometric Stability */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Geometric Stability</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Triangles are the most stable geometric shapes, used in architecture and engineering. The hexagram's perfect symmetry communicates <strong>reliability and structural integrity</strong>.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Studies in visual perception show symmetric shapes are processed faster and remembered longer by the human brain.
              </p>
            </motion.div>

            {/* Universal Symbolism */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Universal Recognition</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                The hexagram appears in Hindu (Shatkona), Jewish, and other traditions as a symbol of <strong>cosmic balance and divine harmony</strong>. It transcends cultural boundaries.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Cross-cultural symbols create instant familiarity, reducing cognitive load and building trust faster.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Mathematics */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
              The Equation of Success
            </h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
              <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-180">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 rotate-180 text-white" fill="currentColor">
                      <polygon points="12,2 22,20 2,20" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm font-medium">Aspiration</span>
                </div>
                
                <span className="text-4xl md:text-5xl font-bold text-white">+</span>
                
                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                      <polygon points="12,22 2,4 22,4" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm font-medium">Foundation</span>
                </div>
                
                <span className="text-4xl md:text-5xl font-bold text-white">=</span>
                
                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <svg viewBox="0 0 100 100" className="w-12 h-12">
                      <polygon points="50,10 85,75 15,75" fill="white"/>
                      <polygon points="50,90 15,25 85,25" fill="white" opacity="0.7"/>
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm font-medium">Excellence</span>
                </div>
              </div>
              
              <p className="text-white/70 mt-8 text-lg max-w-2xl mx-auto">
                When students combine their <strong className="text-violet-300">ambition to grow</strong> with a <strong className="text-pink-300">solid knowledge foundation</strong>, they achieve <strong className="text-white">true excellence</strong>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6">
                Our Vision
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-lg">
                  At <strong className="text-violet-600">SAMIKARAN Olympiad</strong>, we believe every child deserves a fair chance to demonstrate their potential.
                </p>
                <p>
                  Our platform is built on the principle of <strong>equation</strong> — not just in mathematics, but in <strong>equal opportunity</strong>. Whether from a village school or a metropolitan academy, every student faces the same challenge, under the same fair conditions.
                </p>
                <p>
                  The hexagram in our logo isn't just design — it's a <strong>promise</strong>. A promise that we balance rigor with fairness, challenge with support, and competition with growth.
                </p>
                <p className="text-lg font-medium bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  We're not just conducting exams. We're building the equation for a brighter future.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { number: "500K+", label: "Students Trust Us" },
                { number: "50+", label: "Countries" },
                { number: "26", label: "Olympiad Categories" },
                { number: "100%", label: "Fair & Transparent" },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 text-center"
                >
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-violet-600 to-pink-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Mark with Name */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20">
                <polygon points="50,8 90,78 10,78" fill="white"/>
                <polygon points="50,92 10,22 90,22" fill="white" opacity="0.7"/>
                <rect x="35" y="44" width="30" height="5" rx="2.5" fill="#8A2BE2"/>
                <rect x="35" y="53" width="30" height="5" rx="2.5" fill="#8A2BE2"/>
              </svg>
              <div className="text-left">
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  SAMIKARAN<span className="text-pink-200">.</span>
                </div>
                <div className="text-sm md:text-base font-semibold text-white/80 uppercase tracking-[0.3em]">
                  Olympiad
                </div>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              The Equation of Excellence
            </p>
            
            <div className="mt-8 text-white/60 text-sm">
              Est. 2026 | Trusted Worldwide
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
