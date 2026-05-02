import React from "react";
import Svg, {
  Circle, Rect, Path, G, Defs, LinearGradient, Stop, Polygon,
  Ellipse, Line, Text as SvgText
} from "react-native-svg";

export function OlympiadIllustration({ size = 300 }: { size?: number }) {
  const s = size / 300;
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <LinearGradient id="trophy" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F5C518" />
          <Stop offset="1" stopColor="#f59e0b" />
        </LinearGradient>
        <LinearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8A2BE2" />
          <Stop offset="1" stopColor="#FF2FBF" />
        </LinearGradient>
        <LinearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#e0d7ff" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* Background decorative circle */}
      <Circle cx="150" cy="145" r="110" fill="#8A2BE2" fillOpacity="0.08" />
      <Circle cx="150" cy="145" r="80" fill="#8A2BE2" fillOpacity="0.06" />

      {/* Floating dots / confetti */}
      <Circle cx="55" cy="70" r="6" fill="#FF2FBF" fillOpacity="0.7" />
      <Circle cx="245" cy="80" r="4" fill="#F5C518" fillOpacity="0.8" />
      <Circle cx="40" cy="200" r="5" fill="#8A2BE2" fillOpacity="0.6" />
      <Circle cx="260" cy="210" r="7" fill="#FF2FBF" fillOpacity="0.5" />
      <Circle cx="80" cy="250" r="4" fill="#F5C518" fillOpacity="0.6" />
      <Circle cx="225" cy="255" r="5" fill="#8A2BE2" fillOpacity="0.7" />

      {/* Stars scattered */}
      <Path d="M60 120 L63 111 L66 120 L75 120 L68 126 L71 135 L63 129 L55 135 L58 126 L51 120Z" fill="#F5C518" fillOpacity="0.9" />
      <Path d="M240 100 L242 94 L244 100 L250 100 L245 104 L247 110 L242 106 L237 110 L239 104 L234 100Z" fill="#F5C518" fillOpacity="0.7" />
      <Path d="M230 165 L232 159 L234 165 L240 165 L235 169 L237 175 L232 171 L227 175 L229 169 L224 165Z" fill="#FF2FBF" fillOpacity="0.6" />

      {/* Trophy base */}
      <Rect x="126" y="215" width="48" height="8" rx="4" fill="url(#trophy)" />
      <Rect x="138" y="195" width="24" height="22" rx="2" fill="url(#trophy)" />

      {/* Trophy cup */}
      <Path
        d="M110 120 Q108 155 130 175 L145 180 L155 180 L170 175 Q192 155 190 120Z"
        fill="url(#trophy)"
      />
      {/* Trophy cup inner shine */}
      <Path
        d="M120 125 Q120 150 135 165 L140 168"
        stroke="#fff" strokeWidth="3" strokeOpacity="0.4" strokeLinecap="round" fill="none"
      />
      {/* Trophy handles */}
      <Path d="M110 125 Q92 125 90 140 Q90 155 110 155" stroke="url(#trophy)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <Path d="M190 125 Q208 125 210 140 Q210 155 190 155" stroke="url(#trophy)" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* #1 on trophy */}
      <SvgText x="150" y="157" textAnchor="middle" fontSize="26" fontWeight="bold" fill="#fff" fillOpacity="0.9">#1</SvgText>

      {/* Trophy stars */}
      <Circle cx="150" cy="110" r="12" fill="url(#purpleGrad)" />
      <Path d="M150 103 L152 109 L158 109 L153 113 L155 119 L150 115 L145 119 L147 113 L142 109 L148 109Z" fill="#fff" />

      {/* Floating book */}
      <G transform="translate(55, 130) rotate(-15)">
        <Rect width="36" height="46" rx="3" fill="#8A2BE2" />
        <Rect x="3" y="3" width="30" height="40" rx="2" fill="#a855f7" />
        <Rect x="6" y="10" width="20" height="2" rx="1" fill="#fff" fillOpacity="0.6" />
        <Rect x="6" y="15" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
        <Rect x="6" y="20" width="18" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
      </G>

      {/* Floating medal */}
      <G transform="translate(218, 125) rotate(20)">
        <Circle cx="16" cy="22" r="14" fill="#FF2FBF" />
        <Circle cx="16" cy="22" r="10" fill="#ff6bd4" />
        <SvgText x="16" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">1st</SvgText>
        <Rect x="13" y="0" width="6" height="12" rx="3" fill="#FF2FBF" />
      </G>

      {/* Sigma symbol */}
      <G transform="translate(240, 155)">
        <SvgText fontSize="32" fill="#8A2BE2" fillOpacity="0.5" fontWeight="bold">Σ</SvgText>
      </G>

      {/* Math formula */}
      <G transform="translate(35, 165)">
        <SvgText fontSize="14" fill="#FF2FBF" fillOpacity="0.6" fontWeight="bold">x²+y²</SvgText>
      </G>

      {/* Graduation cap floating */}
      <G transform="translate(190, 65)">
        <Rect x="0" y="12" width="44" height="6" rx="3" fill="#1a1033" />
        <Path d="M22 0 L44 12 L22 18 L0 12Z" fill="#0D0A1E" />
        <Path d="M22 0 L44 12 L22 18 L0 12Z" fill="#8A2BE2" fillOpacity="0.9" />
        <Line x1="40" y1="12" x2="40" y2="26" stroke="#F5C518" strokeWidth="2" />
        <Circle cx="40" cy="28" r="4" fill="#F5C518" />
      </G>
    </Svg>
  );
}
