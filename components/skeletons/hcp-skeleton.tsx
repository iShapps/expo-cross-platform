import { Colors, Radii } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

const HcpListSkeleton = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.row}>
      <SkeletonBase style={styles.avatar} />
      <View style={styles.textBlock}>
        <SkeletonBase style={styles.nameSkeleton} />
        <SkeletonBase style={styles.professionSkeleton} />
      </View>
      <View style={styles.radioWrap}>
        <SkeletonBase style={styles.radioDot} />
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: Radii.full,
      marginRight: 12,
    },
    textBlock: {
      flex: 1,
      justifyContent: "center",
    },
    nameSkeleton: {
      width: "60%",
      height: 16,
      borderRadius: Radii.xs,
      marginBottom: 6,
    },
    professionSkeleton: {
      width: "40%",
      height: 14,
      borderRadius: Radii.xs,
    },
    radioWrap: {
      width: 22,
      height: 22,
      borderRadius: Radii.full,
      borderWidth: 2,
      borderColor: theme.greyBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: Radii.full,
    },
  });

export default HcpListSkeleton;
