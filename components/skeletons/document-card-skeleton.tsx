import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";

export const DocumentCardSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.iconSkeleton} />
      <View style={styles.infoColumn}>
        <View style={styles.lineSmall} />
        <View style={styles.lineLargeRow}>
          <View style={styles.lineLarge} />
          <View style={styles.circleSkeleton} />
        </View>
        <View style={styles.lineSmallRow}>
          <View style={styles.lineSmall} />
          <View style={styles.dotSkeleton} />
          <View style={styles.lineSmall} />
        </View>
      </View>
      <View style={styles.moreIconSkeleton} />
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.whiteBackground,
      borderRadius: 5,
      padding: 5,
      borderColor: theme.greyBorder,
      borderWidth: 1,
      minHeight: 56,
    },
    iconSkeleton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.greyBorder,
      marginRight: 16,
      marginLeft: 2,
    },
    infoColumn: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
    },
    lineSmall: {
      height: 10,
      width: 80,
      backgroundColor: theme.greyBorder,
      borderRadius: 4,
      marginBottom: 6,
      marginLeft: 2,
    },
    lineLargeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    lineLarge: {
      height: 16,
      width: 120,
      backgroundColor: theme.greyBorder,
      borderRadius: 4,
      marginRight: 8,
    },
    circleSkeleton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.greyBorder,
    },
    lineSmallRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
      gap: 4,
    },
    dotSkeleton: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.greyBorder,
      marginHorizontal: 3,
      marginTop: -1,
    },
    moreIconSkeleton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.greyBorder,
      marginLeft: 8,
      alignSelf: "flex-start",
    },
  });
