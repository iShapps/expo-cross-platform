import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const DashboardAnalyticsSkeleton: React.FC = () => {
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

const styles = StyleSheet.create({
  container: {
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardCardAvailable: {
    backgroundColor: "#F8FFF0",
    borderColor: "#f0f0f0",
  },
  dashboardCardMy: {
    backgroundColor: "#F0F7FF",
    borderColor: "#f0f0f0",
  },
  dashboardCardUpcoming: {
    backgroundColor: "#FFF7E6",
    borderColor: "#f0f0f0",
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
