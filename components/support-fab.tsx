import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUPPORT_CHAT_ENABLED = false;

export function SupportFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];

  if (!SUPPORT_CHAT_ENABLED) return null;

  return (
    <TouchableOpacity
      onPress={() => router.navigate("/support-chat" as never)}
      activeOpacity={0.85}
      style={[
        styles.fab,
        {
          bottom: insets.bottom + 84,
          backgroundColor: theme.primary,
        },
      ]}
    >
      <Ionicons name="chatbubble-ellipses" size={24} color={theme.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
