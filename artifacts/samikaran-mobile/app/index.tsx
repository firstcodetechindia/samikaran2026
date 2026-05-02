import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;
    (async () => {
      const onboarded = await AsyncStorage.getItem("samikaran_onboarding_done");
      if (!onboarded) {
        router.replace("/onboarding");
      } else if (!user) {
        router.replace("/login");
      } else {
        switch (user.role) {
          case "student": router.replace("/(student)/home"); break;
          case "school":  router.replace("/(school)/home");  break;
          case "parent":  router.replace("/(parent)/home");  break;
          case "partner": router.replace("/(partner)/home"); break;
          default:        router.replace("/login");
        }
      }
    })();
  }, [isLoading, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
