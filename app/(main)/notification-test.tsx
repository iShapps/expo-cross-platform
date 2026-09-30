import { AppButton, AppText, IconBadge } from "@/components/design";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationTestScreen() {
  const { colors } = useAppTheme();
  const [confettiKey, setConfettiKey] = React.useState(0);
  const repeatTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (repeatTimer.current) {
        clearTimeout(repeatTimer.current);
      }
    };
  }, []);

  const repeatConfetti = () => {
    repeatTimer.current = setTimeout(() => {
      setConfettiKey((key) => key + 1);
    }, 900);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ConfettiCannon
        key={confettiKey}
        count={90}
        origin={{ x: 0, y: -20 }}
        colors={["#70C601", "#FFD966", "#4A90E2", "#ff6f61", "#ffffff"]}
        explosionSpeed={420}
        fallSpeed={2800}
        fadeOut
        onAnimationEnd={repeatConfetti}
      />
      <View style={styles.content}>
        <View style={[styles.halo, { backgroundColor: colors.primarySoft }]}>
          <IconBadge icon="checkmark-done" tone="primary" size={96} />
        </View>

        <AppText variant="title1" align="center">
          Notification test complete
        </AppText>
        <AppText variant="body" color="textSecondary" align="center" style={styles.subtitle}>
          Your notifications are working correctly
        </AppText>

        <AppButton
          title="Go to dashboard"
          icon="arrow-forward"
          iconPosition="right"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Space.xl,
    paddingBottom: Space.xl,
    gap: Space.sm,
  },
  halo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Space.lg,
  },
  subtitle: {
    maxWidth: 300,
    marginBottom: Space.xl,
  },
});
