import React from "react";
import Svg, {
  Circle, Rect, Path, G, Defs, LinearGradient, Stop,
  Line, Text as SvgText, Ellipse
} from "react-native-svg";

export function RolesIllustration({ size = 300 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <LinearGradient id="r1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8A2BE2" />
          <Stop offset="1" stopColor="#a855f7" />
        </LinearGradient>
        <LinearGradient id="r2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF2FBF" />
          <Stop offset="1" stopColor="#f472b6" />
        </LinearGradient>
        <LinearGradient id="r3" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#06b6d4" />
          <Stop offset="1" stopColor="#38bdf8" />
        </LinearGradient>
        <LinearGradient id="r4" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#22c55e" />
          <Stop offset="1" stopColor="#4ade80" />
        </LinearGradient>
      </Defs>

      {/* Center hub */}
      <Circle cx="150" cy="150" r="28" fill="#8A2BE2" fillOpacity="0.15" />
      <Circle cx="150" cy="150" r="20" fill="#8A2BE2" fillOpacity="0.2" />
      <SvgText x="150" y="154" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#8A2BE2">S</SvgText>

      {/* Connection lines */}
      <Line x1="150" y1="130" x2="150" y2="75" stroke="#8A2BE2" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4,3" />
      <Line x1="170" y1="150" x2="225" y2="150" stroke="#FF2FBF" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4,3" />
      <Line x1="150" y1="170" x2="150" y2="225" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4,3" />
      <Line x1="130" y1="150" x2="75" y2="150" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4,3" />

      {/* Role 1: Student - Top */}
      <G transform="translate(120, 38)">
        <Circle cx="30" cy="30" r="30" fill="url(#r1)" />
        {/* Student icon */}
        <Circle cx="30" cy="22" r="9" fill="#fff" fillOpacity="0.9" />
        <Path d="M14 46 Q14 36 30 36 Q46 36 46 46" fill="#fff" fillOpacity="0.7" />
        <Rect x="22" y="8" width="16" height="4" rx="2" fill="#F5C518" />
        <Rect x="20" y="6" width="20" height="3" rx="1.5" fill="#F5C518" />
        <SvgText x="30" y="62" textAnchor="middle" fontSize="9" fill="#8A2BE2" fontWeight="bold">STUDENT</SvgText>
      </G>

      {/* Role 2: School - Right */}
      <G transform="translate(213, 120)">
        <Circle cx="30" cy="30" r="30" fill="url(#r2)" />
        {/* Building icon */}
        <Rect x="15" y="18" width="30" height="24" rx="2" fill="#fff" fillOpacity="0.2" />
        <Rect x="18" y="18" width="24" height="24" rx="2" fill="#fff" fillOpacity="0.8" />
        <Rect x="24" y="26" width="6" height="6" rx="1" fill="#FF2FBF" />
        <Rect x="32" y="26" width="6" height="6" rx="1" fill="#FF2FBF" />
        <Rect x="26" y="35" width="8" height="7" rx="1" fill="#FF2FBF" />
        <Path d="M18 18 L30 10 L42 18Z" fill="#fff" fillOpacity="0.9" />
        <SvgText x="30" y="62" textAnchor="middle" fontSize="9" fill="#FF2FBF" fontWeight="bold">SCHOOL</SvgText>
      </G>

      {/* Role 3: Parent - Bottom */}
      <G transform="translate(120, 213)">
        <Circle cx="30" cy="30" r="30" fill="url(#r3)" />
        {/* Family icon */}
        <Circle cx="22" cy="20" r="7" fill="#fff" fillOpacity="0.9" />
        <Circle cx="38" cy="22" r="5.5" fill="#fff" fillOpacity="0.7" />
        <Path d="M10 44 Q10 34 22 34 Q34 34 34 44" fill="#fff" fillOpacity="0.7" />
        <Path d="M30 44 Q30 37 38 37 Q46 37 46 44" fill="#fff" fillOpacity="0.5" />
        <SvgText x="30" y="62" textAnchor="middle" fontSize="9" fill="#06b6d4" fontWeight="bold">PARENT</SvgText>
      </G>

      {/* Role 4: Partner - Left */}
      <G transform="translate(27, 120)">
        <Circle cx="30" cy="30" r="30" fill="url(#r4)" />
        {/* Handshake icon */}
        <Path d="M12 28 L22 20 L30 24 L38 20 L48 28" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.9" />
        <Path d="M12 28 L12 38 Q12 42 16 42 L44 42 Q48 42 48 38 L48 28" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.7" />
        <Circle cx="30" cy="32" r="5" fill="#fff" fillOpacity="0.9" />
        <SvgText x="30" y="62" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="bold">PARTNER</SvgText>
      </G>

      {/* Floating sparkles */}
      <Circle cx="100" cy="90" r="4" fill="#F5C518" fillOpacity="0.7" />
      <Circle cx="200" cy="90" r="3" fill="#F5C518" fillOpacity="0.6" />
      <Circle cx="200" cy="210" r="4" fill="#8A2BE2" fillOpacity="0.5" />
      <Circle cx="100" cy="210" r="3" fill="#FF2FBF" fillOpacity="0.6" />
    </Svg>
  );
}
