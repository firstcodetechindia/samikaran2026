import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "react-qr-code";

const printStyles = `
  @page {
    size: A4 landscape;
    margin: 0;
  }
  @media print {
    html, body {
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print-hide { display: none !important; }
    .print-container {
      width: 297mm !important;
      height: 210mm !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      page-break-after: avoid;
      page-break-before: avoid;
    }
    .chat-widget,
    [class*="chat-widget"],
    [id*="chat-widget"],
    [class*="ChatWidget"],
    .fixed.bottom-4.right-4,
    .fixed.bottom-6.right-6,
    div[style*="position: fixed"][style*="bottom"],
    iframe[src*="chat"],
    button[aria-label*="chat" i],
    button[aria-label*="Chat" i] {
      display: none !important;
      visibility: hidden !important;
    }
  }
`;

interface CertificateData {
  certificateNumber: string;
  indexNumber: string;
  verificationCode: string;
  studentName: string;
  schoolName: string;
  grade: string;
  olympiadName: string;
  examDate: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: string;
  awardType: string;
  issuedAt: string;
  verificationStatus: string;
}

interface CertDesign {
  sidebarGrad: string;
  sidebarAccent: string;
  mainBg: string;
  borderColor: string;
  borderColorLight: string;
  accentColor: string;
  titleColor: string;
  bodyText: string;
  subtleText: string;
  sealBg: string;
  sealRing: string;
  sealText: string;
  bannerBg: string;
  bannerText: string;
  dividerColor: string;
  nameColor: string;
  iconFill: string;
  typeLabel: string;
  certTitle: string;
  rankLabel: string;
}

const designs: Record<string, CertDesign> = {
  gold: {
    sidebarGrad: "linear-gradient(180deg, #92400E 0%, #B45309 30%, #D97706 60%, #F59E0B 85%, #B45309 100%)",
    sidebarAccent: "rgba(255,215,0,0.25)",
    mainBg: "linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 40%, #FDE68A 70%, #FEF3C7 100%)",
    borderColor: "#D97706",
    borderColorLight: "#FDE68A",
    accentColor: "#F59E0B",
    titleColor: "#78350F",
    bodyText: "#92400E",
    subtleText: "#B45309",
    sealBg: "radial-gradient(circle at 35% 30%, #FBBF24, #D97706 50%, #92400E)",
    sealRing: "#FCD34D",
    sealText: "#FFFBEB",
    bannerBg: "linear-gradient(90deg, transparent, #F59E0B55, #D97706AA, #F59E0B55, transparent)",
    bannerText: "#78350F",
    dividerColor: "#D97706",
    nameColor: "#3B1A00",
    iconFill: "rgba(255,245,200,0.7)",
    typeLabel: "GOLD AWARD",
    certTitle: "CERTIFICATE OF EXCELLENCE",
    rankLabel: "Gold Award",
  },
  silver: {
    sidebarGrad: "linear-gradient(180deg, #1F2937 0%, #374151 30%, #4B5563 60%, #6B7280 85%, #374151 100%)",
    sidebarAccent: "rgba(200,210,220,0.2)",
    mainBg: "linear-gradient(160deg, #F9FAFB 0%, #F3F4F6 40%, #E5E7EB 70%, #F3F4F6 100%)",
    borderColor: "#6B7280",
    borderColorLight: "#D1D5DB",
    accentColor: "#9CA3AF",
    titleColor: "#111827",
    bodyText: "#374151",
    subtleText: "#6B7280",
    sealBg: "radial-gradient(circle at 35% 30%, #D1D5DB, #9CA3AF 50%, #4B5563)",
    sealRing: "#E5E7EB",
    sealText: "#F9FAFB",
    bannerBg: "linear-gradient(90deg, transparent, #9CA3AF55, #6B7280AA, #9CA3AF55, transparent)",
    bannerText: "#1F2937",
    dividerColor: "#9CA3AF",
    nameColor: "#111827",
    iconFill: "rgba(220,225,235,0.65)",
    typeLabel: "SILVER AWARD",
    certTitle: "CERTIFICATE OF EXCELLENCE",
    rankLabel: "Silver Award",
  },
  bronze: {
    sidebarGrad: "linear-gradient(180deg, #431407 0%, #7C2D12 30%, #9A3412 60%, #C2410C 85%, #7C2D12 100%)",
    sidebarAccent: "rgba(205,127,50,0.25)",
    mainBg: "linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 40%, #FED7AA 70%, #FFEDD5 100%)",
    borderColor: "#C2410C",
    borderColorLight: "#FED7AA",
    accentColor: "#EA580C",
    titleColor: "#431407",
    bodyText: "#7C2D12",
    subtleText: "#9A3412",
    sealBg: "radial-gradient(circle at 35% 30%, #FB923C, #C2410C 50%, #431407)",
    sealRing: "#FED7AA",
    sealText: "#FFF7ED",
    bannerBg: "linear-gradient(90deg, transparent, #EA580C55, #C2410CAA, #EA580C55, transparent)",
    bannerText: "#431407",
    dividerColor: "#C2410C",
    nameColor: "#1C0900",
    iconFill: "rgba(255,235,200,0.65)",
    typeLabel: "BRONZE AWARD",
    certTitle: "CERTIFICATE OF ACHIEVEMENT",
    rankLabel: "Bronze Award",
  },
  participation: {
    sidebarGrad: "linear-gradient(180deg, #2E1065 0%, #4C1D95 30%, #6D28D9 60%, #7C3AED 85%, #4C1D95 100%)",
    sidebarAccent: "rgba(167,139,250,0.2)",
    mainBg: "linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 40%, #DDD6FE 70%, #EDE9FE 100%)",
    borderColor: "#7C3AED",
    borderColorLight: "#DDD6FE",
    accentColor: "#8B5CF6",
    titleColor: "#2E1065",
    bodyText: "#4C1D95",
    subtleText: "#6D28D9",
    sealBg: "radial-gradient(circle at 35% 30%, #A78BFA, #7C3AED 50%, #4C1D95)",
    sealRing: "#C4B5FD",
    sealText: "#F5F3FF",
    bannerBg: "linear-gradient(90deg, transparent, #8B5CF655, #7C3AEDAA, #8B5CF655, transparent)",
    bannerText: "#2E1065",
    dividerColor: "#7C3AED",
    nameColor: "#1A0050",
    iconFill: "rgba(220,210,255,0.65)",
    typeLabel: "PARTICIPATION",
    certTitle: "CERTIFICATE OF PARTICIPATION",
    rankLabel: "Participation",
  },
};

function SidebarIcons({ fill }: { fill: string }) {
  const icons = [
    /* Book */ <svg key="book" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    /* Trophy */ <svg key="trophy" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>,
    /* Star */ <svg key="star" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="1.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    /* Globe */ <svg key="globe" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    /* GradCap */ <svg key="grad" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    /* Atom */ <svg key="atom" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
    /* Medal */ <svg key="medal" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M9 2l-1 4"/><path d="M15 2l1 4"/><path d="M9.5 6.5L12 8l2.5-1.5"/></svg>,
    /* Users */ <svg key="users" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    /* Pencil */ <svg key="pencil" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    /* Award */ <svg key="award" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
    /* Lightbulb */ <svg key="bulb" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
    /* Flask */ <svg key="flask" viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v13l4 4H5l4-4V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>,
  ];
  return <>{icons}</>;
}

function DecorativeDivider({ color, accent }: { color: string; accent: string }) {
  return (
    <div className="flex items-center gap-1 w-full max-w-xs mx-auto my-1">
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ background: color }} />
      <div className="w-2 h-2 rotate-45 border" style={{ borderColor: accent }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ background: color }} />
      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

function YearSeal({ year, label, design }: { year: string; label: string; design: CertDesign }) {
  return (
    <div
      className="absolute z-20 flex flex-col items-center justify-center"
      style={{
        top: "18px", right: "22px",
        width: "clamp(64px, 8vw, 88px)",
        height: "clamp(64px, 8vw, 88px)",
        borderRadius: "50%",
        background: design.sealBg,
        border: `3px solid ${design.sealRing}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.25), 0 0 0 6px ${design.sealRing}30`,
      }}
    >
      <span style={{ color: design.sealText, fontSize: "clamp(5px, 0.75vw, 9px)", letterSpacing: "0.15em", fontWeight: 700 }}>SAMIKARAN</span>
      <span style={{ color: design.sealText, fontSize: "clamp(12px, 1.8vw, 20px)", fontWeight: 900, lineHeight: 1.1 }}>{year}</span>
      <span style={{ color: design.sealText, fontSize: "clamp(4px, 0.6vw, 8px)", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.9 }}>{label}</span>
    </div>
  );
}

interface CertificateCanvasProps {
  design: CertDesign;
  data: {
    studentName: string;
    schoolName: string;
    grade: string;
    olympiadName: string;
    examDate: string;
    rank: string;
    score?: number;
    totalMarks?: number;
    percentage?: number;
    certificateNumber: string;
    indexNumber: string;
    verificationCode: string;
  };
  signatoryNames: {
    signatory1Name: string;
    signatory1Title: string;
    signatory2Name: string;
    signatory2Title: string;
  };
  qrOrigin: string;
}

function CertificateCanvas({ design, data, signatoryNames, qrOrigin }: CertificateCanvasProps) {
  const year = data.examDate ? new Date(data.examDate).getFullYear().toString() : new Date().getFullYear().toString();
  const formattedDate = data.examDate
    ? new Date(data.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const sidebarIconFill = design.iconFill;

  return (
    <div className="print-container w-full max-w-4xl relative overflow-hidden flex" style={{ aspectRatio: "1.414 / 1", background: design.mainBg }}>
      {/* ─── LEFT SIDEBAR ─── */}
      <div
        className="relative flex-shrink-0 flex flex-col items-center justify-between py-4 px-2"
        style={{
          width: "clamp(80px, 13%, 120px)",
          background: design.sidebarGrad,
          boxShadow: "inset -4px 0 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Corner ornament top */}
        <div className="w-full flex justify-center mb-2">
          <svg viewBox="0 0 40 20" style={{ width: "70%", fill: sidebarIconFill }}>
            <polygon points="20,2 38,18 2,18" />
          </svg>
        </div>

        {/* Icon grid */}
        <div className="grid grid-cols-2 gap-2 px-2 flex-1 content-center">
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <div key={i} className="flex items-center justify-center" style={{ width: "clamp(16px,2.5vw,28px)", height: "clamp(16px,2.5vw,28px)" }}>
              <div style={{ width: "100%", height: "100%", opacity: 0.75 + (i % 3) * 0.08 }}>
                {[
                  /* book */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
                  /* trophy */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
                  /* star */<svg viewBox="0 0 24 24" fill={sidebarIconFill} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                  /* globe */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                  /* grad */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
                  /* atom */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
                  /* medal */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="5"/><path d="m8.21 13.89-2.83-7.07A2 2 0 0 1 7.25 4h9.5a2 2 0 0 1 1.87 2.82l-2.83 7.07"/><path d="M12 10v5"/><path d="m9 12 3-2 3 2"/></svg>,
                  /* users */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  /* pencil */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
                  /* award */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
                  /* bulb */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
                  /* target */<svg viewBox="0 0 24 24" fill="none" stroke={sidebarIconFill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
                ][i % 12]}
              </div>
            </div>
          ))}
        </div>

        {/* Vertical brand text */}
        <div
          className="mt-3 text-center font-bold tracking-widest"
          style={{
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
            color: design.iconFill,
            fontSize: "clamp(5px, 0.8vw, 9px)",
            letterSpacing: "0.3em",
            opacity: 0.85,
          }}
        >
          SAMIKARAN OLYMPIAD
        </div>

        {/* Corner ornament bottom */}
        <div className="w-full flex justify-center mt-2">
          <svg viewBox="0 0 40 20" style={{ width: "70%", fill: sidebarIconFill }}>
            <polygon points="2,2 38,2 20,18" />
          </svg>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative flex flex-col flex-1 overflow-hidden">
        {/* Subtle inner sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{ background: "linear-gradient(150deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 25%, transparent 55%)" }}
        />

        {/* Outer border */}
        <div
          className="absolute pointer-events-none z-[5]"
          style={{ inset: "10px", border: `2px solid ${design.borderColor}`, opacity: 0.9 }}
        />
        {/* Inner border */}
        <div
          className="absolute pointer-events-none z-[5]"
          style={{ inset: "15px", border: `1px solid ${design.borderColorLight}`, opacity: 0.6 }}
        />

        {/* Corner flourishes */}
        {[
          { top: 10, left: 10, rotate: 0 },
          { top: 10, right: 10, rotate: 90 },
          { bottom: 10, right: 10, rotate: 180 },
          { bottom: 10, left: 10, rotate: 270 },
        ].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none z-[6]" style={{ ...pos, width: 28, height: 28 }}>
            <svg viewBox="0 0 28 28" width="28" height="28" style={{ transform: `rotate(${pos.rotate}deg)` }}>
              <path d="M2 26 L2 2 L26 2" fill="none" stroke={design.borderColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M6 20 L6 6 L20 6" fill="none" stroke={design.borderColorLight} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            </svg>
          </div>
        ))}

        {/* Year Seal */}
        <YearSeal year={year} label={design.rankLabel.toUpperCase()} design={design} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-[5%] py-[3%]">
          {/* Header row: Index/Cert info */}
          <div className="flex justify-between items-start mb-2" style={{ fontSize: "clamp(6px, 0.85vw, 10px)", color: design.subtleText }}>
            <div>
              <span className="font-semibold">Index No.</span>
              <span className="font-bold ml-1">{data.indexNumber}</span>
              <span className="mx-2 opacity-40">·</span>
              <span className="font-semibold">Cert.</span>
              <span className="font-bold ml-1">{data.certificateNumber}</span>
            </div>
            <div style={{ marginRight: "clamp(70px, 11vw, 100px)" }}>
              <span className="font-semibold">India</span>
            </div>
          </div>

          {/* Organization name */}
          <div className="text-center">
            <h2
              className="font-black tracking-[0.35em] uppercase"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(14px, 2.5vw, 28px)",
                color: design.titleColor,
                letterSpacing: "0.35em",
              }}
            >
              SAMIKARAN
            </h2>
            <p
              className="tracking-[0.55em] font-bold -mt-0.5"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(7px, 1.1vw, 13px)",
                color: design.subtleText,
                letterSpacing: "0.55em",
              }}
            >
              OLYMPIAD
            </p>
          </div>

          {/* Decorative divider */}
          <DecorativeDivider color={design.dividerColor} accent={design.accentColor} />

          {/* Certificate title */}
          <div className="text-center mt-1">
            <h1
              className="font-black tracking-[0.18em] uppercase"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(11px, 1.9vw, 22px)",
                color: design.titleColor,
                letterSpacing: "0.2em",
                textShadow: `0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.12)`,
              }}
            >
              {design.certTitle}
            </h1>
          </div>

          {/* "This is to certify" */}
          <p
            className="text-center italic mt-2"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(7px, 1.1vw, 13px)",
              color: design.bodyText,
              letterSpacing: "0.05em",
            }}
          >
            This is to certify with honour that
          </p>

          {/* Student name */}
          <div className="text-center mt-1 mb-0.5">
            <h3
              className="font-black tracking-wide"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(18px, 3.8vw, 42px)",
                color: design.nameColor,
                textShadow: `0 2px 6px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.5)`,
                lineHeight: 1.05,
              }}
            >
              {data.studentName}
            </h3>
          </div>

          {/* School name */}
          <p
            className="text-center font-semibold"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(9px, 1.5vw, 17px)",
              color: design.bodyText,
              letterSpacing: "0.04em",
            }}
          >
            {data.schoolName}
          </p>

          {/* Achievement text */}
          <p
            className="text-center mt-2"
            style={{
              fontSize: "clamp(7px, 1.1vw, 13px)",
              color: design.bodyText,
              lineHeight: 1.5,
            }}
          >
            for outstanding performance in <span className="font-bold">{data.grade}</span>,&nbsp;
            <span className="font-bold">{data.olympiadName}</span>
            {data.rank && <span>&nbsp;— securing <span className="font-bold">Rank {data.rank}</span></span>}
            {data.percentage != null && data.percentage > 0 && <span>&nbsp;with <span className="font-bold">{data.percentage.toFixed(1)}%</span></span>}
          </p>

          {/* Date */}
          {formattedDate && (
            <p className="text-center mt-1" style={{ fontSize: "clamp(6px, 0.9vw, 11px)", color: design.subtleText, letterSpacing: "0.05em" }}>
              Date of Examination: <span className="font-semibold">{formattedDate}</span>
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom row */}
          <div className="flex items-end justify-between gap-3">
            {/* QR Code */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="bg-white rounded"
                style={{
                  padding: "clamp(3px, 0.6%, 6px)",
                  width: "clamp(44px, 7vw, 70px)",
                  height: "clamp(44px, 7vw, 70px)",
                  boxShadow: `0 2px 8px rgba(0,0,0,0.12), 0 0 0 2px ${design.borderColorLight}`,
                }}
              >
                <QRCode
                  value={`${qrOrigin}/verify?cert=${data.verificationCode || data.certificateNumber}`}
                  size={80}
                  level="M"
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
              <p className="mt-0.5 text-center" style={{ color: design.subtleText, fontSize: "clamp(4px, 0.65vw, 8px)" }}>
                Scan for report
              </p>
            </div>

            {/* Signature 1 */}
            <div className="text-center flex-1 min-w-0">
              <div
                className="mx-auto mb-1 flex items-end justify-center"
                style={{
                  borderBottom: `1.5px solid ${design.borderColor}`,
                  height: "clamp(24px, 4vw, 40px)",
                  width: "60%",
                  opacity: 0.8
                }}
              >
                <span
                  className="italic"
                  style={{
                    fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                    color: design.subtleText,
                    fontSize: "clamp(12px, 2vw, 22px)",
                    opacity: 0.6,
                  }}
                >
                  ~
                </span>
              </div>
              <p className="font-bold" style={{ color: design.nameColor, fontSize: "clamp(7px, 1.1vw, 13px)" }}>
                {signatoryNames.signatory1Name}
              </p>
              <p style={{ color: design.subtleText, fontSize: "clamp(5px, 0.8vw, 10px)" }}>
                {signatoryNames.signatory1Title}
              </p>
            </div>

            {/* Signature 2 */}
            <div className="text-center flex-1 min-w-0">
              <div
                className="mx-auto mb-1 flex items-end justify-center"
                style={{
                  borderBottom: `1.5px solid ${design.borderColor}`,
                  height: "clamp(24px, 4vw, 40px)",
                  width: "60%",
                  opacity: 0.8
                }}
              >
                <span
                  className="italic"
                  style={{
                    fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                    color: design.subtleText,
                    fontSize: "clamp(12px, 2vw, 22px)",
                    opacity: 0.6,
                  }}
                >
                  ~
                </span>
              </div>
              <p className="font-bold" style={{ color: design.nameColor, fontSize: "clamp(7px, 1.1vw, 13px)" }}>
                {signatoryNames.signatory2Name}
              </p>
              <p style={{ color: design.subtleText, fontSize: "clamp(5px, 0.8vw, 10px)" }}>
                {signatoryNames.signatory2Title}
              </p>
            </div>

            {/* Validity note */}
            <div className="text-right flex-shrink-0" style={{ maxWidth: "clamp(80px, 13vw, 120px)" }}>
              <p className="italic leading-relaxed" style={{ color: design.subtleText, fontSize: "clamp(4px, 0.65vw, 8px)" }}>
                This e-certificate is valid only for the year of competition. Awardees should use physical certificate subsequently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificateDownload() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const certCode = searchParams.get("cert") || "";
  const autoDownload = searchParams.get("download") === "true";

  const { data: cert, isLoading, error } = useQuery<CertificateData>({
    queryKey: [`/api/certificates/verify/${certCode}`],
    enabled: !!certCode,
  });

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const signatoryNames = {
    signatory1Name: siteSettings?.certificate_signatory_1_name || "Authorized Signatory",
    signatory1Title: siteSettings?.certificate_signatory_1_title || "Founder, Samikaran Olympiad",
    signatory2Name: siteSettings?.certificate_signatory_2_name || "Authorized Signatory",
    signatory2Title: siteSettings?.certificate_signatory_2_title || "Controller of Examinations (CoE)",
  };

  useEffect(() => {
    if (autoDownload && cert && !isLoading) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [autoDownload, cert, isLoading]);

  if (!certCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
            <p className="text-muted-foreground">No certificate code provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Certificate Not Found</h2>
            <p className="text-muted-foreground">
              Unable to find certificate: <strong>{certCode}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const awardType = cert.awardType || "gold";
  const design = designs[awardType] || designs.gold;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4 print:p-0 print:bg-white print:min-h-0">
        <div style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.2)", borderRadius: 2 }}>
          <CertificateCanvas
            design={design}
            data={{
              studentName: cert.studentName,
              schoolName: cert.schoolName,
              grade: cert.grade,
              olympiadName: cert.olympiadName,
              examDate: cert.examDate,
              rank: cert.rank,
              score: cert.score,
              totalMarks: cert.totalMarks,
              percentage: cert.percentage,
              certificateNumber: cert.certificateNumber,
              indexNumber: cert.indexNumber,
              verificationCode: cert.verificationCode,
            }}
            signatoryNames={signatoryNames}
            qrOrigin={window.location.origin}
          />
        </div>
      </div>
    </>
  );
}
