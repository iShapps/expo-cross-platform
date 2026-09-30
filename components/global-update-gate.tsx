import { AppButton, AppText, IconBadge } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAppUpdateGate } from "@/hooks/use-app-update-gate";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export function GlobalUpdateGate() {
  const { colors, isDark } = useAppTheme();
  const {
    installedAppVersion,
    isUpdateRequired,
    openStore,
    requiredAppVersion,
    storeLink,
  } = useAppUpdateGate();

  if (!isUpdateRequired) return null;

  return (
    <View style={styles.updateContainer} pointerEvents="auto">
      <BlurView
        intensity={50}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
      <View style={[styles.updateCard, { backgroundColor: colors.surface }]}>
        <IconBadge icon="cloud-download-outline" tone="primary" size={80} />
        <AppText variant="title2" align="center">
          Update required
        </AppText>
        <AppText variant="callout" color="textSecondary" align="center">
          A newer version of iShapps Workforce is required to continue. Please update your
          app from the {Platform.OS === "ios" ? "App Store" : "Play Store"}.
        </AppText>
        <View style={[styles.versions, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.versionRow}>
            <AppText variant="footnote" color="textSecondary">
              Current version
            </AppText>
            <AppText variant="subhead">{installedAppVersion}</AppText>
          </View>
          <View style={styles.versionRow}>
            <AppText variant="footnote" color="textSecondary">
              Required version
            </AppText>
            <AppText variant="subhead" color="primaryStrong">
              {requiredAppVersion}
            </AppText>
          </View>
        </View>
        <AppButton
          title="Update app"
          icon="arrow-down-circle-outline"
          onPress={openStore}
          disabled={!storeLink}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  updateContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Space.gutter,
  },
  updateCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xxl,
    padding: Space.xl,
    paddingTop: Space.xxl,
    alignItems: "center",
    gap: Space.sm,
  },
  versions: {
    alignSelf: "stretch",
    borderRadius: Radius.md,
    padding: Space.sm,
    gap: Space.xxs,
    marginVertical: Space.xs,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
