import React, { useState, useRef, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: 0,
    image: require("../assets/images/onboard1.png"),
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    subtitle: "50,000+ students · 500+ schools · 15 subjects",
    gradientColors: ["#0D0A1E", "#1a0a3e", "#2d0a5e"] as const,
    accentColor: "#a855f7",
    tagBg: "rgba(168,85,247,0.2)",
  },
  {
    id: 1,
    image: require("../assets/images/onboard2.png"),
    tag: "FOR EVERYONE",
    title: "Ek App,\nSabke Liye",
    subtitle: "Students · Schools · Parents · Partners",
    gradientColors: ["#0D0A1E", "#1a0533", "#2d0520"] as const,
    accentColor: "#FF2FBF",
    tagBg: "rgba(255,47,191,0.2)",
  },
  {
    id: 2,
    image: require("../assets/images/onboard3.png"),
    tag: "AI-POWERED",
    title: "Smart Proctoring,\n100% Fair Exams",
    subtitle: "Face detection · Tab-switch alerts · Auto-submit",
    gradientColors: ["#0D0A1E", "#0a1a3e", "#0a2a5e"] as const,
    accentColor: "#38bdf8",
    tagBg: "rgba(56,189,248,0.2)",
  },
  {
    id: 3,
    image: require("../assets/images/onboard4.png"),
    tag: "WIN BIG",
    title: "Compete.\nRank.\nInspire.",
    subtitle: "All India Rank · Scholarships · Certificates",
    gradientColors: ["#0D0A1E", "#1a1a0a", "#2a250a"] as const,
    accentColor: "#F5C518",
    tagBg: "rgba(245,197,24,0.2)",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const slideAnim = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const cardTranslate = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const goToSlide = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    imageScale.value = withTiming(0.93, { duration: 150 }, () => {
      imageScale.value = withSpring(1, { damping: 12 });
    });
    cardTranslate.value = withTiming(30, { duration: 120 }, () => {
      cardTranslate.value = withSpring(0, { damping: 14 });
    });
    setCurrent(index);
  }, []);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goToSlide(current + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("samikaran_onboarding_done", "true");
    router.replace("/login");
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("samikaran_onboarding_done", "true");
    router.replace("/login");
  };

  const slide = SLIDES[current];

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={slide.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative glow orb top */}
      <View
        style={[
          styles.glowOrb,
          { backgroundColor: slide.accentColor, top: height * 0.08, left: -60 },
        ]}
      />
      <View
        style={[
          styles.glowOrb2,
          { backgroundColor: "#FF2FBF", top: height * 0.2, right: -40 },
        ]}
      />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: topPad + 8 }]}
        onPress={handleSkip}
      >
        <Text style={[styles.skipText, { fontFamily: "Inter_500Medium" }]}>Skip</Text>
      </TouchableOpacity>

      {/* Logo top-left */}
      <View style={[styles.logoRow, { top: topPad + 6 }]}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logoMini}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { fontFamily: "Inter_700Bold" }]}>
          SAMIKARAN<Text style={{ color: slide.accentColor }}>.</Text>
        </Text>
      </View>

      {/* Illustration */}
      <Animated.View style={[styles.illustrationWrap, imageAnimStyle]}>
        <Image
          source={slide.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Glass card at bottom */}
      <Animated.View style={[styles.glassCard, cardAnimStyle]}>
        {/* Glass blur layer */}
        <View style={styles.glassInner}>
          {/* Tag pill */}
          <View style={[styles.tagPill, { backgroundColor: slide.tagBg, borderColor: slide.accentColor + "60" }]}>
            <View style={[styles.tagDot, { backgroundColor: slide.accentColor }]} />
            <Text style={[styles.tagText, { color: slide.accentColor, fontFamily: "Inter_600SemiBold" }]}>
              {slide.tag}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontFamily: "Inter_700Bold" }]}>
            {slide.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { fontFamily: "Inter_400Regular" }]}>
            {slide.subtitle}
          </Text>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
                <View
                  style={[
                    styles.dot,
                    {
                      width: i === current ? 28 : 8,
                      backgroundColor: i === current ? slide.accentColor : "rgba(255,255,255,0.25)",
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#8A2BE2", "#FF2FBF"]}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, { fontFamily: "Inter_700Bold" }]}>
                {current < SLIDES.length - 1 ? "Continue" : "Get Started"}
              </Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary link */}
          {current === SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={{ alignItems: "center", marginTop: 4 }}>
              <Text style={[styles.alreadyText, { fontFamily: "Inter_400Regular" }]}>
                Already have an account?{" "}
                <Text style={{ color: slide.accentColor, fontFamily: "Inter_600SemiBold" }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_HEIGHT = height * 0.44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0A1E",
  },
  glowOrb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.18,
  },
  glowOrb2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.12,
  },
  skipBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  logoRow: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoMini: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  logoText: {
    color: "#fff",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  illustrationWrap: {
    position: "absolute",
    top: height * 0.1,
    left: 0,
    right: 0,
    height: height * 0.52,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: width * 0.85,
    height: height * 0.48,
  },
  glassCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  glassInner: {
    flex: 1,
    backgroundColor: "rgba(13,10,30,0.82)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 12,
    // Glass shimmer border top
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 30,
    color: "#ffffff",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginVertical: 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  alreadyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
  },
});
