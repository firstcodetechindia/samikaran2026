import { Helmet } from "react-helmet-async";

export default function BrandAssetsPdf() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Brand Assets - SAMIKARAN Olympiad</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-after: always; }
          }
        `}</style>
      </Helmet>
      
      {/* Navigation Buttons - Hidden when printing */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        <a
          href="/brand"
          className="px-5 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-gray-200"
          data-testid="button-back-to-brand"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Brand
        </a>
        <button
          onClick={handlePrint}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          data-testid="button-print-pdf"
        >
          Download as PDF
        </button>
      </div>

      <div className="min-h-screen bg-white">
        {/* Page 1: Full Logo with Text */}
        <div className="min-h-screen flex flex-col items-center justify-center p-12 page-break">
          <h1 className="text-2xl font-bold text-gray-400 mb-8 uppercase tracking-widest">SAMIKARAN Olympiad - Brand Assets</h1>
          
          <div className="text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-500 mb-6 uppercase tracking-wider">Full Logo with Text</h2>
            
            {/* Large Logo with Text */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <svg viewBox="0 0 100 100" width="180" height="180" className="drop-shadow-2xl">
                <defs>
                  <linearGradient id="pdfGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="50%" stopColor="#C026D3" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                  <linearGradient id="pdfGradDown" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                  <filter id="pdfShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#9333EA" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.1)" transform="translate(3, 4)" />
                <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.08)" transform="translate(3, 4)" />
                <polygon points="50,10 88,75 12,75" fill="url(#pdfGradUp)" filter="url(#pdfShadow)" />
                <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.2)" />
                <polygon points="50,90 12,25 88,25" fill="url(#pdfGradDown)" opacity="0.88" />
                <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.12)" />
                <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                <rect x="32" y="44" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
                <rect x="32" y="53" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
              </svg>
              
              <div className="flex flex-col items-start">
                <span className="text-6xl font-black text-gray-900 tracking-tight">
                  SAMIKARAN<span className="text-pink-500">.</span>
                </span>
                <span className="text-2xl font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Olympiad
                </span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mt-4">Primary Logo - For headers, documents, and official use</p>
          </div>
          
          {/* Logo Variants */}
          <div className="grid grid-cols-2 gap-16 mt-8">
            {/* Light Background */}
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">On Light Background</p>
              <div className="flex items-center justify-center gap-4">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <defs>
                    <linearGradient id="pdfGradUp2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="pdfGradDown2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,10 88,75 12,75" fill="url(#pdfGradUp2)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#pdfGradDown2)" opacity="0.88" />
                  <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                  <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                </svg>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-black text-gray-900">SAMIKARAN<span className="text-pink-500">.</span></span>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">Olympiad</span>
                </div>
              </div>
            </div>
            
            {/* Dark Background */}
            <div className="text-center p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl">
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">On Dark Background</p>
              <div className="flex items-center justify-center gap-4">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <defs>
                    <linearGradient id="pdfGradUp3" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="pdfGradDown3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,10 88,75 12,75" fill="url(#pdfGradUp3)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#pdfGradDown3)" opacity="0.88" />
                  <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                  <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                </svg>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-black text-white">SAMIKARAN<span className="text-pink-500">.</span></span>
                  <span className="text-sm font-semibold text-white/70 uppercase tracking-[0.2em]">Olympiad</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2: Icon Only */}
        <div className="min-h-screen flex flex-col items-center justify-center p-12 page-break">
          <h2 className="text-lg font-semibold text-gray-500 mb-12 uppercase tracking-wider">Icon Only - High Definition</h2>
          
          {/* Extra Large Icon */}
          <div className="mb-16">
            <svg viewBox="0 0 100 100" width="400" height="400" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="pdfIconGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="50%" stopColor="#C026D3" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="pdfIconGradDown" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
                <filter id="pdfIconShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#9333EA" floodOpacity="0.35"/>
                </filter>
              </defs>
              <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(4, 5)" />
              <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(4, 5)" />
              <polygon points="50,10 88,75 12,75" fill="url(#pdfIconGradUp)" filter="url(#pdfIconShadow)" />
              <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.2)" />
              <polygon points="50,90 12,25 88,25" fill="url(#pdfIconGradDown)" opacity="0.88" />
              <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.12)" />
              <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
              <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
              <rect x="32" y="44" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
              <rect x="32" y="53" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
            </svg>
          </div>
          
          <p className="text-gray-400 text-sm mb-8">Hexagram Icon - For app icons, favicons, and standalone use</p>
          
          {/* Size Variants */}
          <div className="flex items-end gap-8 mt-8">
            {[120, 80, 48, 32, 24].map((size) => (
              <div key={size} className="text-center">
                <svg viewBox="0 0 100 100" width={size} height={size}>
                  <defs>
                    <linearGradient id={`pdfSize${size}Up`} x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id={`pdfSize${size}Down`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,10 88,75 12,75" fill={`url(#pdfSize${size}Up)`} />
                  <polygon points="50,90 12,25 88,25" fill={`url(#pdfSize${size}Down)`} opacity="0.88" />
                  <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                  <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                </svg>
                <p className="text-xs text-gray-400 mt-2">{size}px</p>
              </div>
            ))}
          </div>
        </div>

        {/* Page 3: Visual Equation */}
        <div className="min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900">
          <h2 className="text-lg font-semibold text-white/60 mb-16 uppercase tracking-wider">The Equation of Excellence</h2>
          
          <div className="flex items-center gap-8 mb-12">
            {/* Aspiration */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
                <svg viewBox="0 0 100 100" width="60" height="60">
                  <polygon points="50,15 85,75 15,75" fill="white" />
                </svg>
              </div>
              <p className="text-white/80 font-semibold mt-4 text-lg">Aspiration</p>
            </div>
            
            {/* Plus */}
            <span className="text-5xl font-light text-white/60">+</span>
            
            {/* Foundation */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-500/30">
                <svg viewBox="0 0 100 100" width="60" height="60">
                  <polygon points="50,85 15,25 85,25" fill="white" />
                </svg>
              </div>
              <p className="text-white/80 font-semibold mt-4 text-lg">Foundation</p>
            </div>
            
            {/* Equals */}
            <span className="text-5xl font-light text-white/60">=</span>
            
            {/* Excellence */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <svg viewBox="0 0 100 100" width="70" height="70">
                  <defs>
                    <linearGradient id="pdfEqGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,10 88,75 12,75" fill="white" opacity="0.95" />
                  <polygon points="50,90 12,25 88,25" fill="white" opacity="0.7" />
                </svg>
              </div>
              <p className="text-white/80 font-semibold mt-4 text-lg">Excellence</p>
            </div>
          </div>
          
          <p className="text-xl text-white/70 text-center max-w-2xl mt-8 leading-relaxed">
            When students combine their <span className="text-violet-300 font-semibold">ambition to grow</span> with a{" "}
            <span className="text-pink-300 font-semibold">solid knowledge foundation</span>, they achieve{" "}
            <span className="text-white font-bold">true excellence</span>.
          </p>
          
          <div className="mt-16 text-center">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-2">SAMIKARAN Olympiad</p>
            <p className="text-white/60 text-lg font-light italic">The Equation of Excellence</p>
            <p className="text-white/40 text-sm mt-4">Est. 2026 | Trusted Worldwide</p>
          </div>
        </div>

        {/* Page 4: Color Palette */}
        <div className="min-h-screen flex flex-col items-center justify-center p-12">
          <h2 className="text-lg font-semibold text-gray-500 mb-12 uppercase tracking-wider">Brand Color Palette</h2>
          
          <div className="grid grid-cols-4 gap-8 mb-12">
            {[
              { name: "Violet Primary", hex: "#8B5CF6", rgb: "139, 92, 246" },
              { name: "Purple", hex: "#9333EA", rgb: "147, 51, 234" },
              { name: "Fuchsia", hex: "#D946EF", rgb: "217, 70, 239" },
              { name: "Pink", hex: "#EC4899", rgb: "236, 72, 153" },
            ].map((color) => (
              <div key={color.hex} className="text-center">
                <div 
                  className="w-28 h-28 rounded-2xl shadow-lg mb-4"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="font-semibold text-gray-800 text-sm">{color.name}</p>
                <p className="text-gray-500 text-xs font-mono">{color.hex}</p>
                <p className="text-gray-400 text-xs font-mono">RGB({color.rgb})</p>
              </div>
            ))}
          </div>
          
          {/* Gradient */}
          <div className="text-center mt-8">
            <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Brand Gradient</p>
            <div className="w-96 h-20 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 shadow-lg" />
            <p className="text-gray-400 text-xs font-mono mt-4">
              linear-gradient(to right, #8B5CF6, #D946EF, #EC4899)
            </p>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-400 text-sm">
              SAMIKARAN Olympiad Brand Assets | Confidential | Est. 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
