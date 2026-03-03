import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const NotificationCardSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <SkeletonBase width={40} height={40} borderRadius={20} />
      </View>
      <View style={styles.content}>
        <SkeletonBase
          width="70%"
          height={14}
          borderRadius={4}
          style={styles.title}
        />
        <SkeletonBase
          width="100%"
          height={12}
          borderRadius={4}
          style={styles.message}
        />
        <SkeletonBase width="50%" height={11} borderRadius={4} />
      </View>
      <View style={styles.detailHint}>
        <SkeletonBase width={20} height={20} borderRadius={4} />
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.whiteBackground,
      borderRadius: 5,
      padding: 12,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.greyBorder,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: theme.greyBorder,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    title: {
      marginBottom: 4,
    },
    message: {
      marginBottom: 4,
    },
    detailHint: {
      alignSelf: "flex-start",
      marginLeft: 8,
      marginTop: 2,
    },
  });
