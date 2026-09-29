import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { BlurView } from "expo-blur";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "./app-text";

/**
 * Full-screen "working…" overlay: blurs the screen, blocks touches and shows
 * a spinner with a message. Render it conditionally while a request runs.
 */
export function BusyOverlay({ message }: { message: string }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="headline" align="center">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    minWidth: 220,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.lg,
    borderRadius: Radius.xl,
    alignItems: "center",
    gap: Space.sm,
  },
});
