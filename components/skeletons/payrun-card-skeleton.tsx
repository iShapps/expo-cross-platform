import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const PayrunCardSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

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

const getStyles = (colorScheme: string) => StyleSheet.create({
  card: {
    backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
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
    backgroundColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
    borderRadius: 8,
    padding: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 55,
  },
});
