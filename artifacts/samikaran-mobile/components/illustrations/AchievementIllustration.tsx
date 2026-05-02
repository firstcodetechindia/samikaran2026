import React from "react";
import Svg, {
  Circle, Rect, Path, G, Defs, LinearGradient, Stop,
  Line, Text as SvgText, Polygon
} from "react-native-svg";

export function AchievementIllustration({ size = 300 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5C518" />
          <Stop offset="1" stopColor="#d97706" />
        </LinearGradient>
        <LinearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d1d5db" />
          <Stop offset="1" stopColor="#9ca3af" />
        </LinearGradient>
        <LinearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fb923c" />
          <Stop offset="1" stopColor="#c2410c" />
        </LinearGradient>
        <LinearGradient id="podiumGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8A2BE2" />
          <Stop offset="1" stopColor="#FF2FBF" />
        </LinearGradient>
      </Defs>

      {/* Confetti dots */}
      {[
        [45, 55, "#F5C518"], [255, 50, "#FF2FBF"], [35, 160, "#8A2BE2"],
        [268, 145, "#F5C518"], [60, 255, "#FF2FBF"], [245, 265, "#8A2BE2"],
        [150, 30, "#22c55e"], [120, 270, "#38bdf8"], [190, 265, "#F5C518"],
      ].map(([x, y, c], i) => (
        <Circle key={i} cx={x as number} cy={y as number} r={4 + (i % 3)} fill={c as string} fillOpacity={0.7} />
      ))}

      {/* Stars scattered */}
      {[[65, 90], [235, 75], [55, 200], [255, 190]].map(([cx, cy], i) => (
        <G key={i} transform={`translate(${cx - 8}, ${cy - 8})`}>
          <Path d="M8 0 L10 6 L16 6 L11 10 L13 16 L8 12 L3 16 L5 10 L0 6 L6 6Z" fill="#F5C518" fillOpacity={0.7 + i * 0.05} />
        </G>
      ))}

      {/* Podium base */}
      {/* #2 Silver */}
      <Rect x="55" y="178" width="68" height="50" rx="4" fill="url(#silver)" />
      <SvgText x="89" y="208" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#fff" fillOpacity="0.9">2</SvgText>

      {/* #1 Gold - center, tallest */}
      <Rect x="116" y="148" width="68" height="80" rx="4" fill="url(#gold)" />
      <SvgText x="150" y="198" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" fillOpacity="0.95">1</SvgText>

      {/* #3 Bronze */}
      <Rect x="177" y="198" width="68" height="30" rx="4" fill="url(#bronze)" />
      <SvgText x="211" y="218" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff" fillOpacity="0.9">3</SvgText>

      {/* Podium base platform */}
      <Rect x="45" y="228" width="210" height="12" rx="6" fill="url(#podiumGrad)" fillOpacity="0.5" />

      {/* #1 Trophy/Crown on gold */}
      <G transform="translate(130, 105)">
        <Path d="M20 30 L5 10 L10 8 L20 18 L30 8 L35 10Z" fill="#F5C518" />
        <Rect x="10" y="28" width="20" height="4" rx="2" fill="#F5C518" />
        <Circle cx="5" cy="10" r="4" fill="#FF2FBF" />
        <Circle cx="20" cy="5" r="4" fill="#8A2BE2" />
        <Circle cx="35" cy="10" r="4" fill="#FF2FBF" />
      </G>

      {/* Rank badge floating - top right */}
      <G transform="translate(195, 55)">
        <Circle cx="30" cy="30" r="30" fill="url(#podiumGrad)" />
        <SvgText x="30" y="26" textAnchor="middle" fontSize="9" fill="#fff" fillOpacity="0.8">ALL INDIA</SvgText>
        <SvgText x="30" y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">RANK</SvgText>
        <SvgText x="30" y="50" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F5C518">#42</SvgText>
      </G>

      {/* Certificate floating left */}
      <G transform="translate(30, 110) rotate(-8)">
        <Rect width="56" height="42" rx="4" fill="#fff" fillOpacity="0.9" />
        <Rect x="4" y="4" width="48" height="34" rx="2" fill="#f0ebfd" />
        <Rect x="8" y="10" width="30" height="2" rx="1" fill="#8A2BE2" fillOpacity="0.6" />
        <Rect x="8" y="15" width="22" height="2" rx="1" fill="#8A2BE2" fillOpacity="0.3" />
        <Rect x="8" y="20" width="26" height="2" rx="1" fill="#8A2BE2" fillOpacity="0.3" />
        <Circle cx="40" cy="28" r="8" fill="#F5C518" fillOpacity="0.8" />
        <SvgText x="40" y="32" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">★</SvgText>
      </G>
    </Svg>
  );
}
