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
    accent: "#8A2BE2",
    lightAccent: "#f3e8ff",
    Illustration: OlympiadIllustration,
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — a tailored experience for all.",
    accent: "#c026d3",
    lightAccent: "#fce7f3",
    Illustration: RolesIllustration,
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#0284c7",
    lightAccent: "#e0f2fe",
    Illustration: ProctorIllustration,
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Certificates",
    accent: "#b45309",
    lightAccent: "#fef9c3",
    Illustration: AchievementIllustration,
  },
];

const ILLUS_SIZE = Math.min(width * 0.8, 300);

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cardY = useSharedValue(0);
  const illustScale = useSharedValue(1);
  const illustOpacity = useSharedValue(1);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const slide = SLIDES[current];

  const animateIn = useCallback(() => {
    illustOpacity.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) });
    illustScale.value = withTiming(0.9, { duration: 150 });
    cardY.value = withTiming(12, { duration: 130 }, () => {
      cardY.value = withSpring(0, { damping: 16, stiffness: 220 });
    });
    setTimeout(() => {
      illustScale.value = withSpring(1, { damping: 14, stiffness: 180 });
      illustOpacity.value = withTiming(1, { duration: 220 });
    }, 160);
  }, []);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      if (idx !== current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateIn();
        setCurrent(idx);
      }
    },
    [current, animateIn]
  );

  const goTo = useCallback(
    (idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollRef.current?.scrollTo({ x: idx * width, animated: true });
      animateIn();
      setTimeout(() => setCurrent(idx), 50);
    },
    [animateIn]
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
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

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
          <Text style={[styles.skipTxt, { fontFamily: "Inter_500Medium", color: "#6b7280" }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable illustration area — full width, paginated */}
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
              {/* Soft circle backdrop */}
              <View style={[styles.illustBg, { backgroundColor: s.lightAccent }]} />
              <Animated.View style={i === current ? illustStyle : undefined}>
                <Illus size={ILLUS_SIZE} />
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom card — white, elevated */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: "#e5e7eb" }]} />

        {/* Tag */}
        <View style={[styles.tag, { backgroundColor: slide.lightAccent }]}>
          <View style={[styles.tagDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Inter_600SemiBold" }]}>
            {slide.tag}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontFamily: "Inter_700Bold", color: "#111827" }]}>
          {slide.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.sub, { fontFamily: "Inter_400Regular", color: "#6b7280" }]}>
          {slide.sub}
        </Text>

        {/* Progress dots + hint */}
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
                    width: i === current ? 24 : 7,
                    backgroundColor: i === current ? slide.accent : "#d1d5db",
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

        {/* Sign-in link — last slide only */}
        {current === SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleDone} style={{ alignItems: "center", marginTop: 2 }}>
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

const CARD_TOP_RADIUS = 28;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F5FF" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 4,
    backgroundColor: "#F7F5FF",
    zIndex: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 7 },
  logoTxt: { color: "#111827", fontSize: 13, letterSpacing: 1.8 },
  skipPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  skipTxt: { fontSize: 13 },
  scrollView: { flex: 1, backgroundColor: "#F7F5FF" },
  scrollContent: { alignItems: "center" },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5FF",
  },
  illustBg: {
    position: "absolute",
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    opacity: 0.55,
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: CARD_TOP_RADIUS,
    borderTopRightRadius: CARD_TOP_RADIUS,
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },
  tagTxt: { fontSize: 10, letterSpacing: 1.5 },
  title: { fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  sub: { fontSize: 13, lineHeight: 19 },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },
  swipeHint: {
    marginLeft: 8,
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.4 },
  signinTxt: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
});
