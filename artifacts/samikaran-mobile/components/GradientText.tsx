import React from "react";
import { Text, StyleSheet, type TextStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

interface GradientTextProps {
  text: string;
  style?: TextStyle;
  colors?: [string, string, ...string[]];
}

export function GradientText({
  text,
  style,
  colors = ["#8A2BE2", "#FF2FBF"],
}: GradientTextProps) {
  return (
    <MaskedView maskElement={<Text style={[styles.text, style]}>{text}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[styles.text, style, styles.transparent]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: "Inter_700Bold",
  },
  transparent: {
    opacity: 0,
  },
});
