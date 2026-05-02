import React from "react";
import Svg, {
  Circle, Rect, Path, G, Defs, LinearGradient, Stop,
  Line, Text as SvgText, Ellipse
} from "react-native-svg";

export function ProctorIllustration({ size = 300 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <LinearGradient id="shieldG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8A2BE2" />
          <Stop offset="1" stopColor="#FF2FBF" />
        </LinearGradient>
        <LinearGradient id="eyeG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#38bdf8" />
          <Stop offset="1" stopColor="#0284c7" />
        </LinearGradient>
        <LinearGradient id="screenG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1a1033" />
          <Stop offset="1" stopColor="#0D0A1E" />
        </LinearGradient>
      </Defs>

      {/* Outer scanning ring */}
      <Circle cx="150" cy="140" r="100" fill="none" stroke="#8A2BE2" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="6,4" />
      <Circle cx="150" cy="140" r="75" fill="none" stroke="#8A2BE2" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4,3" />

      {/* Laptop/screen */}
      <Rect x="75" y="100" width="150" height="95" rx="8" fill="url(#screenG)" />
      <Rect x="80" y="105" width="140" height="85" rx="6" fill="#1e1540" />
      {/* Screen content: face */}
      <Circle cx="150" cy="148" r="28" fill="#2a1f4a" />
      <Circle cx="150" cy="140" r="14" fill="#4a3570" />
      <Circle cx="143" cy="137" r="3" fill="#fff" fillOpacity="0.9" />
      <Circle cx="157" cy="137" r="3" fill="#fff" fillOpacity="0.9" />
      <Path d="M142 148 Q150 154 158 148" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.7" />

      {/* Face scan lines */}
      <Line x1="122" y1="120" x2="122" y2="176" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="178" y1="120" x2="178" y2="176" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="122" y1="120" x2="178" y2="120" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="122" y1="176" x2="178" y2="176" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />

      {/* Corner dots - face tracking */}
      <Circle cx="122" cy="120" r="3" fill="#38bdf8" />
      <Circle cx="178" cy="120" r="3" fill="#38bdf8" />
      <Circle cx="122" cy="176" r="3" fill="#38bdf8" />
      <Circle cx="178" cy="176" r="3" fill="#38bdf8" />

      {/* Laptop base */}
      <Rect x="60" y="195" width="180" height="8" rx="4" fill="#1a1033" />
      <Rect x="110" y="195" width="80" height="4" rx="2" fill="#0D0A1E" />

      {/* Big eye at top */}
      <G transform="translate(118, 40)">
        <Ellipse cx="32" cy="22" rx="32" ry="22" fill="#1a1033" />
        <Ellipse cx="32" cy="22" rx="26" ry="17" fill="#0a2040" />
        <Circle cx="32" cy="22" r="12" fill="url(#eyeG)" />
        <Circle cx="32" cy="22" r="7" fill="#0284c7" />
        <Circle cx="32" cy="22" r="4" fill="#0D0A1E" />
        <Circle cx="35" cy="19" r="2" fill="#fff" fillOpacity="0.7" />
      </G>

      {/* Shield - bottom right */}
      <G transform="translate(210, 195)">
        <Path d="M30 5 L52 15 L52 35 Q52 55 30 65 Q8 55 8 35 L8 15Z" fill="url(#shieldG)" />
        <Path d="M20 35 L27 42 L42 27" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>

      {/* Alert dot */}
      <Circle cx="56" cy="205" r="12" fill="#ef4444" />
      <SvgText x="56" y="210" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">!</SvgText>

      {/* Status dots */}
      <Circle cx="95" cy="87" r="5" fill="#22c55e" />
      <SvgText x="106" y="91" fontSize="9" fill="#22c55e" fontWeight="bold">ACTIVE</SvgText>

      {/* Scan label */}
      <Rect x="82" y="75" width="60" height="14" rx="7" fill="#38bdf8" fillOpacity="0.15" />
      <SvgText x="112" y="85" textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold">AI SCANNING</SvgText>
    </Svg>
  );
}
