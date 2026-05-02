import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { UserRole } from "@/context/AuthContext";

interface RoleCardProps {
  role: NonNullable<UserRole>;
  label: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

export function RoleCard({ role, label, subtitle, icon, selected, onPress }: RoleCardProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.primary + "20" : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: selected ? colors.primary : colors.muted },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={22}
          color={selected ? "#fff" : colors.mutedForeground}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            { color: selected ? colors.primary : colors.foreground, fontFamily: "Inter_600SemiBold" },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {subtitle}
        </Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
