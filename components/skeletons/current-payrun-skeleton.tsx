import { Colors, Radii } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";

export const CurrentPayrunSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.payrunCard}>
      <View style={styles.payrunHeader}>
        <View style={styles.iconPillPayrun} />
        <View style={styles.labelSkeleton} />
      </View>
      <View style={styles.valueSkeleton} />
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    payrunCard: {
      marginTop: 12,
      borderRadius: Radii.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.skeletonBg,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    payrunHeader: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      gap: 8,
    },
    iconPillPayrun: {
      width: 28,
      height: 28,
      borderRadius: Radii.full,
      backgroundColor: theme.greyBorder,
    },
    labelSkeleton: {
      height: 16,
      width: 120,
      borderRadius: Radii.xs,
      backgroundColor: theme.greyBorder,
      flexGrow: 1,
      marginLeft: 8,
    },
    valueSkeleton: {
      height: 18,
      width: 100,
      borderRadius: Radii.xs,
      backgroundColor: theme.greyBorder,
      marginTop: 8,
    },
  });
