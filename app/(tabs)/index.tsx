import { fetchDashboard } from "@/api-queries/fetchers";
import ActiveCard from "@/components/active-card";
import { NotificationCard } from "@/components/notification-card";
import { useProfileData } from "@/data-store/use-account-store";
import {
  DashboardResponse,
  Notification,
  Payrun,
} from "@/data-types/dashboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { router } from "expo-router";

import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const sample_payruns: Payrun[] = [
    {
      id: "1",
      period_start: "2026-01-31T09:00:00.000Z",
      period_end: "2026-01-31T19:00:00.000Z",
      status: "ongoing",
      shift_type: "Morning",
      total_hours: 8,
      total_amount: 1000,
      location: "21 Aldwych Way, Joondalup WA, Australia",
      category_id: "1",
      category_name: "Assistant in Nursing",
      facility_id: "1",
      facility_name: "MercyCare Joondalup",
    },
  ];
  const sample_notifications: Notification[] = [
    {
      id: "1",
      type: "shift_available",
      created_at: "2023-10-01T10:00:00.000Z",
      is_read: false,
      title: "New Shift Available",
      message: "A new shift is available at MercyCare Joondalup.",
    },
    {
      id: "2",
      type: "payment",
      created_at: "2023-09-28T14:30:00.000Z",
      is_read: true,
      title: "Payment Processed",
      message: "Your payment for the last payrun has been processed.",
    },
    {
      id: "3",
      type: "shift_reminder",
      created_at: "2023-09-30T08:00:00.000Z",
      is_read: false,
      title: "Shift Reminder",
      message: "Don't forget your shift tomorrow at Brightwater Oats Street.",
    },
    {
      id: "4",
      type: "general",
      created_at: "2023-10-02T07:15:00.000Z",
      is_read: true,
      title: "Profile Updated",
      message: "Your profile details were updated successfully.",
    },
    {
      id: "5",
      type: "shift_available",
      created_at: "2023-10-02T09:45:00.000Z",
      is_read: false,
      title: "Extra Shift Added",
      message: "An extra evening shift is available at Regis Lake Park.",
    },
    {
      id: "6",
      type: "payment",
      created_at: "2023-10-03T12:10:00.000Z",
      is_read: true,
      title: "Payslip Ready",
      message: "Your payslip for the current period is ready to view.",
    },
    {
      id: "7",
      type: "shift_reminder",
      created_at: "2023-10-03T17:30:00.000Z",
      is_read: false,
      title: "Shift Starts Soon",
      message: "Your shift at Brightwater Oats Street starts in 2 hours.",
    },
    {
      id: "8",
      type: "general",
      created_at: "2023-10-04T08:05:00.000Z",
      is_read: true,
      title: "App Update",
      message: "A new version is available with performance improvements.",
    },
  ];
  const currentPayrun = sample_payruns[0];
  const { data: dashboard } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
  const dashboardData = dashboard?.data;
  const availableShifts = dashboardData?.available_shifts ?? 0;
  const scheduledShifts = dashboardData?.scheduled_shifts ?? 0;
  const upcomingShifts = dashboardData?.upcoming_shifts ?? 0;
  const weekStart = dashboardData?.week_start_date;
  const weekEnd = dashboardData?.week_end_date;
  const dashboardPayrunLabel =
    weekStart && weekEnd
      ? `Payrun: Week of ${format(new Date(weekStart), "dd MMM")} - ${format(
          new Date(weekEnd),
          "dd MMM yyyy",
        )}`
      : null;
  const payrunStart = currentPayrun
    ? format(new Date(currentPayrun.period_start), "dd MMM")
    : "";
  const payrunEnd = currentPayrun
    ? format(new Date(currentPayrun.period_end), "dd MMM yyyy")
    : "";
  const payrunLabel = dashboardPayrunLabel
    ? dashboardPayrunLabel
    : currentPayrun
      ? `Payrun: Week of ${payrunStart} - ${payrunEnd}`
      : "Payrun: --";
  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.containerTop}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Text style={styles.headerTitle}>{userDetails?.name}</Text>
            <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
              <FontAwesome6 name="location-dot" size={16} color="#FFC107" />
              <Text style={styles.headerSubtitle}>
                {userDetails?.hcp?.address}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/notifications")}
            style={styles.notificationContainer}
          >
            <MaterialIcons name="notifications" size={20} color="#fff" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.mainLandingContainer}>
        <FlatList
          data={sample_notifications}
          renderItem={({ item }) => <NotificationCard notification={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainLandingContent}
          ListHeaderComponent={
            <View>
              <View style={styles.dashboardHeader}>
                <Text style={styles.sectionLabel}>Dashboard</Text>
                <View style={styles.sectionUnderline} />
              </View>
              <View style={styles.dashboardRow}>
                <View
                  style={[styles.dashboardCard, styles.dashboardCardAvailable]}
                >
                  <View style={styles.dashboardTopRow}>
                    <View style={[styles.iconPill, styles.iconPillAvailable]}>
                      <MaterialIcons
                        name="event-available"
                        size={16}
                        color="#70C601"
                      />
                    </View>
                    <Text style={styles.dashboardValue}>{availableShifts}</Text>
                  </View>
                  <Text style={styles.dashboardTitle}>Available Shifts</Text>
                </View>
                <View style={[styles.dashboardCard, styles.dashboardCardMy]}>
                  <View style={styles.dashboardTopRow}>
                    <View style={[styles.iconPill, styles.iconPillMy]}>
                      <MaterialIcons
                        name="assignment-ind"
                        size={16}
                        color="#4A90E2"
                      />
                    </View>
                    <Text style={styles.dashboardValue}>{scheduledShifts}</Text>
                  </View>
                  <Text style={styles.dashboardTitle}>My Shifts</Text>
                </View>
                <View
                  style={[styles.dashboardCard, styles.dashboardCardUpcoming]}
                >
                  <View style={styles.dashboardTopRow}>
                    <View style={[styles.iconPill, styles.iconPillUpcoming]}>
                      <MaterialIcons
                        name="schedule"
                        size={16}
                        color="#FFC107"
                      />
                    </View>
                    <Text style={styles.dashboardValue}>{upcomingShifts}</Text>
                  </View>
                  <Text style={styles.dashboardTitle}>Upcoming Shifts</Text>
                </View>
              </View>
              <View style={styles.payrunCard}>
                <View style={styles.payrunHeader}>
                  <View style={styles.iconPillPayrun}>
                    <MaterialIcons
                      name="date-range"
                      size={16}
                      color="#70C601"
                    />
                  </View>
                  <Text style={styles.payrunLabel}>Current Payrun</Text>
                </View>
                <Text style={styles.payrunValue}>{payrunLabel}</Text>
              </View>
              <ActiveCard payrun={sample_payruns[0]} />
              <View style={styles.notificationsHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionLabel}>Notifications</Text>
                  <View style={styles.sectionUnderline} />
                </View>
                <Pressable
                  onPress={() => router.push("/(tabs)/notifications")}
                  style={styles.seeAllButton}
                  // activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={18}
                    color="#70C601"
                  />
                </Pressable>
              </View>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "#70C601",
    width: "100%",
    flex: 1,
  },
  header: {
    backgroundColor: "#70C601",
    paddingTop: 55,
    paddingBottom: 10,
    alignItems: "center",
  },
  containerTop: {
    backgroundColor: "#70C601",
    height: "20%",
    width: "100%",
    paddingTop: 55,
    paddingBottom: 10,
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 10,
    gap: 10,
  },

  mainLandingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  mainLandingContent: {
    paddingBottom: 120,
    paddingTop: 4,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
  },
  notificationContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
    borderRadius: 5,
    padding: 8,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 7,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dashboardHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  dashboardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardCard: {
    // flex: 1,
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
    borderColor: "#70C601",
  },
  dashboardCardScheduled: {
    backgroundColor: "#F0F7FF",
    borderColor: "#4A90E2",
  },
  dashboardCardMy: {
    backgroundColor: "#F0F7FF",
    borderColor: "#4A90E2",
  },
  dashboardCardUpcoming: {
    backgroundColor: "#FFF7E6",
    borderColor: "#FFC107",
  },
  dashboardTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#667085",
    marginTop: 8,
  },
  dashboardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },
  dashboardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
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
  payrunCard: {
    marginTop: 12,
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDE7D6",
    backgroundColor: "#F8FFF0",
    shadowColor: "#000",
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
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F6D3",
  },
  payrunLabel: {
    fontSize: 13,
    flexGrow: 1,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  payrunValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  notificationsHeader: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleWrap: {
    flexDirection: "column",
    gap: 6,
  },
  sectionUnderline: {
    height: 3,
    width: 48,
    borderRadius: 999,
    backgroundColor: "#70C601",
    opacity: 0.8,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70C601",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
