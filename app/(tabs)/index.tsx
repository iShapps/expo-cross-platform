import {
  AppText,
  Avatar,
  EmptyState,
  GradientFill,
  Icon,
  IconBadge,
  IconButton,
  OrgLogo,
  PressableCard,
  SectionHeader,
  type IconName,
} from "@/components/design";
import { NotificationCard } from "@/components/notification-card";
import { NotificationCardSkeleton, SkeletonBase } from "@/components/skeletons";
import { useProfileData } from "@/data-store/use-account-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { DashboardResponse } from "@/data-types/dashboard";
import { useLocation } from "@/hooks/use-location";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { router } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";

import { getHCPDashboard } from "@/api-queries/dashboard";
import { getNotifications } from "@/api-queries/notifcations";
import {
  Radius,
  Space,
  Touch,
  type AppColors,
  type Tone,
} from "@/constants/design";
import { User } from "@/data-types/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useMissingDocuments } from "@/hooks/use-missing-documents";
import { useAgreements } from "@/hooks/use-agreements";
import { useOneSignalSubscriptionStatus } from "@/hooks/use-one-signal";
import { getAvatarImageSource } from "@/utils/auth";
import { getRegistrationStatus, TokenStorage } from "@/utils/auth-api";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../ctx";

const WalkthroughableView = walkthroughable(View);

export default function HomeScreen() {
  // const { expoPushToken, notification } = usePushNotifications();
  const { retryNotificationSetup, updateHcp } = useSession();
  const { isChecking, isSetup, refresh } = useOneSignalSubscriptionStatus();
  const { requestPermission } = useLocation();
  const { colors, isDark } = useAppTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const organizationName = useTenantStore((state) => state.tenant?.name);
  const organizationLogoUrl = useTenantStore((state) => state.tenant?.logoUrl);
  const queryClient = useQueryClient();

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

    // The onboarding gate follows the server: an HCP still onboarding who
    // gets new requirements goes back to onboarding now, not at next login.
    // Registered HCPs stay "0" on the server, so this never locks them out
    // (new documents show in Documents → Missing instead).
    const freshScreen = hcpStatusSync?.data?.registration_screen;
    if (
      freshScreen != null &&
      userDetails?.hcp &&
      String(freshScreen) !== String(userDetails.hcp.app_registration_screen)
    ) {
      updateHcp({ app_registration_screen: String(freshScreen) });
    }
  }, [hcpStatusSync, userDetails, updateHcp]);

  const { actionCount: missingDocuments } = useMissingDocuments();
  const { toSignCount: agreementsToSign } = useAgreements();

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

  const payrunRange =
    periodStart && periodEnd
      ? `${format(new Date(periodStart), "d MMM")} – ${format(
          new Date(periodEnd),
          "d MMM yyyy",
        )}`
      : "Not available yet";
  const payrunPeriod = periodLabel === "Fortnight" ? "Fortnightly" : "Weekly";

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

  // ─── Presentation only below this line ──────────────────────────────────

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = userDetails?.name?.trim().split(/\s+/)[0] ?? "there";
  const avatarUri = userDetails?.hcp
    ? getAvatarImageSource(userDetails.hcp)
    : undefined;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(isDark ? "light" : "dark");
    }, [isDark]),
  );

  // A solid bar fades in behind the status bar once the hero scrolls away.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [heroHeight, setHeroHeight] = useState(0);
  const fadeEnd = Math.max(1, heroHeight - insets.top);
  const statusBackdropOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, fadeEnd - 48), fadeEnd],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stats: {
    key: string;
    label: string;
    value: number;
    icon: IconName;
    tone: Tone;
    onPress: () => void;
  }[] = [
    {
      key: "available",
      label: "Available",
      value: availableShifts,
      icon: "flash-outline",
      tone: "primary",
      onPress: () => router.push("/(tabs)/shifts"),
    },
    {
      key: "upcoming",
      label: "Upcoming",
      value: upcomingShifts,
      icon: "time-outline",
      tone: "amber",
      onPress: () =>
        router.push({
          pathname: "/(tabs)/schedules",
          params: { activeTab: "scheduled" },
        }),
    },
    {
      key: "mine",
      label: "My Shifts",
      value: scheduledShifts,
      icon: "calendar-outline",
      tone: "blue",
      onPress: () => router.push("/(tabs)/schedules"),
    },
  ];

  const header = (
    <View>
      {/* HERO */}
      <View
        style={styles.heroWrap}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        {/* Fills the iOS pull-down bounce area above the hero */}
        <View style={styles.heroOverscroll} />
        <View style={[styles.hero, { paddingTop: insets.top + Space.sm }]}>
          <GradientFill colors={colors.heroGradient} />
          <View style={[styles.heroOrb, styles.heroOrbLarge]} />
          <View style={[styles.heroOrb, styles.heroOrbSmall]} />

          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your account"
              hitSlop={8}
              onPress={() => router.push("/(main)/profile")}
            >
              <Avatar name={userDetails?.name} uri={avatarUri} size={52} ring />
            </Pressable>
            <View style={styles.heroGreeting}>
              <AppText variant="footnote" style={styles.onHeroMuted}>
                {greeting},
              </AppText>
              <AppText variant="title2" style={styles.onHero} numberOfLines={1}>
                {firstName}
              </AppText>
            </View>
            <CopilotStep
              name="dashboard-notifications"
              order={2}
              active={isFocused}
              text="This is where shift updates, approvals, and reminders land. The dot means something's waiting for you."
            >
              <WalkthroughableView>
                <IconButton
                  icon="notifications-outline"
                  accessibilityLabel="Notifications"
                  variant="glass"
                  badge={notifications.length > 0}
                  onPress={() => router.push("/(main)/notifications")}
                />
              </WalkthroughableView>
            </CopilotStep>
          </View>

          <View style={styles.orgPill}>
            {organizationLogoUrl ? (
              // Only for a real logo — OrgLogo's own no-image fallback tile
              // is brand-green, which would nearly disappear against this
              // same-toned hero. The plain icon below covers that case.
              <OrgLogo
                name={organizationName}
                uri={organizationLogoUrl}
                size={16}
              />
            ) : (
              <Icon name="business-outline" size={14} color={colors.onHero} />
            )}
            <AppText variant="caption" style={styles.onHero} numberOfLines={1}>
              {organizationName ?? "—"}
            </AppText>
          </View>

          {/* PAYRUN */}
          <View style={styles.payrunCard}>
            <View style={styles.payrunRow}>
              <View style={styles.payrunIcon}>
                <Icon name="wallet-outline" size={20} color={colors.onHero} />
              </View>
              <View style={styles.payrunText}>
                <AppText variant="overline" style={styles.onHeroMuted}>
                  Current payrun · {payrunPeriod}
                </AppText>
                {dashboardLoading ? (
                  <View style={styles.heroPlaceholder} />
                ) : (
                  <AppText variant="title3" style={styles.onHero}>
                    {payrunRange}
                  </AppText>
                )}
              </View>
            </View>
            {!!payrunDisclaimer && !dashboardLoading && (
              <View style={styles.payrunFooter}>
                <Icon
                  name="alarm-outline"
                  size={14}
                  color={colors.onHeroMuted}
                />
                <AppText
                  variant="caption"
                  style={[styles.onHeroMuted, styles.payrunDisclaimer]}
                >
                  {payrunDisclaimer}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* STATS — overlap the hero's bottom edge */}
      <CopilotStep
        name="dashboard-stats"
        order={1}
        active={isFocused}
        text={
          '"Available" shows open shifts you can pick up, "Upcoming" shows shifts starting soon, and "My Shifts" is everything on your schedule. Tap any card to jump straight there.'
        }
      >
        <WalkthroughableView style={styles.statsRow}>
          {stats.map((stat) => (
            <PressableCard
              key={stat.key}
              onPress={stat.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              padding={Space.sm + 2}
              raised
              style={styles.statTile}
            >
              <IconBadge icon={stat.icon} tone={stat.tone} size={36} />
              {dashboardLoading ? (
                <SkeletonBase
                  width={44}
                  height={34}
                  borderRadius={Radius.xs}
                  style={styles.statValue}
                />
              ) : (
                <AppText variant="display" style={styles.statValue}>
                  {stat.value}
                </AppText>
              )}
              <AppText
                variant="subhead"
                color="textSecondary"
                numberOfLines={1}
              >
                {stat.label}
              </AppText>
            </PressableCard>
          ))}
        </WalkthroughableView>
      </CopilotStep>

      {/* "pending-approval" is the pre-rename status (older sessions). */}
      {(userDetails?.hcp?.status === "onboarding" ||
        userDetails?.hcp?.status === "pending-approval") && (
        <CopilotStep
          name="dashboard-pending-approval"
          order={3}
          active={isFocused}
          text="You're almost set up — once your documents are reviewed and your account's approved, you'll be able to accept shifts."
        >
          <WalkthroughableView style={styles.pendingCard}>
            <IconBadge icon="hourglass-outline" tone="warning" size={40} />
            <View style={styles.pendingText}>
              <AppText variant="headline">Almost there</AppText>
              <AppText variant="footnote" color="textSecondary">
                We&apos;re reviewing your profile and documents. You&apos;ll be notified once you&apos;re approved.
              </AppText>
            </View>
          </WalkthroughableView>
        </CopilotStep>
      )}

      {/* Was active; a document expired, was rejected or is newly required. Back to active once it's approved. */}
      {userDetails?.hcp?.status === "on-hold" && (
        <PressableCard
          onPress={() =>
            router.navigate({ pathname: "/(tabs)/documents", params: { tab: "missing" } })
          }
          accessibilityRole="button"
          accessibilityLabel="Your account is on hold. Update your documents."
          radius={Radius.xl}
          padding={Space.md}
          style={styles.missingCard}
        >
          <IconBadge icon="pause-circle-outline" tone="warning" size={40} />
          <View style={styles.pendingText}>
            <AppText variant="headline">Your account is on hold</AppText>
            <AppText variant="footnote" color="textSecondary">
              A document needs updating. Upload it and you&apos;ll be back to work once it&apos;s approved.
            </AppText>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </PressableCard>
      )}

      {missingDocuments > 0 && (
        <PressableCard
          onPress={() =>
            router.navigate({ pathname: "/(tabs)/documents", params: { tab: "missing" } })
          }
          accessibilityRole="button"
          accessibilityLabel={`${missingDocuments} documents need your attention`}
          radius={Radius.xl}
          padding={Space.md}
          style={styles.missingCard}
        >
          <IconBadge icon="document-attach-outline" tone="danger" size={40} />
          <View style={styles.pendingText}>
            <AppText variant="headline">
              {missingDocuments === 1
                ? "1 document needs your attention"
                : `${missingDocuments} documents need your attention`}
            </AppText>
            <AppText variant="footnote" color="textSecondary">
              Upload them to keep working every profession you hold.
            </AppText>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </PressableCard>
      )}

      {agreementsToSign > 0 && (
        <PressableCard
          onPress={() => router.push("/(main)/agreements")}
          accessibilityRole="button"
          accessibilityLabel={`${agreementsToSign} agreements to sign`}
          radius={Radius.xl}
          padding={Space.md}
          style={styles.missingCard}
        >
          <IconBadge icon="create-outline" tone="blue" size={40} />
          <View style={styles.pendingText}>
            <AppText variant="headline">
              {agreementsToSign === 1 ? "1 agreement to sign" : `${agreementsToSign} agreements to sign`}
            </AppText>
            <AppText variant="footnote" color="textSecondary">
              Read it in the app and sign with your finger.
            </AppText>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </PressableCard>
      )}

      <SectionHeader
        title="Recent activity"
        actionLabel="See all"
        onAction={() => router.push("/(main)/notifications")}
        style={styles.sectionHeader}
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <Animated.FlatList
        data={notificationsLoading ? [...Array(6)] : notifications}
        renderItem={
          notificationsLoading
            ? () => (
                <View style={styles.gutter}>
                  <NotificationCardSkeleton />
                </View>
              )
            : ({ item }) => (
                <View style={styles.gutter}>
                  <NotificationCard notification={item} />
                </View>
              )
        }
        keyExtractor={
          notificationsLoading
            ? (_, idx) => `skeleton-${idx}`
            : (item) => String(item.id)
        }
        ListHeaderComponent={header}
        ItemSeparatorComponent={ItemGap}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        refreshing={isFetchingNextPage}
        onRefresh={handlePullToRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          !notificationsLoading && isFetchingNextPage ? (
            <View style={[styles.gutter, styles.footer]}>
              <NotificationCardSkeleton />
              <NotificationCardSkeleton />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !notificationsLoading && !isError && notifications.length === 0 ? (
            <EmptyState
              icon="notifications-outline"
              title="You're all caught up"
              message="Shift updates, approvals and reminders will show up here."
            />
          ) : null
        }
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.statusBackdrop,
          { height: insets.top, opacity: statusBackdropOpacity },
        ]}
      />
    </View>
  );
}

const ItemGap = () => <View style={{ height: Space.sm }} />;

const getStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 120,
    },
    gutter: {
      paddingHorizontal: Space.gutter,
    },
    footer: {
      gap: Space.sm,
      paddingTop: Space.sm,
    },
    statusBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.heroGradient[1],
    },

    // Hero
    heroWrap: {
      position: "relative",
    },
    heroOverscroll: {
      position: "absolute",
      top: -600,
      left: 0,
      right: 0,
      height: 600,
      backgroundColor: colors.heroGradient[0],
    },
    hero: {
      overflow: "hidden",
      borderBottomLeftRadius: Radius.md,
      borderBottomRightRadius: Radius.md,
      paddingHorizontal: Space.gutter,
      // room for the stat tiles that overlap the bottom edge
      paddingBottom: Space.xxl + 44,
      gap: Space.md,
    },
    heroOrb: {
      position: "absolute",
      borderRadius: Radius.full,
      backgroundColor: "rgba(255,255,255,0.07)",
    },
    heroOrbLarge: {
      width: 260,
      height: 260,
      top: -90,
      right: -80,
    },
    heroOrbSmall: {
      width: 140,
      height: 140,
      bottom: 30,
      left: -60,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
      minHeight: Touch.min,
    },
    heroGreeting: {
      flex: 1,
    },
    onHero: {
      color: colors.onHero,
    },
    onHeroMuted: {
      color: colors.onHeroMuted,
    },
    orgPill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      maxWidth: "100%",
      gap: 6,
      paddingHorizontal: Space.sm,
      paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: colors.heroGlass,
      borderWidth: 1,
      borderColor: colors.heroGlassBorder,
    },
    payrunCard: {
      borderRadius: Radius.xl,
      padding: Space.md,
      backgroundColor: colors.heroGlass,
      borderWidth: 1,
      borderColor: colors.heroGlassBorder,
      gap: Space.sm,
    },
    payrunRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
    },
    payrunIcon: {
      width: Touch.min,
      height: Touch.min,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.heroGlass,
    },
    payrunText: {
      flex: 1,
      gap: 2,
    },
    payrunFooter: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      paddingTop: Space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.heroGlassBorder,
    },
    payrunDisclaimer: {
      flex: 1,
    },
    heroPlaceholder: {
      height: 22,
      width: "60%",
      marginTop: 2,
      borderRadius: Radius.xs,
      backgroundColor: colors.heroGlass,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: Space.sm,
      paddingHorizontal: Space.gutter,
      marginTop: -44,
    },
    statTile: {
      flex: 1,
      minHeight: 132,
      justifyContent: "space-between",
    },
    statValue: {
      marginTop: Space.sm,
    },

    // Pending approval
    pendingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
      marginTop: Space.md,
      marginHorizontal: Space.gutter,
      padding: Space.md,
      borderRadius: Radius.xl,
      backgroundColor: colors.warningSoft,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    pendingText: {
      flex: 1,
      gap: 2,
    },

    missingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
      marginTop: Space.md,
      marginHorizontal: Space.gutter,
      backgroundColor: colors.dangerSoft,
      borderColor: isDark ? colors.border : colors.dangerSoft,
    },

    sectionHeader: {
      marginTop: Space.lg,
      marginBottom: Space.xs,
      paddingHorizontal: Space.gutter,
    },
  });
