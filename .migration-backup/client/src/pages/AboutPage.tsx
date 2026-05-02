import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "wouter";
import taraAvatarImg from "@assets/mira-avatar.webp";
import "./about-page.css";

export default function AboutPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      setScrollProgress(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <PublicLayout>
      <Helmet>
        <title>About Samikaran Olympiad | India's Premier AI-Powered Olympiad Platform</title>
        <meta name="description" content="Learn about Samikaran Olympiad - India's leading online olympiad examination platform. Features AI-proctored exams, real-time analytics, secure testing environment, multi-language support for Math, Science, English olympiads." />
        <link rel="canonical" href="https://www.samikaranolympiad.com/about" />
        <meta property="og:title" content="About Samikaran Olympiad | India's Premier AI-Powered Olympiad Platform" />
        <meta property="og:description" content="Learn about Samikaran Olympiad - India's leading online olympiad examination platform with AI-proctored exams for Math, Science, English olympiads." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/about" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="keywords" content="about samikaran olympiad, olympiad platform India, AI proctored exams, online olympiad company" />
        <meta name="robots" content="index, follow" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="About Samikaran Olympiad | India's Premier AI-Powered Olympiad Platform" />
        <meta name="twitter:description" content="Learn about Samikaran Olympiad - India's leading online olympiad examination platform." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "About", url: `${BASE_URL}/about` }
        ]))}</script>
      </Helmet>

      <div className="about-pg-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <div className="about-pg">
        <section className="about-pg-hero">
          <div className="about-pg-hero-content">
            <div className="about-pg-hero-badge">
              <span className="about-pg-india-flag" /> INDIA'S #1 AI-POWERED OLYMPIAD PLATFORM
            </div>
            <div className="about-pg-logo-row">
              <svg viewBox="0 0 100 100" width="80" height="80" style={{ filter: "drop-shadow(0 4px 12px rgba(147,51,234,0.4))" }}>
                <defs>
                  <linearGradient id="aboutLogoUp" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333EA"/>
                    <stop offset="50%" stopColor="#C026D3"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                  </linearGradient>
                  <linearGradient id="aboutLogoDown" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7"/>
                    <stop offset="100%" stopColor="#F472B6"/>
                  </linearGradient>
                </defs>
                <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(2,4)"/>
                <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(2,4)"/>
                <polygon points="50,10 88,75 12,75" fill="url(#aboutLogoUp)"/>
                <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.18)"/>
                <polygon points="50,90 12,25 88,25" fill="url(#aboutLogoDown)" opacity="0.88"/>
                <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.12)"/>
                <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white"/>
                <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white"/>
              </svg>
              <div style={{ textAlign: "left" }}>
                <div className="about-pg-logo">SAMIKARAN<span className="about-pg-logo-dot">.</span></div>
                <div className="about-pg-logo-sub">OLYMPIAD</div>
              </div>
            </div>
            <h1>The Future of Academic Excellence</h1>
            <p>India's most advanced AI-powered olympiad examination platform, building tomorrow's leaders through competitive learning and innovation.</p>
          </div>
        </section>

        <nav className="about-pg-nav">
          <div className="about-pg-nav-container">
            <a href="#about" className="about-pg-nav-link">About</a>
            <a href="#samikaran" className="about-pg-nav-link">Why SAMIKARAN?</a>
            <a href="#vision" className="about-pg-nav-link">Vision & Mission</a>
            <a href="#features" className="about-pg-nav-link">Features</a>
            <a href="#tara" className="about-pg-nav-link">TARA AI</a>
            <a href="#dreams" className="about-pg-nav-link">Our Promise</a>
            <a href="#nation" className="about-pg-nav-link">Nation Building</a>
            <a href="#roadmap" className="about-pg-nav-link">Roadmap</a>
            <a href="#team" className="about-pg-nav-link">The Team</a>
          </div>
        </nav>

        <div className="about-pg-container">
          <section id="about" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon about-pg-bg-purple">🎓</div>
              <h2 className="about-pg-section-title">What is Samikaran Olympiad?</h2>
              <p className="about-pg-section-subtitle">A revolutionary platform transforming how students compete, learn, and excel in academic olympiads across India.</p>
            </div>
            <div className="about-pg-card-grid">
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-purple">📚</div>
                <h3>Academic Excellence Platform</h3>
                <p>Samikaran Olympiad is India's premier AI-powered examination platform designed to identify, nurture, and celebrate academic talent. We conduct nationwide olympiads in Mathematics, Science, English, Computer Science, Reasoning, and more.</p>
              </div>
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-pink">🤖</div>
                <h3>AI-Powered Assessment</h3>
                <p>Our advanced AI engine generates unique question papers, provides instant evaluation, personalized feedback, and adaptive difficulty levels - ensuring fair and comprehensive assessment for every student.</p>
              </div>
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-blue">🔒</div>
                <h3>Secure Proctored Exams</h3>
                <p>Enterprise-grade proctoring system with AI-powered monitoring, multi-language warning support (22 Indian languages), anti-cheating measures, and real-time supervision capabilities.</p>
              </div>
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-green">📈</div>
                <h3>Comprehensive Analytics</h3>
                <p>World-class analytics dashboard providing deep insights into performance, subject-wise analysis, improvement trends, national rankings, and AI-powered recommendations for growth.</p>
              </div>
            </div>
            <div className="about-pg-stats-grid">
              <div className="about-pg-stat-card">
                <div className="about-pg-stat-number">5000+</div>
                <div className="about-pg-stat-label">Partner Schools</div>
              </div>
              <div className="about-pg-stat-card">
                <div className="about-pg-stat-number">1M+</div>
                <div className="about-pg-stat-label">Students Registered</div>
              </div>
              <div className="about-pg-stat-card">
                <div className="about-pg-stat-number">50+</div>
                <div className="about-pg-stat-label">Olympiads Conducted</div>
              </div>
              <div className="about-pg-stat-card">
                <div className="about-pg-stat-number">28</div>
                <div className="about-pg-stat-label">States Covered</div>
              </div>
            </div>
          </section>

          <section id="samikaran" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon about-pg-bg-pink">❤️</div>
              <h2 className="about-pg-section-title">Why "SAMIKARAN"?</h2>
              <p className="about-pg-section-subtitle">More than just a name - it's a philosophy rooted in mathematics, emotion, and the spirit of equality.</p>
            </div>
            <div className="about-pg-vision-box" style={{ marginBottom: 40 }}>
              <h2>💡 The Mathematical Soul</h2>
              <p style={{ fontSize: 18 }}>"<strong>SAMIKARAN</strong>" (समीकरण) is a Hindi word meaning <strong>"Equation"</strong> - the beautiful balance where both sides are equal. Just as an equation brings harmony between two expressions, <strong>Samikaran Olympiad</strong> brings equality of opportunity to every student, regardless of their background.</p>
            </div>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="about-pg-samikaran-letters-box">
                <div className="about-pg-samikaran-letters">
                  <span style={{ color: "#F472B6" }}>S</span>
                  <span style={{ color: "#A78BFA" }}>A</span>
                  <span style={{ color: "#60A5FA" }}>M</span>
                  <span style={{ color: "#34D399" }}>I</span>
                  <span style={{ color: "#FBBF24" }}>K</span>
                  <span style={{ color: "#FB923C" }}>A</span>
                  <span style={{ color: "#F87171" }}>R</span>
                  <span style={{ color: "#A78BFA" }}>A</span>
                  <span style={{ color: "#2DD4BF" }}>N</span>
                </div>
                <div style={{ fontSize: 20, opacity: 0.9, fontStyle: "italic" }}>समीकरण = Equation = Equality</div>
              </div>
            </div>
            <h3 className="about-pg-letter-heading">Every Letter Tells a Story</h3>
            <div className="about-pg-letter-grid">
              {[
                { letter: "S", word: "Scholarship", color: "#F472B6", desc: "Celebrating the pursuit of knowledge. Every student who participates is a scholar in the making - curious, dedicated, and striving for excellence." },
                { letter: "A", word: "Aspiration", color: "#A78BFA", desc: "Dreaming big is the first step to achieving big. We nurture the aspirations of millions of young minds who dream of representing India globally." },
                { letter: "M", word: "Mathematics", color: "#60A5FA", desc: "The universal language of logic and problem-solving. Mathematics is at the heart of our platform - from our name to our algorithms." },
                { letter: "I", word: "Innovation", color: "#34D399", desc: "We innovate continuously - AI-powered assessments, secure proctoring, adaptive learning. Technology that serves education, not the other way around." },
                { letter: "K", word: "Knowledge", color: "#FBBF24", desc: "Knowledge is power, but shared knowledge is empowerment. We believe in democratizing quality education for every child in India." },
                { letter: "A", word: "Accessibility", color: "#FB923C", desc: "From metros to villages, from English medium to regional languages - we ensure every student has equal access to participate and excel." },
                { letter: "R", word: "Recognition", color: "#F87171", desc: "Every effort deserves recognition. From participation certificates to national ranks, we celebrate every student's journey and achievement." },
                { letter: "A", word: "Achievement", color: "#A78BFA", desc: "Success is a journey, not a destination. We track, measure, and celebrate achievements - motivating students to keep pushing their boundaries." },
                { letter: "N", word: "Nation Building", color: "#2DD4BF", desc: "Every great nation is built by great minds. By nurturing young talent today, we're investing in the scientists, engineers, and leaders of tomorrow." },
              ].map((item, idx) => (
                <div key={idx} className="about-pg-card" style={{ borderLeft: `4px solid ${item.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 15 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 900 }}>{item.letter}</div>
                    <h3 style={{ margin: 0, fontSize: 20 }}>{item.word}</h3>
                  </div>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="about-pg-quote-box" style={{ marginTop: 50 }}>
              <div className="about-pg-quote-icon">∑</div>
              <div className="about-pg-quote-text">Just as both sides of an equation must balance, we believe every student - rich or poor, urban or rural - deserves an equal chance to prove their brilliance.</div>
              <div className="about-pg-quote-author">- The Equation of Equality</div>
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <div className="about-pg-rooted-box">
                <div style={{ fontSize: 24, fontWeight: 700, color: "#7C3AED", marginBottom: 10 }}>
                  <span className="about-pg-india-flag" style={{ width: 28, height: 18 }} /> Rooted in India, Reaching the World
                </div>
                <p style={{ color: "#6B21A8", fontSize: 16, margin: 0 }}>The word "Samikaran" connects us to our Sanskrit heritage while our technology connects us to the future.</p>
              </div>
            </div>
          </section>

          <section id="vision" className="about-pg-section">
            <div className="about-pg-vision-box">
              <h2>🎯 Our Vision</h2>
              <p>"To democratize quality competitive education and identify hidden talent from every corner of India, regardless of their socio-economic background, empowering the next generation of scientists, mathematicians, and innovators who will lead India to global prominence."</p>
            </div>
            <div className="about-pg-card-grid" style={{ marginTop: 40 }}>
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-orange">🏆</div>
                <h3>Our Mission</h3>
                <p>To provide equal opportunity to every student in India to showcase their academic potential through accessible, fair, and technology-driven olympiad examinations that prepare them for global competitions.</p>
              </div>
              <div className="about-pg-card">
                <div className="about-pg-card-icon about-pg-bg-cyan">💡</div>
                <h3>Our Purpose</h3>
                <p>To create a culture of competitive learning that goes beyond rote memorization, fostering critical thinking, problem-solving, and innovation - the skills that will define India's future workforce.</p>
              </div>
            </div>
            <div className="about-pg-quote-box">
              <div className="about-pg-quote-icon">❝</div>
              <div className="about-pg-quote-text">Every child in India deserves the chance to prove their brilliance. Geography, economics, or circumstance should never be barriers to academic excellence.</div>
              <div className="about-pg-quote-author">- Samikaran Olympiad Founding Principle</div>
            </div>
          </section>

          <section id="features" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon about-pg-bg-pink">⚡</div>
              <h2 className="about-pg-section-title">Platform Features</h2>
              <p className="about-pg-section-subtitle">Enterprise-grade capabilities built for scale, security, and seamless user experience.</p>
            </div>
            <div className="about-pg-feature-list">
              {[
                "AI-Powered Smart Question Generation",
                "TARA — Your Personal AI Voice Assistant",
                "Advanced Randomized & Secure Question Delivery",
                "Real-time AI Proctoring & Monitoring",
                "Multi-language Support (22 Indian Languages)",
                "Role-Based Access & Permission Management",
                "Mobile-First Progressive Web App Experience",
                "Enterprise-grade Support System",
                "AI Chatbot with Live Human Escalation",
                "Comprehensive Content & Blog Management",
                "Seamless Online Payment & Checkout",
                "Automated GST & Invoice Generation",
                "Email Campaigns & Smart Automation",
                "Dynamic Result & Certificate Generation",
                "Dedicated School & Partner Dashboards",
                "Dual Ranking System (National & School Level)",
                "In-depth Performance Analytics & Insights",
              ].map((feat, idx) => (
                <div key={idx} className="about-pg-feature-item">
                  <div className="about-pg-feature-check">✓</div>
                  <div className="about-pg-feature-text">{feat}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="tara" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon" style={{ background: "linear-gradient(135deg, #8A2BE2, #EC4899)" }}>🎓</div>
              <h2 className="about-pg-section-title">Meet TARA — Your Personal AI Tutor</h2>
              <p className="about-pg-section-subtitle">Imagine having a brilliant, patient teacher available 24/7 — just for you. That's TARA.</p>
            </div>

            <div className="about-pg-card about-pg-tara-card">
              <div className="about-pg-tara-inner">
                <div className="about-pg-tara-icon"><img src={taraAvatarImg} alt="TARA - AI Tutor" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "24px" }} /></div>
                <div className="about-pg-tara-content">
                  <h3 className="about-pg-tara-title">Why Every Student Deserves TARA <span style={{ background: "none", WebkitTextFillColor: "initial", color: "#444", fontWeight: 600 }}>(<span style={{ color: "#EC4899", fontWeight: 800, fontSize: "1.1em" }}>T</span>alent <span style={{ color: "#8B5CF6", fontWeight: 800, fontSize: "1.1em" }}>A</span>ssessment <span style={{ color: "#F59E0B", fontWeight: 800, fontSize: "1.1em" }}>& R</span>esearch <span style={{ color: "#10B981", fontWeight: 800, fontSize: "1.1em" }}>A</span>ssistant)</span></h3>
                  <p className="about-pg-tara-desc">
                    Not every student has access to a great tutor. Not every parent can afford expensive coaching. 
                    That's why we built TARA — an AI tutor who is always there for your child. She explains concepts 
                    in simple language, helps prepare for olympiads, clears doubts instantly, and speaks in a voice 
                    that feels just like talking to a friendly teacher. No waiting, no extra fees, no judgement.
                  </p>
                </div>
              </div>
            </div>

            <div className="about-pg-grid-3" style={{ marginTop: 30 }}>
              <div className="about-pg-card" style={{ textAlign: "center", borderTop: "4px solid #8A2BE2", padding: 30 }}>
                <div style={{ fontSize: "2.5em", marginBottom: 15 }}>📖</div>
                <h3 style={{ color: "#8A2BE2", marginBottom: 12, fontSize: "1.2em" }}>Learns With You</h3>
                <p style={{ color: "#64748B", lineHeight: 1.85, letterSpacing: "0.012em" }}>TARA understands where you're stuck. She explains topics step by step, gives examples, and makes sure you truly understand — not just memorize.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center", borderTop: "4px solid #EC4899", padding: 30 }}>
                <div style={{ fontSize: "2.5em", marginBottom: 15 }}>🕐</div>
                <h3 style={{ color: "#EC4899", marginBottom: 12, fontSize: "1.2em" }}>Available 24/7</h3>
                <p style={{ color: "#64748B", lineHeight: 1.85, letterSpacing: "0.012em" }}>Late night exam prep? Early morning doubt? TARA never sleeps. Ask her anything, anytime — she's always ready to help you succeed.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center", borderTop: "4px solid #6366F1", padding: 30 }}>
                <div style={{ fontSize: "2.5em", marginBottom: 15 }}>🗣</div>
                <h3 style={{ color: "#6366F1", marginBottom: 12, fontSize: "1.2em" }}>Talks Like a Real Teacher</h3>
                <p style={{ color: "#64748B", lineHeight: 1.85, letterSpacing: "0.012em" }}>Type or speak — TARA responds in a warm, natural voice. It's like having a personal teacher sitting right beside you, guiding you through every question.</p>
              </div>
            </div>

            <div className="about-pg-grid-2" style={{ marginTop: 25, gap: 25 }}>
              <div className="about-pg-card" style={{ display: "flex", alignItems: "flex-start", gap: 15, padding: 25 }}>
                <span style={{ fontSize: "2em" }}>💡</span>
                <div>
                  <strong style={{ color: "#8A2BE2", fontSize: "1.1em" }}>Smart Exam Preparation</strong>
                  <p style={{ color: "#64748B", marginTop: 8, lineHeight: 1.85, letterSpacing: "0.012em" }}>TARA knows the syllabus, the exam pattern, and what's important. She gives you focused tips, practice strategies, and helps you prepare smarter — not harder.</p>
                </div>
              </div>
              <div className="about-pg-card" style={{ display: "flex", alignItems: "flex-start", gap: 15, padding: 25 }}>
                <span style={{ fontSize: "2em" }}>👨‍👩‍👦</span>
                <div>
                  <strong style={{ color: "#EC4899", fontSize: "1.1em" }}>Peace of Mind for Parents</strong>
                  <p style={{ color: "#64748B", marginTop: 8, lineHeight: 1.85, letterSpacing: "0.012em" }}>Your child gets quality guidance without expensive tuition. TARA is safe, reliable, and focused only on education. If she ever can't help, a real human expert steps in immediately.</p>
                </div>
              </div>
            </div>

            <div className="about-pg-card" style={{ background: "linear-gradient(135deg, rgba(138,43,226,0.06), rgba(236,72,153,0.06))", textAlign: "center", padding: 35, marginTop: 30 }}>
              <p style={{ fontSize: "1.3em", fontStyle: "italic", color: "#555", lineHeight: 1.8, maxWidth: 700, margin: "0 auto" }}>
                "Every child deserves a great teacher. With TARA, every child gets one — no matter where they live, what school they go to, or what their family earns."
              </p>
              <p style={{ marginTop: 20, fontWeight: 700, color: "#8A2BE2", fontSize: "1.1em" }}>TARA — Because Your Dreams Deserve the Best Guidance.</p>
            </div>
          </section>

          <section id="dreams" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon" style={{ background: "linear-gradient(135deg, #FF6B6B, #FF8E53)" }}>❤</div>
              <h2 className="about-pg-section-title">Dreams We Nurture</h2>
              <p className="about-pg-section-subtitle">Behind every exam, there's a dream. Behind every score, there's a story.</p>
            </div>
            <div className="about-pg-card" style={{ textAlign: "center", padding: 40, marginBottom: 30 }}>
              <p style={{ fontSize: "1.4em", fontStyle: "italic", color: "#666", lineHeight: 1.8, maxWidth: 800, margin: "0 auto" }}>
                "A child from a small village in Bihar dreams of becoming a scientist.<br/>
                A girl from a remote town in Rajasthan wants to solve the mysteries of mathematics.<br/>
                A boy from a government school in Tamil Nadu aspires to represent India at the International Olympiad."
              </p>
              <p style={{ marginTop: 25, fontWeight: 600, color: "#8A2BE2" }}>We exist to make these dreams possible.</p>
            </div>
            <div className="about-pg-grid-3" style={{ marginBottom: 40 }}>
              <div className="about-pg-card" style={{ textAlign: "center", borderLeft: "4px solid #FF6B6B" }}>
                <div style={{ fontSize: "3em", marginBottom: 15 }}>👦</div>
                <h3 style={{ color: "#FF6B6B", marginBottom: 15 }}>For the First-Generation Learner</h3>
                <p style={{ color: "#666" }}>Your parents may not have had the opportunity, but you will. We're here to guide you, support you, and celebrate your victories.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center", borderLeft: "4px solid #4CAF50" }}>
                <div style={{ fontSize: "3em", marginBottom: 15 }}>🌱</div>
                <h3 style={{ color: "#4CAF50", marginBottom: 15 }}>For the Rural Champion</h3>
                <p style={{ color: "#666" }}>Distance is no barrier. Whether you're in a metro city or a village with one school, quality olympiad preparation reaches you.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center", borderLeft: "4px solid #2196F3" }}>
                <div style={{ fontSize: "3em", marginBottom: 15 }}>💫</div>
                <h3 style={{ color: "#2196F3", marginBottom: 15 }}>For the Quiet Genius</h3>
                <p style={{ color: "#666" }}>Not everyone is loud about their talents. We see you. We believe in you. Let your scores speak for themselves.</p>
              </div>
            </div>
            <div className="about-pg-card" style={{ background: "linear-gradient(135deg, rgba(138,43,226,0.05), rgba(255,47,191,0.05))", padding: 40, textAlign: "center" }}>
              <h3 style={{ fontSize: "1.8em", color: "#333", marginBottom: 25 }}>Our Promise to Every Student</h3>
              <div className="about-pg-grid-2" style={{ gap: 30, textAlign: "left" }}>
                {[
                  { icon: "🎯", title: "Equal Opportunity", desc: "No matter where you come from, you deserve a fair chance to compete and shine." },
                  { icon: "💖", title: "Affordable Excellence", desc: "World-class olympiad experience at fees that don't burden families." },
                  { icon: "🎓", title: "Recognition You Deserve", desc: "Every achievement, big or small, is celebrated. Your hard work matters." },
                  { icon: "👪", title: "Parents' Peace of Mind", desc: "Transparent, secure, and trustworthy. Your child is in safe hands." },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 15 }}>
                    <span style={{ fontSize: "2em" }}>{item.icon}</span>
                    <div>
                      <strong style={{ color: "#8A2BE2" }}>{item.title}</strong>
                      <p style={{ color: "#666", marginTop: 8 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-pg-card about-pg-india-card" style={{ marginTop: 40 }}>
              <div className="about-pg-india-card-inner">
                <h3 style={{ fontSize: "1.6em" }}>
                  <span className="about-pg-india-flag" /> Proudly Made in India, For the World
                </h3>
                <p style={{ marginTop: 15, color: "#555", maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
                  Developed in India with a global vision. Built with love, dedication, and the belief that every child across the world deserves a platform to prove their potential.
                </p>
                <p style={{ marginTop: 20, fontWeight: 700, fontSize: "1.2em", color: "#FF9933" }}>
                  "From India, Empowering Students Worldwide"
                </p>
                <div className="about-pg-made-in-india">
                  <span><span className="about-pg-india-flag" style={{ width: 28, height: 18 }} /> Made with ❤ in India</span>
                </div>
              </div>
            </div>
          </section>

          <section id="nation" className="about-pg-section">
            <div className="about-pg-nation-section">
              <div className="about-pg-section-header">
                <div className="about-pg-section-icon about-pg-bg-orange">
                  <span className="about-pg-india-flag" style={{ width: 36, height: 24, boxShadow: "none" }} />
                </div>
                <h2 className="about-pg-section-title">Building the Nation</h2>
                <p className="about-pg-section-subtitle">How Samikaran Olympiad contributes to India's growth and development</p>
              </div>
              <div className="about-pg-nation-grid">
                {[
                  { icon: "📚", title: "Quality Education Access", desc: "Bringing olympiad-level competitive exams to Tier 2, Tier 3 cities and rural areas where such opportunities were previously unavailable." },
                  { icon: "🔬", title: "STEM Talent Identification", desc: "Identifying and nurturing future scientists, engineers, and mathematicians from every corner of India through early talent recognition." },
                  { icon: "🎯", title: "Global Competition Prep", desc: "Preparing Indian students for international olympiads (IMO, IPhO, IOI) by providing world-class competitive examination experience." },
                  { icon: "💼", title: "Employment Generation", desc: "Creating jobs through our partner network - from content creators to exam supervisors, supporting the local economy." },
                  { icon: "🖥", title: "Digital India Initiative", desc: "Contributing to Digital India by bringing technology-driven education solutions to schools across the nation." },
                  { icon: "🌟", title: "Meritocracy Promotion", desc: "Ensuring that talent is recognized based on merit alone, regardless of background, through fair and transparent examination systems." },
                ].map((item, idx) => (
                  <div key={idx} className="about-pg-nation-card">
                    <div className="about-pg-nation-icon">{item.icon}</div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="roadmap" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon about-pg-bg-cyan">🚀</div>
              <h2 className="about-pg-section-title">Our Journey & Future</h2>
              <p className="about-pg-section-subtitle">From inception to becoming India's largest olympiad platform</p>
            </div>
            <div className="about-pg-timeline">
              {[
                { year: "2024 - Foundation", title: "Platform Conceptualization", desc: "The idea of Samikaran Olympiad was born - to create an accessible, technology-driven olympiad platform for every Indian student." },
                { year: "2025 - Development", title: "Core Platform Built", desc: "Complete platform development including AI question generation, proctoring system, multi-tenant architecture, and enterprise features." },
                { year: "2026 - Launch", title: "National Launch & Expansion", desc: "Official nationwide launch with school partnerships, partner programs, and first batch of olympiad examinations across all subjects." },
                { year: "2027 - Growth", title: "International Expansion", desc: "Expanding to SAARC countries, launching scholarship programs, and introducing advanced AI-powered personalized learning paths." },
                { year: "2030 - Vision", title: "10 Million Students", desc: "Target of 10 million registered students, presence in 100+ countries, and becoming the world's most trusted olympiad examination platform." },
              ].map((item, idx) => (
                <div key={idx} className="about-pg-timeline-item">
                  <div className="about-pg-timeline-dot" />
                  <div className="about-pg-timeline-year">{item.year}</div>
                  <div className="about-pg-timeline-title">{item.title}</div>
                  <div className="about-pg-timeline-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="team" className="about-pg-section">
            <div className="about-pg-section-header">
              <div className="about-pg-section-icon about-pg-bg-green">🤝</div>
              <h2 className="about-pg-section-title">The Samikaran Family</h2>
              <p className="about-pg-section-subtitle">A diverse team of educators, technologists, and dreamers united by a common mission</p>
            </div>
            <div className="about-pg-card-grid">
              <div className="about-pg-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 15 }}>👩‍🏫</div>
                <h3>Educators</h3>
                <p>Expert teachers and academicians who design curriculum-aligned, challenging questions that prepare students for real-world problem solving.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 15 }}>👨‍💻</div>
                <h3>Technologists</h3>
                <p>Engineers and developers building cutting-edge solutions using AI, cloud computing, and modern frameworks to deliver seamless experiences.</p>
              </div>
              <div className="about-pg-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 15 }}>👨‍💼</div>
                <h3>Operations</h3>
                <p>Dedicated team managing partnerships, student support, and ensuring smooth execution of examinations across the country.</p>
              </div>
            </div>
          </section>

          <div className="about-pg-vision-box" style={{ marginTop: 60 }}>
            <h2>🚀 Join the Movement</h2>
            <p style={{ marginBottom: 30 }}>Whether you're a student, school, partner, or educator - there's a place for you in the Samikaran family. Together, let's shape the future of India's academic excellence.</p>
            <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="about-pg-cta-btn about-pg-cta-primary">Student Portal</Link>
              <Link href="/school" className="about-pg-cta-btn about-pg-cta-outline">School Portal</Link>
              <Link href="/partner/dashboard" className="about-pg-cta-btn about-pg-cta-outline">Partner Portal</Link>
            </div>
          </div>
        </div>
      </div>

    </PublicLayout>
  );
}