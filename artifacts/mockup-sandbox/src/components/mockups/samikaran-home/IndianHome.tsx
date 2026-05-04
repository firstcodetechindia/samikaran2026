import React from 'react';

export function IndianHome() {
  const marqueeContent = Array(10).fill("Registrations open for 2025–26 · Results for Class 3–5 now live · Download your hall ticket · Free registration for all students");

  return (
    <div style={{ fontFamily: "'Hind', sans-serif", backgroundColor: "#FDFAF5", color: "#1C1410", minHeight: "100vh" }} className="w-full flex flex-col items-center overflow-x-hidden">
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .marquee-container {
            display: flex;
            width: 200%;
            animation: marquee 30s linear infinite;
          }
          .playfair { font-family: 'Playfair Display', serif; }
          .rajdhani { font-family: 'Rajdhani', sans-serif; }
          
          /* Custom dotted border */
          .dotted-border {
            background-image: radial-gradient(#D4660A 20%, transparent 20%);
            background-position: 0 0;
            background-size: 8px 8px;
            background-repeat: repeat-x;
            height: 2px;
            width: 100%;
          }
        `}
      </style>

      {/* Navigation */}
      <nav className="w-full bg-white px-8 py-4 flex justify-between items-center shadow-sm relative z-10 sticky top-0" style={{ borderBottom: "1px solid #E8DDD0" }}>
        <div className="flex flex-col items-start">
          <div className="playfair text-3xl font-bold" style={{ color: "#D4660A" }}>Samikaran</div>
          <div className="rajdhani text-sm tracking-widest font-semibold" style={{ color: "#7A6A5A" }}>OLYMPIAD 2026</div>
        </div>
        
        <div className="hidden md:flex space-x-8 items-center text-lg font-medium">
          <a href="#" className="hover:text-[#D4660A]" style={{ borderBottom: "2px solid #D4660A", color: "#1C1410" }}>Subjects</a>
          <a href="#" className="hover:text-[#D4660A]" style={{ color: "#7A6A5A" }}>Results</a>
          <a href="#" className="hover:text-[#D4660A]" style={{ color: "#7A6A5A" }}>Schools</a>
          <a href="#" className="hover:text-[#D4660A]" style={{ color: "#7A6A5A" }}>About</a>
        </div>

        <div>
          <button className="px-6 py-2.5 rounded-md font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: "#D4660A", color: "white", borderRadius: "6px" }}>
            Register Free
          </button>
        </div>
      </nav>

      {/* Main Content Container centered at max 1280px */}
      <div className="w-full max-w-[1280px] flex flex-col items-center">

        {/* Hero Section */}
        <section className="w-full relative px-8 py-20 flex flex-col md:flex-row items-center justify-between overflow-hidden" 
          style={{ background: "radial-gradient(circle at center, #FDFAF5 0%, #FBF7EF 100%)" }}>
          
          {/* Watermark SVG */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none w-[600px] h-[600px]">
            <svg viewBox="0 0 100 100" fill="none" stroke="#D4660A" strokeWidth="0.5">
              {[...Array(16)].map((_, i) => (
                <path key={i} d="M50,50 C50,20 65,20 50,0 C35,20 50,20 50,50" transform={`rotate(${i * 22.5} 50 50)`} />
              ))}
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="20" strokeDasharray="2 2" />
            </svg>
          </div>

          <div className="md:w-1/2 flex flex-col items-start z-10 mb-12 md:mb-0">
            <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide" style={{ backgroundColor: "#1A5C38", color: "white", borderRadius: "9999px" }}>
              <span className="mr-2">🇮🇳</span> REGISTRATIONS OPEN
            </div>
            <h1 className="playfair text-5xl md:text-[56px] leading-[1.15] mb-6 font-bold" style={{ color: "#1C1410" }}>
              India's Olympiad<br/>
              for Every<br/>
              School Child
            </h1>
            <p className="text-[19px] leading-relaxed mb-8 max-w-[480px]" style={{ color: "#7A6A5A" }}>
              A national platform celebrating academic excellence across 8 subjects. Built for the modern Indian student.
            </p>
            <div className="flex space-x-4">
              <button className="px-8 py-3.5 rounded-md font-semibold text-lg transition-transform hover:-translate-y-0.5 shadow-sm" style={{ backgroundColor: "#D4660A", color: "white", borderRadius: "6px" }}>
                Register for Free
              </button>
              <button className="px-8 py-3.5 rounded-md font-semibold text-lg transition-colors" style={{ backgroundColor: "transparent", color: "#1C1410", border: "1px solid #7A6A5A", borderRadius: "6px" }}>
                Download Brochure
              </button>
            </div>
          </div>

          <div className="md:w-[45%] grid grid-cols-2 gap-4 z-10">
            <div className="p-6 bg-white shadow-sm flex flex-col items-start justify-center" style={{ border: "1px solid #E8DDD0", borderRadius: "4px" }}>
              <div className="playfair text-4xl font-bold mb-2" style={{ color: "#D4660A" }}>1,40,000+</div>
              <div className="text-sm font-medium tracking-wide uppercase" style={{ color: "#7A6A5A" }}>Students</div>
            </div>
            <div className="p-6 bg-white shadow-sm flex flex-col items-start justify-center" style={{ border: "1px solid #E8DDD0", borderRadius: "4px" }}>
              <div className="playfair text-4xl font-bold mb-2" style={{ color: "#B8860B" }}>3,200+</div>
              <div className="text-sm font-medium tracking-wide uppercase" style={{ color: "#7A6A5A" }}>Schools</div>
            </div>
            <div className="p-6 bg-white shadow-sm flex flex-col items-start justify-center" style={{ border: "1px solid #E8DDD0", borderRadius: "4px" }}>
              <div className="playfair text-4xl font-bold mb-2" style={{ color: "#1A5C38" }}>28</div>
              <div className="text-sm font-medium tracking-wide uppercase" style={{ color: "#7A6A5A" }}>States</div>
            </div>
            <div className="p-6 bg-white shadow-sm flex flex-col items-start justify-center relative overflow-hidden" style={{ border: "1px solid #E8DDD0", borderRadius: "4px" }}>
              <div className="playfair text-4xl font-bold mb-2" style={{ color: "#1C1410" }}>Free</div>
              <div className="text-sm font-medium tracking-wide uppercase" style={{ color: "#7A6A5A" }}>Entry</div>
              <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-[100px] playfair font-bold leading-none">₹0</div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="w-full bg-[#B8860B] py-2 overflow-hidden flex whitespace-nowrap text-white rajdhani text-[15px] tracking-widest font-semibold uppercase" style={{ borderTop: "2px solid #D4660A", borderBottom: "2px solid #D4660A" }}>
          <div className="marquee-container">
            {marqueeContent.map((text, i) => (
              <span key={i} className="mx-8">{text}</span>
            ))}
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="w-full py-12 flex justify-center items-center px-8">
          <div className="flex items-center w-full max-w-2xl">
            <span className="text-[#D4660A] text-xs">◆</span>
            <div className="h-[1px] flex-grow mx-2 bg-[#D4660A] opacity-40"></div>
            <span className="text-[#D4660A] text-xs">◆</span>
          </div>
        </div>

        {/* Subjects Section */}
        <section className="w-full px-8 pb-16">
          <h2 className="playfair text-4xl font-bold mb-10" style={{ color: "#1C1410" }}>8 Subjects. One Olympiad.</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Mathematics", bg: "#D4660A", abbr: "MA" },
              { name: "Science", bg: "#1A5C38", abbr: "SC" },
              { name: "English", bg: "#1D3557", abbr: "EN" },
              { name: "Social Science", bg: "#A44A3F", abbr: "SS" },
              { name: "Hindi", bg: "#800000", abbr: "HI" },
              { name: "Gen. Knowledge", bg: "#B8860B", abbr: "GK" },
              { name: "Computer Sci.", bg: "#006D77", abbr: "CS" },
              { name: "Reasoning", bg: "#5C4033", abbr: "RE" },
            ].map((subj, i) => (
              <div key={i} className="relative h-[120px] p-5 flex items-end overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: subj.bg, borderRadius: "4px" }}>
                <div className="absolute top-2 right-2 text-white opacity-10 text-[80px] font-bold leading-none select-none tracking-tighter" style={{ fontFamily: "Arial, sans-serif" }}>
                  {subj.abbr}
                </div>
                <h3 className="playfair text-xl font-bold text-white relative z-10">{subj.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Decorative Divider */}
        <div className="w-full pb-12 flex justify-center items-center px-8">
          <div className="flex items-center w-full max-w-2xl">
            <span className="text-[#D4660A] text-xs">◆</span>
            <div className="h-[1px] flex-grow mx-2 bg-[#D4660A] opacity-40"></div>
            <span className="text-[#D4660A] text-xs">◆</span>
          </div>
        </div>

        {/* Why Samikaran */}
        <section className="w-full px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="flex flex-col">
              <div className="text-[#D4660A] text-6xl playfair leading-none h-[40px]">"</div>
              <p className="playfair text-2xl italic leading-relaxed" style={{ color: "#1C1410" }}>
                The curriculum aligned perfectly with what is taught in schools, but tested their conceptual depth in a beautiful way.
              </p>
              <div className="mt-4 rajdhani tracking-wider font-bold uppercase text-sm" style={{ color: "#7A6A5A" }}>— Principal, Delhi Public School</div>
            </div>
            
            <div className="flex flex-col space-y-6 pl-0 md:pl-8" style={{ borderLeft: "1px solid rgba(212, 102, 10, 0.2)" }}>
              {[
                "Strictly mapped to NCERT & State Board syllabus",
                "Detailed performance analytics for every student",
                "Zero registration fee to ensure equal opportunity",
                "Bilingual format (English & Hindi) for core subjects"
              ].map((text, i) => (
                <div key={i} className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: "#D4660A" }}></div>
                  <p className="text-lg leading-snug" style={{ color: "#1C1410" }}>{text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center p-8 bg-white" style={{ border: "1px solid #E8DDD0", borderRadius: "4px", boxShadow: "inset 0 0 0 4px #FDFAF5" }}>
              <div className="text-center border-[1px] border-[#D4660A] p-6 w-full">
                <div className="playfair text-6xl font-bold mb-2" style={{ color: "#1A5C38" }}>8<span className="text-4xl align-super">th</span></div>
                <div className="rajdhani text-lg tracking-[0.2em] font-bold uppercase" style={{ color: "#D4660A" }}>Year</div>
                <div className="mt-3 playfair italic text-lg" style={{ color: "#7A6A5A" }}>of National Excellence</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full px-8 pb-20">
          <h2 className="playfair text-4xl font-bold mb-12 text-center" style={{ color: "#1C1410" }}>Journey to Excellence</h2>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-[24px] left-[10%] right-[10%] h-[2px] z-0" style={{ backgroundColor: "rgba(212, 102, 10, 0.3)" }}></div>
            
            <div className="grid grid-cols-4 gap-4 relative z-10">
              {[
                { step: "01", title: "Register", desc: "School or individual sign-up" },
                { step: "02", title: "Prepare", desc: "Access mock papers" },
                { step: "03", title: "Attempt", desc: "Take the test online" },
                { step: "04", title: "Excel", desc: "Get certificates & reports" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white rajdhani text-xl font-bold tracking-wider mb-4 shadow-md" style={{ backgroundColor: "#B8860B", border: "2px solid #FDFAF5" }}>
                    {item.step}
                  </div>
                  <h4 className="playfair text-xl font-bold mb-2" style={{ color: "#1C1410" }}>{item.title}</h4>
                  <p className="text-sm px-2" style={{ color: "#7A6A5A" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "A true benchmark of a child's understanding. My daughter enjoyed the logical approach of the questions.", name: "Ramesh Iyer", role: "Parent, Class 6 Student" },
              { quote: "The portal was seamless. Conducting the exam for 400+ students from our computer lab was completely hassle-free.", name: "Meena Sharma", role: "Exam Coordinator, KV" },
              { quote: "I loved the science questions. They made me think about how things work around us, not just what's in the book.", name: "Aarav P.", role: "State Topper, Class 9" }
            ].map((test, i) => (
              <div key={i} className="p-8 bg-white flex flex-col justify-between" style={{ border: "1px solid #E8DDD0", borderRadius: "4px", borderTop: "4px solid #D4660A" }}>
                <p className="playfair text-lg italic mb-6 leading-relaxed" style={{ color: "#1C1410" }}>"{test.quote}"</p>
                <div>
                  <div className="font-semibold text-[15px]" style={{ color: "#1C1410" }}>{test.name}</div>
                  <div className="text-sm mt-1" style={{ color: "#7A6A5A" }}>{test.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer CTA Banner - Full Width */}
      <div className="w-full py-16 px-8 text-center flex flex-col items-center relative overflow-hidden" style={{ backgroundColor: "#D4660A" }}>
        {/* Background Mandala texture */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none w-[800px] h-[800px]">
           <svg viewBox="0 0 100 100" fill="none" stroke="#FFFFFF" strokeWidth="0.5">
              {[...Array(24)].map((_, i) => (
                <path key={i} d="M50,50 C50,10 70,10 50,0 C30,10 50,10 50,50" transform={`rotate(${i * 15} 50 50)`} />
              ))}
            </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="playfair text-4xl md:text-5xl font-bold text-white mb-6">Join 1,40,000+ Students Across India</h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">Registration for the 2025–26 academic year is completely free. Give your child the stage they deserve.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-3.5 rounded-md font-bold text-lg shadow-lg hover:shadow-xl transition-shadow bg-white" style={{ color: "#D4660A", borderRadius: "6px" }}>
              Register Free
            </button>
            <button className="px-8 py-3.5 rounded-md font-bold text-lg text-white transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px" }}>
              For Schools
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="w-full px-8 py-16" style={{ backgroundColor: "#1C1410", color: "#FBF7EF" }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b pb-12 mb-8" style={{ borderColor: "rgba(251, 247, 239, 0.1)" }}>
          
          <div className="col-span-1">
            <div className="playfair text-2xl font-bold mb-1" style={{ color: "#D4660A" }}>Samikaran</div>
            <div className="rajdhani text-xs tracking-widest font-semibold text-white/60 mb-6">OLYMPIAD 2026</div>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Empowering the next generation of Indian scholars through comprehensive and accessible national assessments.
            </p>
          </div>

          <div>
            <h4 className="rajdhani font-bold tracking-widest uppercase mb-6 text-sm text-white/90">Subjects</h4>
            <ul className="space-y-3 text-sm text-white/60">
              {["Mathematics", "Science", "English", "Social Science", "Hindi"].map(l => (
                <li key={l} className="hover:text-[#D4660A] cursor-pointer transition-colors">{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="rajdhani font-bold tracking-widest uppercase mb-6 text-sm text-white/90">Important Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              {["Register Now", "Download Hall Ticket", "Check Results", "School Login", "Syllabus"].map(l => (
                <li key={l} className="hover:text-[#D4660A] cursor-pointer transition-colors">{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="rajdhani font-bold tracking-widest uppercase mb-6 text-sm text-white/90">Contact Us</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>support@samikaran.in</li>
              <li>1800-123-4567</li>
              <li className="mt-4 italic playfair text-white/40">New Delhi, India</li>
            </ul>
          </div>

        </div>

        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-white/40">
          <p>© 2025 Samikaran Olympiad Foundation. All rights reserved.</p>
          <p className="mt-4 md:mt-0 rajdhani tracking-widest uppercase font-semibold text-white/60 flex items-center">
            Made in India <span className="text-lg ml-2">🇮🇳</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
