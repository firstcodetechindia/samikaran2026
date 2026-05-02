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
    accent: "#8A2BE2",
    lightAccent: "#ede9fe",
    image: require("../assets/images/onboard1.png"),
  },
  {
    id: "1",
    tag: "FOR EVERYONE",
    title: "Student. School.\nParent. Partner.",
    sub: "One app, every role — a tailored experience for all.",
    accent: "#c026d3",
    lightAccent: "#fae8ff",
    image: require("../assets/images/onboard2.png"),
  },
  {
    id: "2",
    tag: "AI POWERED",
    title: "100% Fair.\nProctored in Real-Time.",
    sub: "Face detection · Voice alerts · Auto-submit on violation",
    accent: "#0284c7",
    lightAccent: "#e0f2fe",
    image: require("../assets/images/onboard3.png"),
  },
  {
    id: "3",
    tag: "WIN BIG",
    title: "Rank. Earn.\nMake India Proud.",
    sub: "All India Rank · Scholarships · Certificates",
    accent: "#7c3aed",
    lightAccent: "#ede9fe",
    image: require("../assets/images/onboard4.png"),
  },
];

const ILLUS_SIZE = Math.min(width * 0.72, 280);

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
    illustOpacity.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) });
    illustScale.value = withTiming(0.92, { duration: 140 });
    cardY.value = withTiming(10, { duration: 120 }, () => {
      cardY.value = withSpring(0, { damping: 16, stiffness: 220 });
    });
    setTimeout(() => {
      illustScale.value = withSpring(1, { damping: 14, stiffness: 180 });
      illustOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
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
          <Text style={[styles.skipTxt, { fontFamily: "Inter_500Medium" }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable illustration area */}
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
        {SLIDES.map((s, i) => (
          <View key={s.id} style={styles.slide}>
            {/* Soft colour circle behind illustration */}
            <View style={[styles.illustBg, { backgroundColor: s.lightAccent }]} />
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

      {/* Bottom white card */}
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={[styles.handle, { backgroundColor: "#e5e7eb" }]} />

        {/* Tag pill */}
        <View style={[styles.tag, { backgroundColor: slide.lightAccent }]}>
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

        {/* Progress dots */}
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
            swipe
          </Text>
        </View>

        {/* CTA button */}
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
  skipTxt: { fontSize: 13, color: "#6b7280" },
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
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: width * 0.36,
    opacity: 0.6,
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
  title: { fontSize: 28, color: "#111827", lineHeight: 36, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },
  swipeHint: { marginLeft: 8, fontSize: 11, color: "#9ca3af", letterSpacing: 0.3 },
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.4 },
  signinTxt: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
});
