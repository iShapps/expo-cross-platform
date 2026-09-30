import { Icon } from "@/components/design";
import { elevation, Radius } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUPPORT_CHAT_ENABLED = false;

export function SupportFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  if (!SUPPORT_CHAT_ENABLED) return null;

  return (
    <Pressable
      onPress={() => router.navigate("/support-chat" as never)}
      accessibilityRole="button"
      accessibilityLabel="Support chat"
      style={({ pressed }) => [
        styles.fab,
        elevation(colors, isDark, 2),
        {
          bottom: insets.bottom + 84,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Icon name="chatbubble-ellipses" size={24} color={colors.textOnPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
