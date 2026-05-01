import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Crown, Medal, Star } from "lucide-react";
import QRCode from "react-qr-code";

export const CERTIFICATE_TYPES = [
  { type: "gold",          label: "Gold Award",    icon: Crown,  description: "Top performers — Rank 1-10" },
  { type: "silver",        label: "Silver Award",  icon: Medal,  description: "Excellent performance — Rank 11-50" },
  { type: "bronze",        label: "Bronze Award",  icon: Award,  description: "Good performance — Rank 51-200" },
  { type: "participation", label: "Participation", icon: Star,   description: "Certificate of participation for all students" },
];

interface CertDesign {
  sidebarGrad: string;
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
  dividerColor: string;
  nameColor: string;
  iconFill: string;
  typeLabel: string;
  certTitle: string;
  rankLabel: string;
  logoColorDark: string;
  logoColorLight: string;
  logoGlow: string;
}

export const designs: Record<string, CertDesign> = {
  gold: {
    sidebarGrad: "linear-gradient(180deg, #92400E 0%, #B45309 30%, #D97706 60%, #F59E0B 85%, #B45309 100%)",
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
    dividerColor: "#D97706",
    nameColor: "#3B1A00",
    iconFill: "rgba(255,245,200,0.7)",
    typeLabel: "GOLD AWARD",
    certTitle: "CERTIFICATE OF EXCELLENCE",
    rankLabel: "GOLD",
    logoColorDark:  "#92400E",
    logoColorLight: "#FCD34D",
    logoGlow:       "rgba(245,158,11,0.18)",
  },
  silver: {
    sidebarGrad: "linear-gradient(180deg, #1F2937 0%, #374151 30%, #4B5563 60%, #6B7280 85%, #374151 100%)",
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
    dividerColor: "#9CA3AF",
    nameColor: "#111827",
    iconFill: "rgba(220,225,235,0.65)",
    typeLabel: "SILVER AWARD",
    certTitle: "CERTIFICATE OF EXCELLENCE",
    rankLabel: "SILVER",
    logoColorDark:  "#374151",
    logoColorLight: "#D1D5DB",
    logoGlow:       "rgba(156,163,175,0.2)",
  },
  bronze: {
    sidebarGrad: "linear-gradient(180deg, #431407 0%, #7C2D12 30%, #9A3412 60%, #C2410C 85%, #7C2D12 100%)",
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
    dividerColor: "#C2410C",
    nameColor: "#1C0900",
    iconFill: "rgba(255,235,200,0.65)",
    typeLabel: "BRONZE AWARD",
    certTitle: "CERTIFICATE OF ACHIEVEMENT",
    rankLabel: "BRONZE",
    logoColorDark:  "#9A3412",
    logoColorLight: "#FB923C",
    logoGlow:       "rgba(234,88,12,0.18)",
  },
  participation: {
    sidebarGrad: "linear-gradient(180deg, #2E1065 0%, #4C1D95 30%, #6D28D9 60%, #7C3AED 85%, #4C1D95 100%)",
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
    dividerColor: "#7C3AED",
    nameColor: "#1A0050",
    iconFill: "rgba(220,210,255,0.65)",
    typeLabel: "PARTICIPATION",
    certTitle: "CERTIFICATE OF PARTICIPATION",
    rankLabel: "PARTICIPATION",
    logoColorDark:  "#5B21B6",
    logoColorLight: "#A78BFA",
    logoGlow:       "rgba(139,92,246,0.2)",
  },
};

function SamikaranLogoMark({
  colorDark,
  colorLight,
  glowColor = "transparent",
  size = "100%",
}: {
  colorDark: string;
  colorLight: string;
  glowColor?: string;
  size?: string;
}) {
  const id = colorDark.replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={glowColor} stopOpacity="1" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glow ring */}
      <circle cx="55" cy="55" r="48" fill={`url(#glow-${id})`} />
      {/* Upward triangle — dark tone */}
      <polygon points="55,10 95,78 15,78" fill={colorDark} />
      <polygon points="55,10 73,44 37,44" fill="rgba(255,255,255,0.15)" />
      {/* Downward triangle — light tone */}
      <polygon points="55,100 15,32 95,32" fill={colorLight} opacity="0.90" />
      <polygon points="55,100 37,66 73,66" fill="rgba(255,255,255,0.10)" />
      {/* Equals bars — white */}
      <rect x="34" y="47" width="42" height="6.5" rx="3.25" fill="white" opacity="0.95" />
      <rect x="34" y="56.5" width="42" height="6.5" rx="3.25" fill="white" opacity="0.95" />
    </svg>
  );
}

const SIDEBAR_ICONS = [
  /* book */      <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  /* trophy */    <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  /* star */      <svg key="2" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  /* globe */     <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  /* grad cap */  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  /* atom */      <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
  /* medal */     <svg key="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="5"/><path d="m8.21 13.89-2.83-7.07A2 2 0 0 1 7.25 4h9.5a2 2 0 0 1 1.87 2.82l-2.83 7.07"/></svg>,
  /* users */     <svg key="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  /* pencil */    <svg key="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  /* award */     <svg key="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  /* bulb */      <svg key="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  /* target */    <svg key="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
];

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

export interface CertStudentData {
  studentName: string;
  schoolName: string;
  olympiadName: string;
  certNumber: string;
  indexNumber: string;
  grade: string;
  rank: string;
  percentage: string;
  date: string;
}

export function FullCertificatePreview({
  type,
  signatories,
  studentData,
}: {
  type: string;
  signatories?: { s1Name: string; s1Title: string; s2Name: string; s2Title: string };
  studentData?: CertStudentData;
}) {
  const design = designs[type] || designs.gold;
  const year = new Date().getFullYear().toString();

  const sample: CertStudentData = studentData ?? {
    studentName: "NIPUN SAHA",
    schoolName: "DHIRUBHAI AMBANI INTERNATIONAL SCHOOL",
    olympiadName: "NATIONAL JUNIOR SCIENCE OLYMPIAD 2025",
    certNumber: "091251000968",
    indexNumber: "A000968",
    grade: "Grade 9",
    rank: "3",
    percentage: "94.5",
    date: "15th January 2025",
  };

  return (
    <div
      className="relative overflow-hidden flex"
      style={{
        background: design.mainBg,
        width: "100%",
        aspectRatio: "1.414 / 1",
        maxWidth: "900px",
        margin: "0 auto",
        boxShadow: "0 16px 48px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)",
        borderRadius: "2px",
      }}
    >
      {/* ─── LEFT SIDEBAR ─── */}
      <div
        className="relative flex-shrink-0 flex flex-col items-center justify-between py-[3%] px-[1%]"
        style={{
          width: "13%",
          background: design.sidebarGrad,
          boxShadow: "inset -4px 0 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Top triangle */}
        <div className="w-full flex justify-center mb-1">
          <svg viewBox="0 0 40 20" style={{ width: "70%", fill: design.iconFill }}>
            <polygon points="20,2 38,18 2,18" />
          </svg>
        </div>

        {/* Icon grid */}
        <div
          className="grid grid-cols-2 gap-[6%] px-[8%] flex-1 content-center w-full"
          style={{ color: design.iconFill }}
        >
          {SIDEBAR_ICONS.map((icon, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{
                width: "clamp(12px, 2vw, 22px)",
                height: "clamp(12px, 2vw, 22px)",
                opacity: 0.75 + (i % 3) * 0.08,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Vertical brand text */}
        <div
          className="font-bold tracking-widest text-center mt-2"
          style={{
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
            color: design.iconFill,
            fontSize: "clamp(4px, 0.65vw, 8px)",
            letterSpacing: "0.3em",
            opacity: 0.85,
          }}
        >
          SAMIKARAN OLYMPIAD
        </div>

        {/* Bottom triangle */}
        <div className="w-full flex justify-center mt-1">
          <svg viewBox="0 0 40 20" style={{ width: "70%", fill: design.iconFill }}>
            <polygon points="2,2 38,2 20,18" />
          </svg>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative flex flex-col flex-1 overflow-hidden">
        {/* Sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{ background: "linear-gradient(150deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 25%, transparent 55%)" }}
        />

        {/* Outer border */}
        <div
          className="absolute pointer-events-none z-[5]"
          style={{ inset: "clamp(6px,1.2%,12px)", border: `2px solid ${design.borderColor}`, opacity: 0.9 }}
        />
        {/* Inner border */}
        <div
          className="absolute pointer-events-none z-[5]"
          style={{ inset: "clamp(10px,2%,18px)", border: `1px solid ${design.borderColorLight}`, opacity: 0.55 }}
        />

        {/* Corner flourishes */}
        {[
          { top: "clamp(6px,1.2%,12px)", left: "clamp(6px,1.2%,12px)", rotate: 0 },
          { top: "clamp(6px,1.2%,12px)", right: "clamp(6px,1.2%,12px)", rotate: 90 },
          { bottom: "clamp(6px,1.2%,12px)", right: "clamp(6px,1.2%,12px)", rotate: 180 },
          { bottom: "clamp(6px,1.2%,12px)", left: "clamp(6px,1.2%,12px)", rotate: 270 },
        ].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none z-[6]" style={{ ...(pos as object), width: "clamp(18px,2.8%,28px)", height: "clamp(18px,2.8%,28px)" }}>
            <svg viewBox="0 0 28 28" width="100%" height="100%" style={{ transform: `rotate(${pos.rotate}deg)` }}>
              <path d="M2 26 L2 2 L26 2" fill="none" stroke={design.borderColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M6 20 L6 6 L20 6" fill="none" stroke={design.borderColorLight} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            </svg>
          </div>
        ))}

        {/* Year Seal */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center"
          style={{
            top: "clamp(10px,2%,20px)",
            right: "clamp(10px,2%,20px)",
            width: "clamp(52px, 7vw, 82px)",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background: design.sealBg,
            border: `3px solid ${design.sealRing}`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.25), 0 0 0 5px ${design.sealRing}30`,
          }}
        >
          <span style={{ color: design.sealText, fontSize: "clamp(3.5px, 0.52vw, 6px)", letterSpacing: "0.1em", fontWeight: 700, lineHeight: 1.1 }}>SAMIKARAN</span>
          <span style={{ color: design.sealText, fontSize: "clamp(3px, 0.45vw, 5.5px)", letterSpacing: "0.14em", fontWeight: 600, opacity: 0.9, lineHeight: 1.1 }}>OLYMPIAD</span>
          <span style={{ color: design.sealText, fontSize: "clamp(9px, 1.45vw, 16px)", fontWeight: 900, lineHeight: 1.1 }}>{year}</span>
          <span style={{ color: design.sealText, fontSize: design.rankLabel.length > 6 ? "clamp(2.5px, 0.4vw, 5px)" : "clamp(3px, 0.5vw, 6px)", letterSpacing: design.rankLabel.length > 6 ? "0.04em" : "0.12em", fontWeight: 800, opacity: 0.95, textAlign: "center", lineHeight: 1.2 }}>{design.rankLabel}</span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-[5%] py-[3%]">
          {/* Header */}
          <div className="flex justify-between items-start mb-[1.5%]" style={{ fontSize: "clamp(5px, 0.75vw, 9px)", color: design.subtleText }}>
            <div>
              <span className="font-semibold">Index No.</span>
              <span className="font-bold ml-1">{sample.indexNumber}</span>
              <span className="mx-1 opacity-40">·</span>
              <span className="font-semibold">Cert.</span>
              <span className="font-bold ml-1">{sample.certNumber}</span>
            </div>
            <div style={{ marginRight: "clamp(56px, 10%, 90px)" }}>
              <span className="font-semibold">India</span>
            </div>
          </div>

          {/* Org name with logo */}
          <div className="flex items-center justify-center" style={{ gap: "clamp(5px, 1%, 12px)" }}>
            {/* Logo mark */}
            <SamikaranLogoMark
              colorDark={design.logoColorDark}
              colorLight={design.logoColorLight}
              glowColor={design.logoGlow}
              size="clamp(30px, 4.8vw, 56px)"
            />
            {/* Text — tight block, logo center aligns with SAMIKARAN baseline */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
              <h2
                className="font-black uppercase"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(12px, 2.2vw, 26px)",
                  color: design.titleColor,
                  letterSpacing: "0.3em",
                  lineHeight: 1,
                  margin: 0,
                  padding: 0,
                }}
              >
                SAMIKARAN
              </h2>
              <p
                className="font-semibold uppercase"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(5.5px, 0.85vw, 10px)",
                  color: design.subtleText,
                  letterSpacing: "0.4em",
                  lineHeight: 1,
                  marginTop: "clamp(2px, 0.3vw, 4px)",
                  padding: 0,
                }}
              >
                OLYMPIAD
              </p>
            </div>
          </div>

          <DecorativeDivider color={design.dividerColor} accent={design.accentColor} />

          {/* Certificate title */}
          <div className="text-center mt-[0.5%]">
            <h1
              className="font-black uppercase"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(10px, 1.7vw, 20px)",
                color: design.titleColor,
                letterSpacing: "0.2em",
                textShadow: `0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.1)`,
              }}
            >
              {design.certTitle}
            </h1>
          </div>

          {/* Certify intro */}
          <p
            className="text-center italic mt-[1.5%]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(6px, 1vw, 12px)",
              color: design.bodyText,
            }}
          >
            This is to certify with honour that
          </p>

          {/* Student name */}
          <div className="text-center mt-[0.5%] mb-[0.5%]">
            <h3
              className="font-black"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(15px, 3.4vw, 38px)",
                color: design.nameColor,
                textShadow: `0 2px 6px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.5)`,
                lineHeight: 1.05,
              }}
            >
              {sample.studentName}
            </h3>
          </div>

          {/* School */}
          <p
            className="text-center font-semibold"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(8px, 1.35vw, 16px)",
              color: design.bodyText,
              letterSpacing: "0.03em",
            }}
          >
            {sample.schoolName}
          </p>

          {/* Achievement */}
          <p
            className="text-center mt-[1.5%]"
            style={{
              fontSize: "clamp(6px, 1vw, 12px)",
              color: design.bodyText,
              lineHeight: 1.5,
            }}
          >
            for outstanding performance in <span className="font-bold">{sample.grade}</span>,&nbsp;
            <span className="font-bold">{sample.olympiadName}</span>
            {" — "}securing <span className="font-bold">Rank {sample.rank}</span> with <span className="font-bold">{sample.percentage}%</span>
          </p>

          <p className="text-center mt-[0.8%]" style={{ fontSize: "clamp(5px, 0.8vw, 10px)", color: design.subtleText }}>
            Date of Examination: <span className="font-semibold">{sample.date}</span>
          </p>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom */}
          <div className="flex items-end justify-between gap-[2%]">
            {/* QR */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="bg-white rounded"
                style={{
                  padding: "clamp(2px,0.5%,5px)",
                  width: "clamp(38px, 6.5vw, 62px)",
                  height: "clamp(38px, 6.5vw, 62px)",
                  boxShadow: `0 2px 8px rgba(0,0,0,0.12), 0 0 0 2px ${design.borderColorLight}`,
                }}
              >
                <QRCode
                  value={`${typeof window !== "undefined" ? window.location.origin : "https://samikaranolympiad.com"}/verify?cert=${sample.certNumber}`}
                  size={80}
                  level="M"
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
              <p className="mt-0.5 text-center" style={{ color: design.subtleText, fontSize: "clamp(4px, 0.6vw, 7px)" }}>Scan for report</p>
            </div>

            {/* Sig 1 */}
            <div className="text-center flex-1 min-w-0">
              <div
                className="mx-auto mb-[0.5%] flex items-end justify-center"
                style={{
                  borderBottom: `1.5px solid ${design.borderColor}`,
                  height: "clamp(20px, 3.5vw, 36px)",
                  width: "60%",
                  opacity: 0.8,
                }}
              >
                <span className="italic" style={{ fontFamily: "cursive", color: design.subtleText, fontSize: "clamp(10px, 1.8vw, 20px)", opacity: 0.6 }}>~</span>
              </div>
              <p className="font-bold" style={{ color: design.nameColor, fontSize: "clamp(6px, 1vw, 12px)" }}>
                {signatories?.s1Name || "Authorized Signatory"}
              </p>
              <p style={{ color: design.subtleText, fontSize: "clamp(4px, 0.7vw, 9px)" }}>
                {signatories?.s1Title || "Founder, Samikaran Olympiad"}
              </p>
            </div>

            {/* Sig 2 */}
            <div className="text-center flex-1 min-w-0">
              <div
                className="mx-auto mb-[0.5%] flex items-end justify-center"
                style={{
                  borderBottom: `1.5px solid ${design.borderColor}`,
                  height: "clamp(20px, 3.5vw, 36px)",
                  width: "60%",
                  opacity: 0.8,
                }}
              >
                <span className="italic" style={{ fontFamily: "cursive", color: design.subtleText, fontSize: "clamp(10px, 1.8vw, 20px)", opacity: 0.6 }}>~</span>
              </div>
              <p className="font-bold" style={{ color: design.nameColor, fontSize: "clamp(6px, 1vw, 12px)" }}>
                {signatories?.s2Name || "Authorized Signatory"}
              </p>
              <p style={{ color: design.subtleText, fontSize: "clamp(4px, 0.7vw, 9px)" }}>
                {signatories?.s2Title || "Controller of Examinations (CoE)"}
              </p>
            </div>

            {/* Validity */}
            <div className="text-right flex-shrink-0" style={{ maxWidth: "clamp(60px, 12%, 110px)" }}>
              <p className="italic leading-relaxed" style={{ color: design.subtleText, fontSize: "clamp(4px, 0.6vw, 7px)" }}>
                This e-certificate is valid only for the year of competition. Awardees should use physical certificate subsequently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificatePreviewSection() {
  const [activeType, setActiveType] = useState("gold");
  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const signatories = {
    s1Name: siteSettings?.certificate_signatory_1_name || "Authorized Signatory",
    s1Title: siteSettings?.certificate_signatory_1_title || "Founder, Samikaran Olympiad",
    s2Name: siteSettings?.certificate_signatory_2_name || "Authorized Signatory",
    s2Title: siteSettings?.certificate_signatory_2_title || "Controller of Examinations (CoE)",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Certificate Design Previews
          </CardTitle>
          <CardDescription>
            Reference previews of all certificate types. Design changes are applied to the application code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              {CERTIFICATE_TYPES.map((cert) => {
                const Icon = cert.icon;
                return (
                  <TabsTrigger key={cert.type} value={cert.type} className="text-xs">
                    <Icon className="w-3 h-3 mr-1" />
                    {cert.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {CERTIFICATE_TYPES.map((cert) => (
              <TabsContent key={cert.type} value={cert.type}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <cert.icon className="w-5 h-5" />
                        {cert.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                    </div>
                    <Badge variant="outline">Hardcoded Design</Badge>
                  </div>

                  <FullCertificatePreview type={cert.type} signatories={signatories} />

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Signatories:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{signatories.s1Name}</p>
                        <p>{signatories.s1Title}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{signatories.s2Name}</p>
                        <p>{signatories.s2Title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
