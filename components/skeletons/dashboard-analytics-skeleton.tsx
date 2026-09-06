import { Colors, Radii } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const DashboardAnalyticsSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.dashboardRow}>
        {/* Available Shifts Card */}
        <View style={[styles.dashboardCard, theme.dashboardCardAvailable]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillAvailable]}>
              <SkeletonBase width={16} height={16} borderRadius={Radii.xs} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={Radii.xs} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={Radii.xs} />
        </View>

        {/* My Shifts Card */}
        <View style={[styles.dashboardCard, theme.dashboardCardMy]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillMy]}>
              <SkeletonBase width={16} height={16} borderRadius={Radii.xs} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={Radii.xs} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={Radii.xs} />
        </View>

        {/* Upcoming Shifts Card */}
        <View style={[styles.dashboardCard, theme.dashboardCardUpcoming]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillUpcoming]}>
              <SkeletonBase width={16} height={16} borderRadius={Radii.xs} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={Radii.xs} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={Radii.xs} />
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      paddingHorizontal: 0,
    },
    dashboardRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    dashboardCard: {
      borderRadius: Radii.md,
      padding: 12,
      borderWidth: 1,
      width: "31%",
      shadowColor: "#000",
      backgroundColor: theme.whiteBackground,
      borderColor: theme.greyBorder,
    },
    dashboardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    iconPill: {
      width: 28,
      height: 28,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    iconPillAvailable: {
      backgroundColor: "#E8F6D3",
    },
    iconPillMy: {
      backgroundColor: "#E7F1FF",
    },
    iconPillUpcoming: {
      backgroundColor: "#FFF3CD",
    },
  });
