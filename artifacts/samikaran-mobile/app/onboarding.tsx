import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: null,
    title: "Bharat ka #1\nOlympiad Platform",
    subtitle: "50,000+ students · 500+ schools · 15 subjects",
    description: "Compete nationally, earn scholarships, and claim your All India Rank from Class 1 to 12.",
    gradientColors: ["#8A2BE2", "#6a0dad"] as [string, string],
    accent: "#FF2FBF",
  },
  {
    id: "2",
    icon: "people",
    title: "Ek App,\nSabke Liye",
    subtitle: "Students · Schools · Parents · Partners",
    description: "Every role has its own tailored experience — one login, complete access to everything you need.",
    gradientColors: ["#FF2FBF", "#c9006a"] as [string, string],
    accent: "#8A2BE2",
  },
  {
    id: "3",
    icon: "eye",
    title: "AI-Powered\nProctoring",
    subtitle: "Fair · Secure · Transparent",
    description: "Advanced face detection, voice monitoring and real-time alerts ensure every exam is 100% fair.",
    gradientColors: ["#1a0a3e", "#8A2BE2"] as [string, string],
    accent: "#FF2FBF",
  },
  {
    id: "4",
    icon: "shield-checkmark",
    title: "Secure.\nSmart.\nSimple.",
    subtitle: "Enterprise-grade security",
    description: "PIN lock, session validation, biometric login, and offline exam support. Built for India's future.",
    gradientColors: ["#0D0A1E", "#1a1033"] as [string, string],
    accent: "#8A2BE2",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next });
      setCurrentIndex(next);
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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.gradientColors}
            style={[styles.slide, { width }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: item.accent + "30", borderColor: item.accent + "60" },
              ]}
            >
              {item.icon === null ? (
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name={item.icon as any} size={64} color={item.accent} />
              )}
            </View>
            <Text style={[styles.title, { fontFamily: "Inter_700Bold" }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: item.accent, fontFamily: "Inter_600SemiBold" }]}>
              {item.subtitle}
            </Text>
            <Text style={[styles.description, { fontFamily: "Inter_400Regular" }]}>
              {item.description}
            </Text>
          </LinearGradient>
        )}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            backgroundColor: "transparent",
          },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 24 : 8,
                  backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.4)",
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentIndex < SLIDES.length - 1 ? (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={[styles.skipText, { fontFamily: "Inter_500Medium" }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipBtn} />
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: "#fff" }]}
            activeOpacity={0.85}
          >
            {currentIndex < SLIDES.length - 1 ? (
              <Ionicons name="arrow-forward" size={22} color={SLIDES[currentIndex].gradientColors[0]} />
            ) : (
              <Text
                style={[
                  styles.getStartedText,
                  { color: SLIDES[currentIndex].gradientColors[0], fontFamily: "Inter_700Bold" },
                ]}
              >
                Get Started
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0A1E" },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 36,
    color: "#fff",
    textAlign: "center",
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 24,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  skipText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  getStartedText: { fontSize: 16 },
});
