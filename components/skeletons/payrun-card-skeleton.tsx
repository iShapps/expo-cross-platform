import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const PayrunCardSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.mainContent}>
        <SkeletonBase width="60%" height={14} borderRadius={4} />
        <SkeletonBase width="40%" height={12} borderRadius={4} />
        <View style={styles.spacer} />
        <SkeletonBase width="80%" height={12} borderRadius={4} />
        <SkeletonBase width="70%" height={12} borderRadius={4} />
      </View>
      <View style={styles.dateCard}>
        <SkeletonBase width={40} height={20} borderRadius={3} />
        <View style={{ height: 4 }} />
        <SkeletonBase width={40} height={18} borderRadius={3} />
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
      borderColor: theme.greyBorder,
      display: "flex",
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      gap: 14,
      marginBottom: 8,
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
    dateCard: {
      backgroundColor: theme.greyBorder,
      borderRadius: 8,
      padding: 4,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: 55,
    },
  });
