import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const ShiftCardBaseSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <SkeletonBase width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.dateContainer}>
        <View style={styles.dateCard}>
          <SkeletonBase width={40} height={20} borderRadius={3} />
          <View style={{ height: 4 }} />
          <SkeletonBase width={40} height={18} borderRadius={3} />
        </View>
      </View>
      <View style={styles.mainContent}>
        <SkeletonBase width="70%" height={14} borderRadius={4} />
        <SkeletonBase width="50%" height={12} borderRadius={4} />
        <View style={styles.spacer} />
        <SkeletonBase width="80%" height={12} borderRadius={4} />
        <SkeletonBase width="75%" height={12} borderRadius={4} />
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.whiteBackground,
      borderRadius: 5,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.activeBorder,
      display: "flex",
      flexDirection: "row",
      width: "100%",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 14,
      position: "relative",
    },
    headerRow: {
      position: "absolute",
      right: -3,
      top: -8,
      zIndex: 100,
    },
    dateContainer: {
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
    },
    dateCard: {
      backgroundColor: theme.greyBorder,
      borderRadius: 5,
      padding: 4,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: 55,
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    spacer: {
      height: 4,
    },
  });
