import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

const FacilityCardSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroContent}>
        <SkeletonBase width={120} height={18} style={styles.heroName} />
        <View style={styles.heroText}>
          <SkeletonBase width={16} height={16} style={{ borderRadius: 8 }} />
          <SkeletonBase width={90} height={14} style={styles.heroMeta} />
        </View>
        <View style={styles.heroText}>
          <SkeletonBase width={16} height={16} style={{ borderRadius: 8 }} />
          <SkeletonBase width={110} height={14} style={styles.heroMeta} />
        </View>
        <View style={styles.heroText}>
          <SkeletonBase width={14} height={14} style={{ borderRadius: 7 }} />
          <SkeletonBase width={60} height={14} style={styles.heroMeta} />
        </View>
      </View>
    </View>
  );
};

export default FacilityCardSkeleton;

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    heroCard: {
      marginTop: 8,
      backgroundColor: theme.heroBg,
      borderRadius: 5,
      padding: 10,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    heroText: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 5,
    },
    heroName: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 2,
    },
    heroMeta: {
      fontSize: 12,
      marginTop: 2,
    },
  });
