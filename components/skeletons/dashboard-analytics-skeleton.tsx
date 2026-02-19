import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const DashboardAnalyticsSkeleton: React.FC = () => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.container}>
      <View style={styles.dashboardRow}>
        {/* Available Shifts Card */}
        <View style={[styles.dashboardCard, styles.dashboardCardAvailable]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillAvailable]}>
              <SkeletonBase width={16} height={16} borderRadius={4} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={4} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={4} />
        </View>

        {/* My Shifts Card */}
        <View style={[styles.dashboardCard, styles.dashboardCardMy]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillMy]}>
              <SkeletonBase width={16} height={16} borderRadius={4} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={4} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={4} />
        </View>

        {/* Upcoming Shifts Card */}
        <View style={[styles.dashboardCard, styles.dashboardCardUpcoming]}>
          <View style={styles.dashboardTopRow}>
            <View style={[styles.iconPill, styles.iconPillUpcoming]}>
              <SkeletonBase width={16} height={16} borderRadius={4} />
            </View>
            <SkeletonBase width={35} height={22} borderRadius={4} />
          </View>
          <SkeletonBase width="80%" height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const getStyles = (colorScheme: string) => StyleSheet.create({
  container: {
    backgroundColor: colorScheme === "dark" ? "#232A2E" : undefined,
    paddingHorizontal: 0,
  },
  dashboardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardCard: {
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    width: "31.5%",
    shadowColor: "#000",
    backgroundColor: colorScheme === "dark" ? "#232A2E" : undefined,
    borderColor: colorScheme === "dark" ? "#36454F" : undefined,
  },
  dashboardCardAvailable: {
    backgroundColor: colorScheme === "dark" ? "#232A2E" : undefined,
    borderColor: colorScheme === "dark" ? "#70C601" : undefined,
  },
  dashboardCardMy: {
    backgroundColor: colorScheme === "dark" ? "#232A2E" : undefined,
    borderColor: colorScheme === "dark" ? "#4A90E2" : undefined,
  },
  dashboardCardUpcoming: {
    backgroundColor: colorScheme === "dark" ? "#2E2E2E" : undefined,
    borderColor: colorScheme === "dark" ? "#FFD600" : undefined,
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
    borderRadius: 999,
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
