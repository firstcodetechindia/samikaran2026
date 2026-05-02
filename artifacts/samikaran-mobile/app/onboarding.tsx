import React, { useState, useRef, useCallback, useEffect } from "react";
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
import Svg, { Ellipse, RadialGradient, Stop, Defs } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Pre-resolve all images at module load — Metro bundles & decodes them
// immediately so there's no stall when characters first render
const IMG1 = require("../assets/images/onboard1.webp");
const IMG2 = require("../assets/images/onboard2.webp");
const IMG3 = require("../assets/images/onboard3.webp");
const IMG4 = require("../assets/images/onboard4.webp");

const SLIDES = [
  {
    id: "0",
    tag: "COMPETE",
    title: "Bharat ka #1\nOlympiad Platform",
    sub: "50,000+ students · 500+ schools · 15 subjects",
    accent: "#8A2BE2",
    bgGrad: ["#2D1065", "#4C1D95", "#6D28D9"] as const,
    blobColor: "#7c3aed",
    image: IMG1,
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — a tailored experience for all.",
    accent: "#c026d3",
    bgGrad: ["#4a044e", "#7e22ce", "#c026d3"] as const,
    blobColor: "#a21caf",
    image: IMG2,
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#0284c7",
    bgGrad: ["#0c1445", "#1e3a8a", "#1d4ed8"] as const,
    blobColor: "#2563eb",
    image: IMG3,
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Certificates",
    accent: "#7c3aed",
    bgGrad: ["#1a0533", "#4c1d95", "#8A2BE2"] as const,
    blobColor: "#6d28d9",
    image: IMG4,
  },
];

// Card occupies bottom ~38% — illustration area is the rest
const CARD_H_EST = height * 0.38;
const ILLUS_H = height - CARD_H_EST;
// Character size — set inside component using CHAR_ZONE_H; module values used only for stageWrap halos fallback
const CHAR_H_FALLBACK = Math.min(ILLUS_H * 0.80, 430);
const CHAR_W_FALLBACK = CHAR_H_FALLBACK * 0.88;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const charScale = useSharedValue(1);
  const charOpacity = useSharedValue(1);
  const cardY = useSharedValue(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  // Height of the top bar row (safe area + logo row ~56px + padding)
  const TOP_BAR_H = topPad + 72;
  // Available vertical zone for character (below top bar, above card)
  const CHAR_ZONE_H = ILLUS_H - TOP_BAR_H;
  // Character fills full width so all images display large
  const CHAR_H = Math.min(CHAR_ZONE_H * 1.04, 570);
  const CHAR_W = width * 1.02;
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

      {/* Background stage — glow centered in character zone (below top bar) */}
      <View
        style={[styles.stageWrap, { top: TOP_BAR_H, height: CHAR_ZONE_H }]}
        pointerEvents="none"
      >
        {/* Outermost soft halo — centered in CHAR_ZONE_H */}
        <View style={[styles.halo3, {
          backgroundColor: slide.blobColor + "18",
          top: CHAR_ZONE_H * 0.5 - width * 0.5,
        }]} />
        <View style={[styles.halo2, {
          backgroundColor: slide.blobColor + "30",
          top: CHAR_ZONE_H * 0.5 - width * 0.41,
        }]} />
        <View style={[styles.halo1, {
          backgroundColor: slide.blobColor + "55",
          top: CHAR_ZONE_H * 0.5 - width * 0.32,
        }]} />
        {/* SVG radial gradient core */}
        <Svg
          width={width * 0.9}
          height={width * 0.9}
          style={[styles.svgGlow, { top: CHAR_ZONE_H * 0.5 - (width * 0.9) / 2 }]}
        >
          <Defs>
            <RadialGradient id="rg" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={slide.blobColor} stopOpacity="0.55" />
              <Stop offset="60%" stopColor={slide.blobColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={slide.blobColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={width * 0.45}
            cy={width * 0.45}
            rx={width * 0.44}
            ry={width * 0.44}
            fill="url(#rg)"
          />
        </Svg>

        {/* Decorative floating dots */}
        <View style={[styles.dot1, { backgroundColor: slide.blobColor + "90" }]} />
        <View style={[styles.dot2, { backgroundColor: slide.blobColor + "60" }]} />
        <View style={[styles.dot3, { backgroundColor: "#FF2FBF" + "55" }]} />
        <View style={[styles.dot4, { backgroundColor: "#fff" + "30" }]} />
        <View style={[styles.dot5, { backgroundColor: "#fff" + "20" }]} />
        <View style={[styles.dot6, { backgroundColor: slide.blobColor + "40" }]} />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Image
              source={require("../assets/images/icon_nobg.png")}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <View style={{ flexDirection: "column", justifyContent: "center" }}>
            <Text style={[styles.logoTxt, { fontFamily: "Roboto_700Bold" }]}>
              SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
            </Text>
            <Text style={[styles.logoSub, { fontFamily: "Roboto_500Medium" }]}>OLYMPIAD</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.skipPill}>
          <Text style={[styles.skipTxt, { fontFamily: "Roboto_500Medium" }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable character area — starts BELOW top bar, ends at card top */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={handleScrollEnd}
        style={[styles.charScroll, { top: TOP_BAR_H * 0.45, height: ILLUS_H - TOP_BAR_H * 0.45 }]}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={{
              width,
              alignItems: "center",
              justifyContent: "flex-end",
              height: ILLUS_H - TOP_BAR_H * 0.45,
              paddingBottom: 8,
            }}
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
            <Text style={[styles.tagTxt, { color: slide.accent, fontFamily: "Roboto_700Bold" }]}>
              {slide.tag}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontFamily: "Roboto_700Bold" }]}>
            {slide.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.sub, { fontFamily: "Roboto_400Regular" }]}>
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

          {/* CTA Button — centered on all slides */}
          {current < SLIDES.length - 1 ? (
            /* Slides 1–3 — centered arrow circle */
            <View style={styles.arrowBtnRow}>
              <TouchableOpacity
                onPress={handleNext}
                activeOpacity={0.85}
                style={[styles.arrowBtnWrap, { shadowColor: slide.accent }]}
              >
                <LinearGradient
                  colors={[slide.accent, "#FF2FBF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.arrowBtn}
                >
                  <Text style={styles.arrowBtnTxt}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Last slide — centered gradient pill */
            <View style={styles.lastCtaRow}>
              <TouchableOpacity
                onPress={handleNext}
                activeOpacity={0.87}
                style={[styles.lastCtaWrap, { shadowColor: slide.accent }]}
              >
                <LinearGradient
                  colors={[slide.accent, "#c026d3", "#FF2FBF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.lastCta}
                >
                  <View style={styles.lastIconCircle}>
                    <Text style={styles.lastIconTxt}>🔐</Text>
                  </View>
                  <Text style={[styles.lastCtaTxt, { fontFamily: "Roboto_700Bold" }]}>
                    Get Started
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Small spacer on non-last slides */}
          {current < SLIDES.length - 1 && <View style={{ height: 2 }} />}

          <View style={{ height: insets.bottom + (Platform.OS === "web" ? 16 : 6) }} />
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_RADIUS = 32;

const styles = StyleSheet.create({
  root: { flex: 1 },

  stageWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CHAR_H_FALLBACK,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  // Layered halos — top overridden inline with dynamic CHAR_ZONE_H
  halo3: {
    position: "absolute",
    width: width * 1.0,
    height: width * 1.0,
    borderRadius: width * 0.5,
    alignSelf: "center",
    top: CHAR_H_FALLBACK * 0.5 - width * 0.5,
  },
  halo2: {
    position: "absolute",
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: width * 0.41,
    alignSelf: "center",
    top: CHAR_H_FALLBACK * 0.5 - width * 0.41,
  },
  halo1: {
    position: "absolute",
    width: width * 0.64,
    height: width * 0.64,
    borderRadius: width * 0.32,
    alignSelf: "center",
    top: CHAR_H_FALLBACK * 0.5 - width * 0.32,
  },
  svgGlow: {
    position: "absolute",
    alignSelf: "center",
    top: CHAR_H_FALLBACK * 0.5 - (width * 0.9) / 2,
  },
  // Scattered decorative dots
  dot1: { position: "absolute", width: 14, height: 14, borderRadius: 7, top: "18%", left: "10%" },
  dot2: { position: "absolute", width: 9, height: 9, borderRadius: 4.5, top: "30%", left: "5%" },
  dot3: { position: "absolute", width: 12, height: 12, borderRadius: 6, top: "15%", right: "12%" },
  dot4: { position: "absolute", width: 7, height: 7, borderRadius: 3.5, top: "40%", right: "6%" },
  dot5: { position: "absolute", width: 18, height: 18, borderRadius: 9, top: "55%", left: "8%" },
  dot6: { position: "absolute", width: 10, height: 10, borderRadius: 5, top: "60%", right: "10%" },

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
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: "#FF2FBF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoIcon: { width: 44, height: 44 },
  logoTxt: { color: "#fff", fontSize: 14, letterSpacing: 1.5, lineHeight: 17 },
  logoSub: { color: "rgba(255,255,255,0.65)", fontSize: 9, letterSpacing: 2.5, lineHeight: 12 },
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
    height: ILLUS_H,
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

  // Slides 1-3 arrow-only button — centered
  arrowBtnRow: {
    alignItems: "center",
  },
  arrowBtnWrap: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 9,
  },
  arrowBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtnTxt: { color: "#fff", fontSize: 22, fontWeight: "800" },

  // Last slide — centered gradient pill, compact height
  lastCtaRow: {
    alignItems: "center",
  },
  lastCtaWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 11,
    width: width * 0.78,
  },
  lastCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 10,
    borderRadius: 16,
  },
  lastCtaTxt: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  lastIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  lastIconTxt: { fontSize: 15 },

  signinTxt: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
});
