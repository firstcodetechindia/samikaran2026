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

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "0",
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    sub: "50,000+ students · 500+ schools · 15 subjects",
    accent: "#7c3aed",
    bgTop: "#ede9fe",
    bgMid: "#ddd6fe",
    image: require("../assets/images/onboard1.png"),
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — a tailored experience for all.",
    accent: "#c026d3",
    bgTop: "#fae8ff",
    bgMid: "#f5d0fe",
    image: require("../assets/images/onboard2.png"),
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#0284c7",
    bgTop: "#e0f2fe",
    bgMid: "#bae6fd",
    image: require("../assets/images/onboard3.png"),
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Certificates",
    accent: "#7c3aed",
    bgTop: "#fef9c3",
    bgMid: "#fde68a",
    image: require("../assets/images/onboard4.png"),
  },
];

// Illustration takes 63% of screen height
const ILLUS_AREA = height * 0.63;
const CARD_H = height * 0.42;
const ILLUS_SIZE = Math.min(width * 0.78, 310);

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

  const animateIn = useCallback(() => {
    illustOpacity.value = withTiming(0, { duration: 130, easing: Easing.out(Easing.quad) });
    illustScale.value = withTiming(0.88, { duration: 130 });
    cardY.value = withTiming(14, { duration: 120 }, () => {
      cardY.value = withSpring(0, { damping: 15, stiffness: 240 });
    });
    setTimeout(() => {
      illustScale.value = withSpring(1, { damping: 13, stiffness: 190 });
      illustOpacity.value = withTiming(1, { duration: 200 });
    }, 140);
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
      <StatusBar barStyle="dark-content" />

      {/* Full-screen background gradient that changes per slide */}
      <LinearGradient
        colors={[slide.bgTop, slide.bgMid, "#f8f5ff"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
      />

      {/* Top bar — logo + skip */}
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.logoTxt, { fontFamily: "Inter_700Bold", color: slide.accent }]}>
            SAMIKARAN<Text style={{ color: "#111827" }}>.</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.skipPill}>
          <Text style={[styles.skipTxt, { fontFamily: "Inter_500Medium", color: slide.accent }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable 3D illustration area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ height: ILLUS_AREA, flexGrow: 0 }}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={{ width, height: ILLUS_AREA, alignItems: "center", justifyContent: "center" }}
          >
            <Animated.View style={i === current ? illustStyle : undefined}>
              <Image
                source={s.image}
                style={{ width: ILLUS_SIZE, height: ILLUS_SIZE }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Glassmorphism card — overlapping the illustration slightly */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Glassmorphism inner */}
        <View style={styles.glassInner}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: slide.accent + "40" }]} />

          {/* Tag pill */}
          <View style={[styles.tagRow]}>
            <View style={[styles.tag, { backgroundColor: slide.accent + "18", borderColor: slide.accent + "30" }]}>
              <View style={[styles.tagDot, { backgroundColor: slide.accent }]} />
              <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Inter_700Bold" }]}>
                {slide.tag}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontFamily: "Inter_700Bold" }]}>
            {slide.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.sub, { fontFamily: "Inter_400Regular" }]}>
            {slide.sub}
          </Text>

          {/* Centered progress dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goTo(i)}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: i === current ? 28 : 8,
                      height: 8,
                      backgroundColor: i === current ? slide.accent : slide.accent + "28",
                      borderRadius: 4,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.88}
            style={styles.ctaOuter}
          >
            <LinearGradient
              colors={[slide.accent, "#c026d3", "#FF2FBF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={[styles.ctaTxt, { fontFamily: "Inter_800ExtraBold" }]}>
                {current < SLIDES.length - 1 ? "Continue" : "Get Started"}
              </Text>
              <View style={styles.ctaArrowBox}>
                <Text style={styles.ctaArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign-in link — last slide only */}
          {current === SLIDES.length - 1 ? (
            <TouchableOpacity onPress={handleDone} style={{ alignItems: "center" }}>
              <Text style={[styles.signinTxt, { fontFamily: "Inter_400Regular" }]}>
                Already registered?{" "}
                <Text style={{ color: slide.accent, fontFamily: "Inter_600SemiBold" }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 4 }} />
          )}

          <View style={{ height: insets.bottom + (Platform.OS === "web" ? 20 : 8) }} />
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_RADIUS = 34;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 8,
    zIndex: 20,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 7 },
  logoTxt: { fontSize: 13, letterSpacing: 1.8 },
  skipPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  skipTxt: { fontSize: 13 },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
    // 3D shadow lift effect
    shadowColor: "#5b21b6",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  glassInner: {
    // Glassmorphism: translucent white with blur
    backgroundColor: "rgba(255,255,255,0.82)",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 26,
    paddingTop: 16,
    gap: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 2,
  },
  tagRow: { flexDirection: "row" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { fontSize: 10, letterSpacing: 1.8 },

  title: {
    fontSize: 30,
    color: "#111827",
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 13.5,
    color: "#6b7280",
    lineHeight: 20,
  },

  dotsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dot: {},

  ctaOuter: {
    borderRadius: 18,
    overflow: "hidden",
    // 3D button effect
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  ctaTxt: { color: "#fff", fontSize: 17, letterSpacing: 0.2 },
  ctaArrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrow: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  signinTxt: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
});
