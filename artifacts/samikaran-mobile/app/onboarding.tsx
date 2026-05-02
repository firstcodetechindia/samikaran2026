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
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
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
    id: "0",
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    sub: "50,000+ students · 500+ schools · 15 subjects",
    accent: "#a855f7",
    tagBg: "rgba(168,85,247,0.15)",
    gradColors: ["#0D0A1E", "#180d33", "#0D0A1E"] as const,
    Illustration: OlympiadIllustration,
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — tailored experience for all.",
    accent: "#FF2FBF",
    tagBg: "rgba(255,47,191,0.15)",
    gradColors: ["#0D0A1E", "#1a051a", "#0D0A1E"] as const,
    Illustration: RolesIllustration,
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#38bdf8",
    tagBg: "rgba(56,189,248,0.15)",
    gradColors: ["#0D0A1E", "#051a24", "#0D0A1E"] as const,
    Illustration: ProctorIllustration,
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Digital Certificates",
    accent: "#F5C518",
    tagBg: "rgba(245,197,24,0.15)",
    gradColors: ["#0D0A1E", "#1a1505", "#0D0A1E"] as const,
    Illustration: AchievementIllustration,
  },
];

const ILLUS_SIZE = Math.min(width * 0.78, 290);

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const illustScale = useSharedValue(1);
  const illustOpacity = useSharedValue(1);
  const cardY = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const slide = SLIDES[current];

  const animateTransition = useCallback(() => {
    illustOpacity.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
    illustScale.value = withTiming(0.88, { duration: 160 });
    cardY.value = withTiming(16, { duration: 140 }, () => {
      cardY.value = withSpring(0, { damping: 15, stiffness: 220 });
    });
    setTimeout(() => {
      illustScale.value = withSpring(1, { damping: 13, stiffness: 170 });
      illustOpacity.value = withTiming(1, { duration: 240 });
    }, 170);
  }, []);

  // Called when user finishes a swipe
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      if (idx !== current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateTransition();
        setCurrent(idx);
      }
    },
    [current, animateTransition]
  );

  const goTo = useCallback(
    (idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollRef.current?.scrollTo({ x: idx * width, animated: true });
      animateTransition();
      setTimeout(() => setCurrent(idx), 50);
    },
    [animateTransition]
  );

  const handleNext = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated background gradient */}
      <LinearGradient
        colors={slide.gradColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Accent glow orb */}
      <View style={[styles.glow, { backgroundColor: slide.accent }]} />

      {/* Top bar: logo + skip */}
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

      {/* Swipeable illustrations row */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {SLIDES.map((s, i) => {
          const Illus = s.Illustration;
          return (
            <View key={s.id} style={styles.slide}>
              <Animated.View style={i === current ? illustStyle : undefined}>
                <Illus size={ILLUS_SIZE} />
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Fixed bottom card */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Notch */}
        <View style={[styles.notch, { backgroundColor: slide.accent }]} />

        {/* Tag pill */}
        <View style={[styles.tag, { backgroundColor: slide.tagBg, borderColor: slide.accent + "55" }]}>
          <View style={[styles.tagDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Inter_600SemiBold" }]}>
            {slide.tag}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontFamily: "Inter_700Bold" }]} numberOfLines={3}>
          {slide.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.sub, { fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
          {slide.sub}
        </Text>

        {/* Dots + swipe hint */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: i === current ? 26 : 7,
                    backgroundColor:
                      i === current ? slide.accent : "rgba(255,255,255,0.2)",
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
          <Text style={[styles.swipeHint, { fontFamily: "Inter_400Regular" }]}>
            swipe to explore
          </Text>
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
              {current < SLIDES.length - 1 ? "Continue" : "Get Started →"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign-in link on last slide */}
        {current === SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleDone} style={{ alignItems: "center", marginTop: 4 }}>
            <Text style={[styles.signinTxt, { fontFamily: "Inter_400Regular" }]}>
              Already registered?{" "}
              <Text style={{ color: slide.accent, fontFamily: "Inter_600SemiBold" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 24 : 10) }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0A1E" },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: height * 0.06,
    alignSelf: "center",
    opacity: 0.08,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 6,
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
  scrollView: { flex: 1 },
  scrollContent: { alignItems: "center" },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(18,11,42,0.96)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 0,
    gap: 10,
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  notch: {
    width: 40,
    height: 3,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 2,
    opacity: 0.7,
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
  title: { fontSize: 27, color: "#fff", lineHeight: 35, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 19 },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },
  swipeHint: {
    marginLeft: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 0.3,
  },
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.4 },
  signinTxt: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
  },
});
