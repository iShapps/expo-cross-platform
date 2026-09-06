import { Colors, Radii } from "@/constants/theme";
import { useAppUpdateGate } from "@/hooks/use-app-update-gate";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export function GlobalUpdateGate() {
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
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
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlayTint} />
      <View style={styles.updateCard}>
        <View style={styles.updateIconWrap}>
          <MaterialIcons name="system-update" size={40} color={theme.primary} />
        </View>
        <Text style={styles.updateTitle}>Update Required</Text>
        <Text style={styles.updateBody}>
          A newer version of iShapps is required to continue. Please update your
          app from the {Platform.OS === "ios" ? "App Store" : "Play Store"}.
        </Text>
        <Text style={styles.updateMeta}>
          Current version: {installedAppVersion}
        </Text>
        <Text style={styles.updateMeta}>
          Required version: {requiredAppVersion}
        </Text>
        <Pressable
          onPress={openStore}
          style={styles.updateButton}
          disabled={!storeLink}
        >
          <Text style={styles.updateButtonText}>Update App</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    updateContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      elevation: 1000,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    overlayTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${theme.background}66`,
    },
    updateCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: Radii.lg,
      paddingHorizontal: 22,
      paddingVertical: 26,
      alignItems: "center",
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    updateIconWrap: {
      width: 72,
      height: 72,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroIconBg,
      marginBottom: 16,
    },
    updateTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.primaryText,
      marginBottom: 10,
    },
    updateBody: {
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      color: theme.secondaryText,
      marginBottom: 14,
    },
    updateMeta: {
      fontSize: 13,
      color: theme.tertiaryText,
      marginBottom: 4,
    },
    updateButton: {
      marginTop: 18,
      width: "100%",
      borderRadius: Radii.sm,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      opacity: 1,
    },
    updateButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.white,
    },
  });
