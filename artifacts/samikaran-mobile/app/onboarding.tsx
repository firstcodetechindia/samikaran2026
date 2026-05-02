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
import Svg, { Ellipse } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "0",
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    sub: "50,000+ students · 500+ schools · 15 subjects",
    accent: "#8A2BE2",
    bgGrad: ["#2D1065", "#4C1D95", "#6D28D9"] as const,
    blobColor: "#7c3aed",
    image: require("../assets/images/onboard1.png"),
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — a tailored experience for all.",
    accent: "#c026d3",
    bgGrad: ["#4a044e", "#7e22ce", "#c026d3"] as const,
    blobColor: "#a21caf",
    image: require("../assets/images/onboard2.png"),
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#0284c7",
    bgGrad: ["#0c1445", "#1e3a8a", "#1d4ed8"] as const,
    blobColor: "#2563eb",
    image: require("../assets/images/onboard3.png"),
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Certificates",
    accent: "#7c3aed",
    bgGrad: ["#1a0533", "#4c1d95", "#8A2BE2"] as const,
    blobColor: "#6d28d9",
    image: require("../assets/images/onboard4.png"),
  },
];

const CARD_H = height * 0.36;
const CHAR_H = height * 0.72;
const CHAR_W = CHAR_H * 0.75;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const charScale = useSharedValue(1);
  const charOpacity = useSharedValue(1);
  const cardY = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const slide = SLIDES[current];

  const animateIn = useCallback(() => {
    charOpacity.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
    charScale.value = withTiming(0.9, { duration: 120 });
    cardY.value = withTiming(16, { duration: 110 }, () => {
      cardY.value = withSpring(0, { damping: 14, stiffness: 230 });
    });
    setTimeout(() => {
      charScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      charOpacity.value = withTiming(1, { duration: 220 });
    }, 130);
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

  const charStyle = useAnimatedStyle(() => ({
    transform: [{ scale: charScale.value }],
    opacity: charOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={slide.bgGrad}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Organic blob glow behind character */}
      <View style={styles.blobWrap} pointerEvents="none">
        <Svg width={width * 1.1} height={height * 0.65} viewBox={`0 0 ${width * 1.1} ${height * 0.65}`}>
          <Ellipse
            cx={(width * 1.1) / 2}
            cy={(height * 0.65) / 2}
            rx={width * 0.52}
            ry={height * 0.28}
            fill={slide.blobColor}
            opacity={0.28}
          />
        </Svg>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.logoTxt, { fontFamily: "Inter_700Bold" }]}>
            SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.skipPill}>
          <Text style={[styles.skipTxt, { fontFamily: "Inter_500Medium" }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable character area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.charScroll}
        contentContainerStyle={{ alignItems: "flex-end" }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={{ width, alignItems: "center", justifyContent: "flex-end", height: CHAR_H }}
          >
            <Animated.View style={i === current ? charStyle : undefined}>
              <Image
                source={s.image}
                style={{ width: CHAR_W, height: CHAR_H }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom glass card */}
      <Animated.View style={[styles.card, cardStyle]} pointerEvents="box-none">
        {/* Frosted glass layer */}
        <LinearGradient
          colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.08)"]}
          style={styles.glassLayer}
          pointerEvents="none"
        />

        {/* White content card */}
        <View style={styles.whiteCard}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Tag pill */}
          <View style={[styles.tag, { backgroundColor: slide.accent + "18", borderColor: slide.accent + "40" }]}>
            <View style={[styles.tagDot, { backgroundColor: slide.accent }]} />
            <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Inter_700Bold" }]}>
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

          {/* Centered dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goTo(i)}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: i === current ? 26 : 8,
                      backgroundColor: i === current ? slide.accent : slide.accent + "30",
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.87}
            style={[styles.ctaWrap, { shadowColor: slide.accent }]}
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
              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign-in link */}
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
            <View style={{ height: 2 }} />
          )}

          <View style={{ height: insets.bottom + (Platform.OS === "web" ? 16 : 6) }} />
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_RADIUS = 32;

const styles = StyleSheet.create({
  root: { flex: 1 },

  blobWrap: {
    position: "absolute",
    top: height * 0.08,
    left: -width * 0.05,
    zIndex: 0,
  },

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
    zIndex: 30,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 7 },
  logoTxt: { color: "#fff", fontSize: 13, letterSpacing: 1.8 },
  skipPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  skipTxt: { fontSize: 13, color: "#fff" },

  charScroll: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CHAR_H,
    zIndex: 10,
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 22,
  },
  glassLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  whiteCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 26,
    paddingTop: 14,
    gap: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 2,
  },

  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { fontSize: 10, letterSpacing: 1.8 },

  title: {
    fontSize: 29,
    color: "#111827",
    lineHeight: 37,
    letterSpacing: -0.5,
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
  dot: {
    height: 8,
    borderRadius: 4,
  },

  ctaWrap: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  ctaTxt: { color: "#fff", fontSize: 17, letterSpacing: 0.2 },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { color: "#fff", fontSize: 16 },

  signinTxt: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
});
