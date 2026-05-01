import sharp from "sharp";
import { mkdir } from "fs/promises";

const W = 1080;
const H = 1920;

await mkdir("attached_assets/generated_images", { recursive: true });

// === SVG building blocks =================================================

const brandGradient = `
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6d28d9"/>
      <stop offset="55%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#d946ef"/>
    </linearGradient>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5b21b6"/>
      <stop offset="50%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fde68a" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="strip" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbcfe8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// Subtle science background pattern (atoms, equations, molecules) at low opacity
function scienceBackdrop() {
  return `
  <g opacity="0.10" stroke="#ffffff" stroke-width="1.6" fill="none" font-family="Georgia, serif" font-size="34" font-style="italic">
    <!-- atoms -->
    <g transform="translate(140,260)">
      <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="none"/>
      <ellipse cx="0" cy="0" rx="55" ry="20"/>
      <ellipse cx="0" cy="0" rx="55" ry="20" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="55" ry="20" transform="rotate(120)"/>
    </g>
    <g transform="translate(940,180)">
      <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="none"/>
      <ellipse cx="0" cy="0" rx="42" ry="16"/>
      <ellipse cx="0" cy="0" rx="42" ry="16" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="42" ry="16" transform="rotate(120)"/>
    </g>
    <g transform="translate(980,1620)">
      <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="none"/>
      <ellipse cx="0" cy="0" rx="60" ry="22"/>
      <ellipse cx="0" cy="0" rx="60" ry="22" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="60" ry="22" transform="rotate(120)"/>
    </g>
    <g transform="translate(120,1700)">
      <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="none"/>
      <ellipse cx="0" cy="0" rx="48" ry="18"/>
      <ellipse cx="0" cy="0" rx="48" ry="18" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="48" ry="18" transform="rotate(120)"/>
    </g>
    <!-- molecule rings -->
    <g transform="translate(880,900)">
      <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20"/>
      <circle cx="0" cy="-40" r="6" fill="#ffffff" stroke="none"/>
      <circle cx="35" cy="-20" r="6" fill="#ffffff" stroke="none"/>
      <circle cx="35" cy="20" r="6" fill="#ffffff" stroke="none"/>
      <circle cx="0" cy="40" r="6" fill="#ffffff" stroke="none"/>
      <circle cx="-35" cy="20" r="6" fill="#ffffff" stroke="none"/>
      <circle cx="-35" cy="-20" r="6" fill="#ffffff" stroke="none"/>
    </g>
    <g transform="translate(180,1100)">
      <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15"/>
    </g>
    <!-- equations -->
    <text x="60" y="520" fill="#ffffff" stroke="none">E = mc²</text>
    <text x="780" y="540" fill="#ffffff" stroke="none">a² + b² = c²</text>
    <text x="80" y="1380" fill="#ffffff" stroke="none">∫ f(x)dx</text>
    <text x="760" y="1380" fill="#ffffff" stroke="none">π · r²</text>
    <text x="420" y="1820" fill="#ffffff" stroke="none">H₂O · CO₂ · O₂</text>
    <!-- waves / sine -->
    <path d="M -20 800 Q 90 740 200 800 T 420 800 T 640 800 T 860 800 T 1080 800"/>
    <path d="M -20 1240 Q 90 1180 200 1240 T 420 1240 T 640 1240 T 860 1240 T 1080 1240"/>
    <!-- grid dots -->
    ${Array.from({length: 18}, (_, r) =>
      Array.from({length: 10}, (_, c) =>
        `<circle cx="${60 + c*108}" cy="${1500 + r*22}" r="1.6" fill="#ffffff" stroke="none"/>`
      ).join("")
    ).join("")}
  </g>
  <circle cx="900" cy="100" r="280" fill="url(#glow1)"/>
  <circle cx="120" cy="1820" r="320" fill="url(#glow2)"/>
  `;
}

// Samikaran logo — hexagram (Star of David) with bold equals sign + wordmark
// cx,cy is the center of the hexagram icon, scale controls the icon size
function samikaranLogo({cx, cy, iconSize, fontSize, layout = "horizontal"}) {
  const r = iconSize / 2;
  // Up triangle vertices
  const up = `${cx},${cy - r} ${cx - r * 0.866},${cy + r * 0.5} ${cx + r * 0.866},${cy + r * 0.5}`;
  // Down triangle vertices
  const down = `${cx},${cy + r} ${cx - r * 0.866},${cy - r * 0.5} ${cx + r * 0.866},${cy - r * 0.5}`;
  // Equals sign in center
  const eqW = iconSize * 0.30;
  const eqH = iconSize * 0.07;
  const eqGap = iconSize * 0.06;

  if (layout === "horizontal") {
    const textX = cx + r + iconSize * 0.32;
    return `
      <g>
        <polygon points="${up}" fill="#ffffff" opacity="1"/>
        <polygon points="${down}" fill="#ffffff" opacity="0.55"/>
        <rect x="${cx - eqW/2}" y="${cy - eqGap - eqH}" width="${eqW}" height="${eqH}" rx="${eqH/2}" fill="#7c3aed"/>
        <rect x="${cx - eqW/2}" y="${cy + eqGap}" width="${eqW}" height="${eqH}" rx="${eqH/2}" fill="#7c3aed"/>
        <text x="${textX}" y="${cy - fontSize*0.05}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="-1">SAMIKARAN<tspan fill="#fbcfe8">.</tspan></text>
        <text x="${textX}" y="${cy + fontSize*0.75}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${fontSize*0.42}" font-weight="500" letter-spacing="${fontSize*0.10}">OLYMPIAD</text>
      </g>`;
  } else {
    // vertical / centered layout
    return `
      <g>
        <polygon points="${up}" fill="#ffffff" opacity="1"/>
        <polygon points="${down}" fill="#ffffff" opacity="0.55"/>
        <rect x="${cx - eqW/2}" y="${cy - eqGap - eqH}" width="${eqW}" height="${eqH}" rx="${eqH/2}" fill="#7c3aed"/>
        <rect x="${cx - eqW/2}" y="${cy + eqGap}" width="${eqW}" height="${eqH}" rx="${eqH/2}" fill="#7c3aed"/>
        <text x="${cx}" y="${cy + r + fontSize*1.15}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="-1">SAMIKARAN<tspan fill="#fbcfe8">.</tspan></text>
        <text x="${cx}" y="${cy + r + fontSize*1.75}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${fontSize*0.42}" font-weight="500" letter-spacing="${fontSize*0.10}">OLYMPIAD</text>
      </g>`;
  }
}

function pill({x, y, w, h, text, fontSize = 26}) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
      <text x="${x + w/2}" y="${y + h/2 + fontSize*0.35}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="1.5">${text}</text>
    </g>`;
}

function statBlock({x, y, w, h, value, label}) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
      <text x="${x + w/2}" y="${y + h*0.55}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="900">${value}</text>
      <text x="${x + w/2}" y="${y + h*0.85}" text-anchor="middle" fill="#fce7f3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="500" letter-spacing="2">${label}</text>
    </g>`;
}

function bottomStrip({label}) {
  return `
    <rect x="0" y="${H - 110}" width="${W}" height="110" fill="url(#strip)"/>
    <text x="${W/2}" y="${H - 50}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="1">${label}</text>
  `;
}

// ============== POSTER 1 — Who We Are =====================================
const poster1 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${brandGradient}
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  ${scienceBackdrop()}

  <!-- Top INTRODUCING label -->
  <g>
    <rect x="${W/2 - 175}" y="160" width="350" height="56" rx="28" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/>
    <text x="${W/2}" y="197" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="6">INTRODUCING</text>
  </g>

  <!-- Centered logo -->
  ${samikaranLogo({cx: W/2, cy: 360, iconSize: 170, fontSize: 78, layout: "vertical"})}

  <!-- Tagline above headline -->
  <text x="${W/2}" y="640" text-anchor="middle" fill="#fbcfe8" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" letter-spacing="3">EST. 2026 · TRUSTED WORLDWIDE</text>

  <!-- Main headline -->
  <text x="${W/2}" y="780" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">Where Minds</text>
  <text x="${W/2}" y="880" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">Compete for</text>
  <text x="${W/2}" y="990" text-anchor="middle" fill="#fef3c7" font-family="Georgia, serif" font-size="104" font-style="italic" font-weight="700">Excellence.</text>

  <!-- Sub headline -->
  <text x="${W/2}" y="1095" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="500">India’s Most Advanced</text>
  <text x="${W/2}" y="1145" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="500">AI-Powered Olympiad Platform</text>

  <!-- Description -->
  <text x="${W/2}" y="1230" text-anchor="middle" fill="#ffffff" opacity="0.92" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400">For Class 1 to 12 · Math · Science · English</text>
  <text x="${W/2}" y="1272" text-anchor="middle" fill="#ffffff" opacity="0.92" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400">Coding · Reasoning · 20+ Subjects</text>

  <!-- Stat blocks -->
  ${statBlock({x: 60,  y: 1360, w: 300, h: 180, value: "1–12",     label: "ALL CLASSES"})}
  ${statBlock({x: 390, y: 1360, w: 300, h: 180, value: "₹5 LAKH*", label: "SCHOLARSHIPS"})}
  ${statBlock({x: 720, y: 1360, w: 300, h: 180, value: "20+",      label: "SUBJECTS"})}

  <!-- CTA pill -->
  <g>
    <rect x="${W/2 - 360}" y="1610" width="720" height="110" rx="55" fill="url(#ctaGrad)"/>
    <text x="${W/2}" y="1680" text-anchor="middle" fill="#7c3aed" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="900" letter-spacing="0.5">www.samikaranolympiad.com</text>
  </g>

  ${bottomStrip({label: "www.samikaranolympiad.com  ·  THE EQUATION OF EXCELLENCE"})}
</svg>`;

// ============== POSTER 2 — Registrations Opening Soon =====================
const poster2 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${brandGradient}
  <rect width="${W}" height="${H}" fill="url(#bgGrad2)"/>
  ${scienceBackdrop()}

  <!-- Top-left logo (horizontal, smaller) -->
  ${samikaranLogo({cx: 130, cy: 170, iconSize: 110, fontSize: 48, layout: "horizontal"})}

  <!-- Status pill top-right -->
  ${pill({x: W - 350, y: 145, w: 300, h: 60, text: "● 2026 SESSION", fontSize: 22})}

  <!-- Eyebrow -->
  <text x="${W/2}" y="430" text-anchor="middle" fill="#fbcfe8" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="8">REGISTRATIONS</text>

  <!-- Big OPENING SOON / OPEN -->
  <text x="${W/2}" y="560" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="120" font-weight="900" letter-spacing="-3">OPENING</text>
  <text x="${W/2}" y="690" text-anchor="middle" fill="#fef3c7" font-family="Georgia, serif" font-style="italic" font-size="138" font-weight="700">Soon.</text>

  <!-- Divider -->
  <line x1="${W/2 - 80}" y1="750" x2="${W/2 + 80}" y2="750" stroke="#fbcfe8" stroke-width="3"/>

  <!-- Olympiad name -->
  <text x="${W/2}" y="830" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="800" letter-spacing="-1">Science Olympiad 2026</text>

  <!-- Subline -->
  <text x="${W/2}" y="890" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="500">AI-Proctored · Online · Class 1 to 12</text>

  <!-- Next exam highlight box -->
  <g>
    <rect x="120" y="990" width="${W - 240}" height="260" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
    <text x="${W/2}" y="1045" text-anchor="middle" fill="#fbcfe8" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6">NEXT EXAM</text>
    <text x="${W/2}" y="1140" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="84" font-weight="900" letter-spacing="-2">JUNE 15, 2026</text>
    <text x="${W/2}" y="1200" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500">Samikaran Science Olympiad 2026</text>
  </g>

  <!-- Feature checklist -->
  <g font-family="Inter, Arial, sans-serif" font-size="30" fill="#ffffff" font-weight="500">
    <g transform="translate(140, 1330)">
      <circle cx="0" cy="-10" r="14" fill="#fbcfe8"/>
      <path d="M -7 -10 l 5 6 l 10 -10" stroke="#7c3aed" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="35" y="0">Face Recognition + Tab Detect Proctoring</text>
    </g>
    <g transform="translate(140, 1395)">
      <circle cx="0" cy="-10" r="14" fill="#fbcfe8"/>
      <path d="M -7 -10 l 5 6 l 10 -10" stroke="#7c3aed" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="35" y="0">Pan-India · 10+ States &amp; Expanding</text>
    </g>
    <g transform="translate(140, 1460)">
      <circle cx="0" cy="-10" r="14" fill="#fbcfe8"/>
      <path d="M -7 -10 l 5 6 l 10 -10" stroke="#7c3aed" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="35" y="0">Gold · Silver · Bronze Certificates</text>
    </g>
    <g transform="translate(140, 1525)">
      <circle cx="0" cy="-10" r="14" fill="#fbcfe8"/>
      <path d="M -7 -10 l 5 6 l 10 -10" stroke="#7c3aed" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="35" y="0">Scholarships up to ₹5 Lakh*</text>
    </g>
  </g>

  <!-- CTA pill -->
  <g>
    <rect x="${W/2 - 360}" y="1620" width="720" height="100" rx="50" fill="url(#ctaGrad)"/>
    <text x="${W/2}" y="1685" text-anchor="middle" fill="#7c3aed" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="900">Register Today</text>
  </g>
  <text x="${W/2}" y="1770" text-anchor="middle" fill="#fce7f3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="500">*T&amp;C apply  ·  Follow us on Instagram &amp; WhatsApp</text>

  ${bottomStrip({label: "www.samikaranolympiad.com  ·  Science Olympiad 2026"})}
</svg>`;

// ============== POSTER 3 — AI Features =====================================
function featureRow({x, y, iconColor, iconSvg, title, desc}) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="960" height="160" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.30)" stroke-width="1.2"/>
      <g transform="translate(${x + 90}, ${y + 80})">
        <circle r="50" fill="${iconColor}" opacity="0.95"/>
        ${iconSvg}
      </g>
      <text x="${x + 180}" y="${y + 75}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="800">${title}</text>
      <text x="${x + 180}" y="${y + 120}" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="400">${desc}</text>
    </g>`;
}

const aiBrainIcon = `
  <g stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round">
    <path d="M -20 -10 q -15 -8 -10 -22 q 14 -16 28 -6"/>
    <path d="M 20 -10 q 15 -8 10 -22 q -14 -16 -28 -6"/>
    <path d="M -20 10 q -15 8 -10 22 q 14 16 28 6"/>
    <path d="M 20 10 q 15 8 10 22 q -14 16 -28 6"/>
    <line x1="-12" y1="-14" x2="12" y2="-14"/>
    <line x1="-15" y1="0" x2="15" y2="0"/>
    <line x1="-12" y1="14" x2="12" y2="14"/>
    <circle cx="-12" cy="-14" r="2.5" fill="#ffffff"/>
    <circle cx="12" cy="-14" r="2.5" fill="#ffffff"/>
    <circle cx="0" cy="0" r="2.5" fill="#ffffff"/>
    <circle cx="-12" cy="14" r="2.5" fill="#ffffff"/>
    <circle cx="12" cy="14" r="2.5" fill="#ffffff"/>
  </g>`;

const shieldEyeIcon = `
  <g stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 0 -28 l 24 8 v 18 q 0 18 -24 30 q -24 -12 -24 -30 v -18 z" fill="rgba(255,255,255,0.0)"/>
    <ellipse cx="0" cy="6" rx="14" ry="9"/>
    <circle cx="0" cy="6" r="4" fill="#ffffff"/>
  </g>`;

const audioIcon = `
  <g stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round">
    <line x1="-22" y1="0" x2="-22" y2="0"/>
    <line x1="-14" y1="-10" x2="-14" y2="10"/>
    <line x1="-6"  y1="-18" x2="-6"  y2="18"/>
    <line x1="2"   y1="-26" x2="2"   y2="26"/>
    <line x1="10"  y1="-18" x2="10"  y2="18"/>
    <line x1="18"  y1="-10" x2="18"  y2="10"/>
    <line x1="26"  y1="-4"  x2="26"  y2="4"/>
  </g>`;

const micIcon = `
  <g stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-9" y="-26" width="18" height="32" rx="9" fill="rgba(255,255,255,0.0)"/>
    <path d="M -18 0 q 0 18 18 18 q 18 0 18 -18"/>
    <line x1="0" y1="18" x2="0" y2="30"/>
    <line x1="-10" y1="30" x2="10" y2="30"/>
  </g>`;

const poster3 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${brandGradient}
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  ${scienceBackdrop()}

  <!-- Top centered logo -->
  ${samikaranLogo({cx: W/2, cy: 220, iconSize: 110, fontSize: 56, layout: "horizontal"})}

  <!-- Eyebrow -->
  <text x="${W/2}" y="430" text-anchor="middle" fill="#fbcfe8" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6">MEET TARA · YOUR AI TUTOR</text>

  <!-- Headline -->
  <text x="${W/2}" y="540" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="900" letter-spacing="-2">AI-Enabled</text>
  <text x="${W/2}" y="635" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="900" letter-spacing="-2">Olympiad <tspan fill="#fef3c7" font-style="italic" font-family="Georgia, serif">Experience</tspan></text>

  <!-- Subhead -->
  <text x="${W/2}" y="715" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500">Talent Assessment &amp; Research Assistant</text>
  <text x="${W/2}" y="755" text-anchor="middle" fill="#f5d0fe" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500">guiding every step of your exam journey</text>

  <!-- Feature rows -->
  ${featureRow({x: 60,  y: 820,  iconColor: "#ec4899", iconSvg: aiBrainIcon,  title: "AI-Powered Question Engine",      desc: "Smart adaptive questions that learn your level"})}
  ${featureRow({x: 60,  y: 1000, iconColor: "#a855f7", iconSvg: shieldEyeIcon, title: "Secure Online Proctoring",          desc: "Face recognition + tab detect — 100% fair exams"})}
  ${featureRow({x: 60,  y: 1180, iconColor: "#ec4899", iconSvg: audioIcon,     title: "Audio-Based Question System",       desc: "TARA asks each question in clear audio"})}
  ${featureRow({x: 60,  y: 1360, iconColor: "#a855f7", iconSvg: micIcon,       title: "Voice &amp; MCQ Answers",               desc: "Answer verbally or via multiple choice — your way"})}

  <!-- Stats strip -->
  <text x="${W/2}" y="1610" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="2">Class 1–12  ·  10+ States  ·  20+ Subjects</text>

  <!-- CTA -->
  <g>
    <rect x="${W/2 - 360}" y="1670" width="720" height="100" rx="50" fill="url(#ctaGrad)"/>
    <text x="${W/2}" y="1735" text-anchor="middle" fill="#7c3aed" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="900">Join the Future of Olympiads</text>
  </g>

  ${bottomStrip({label: "www.samikaranolympiad.com  ·  Next Exam: June 15, 2026"})}
</svg>`;

// === Render to PNG ========================================================
const targets = [
  { svg: poster1, out: "attached_assets/generated_images/samikaran_brand_image1.png" },
  { svg: poster2, out: "attached_assets/generated_images/samikaran_brand_image2.png" },
  { svg: poster3, out: "attached_assets/generated_images/samikaran_brand_image3.png" },
];

for (const t of targets) {
  await sharp(Buffer.from(t.svg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(t.out);
  console.log("Wrote", t.out);
}
