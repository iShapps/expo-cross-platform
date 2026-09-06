import { NotificationCard } from "@/components/notification-card";
import {
  CurrentPayrunSkeleton,
  DashboardAnalyticsSkeleton,
  NotificationCardSkeleton,
} from "@/components/skeletons";
import { useProfileData } from "@/data-store/use-account-store";
import { DashboardResponse } from "@/data-types/dashboard";
import { useLocation } from "@/hooks/use-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";

import { getHCPDashboard } from "@/api-queries/dashboard";
import { getNotifications } from "@/api-queries/notifcations";
import { Colors, Radii } from "@/constants/theme";
import { useConfigSettings } from "@/data-store/config-store";
import { User } from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useOneSignalSubscriptionStatus } from "@/hooks/use-one-signal";
import { getAvatarImageSource } from "@/utils/auth";
import { getRegistrationStatus, TokenStorage } from "@/utils/auth-api";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { useSession } from "../ctx";

const WalkthroughableView = walkthroughable(View);

export default function HomeScreen() {
  // const { expoPushToken, notification } = usePushNotifications();
  const { retryNotificationSetup, updateHcp } = useSession();
  const { isChecking, isSetup, refresh } = useOneSignalSubscriptionStatus();
  const { requestPermission } = useLocation();
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const queryClient = useQueryClient();
  const configSettings = useConfigSettings();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => getHCPDashboard(),
    gcTime: 1000 * 60 * 60, // 1 hour
    staleTime: 0, // always stale
    refetchInterval: 30 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: "always",
    enabled: !!userDetails?.id,
  });

  const { data: hcpStatusSync } = useQuery({
    queryKey: ["hcp-status-sync"],
    queryFn: async () => {
      const token = await TokenStorage.getToken();
      const hcpId = userDetails?.hcp?.id;
      if (!token || !hcpId) return null;
      return getRegistrationStatus(token, hcpId);
    },
    gcTime: 1000 * 60 * 60,
    staleTime: 0,
    refetchInterval: 30 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: "always",
    enabled: !!userDetails?.hcp?.id,
  });

  useEffect(() => {
    const freshStatus = hcpStatusSync?.data?.hcp_status;
    if (
      freshStatus &&
      userDetails?.hcp &&
      freshStatus !== userDetails.hcp.status
    ) {
      updateHcp({ status: freshStatus });
    }
  }, [hcpStatusSync, userDetails, updateHcp]);

  const isFocused = useIsFocused();

  useFirstVisitTour(
    "dashboard",
    isFocused && !dashboardLoading && !!userDetails,
  );

  const handleRetryNotificationsSetup = async () => {
    try {
      const didSetup = await retryNotificationSetup();
      await refresh();

      if (!didSetup) {
        // Alert.alert(
        //   "Notifications Setup Failed",
        //   "We couldn't register this device for push notifications. Please allow notifications and try again.",
        //   [{ text: "OK" }],
        // );
      }
    } catch (error) {
      console.error("Failed to retry notification setup:", error);
      // Alert.alert(
      //   "Notifications Setup Failed",
      //   "We couldn't register this device for push notifications. Please try again.",
      //   [{ text: "OK" }],
      // );
    } finally {
    }
  };

  useEffect(() => {
    if (isChecking) return;

    const needsSetup = !isSetup;
    const needsDeviceId = !userDetails?.device_id;

    if (needsSetup || needsDeviceId) {
      handleRetryNotificationsSetup();
    }
  }, [isChecking, isSetup, userDetails?.device_id]);

  useFocusEffect(
    useCallback(() => {
      if (!userDetails?.id) return;
      void refetchDashboard();
    }, [refetchDashboard, userDetails?.id]),
  );

  // Hydrate React Query cache with Zustand userDetails on load
  useEffect(() => {
    if (!userDetails) return;

    queryClient.setQueryData<User | undefined>(["profile-details"], (old) => {
      if (JSON.stringify(old) === JSON.stringify(userDetails)) {
        return old;
      }
      return userDetails;
    });
  }, [queryClient, userDetails]);

  const {
    data,
    isLoading: notificationsLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // error: notificationsError,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.hcps;
      if (!pagination) return undefined;
      if (pagination.current_page < pagination.last_page) {
        return pagination.current_page + 1;
      }
      return undefined;
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    refetchIntervalInBackground: true,
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const notifications =
    data?.pages.flatMap((page) => page?.data?.hcps?.data ?? []) ?? [];

  const dashboardData = dashboard?.data;
  const availableShifts = dashboardData?.available_shifts ?? 0;
  const scheduledShifts = dashboardData?.scheduled_shifts ?? 0;
  const upcomingShifts = dashboardData?.upcoming_shifts ?? 0;
  const periodStart = dashboardData?.period_start;
  const periodEnd = dashboardData?.period_end;
  const periodLabel =
    dashboardData?.payroll_frequency === "fortnightly" ? "Fortnight" : "Week";

  const dashboardPayrunLabel =
    periodStart && periodEnd
      ? `Payrun: ${periodLabel} of ${format(
          new Date(periodStart),
          "dd MMM",
        )} - ${format(new Date(periodEnd), "dd MMM yyyy")}`
      : null;
  const payrunLabel = dashboardPayrunLabel
    ? dashboardPayrunLabel
    : "Payrun: --";

  const cutoffTimeRaw = dashboardData?.payroll_cutoff_time;
  const formattedCutoffTime = cutoffTimeRaw
    ? format(parse(cutoffTimeRaw, "HH:mm:ss", new Date()), "h:mm a")
    : "5:00 PM";

  const cutoffDayRaw = dashboardData?.payroll_cutoff_day;
  const formattedCutoffDay = cutoffDayRaw
    ? cutoffDayRaw.charAt(0).toUpperCase() + cutoffDayRaw.slice(1).toLowerCase()
    : periodEnd
      ? format(new Date(periodEnd), "dd MMM")
      : null;

  const payrunDisclaimer = formattedCutoffDay
    ? `Only shifts completed by ${formattedCutoffTime} on ${formattedCutoffDay} are included.`
    : "";

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handlePullToRefresh = async () => {
    // refetch dashboard data
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // ...styles now come from getStyles(theme)

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
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 8,
              flex: 1,
              marginRight: 5,
            }}
          >
            {userDetails && (
              <Image
                source={{
                  uri: getAvatarImageSource(
                    userDetails.hcp,
                    configSettings?.configSettings?.image_path?.hcp_path ?? "",
                  ),
                }}
                style={styles.avatarImage}
              />
            )}
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Text style={styles.headerTitle}>{userDetails?.name}</Text>
              <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                <FontAwesome6 name="briefcase" size={16} color="#FFC107" />
                <Text
                  style={styles.headerSubtitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {userDetails?.hcp?.hcp_professions
                    ?.map((prfession) => prfession?.profession?.name ?? "—")
                    .join(" | ") ?? "—"}
                </Text>
              </View>
            </View>
          </View>
          <CopilotStep
            name="dashboard-notifications"
            order={2}
            active={isFocused}
            text="This is where shift updates, approvals, and reminders land. The dot means something's waiting for you."
          >
            <WalkthroughableView>
              <Pressable
                onPress={() => router.push("/(main)/notifications")}
                style={styles.notificationContainer}
              >
                <MaterialIcons name="notifications" size={20} color="#fff" />

                {notifications.length > 0 && (
                  <View style={styles.notificationDot} />
                )}
              </Pressable>
            </WalkthroughableView>
          </CopilotStep>
        </View>

        {userDetails?.hcp?.status === "pending-approval" && (
          <CopilotStep
            name="dashboard-pending-approval"
            order={3}
            active={isFocused}
            text="You're almost set up — once your documents are reviewed and your account's approved, you'll be able to accept shifts."
          >
            <WalkthroughableView style={styles.pendingApprovalBanner}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={18}
                color={theme.white}
              />
              <Text style={styles.pendingApprovalText}>
                Your account is pending approval. You&apos;ll be notified once
                it has been reviewed.
              </Text>
            </WalkthroughableView>
          </CopilotStep>
        )}
      </View>

      {/* CONTENT */}

      <View style={styles.dashboardContainer}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.overviewLabel}>Overview</Text>
          <View style={styles.sectionUnderline} />
        </View>
        {dashboardLoading ? (
          <DashboardAnalyticsSkeleton />
        ) : (
          <CopilotStep
            name="dashboard-stats"
            order={1}
            active={isFocused}
            text={
              '"Available" shows open shifts you can pick up, "Upcoming" shows shifts starting soon, and "My Shifts" is everything on your schedule. Tap any card to jump straight there.'
            }
          >
            <WalkthroughableView style={styles.dashboardRow}>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/shifts")}
                style={[styles.dashboardCard, theme.dashboardCardAvailable]}
              >
                <View style={styles.dashboardTopRow}>
                  <View style={[styles.iconPill, styles.iconPillAvailable]}>
                    <MaterialIcons
                      name="event-available"
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={styles.dashboardValue}>{availableShifts}</Text>
                </View>
                <Text style={styles.dashboardTitle}>Available</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/schedules",
                    params: { activeTab: "scheduled" },
                  })
                }
                style={[styles.dashboardCard, theme.dashboardCardUpcoming]}
              >
                <View style={styles.dashboardTopRow}>
                  <View style={[styles.iconPill, styles.iconPillUpcoming]}>
                    <MaterialIcons name="schedule" size={16} color="#FFC107" />
                  </View>
                  <Text style={styles.dashboardValue}>{upcomingShifts}</Text>
                </View>
                <Text style={styles.dashboardTitle}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/schedules")}
                style={[styles.dashboardCard, theme.dashboardCardMy]}
              >
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
              </TouchableOpacity>
            </WalkthroughableView>
          </CopilotStep>
        )}

        {dashboardLoading ? (
          <CurrentPayrunSkeleton />
        ) : (
          <View style={styles.payrunCard}>
            <View style={styles.payrunHeader}>
              <View style={styles.iconPillPayrun}>
                <MaterialIcons
                  name="date-range"
                  size={16}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.payrunValue}>{payrunLabel}</Text>
              {/* <Text style={styles.payrunLabel}>Current Payrun</Text> */}
            </View>
            <Text style={styles.payrunDisclaimer}>{payrunDisclaimer}</Text>
          </View>
        )}

        {/* <ActiveCard payrun={sample_payruns[0]} /> */}
      </View>
      <View style={styles.mainLandingContainer}>
        <View style={styles.notificationsHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionLabel}>Notifications</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(main)/notifications")}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <MaterialIcons
              name="chevron-right"
              size={18}
              color={theme.activeText}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={notificationsLoading ? [...Array(6)] : notifications}
          renderItem={
            notificationsLoading
              ? () => <NotificationCardSkeleton />
              : ({ item }) => <NotificationCard notification={item} />
          }
          keyExtractor={
            notificationsLoading
              ? (_, idx) => `skeleton-${idx}`
              : (item) => String(item.id)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 10,
            flexGrow: 1,
            gap: 10,
          }}
          refreshing={isFetchingNextPage}
          onRefresh={handlePullToRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            !notificationsLoading && isFetchingNextPage ? (
              <View style={{ gap: 10, paddingTop: 10 }}>
                <NotificationCardSkeleton />
                <NotificationCardSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !notificationsLoading && !isError && notifications.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="calendar-remove-outline"
                  size={72}
                  color={theme.mutedText}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.activeText,
                    marginBottom: 8,
                  }}
                >
                  No Notifications Yet
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: theme.secondaryText,
                    textAlign: "center",
                    maxWidth: 260,
                  }}
                >
                  There&apos;s no notifications for this the moment. Check back
                  later
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    mainContainer: {
      backgroundColor: theme.whiteBackground,
      width: "100%",
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
    },
    header: {
      backgroundColor: theme.primary,
      paddingTop: 55,
      paddingBottom: 10,
      alignItems: "center",
    },
    containerTop: {
      backgroundColor: theme.background,
      minHeight: "12%",
      width: "100%",
      paddingTop: 55,
      paddingBottom: 2,
      display: "flex",
      flexDirection: "column",
      paddingHorizontal: 10,
      gap: 10,
      borderBottomColor: theme.whiteBackground,
      borderBottomWidth: 0.5,
    },
    pendingApprovalBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      width: "100%",
      backgroundColor: "rgba(255,140,26,0.35)",
      borderWidth: 1,
      borderColor: "rgba(255,140,26,0.6)",
      borderRadius: Radii.sm,
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    pendingApprovalText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.white,
    },
    dashboardContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      backgroundColor: theme.background,
      paddingHorizontal: 10,
      paddingBottom: 20,
      marginBottom: 5,
    },
    mainLandingContainer: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      width: "100%",
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
      color: theme.white,
    },
    headerSubtitle: {
      fontSize: 12.5,
      color: theme.white,
      flexWrap: "wrap", // allow wrapping
      flexShrink: 1, // prevent overflow
      maxWidth: "96%",
    },
    notificationContainer: {
      backgroundColor: theme.notificationFaint,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      flexDirection: "row",
      borderRadius: Radii.sm,
      padding: 8,
      position: "relative",
    },
    notificationDot: {
      position: "absolute",
      top: 7,
      right: 11,
      width: 6,
      height: 6,
      borderRadius: Radii.full,
      backgroundColor: theme.danger,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.secondaryText,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    overviewLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.white,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dashboardHeader: {
      marginTop: 16,
      marginBottom: 8,
    },
    dashboardRow: {
      flexDirection: "row",
      // flexWrap: "wrap",
      gap: 10,
    },
    dashboardCard: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      borderRadius: Radii.md,
      padding: 12,
      borderWidth: 1,
      width: "31%",
      minHeight: 110,
      gap: 6,
    },
    dashboardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.secondaryText,
      marginTop: 8,
    },
    dashboardValue: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.primaryText,
    },
    dashboardTopRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconPill: {
      width: 28,
      height: 28,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroIconBg,
    },
    iconPillAvailable: {
      backgroundColor: theme.heroIconBg,
    },
    iconPillMy: {
      backgroundColor: theme.heroIconBg,
    },
    iconPillUpcoming: {
      backgroundColor: theme.heroIconBg,
    },
    payrunCard: {
      marginTop: 5,
      borderRadius: Radii.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.heroBorder,
      backgroundColor: theme.heroBg,
      shadowColor: theme.background,
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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroIconBg,
    },
    payrunLabel: {
      fontSize: 13,
      flexGrow: 1,
      fontWeight: "700",
      color: theme.primaryText,
      marginBottom: 4,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    payrunValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primaryText,
    },
    payrunDisclaimer: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 18,
      color: theme.secondaryText,
      fontStyle: "italic",
    },
    notificationsHeader: {
      marginTop: 8,
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
      height: 1,
      width: 48,
      marginTop: 8,
      borderRadius: Radii.full,
      backgroundColor: theme.whiteBackground,
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
      color: theme.activeText,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    avatarImage: {
      height: 50,
      width: 50,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.white,
    },
  });
