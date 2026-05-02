import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { OlympiadIllustration } from "@/components/illustrations/OlympiadIllustration";
import { RolesIllustration } from "@/components/illustrations/RolesIllustration";
import { ProctorIllustration } from "@/components/illustrations/ProctorIllustration";
import { AchievementIllustration } from "@/components/illustrations/AchievementIllustration";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: 0,
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    sub: "50,000+ students · 500+ schools · 15 subjects",
    accent: "#a855f7",
    tagBg: "rgba(168,85,247,0.15)",
    bgFrom: "#0D0A1E",
    bgTo: "#180d33",
    Illustration: OlympiadIllustration,
  },
  {
    id: 1,
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — tailored experience for all.",
    accent: "#FF2FBF",
    tagBg: "rgba(255,47,191,0.15)",
    bgFrom: "#0D0A1E",
    bgTo: "#1a051a",
    Illustration: RolesIllustration,
  },
  {
    id: 2,
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#38bdf8",
    tagBg: "rgba(56,189,248,0.15)",
    bgFrom: "#0D0A1E",
    bgTo: "#051a24",
    Illustration: ProctorIllustration,
  },
  {
    id: 3,
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Digital Certificates",
    accent: "#F5C518",
    tagBg: "rgba(245,197,24,0.15)",
    bgFrom: "#0D0A1E",
    bgTo: "#1a1505",
    Illustration: AchievementIllustration,
  },
];

const ILLUS_SIZE = Math.min(width * 0.82, 300);
const CARD_H = height * 0.42;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const illustScale = useSharedValue(1);
  const illustOpacity = useSharedValue(1);
  const cardY = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const slide = SLIDES[current];

  const transition = useCallback((nextIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    illustOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
    illustScale.value = withTiming(0.85, { duration: 180 });
    cardY.value = withTiming(20, { duration: 150 }, () => {
      cardY.value = withSpring(0, { damping: 16, stiffness: 200 });
    });
    setTimeout(() => {
      setCurrent(nextIdx);
      illustScale.value = withSpring(1, { damping: 14, stiffness: 160 });
      illustOpacity.value = withTiming(1, { duration: 260 });
    }, 190);
  }, []);

  const handleNext = () => {
    if (current < SLIDES.length - 1) transition(current + 1);
    else handleDone();
  };

  const handleDone = async () => {
    await AsyncStorage.setItem("samikaran_onboarding_done", "true");
    router.replace("/login");
  };

  const illustStyle = useAnimatedStyle(() => ({
    transform: [{ scale: illustScale.value }],
    opacity: illustOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  const Illus = slide.Illustration;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={[slide.bgFrom, slide.bgTo, "#0D0A1E"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Subtle glow behind illustration */}
      <View style={[styles.glow, { backgroundColor: slide.accent }]} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 10 }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.logoTxt, { fontFamily: "Inter_700Bold" }]}>
            SAMIKARAN<Text style={{ color: slide.accent }}>.</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.skipPill}>
          <Text style={[styles.skipTxt, { fontFamily: "Inter_500Medium" }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <Animated.View style={[styles.illustWrap, illustStyle]}>
        <Illus size={ILLUS_SIZE} />
      </Animated.View>

      {/* Glass card */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Top notch line */}
        <View style={[styles.notchLine, { backgroundColor: slide.accent }]} />

        {/* Tag */}
        <View style={[styles.tag, { backgroundColor: slide.tagBg, borderColor: slide.accent + "50" }]}>
          <View style={[styles.tagDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Inter_600SemiBold" }]}>
            {slide.tag}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontFamily: "Inter_700Bold" }]}>
          {slide.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.sub, { fontFamily: "Inter_400Regular" }]}>
          {slide.sub}
        </Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => i !== current && transition(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    width: i === current ? 26 : 7,
                    backgroundColor: i === current ? slide.accent : "rgba(255,255,255,0.2)",
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.88} style={styles.ctaWrap}>
          <LinearGradient
            colors={["#8A2BE2", "#c026d3", "#FF2FBF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={[styles.ctaTxt, { fontFamily: "Inter_700Bold" }]}>
              {current < SLIDES.length - 1 ? "Continue" : "Get Started"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign in link on last slide */}
        {current === SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleDone} style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={[styles.signinTxt, { fontFamily: "Inter_400Regular" }]}>
              Already registered?{" "}
              <Text style={{ color: slide.accent, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Safe area spacing */}
        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 24 : 8) }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0A1E" },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: height * 0.05,
    alignSelf: "center",
    opacity: 0.07,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 8,
    zIndex: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 7 },
  logoTxt: { color: "#fff", fontSize: 13, letterSpacing: 1.8 },
  skipPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  skipTxt: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  illustWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
  },
  card: {
    backgroundColor: "rgba(18,11,42,0.95)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 10,
    // top glow
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  notchLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },
  tagTxt: { fontSize: 10, letterSpacing: 1.5 },
  title: {
    fontSize: 27,
    color: "#fff",
    lineHeight: 35,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: { height: 6, borderRadius: 3 },
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.4 },
  signinTxt: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
});
