import {
  postApprovedShifts,
  postCancelledShifts,
  postPendingApprovalShifts,
  postRunningShifts,
  postScheduledShifts,
  postTransferredShifts,
} from "@/api-queries/post-pending-shifts";
import { EmptyState, IconButton, SegmentedTabs } from "@/components/design";
import { ShiftCardBase } from "@/components/pay-run";
import TabsHeader from "@/components/shared/tabs-header";
import { ShiftCardBaseSkeleton } from "@/components/skeletons/payrun-card-base-skeleton";
import { Space } from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { IShift } from "@/data-types/shifts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

// a4cfbbf7-fae5-470b-bb0c-b6bc8f673ade -android app id

export default function Schedules() {
  const filterState = useProfileData();
  const startDate = useProfileData((s) => s.startDate || undefined);
  const endDate = useProfileData((s) => s.endDate || undefined);
  console.log("Schedules received store dates:", { startDate, endDate });
  const { activeTab } = useLocalSearchParams() as { activeTab?: string };
  const statusTabs = useMemo(
    () =>
      [
        "Running",
        "Scheduled",
        "Pending Approval",
        "Approved",
        "Cancelled",
        "Transferred",
      ] as const,
    [],
  );
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusTabs)[number]>("Running");
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentPageWidth = screenWidth - 16;

  const contentScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabOffsetsRef = useRef<number[]>([]);
  const tabWidthsRef = useRef<number[]>([]);

  const useShiftInfiniteQuery = (
    key: string,
    queryFn: (
      page?: number,
      startDate?: string,
      endDate?: string,
    ) => Promise<any>,
    startDate?: string,
    endDate?: string,
  ) => {
    return useInfiniteQuery({
      queryKey: [key, startDate, endDate],
      queryFn: ({ pageParam = 1 }) => queryFn(pageParam, startDate, endDate),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const pagination = lastPage?.data?.shifts;
        if (!pagination) return undefined;
        if (pagination.current_page < pagination.last_page) {
          return pagination.current_page + 1;
        }
        return undefined;
      },
      refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes.
      refetchIntervalInBackground: true, //Keeps refetching even if the app is in the background.
      gcTime: 1000 * 60 * 60, // Collect garbage and remove data from cache after 1 hour of inactivity
      staleTime: 1000 * 60 * 60 * 24, //Data is considered fresh for 24 hours
    });
  };

  // upcoming shifts
  const scheduledQuery = useShiftInfiniteQuery(
    "scheduled-shifts",
    postScheduledShifts,
    startDate,
    endDate,
  );

  // running shifts
  const runningQuery = useShiftInfiniteQuery(
    "running-shifts",
    postRunningShifts,
    startDate,
    endDate,
  );

  // cancelled shifts
  const cancelledQuery = useShiftInfiniteQuery(
    "cancelled-shifts",
    postCancelledShifts,
    startDate,
    endDate,
  );

  // transfered shifts
  const transferredQuery = useShiftInfiniteQuery(
    "transferred-shifts",
    postTransferredShifts,
    startDate,
    endDate,
  );

  // past shifts
  const pastQuery = useShiftInfiniteQuery(
    "past-shifts",
    postApprovedShifts,
    startDate,
    endDate,
  );

  // completed shifts
  const completedQuery = useShiftInfiniteQuery(
    "completed-shifts",
    postPendingApprovalShifts,
    startDate,
    endDate,
  );

  // paid -- > past
  // running -- > running
  // scheduled -- > scheduled
  // cancelled -- > cancelled
  // transfered -- > transfered
  // pending payment -- > completed
  // 10-15 mins shift tracking

  // upcoming, avialable, completed,

  const scrollTabIntoView = useCallback(
    (index: number) => {
      const offset = tabOffsetsRef.current[index];
      const width = tabWidthsRef.current[index];
      if (offset == null || width == null) return;
      tabScrollRef.current?.scrollTo({
        x: offset - screenWidth / 2 + width / 2, // center the active tab
        animated: true,
      });
    },
    [screenWidth],
  );

  const handleTabPress = useCallback(
    (index: number) => {
      router.setParams({ activeTab: undefined });
      setActiveStatus(statusTabs[index]);
      scrollTabIntoView(index);
      contentScrollRef.current?.scrollTo({
        x: index * contentPageWidth,
        animated: true,
      });
    },
    [contentPageWidth, router, scrollTabIntoView, statusTabs],
  );

  const runningRefetchRef = useRef(runningQuery.refetch);
  const scheduledRefetchRef = useRef(scheduledQuery.refetch);

  useFocusEffect(
    useCallback(() => {
      // refetch only running and scheduled shifts on focus, as those are most likely to change
      void runningRefetchRef.current();
      void scheduledRefetchRef.current();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (activeTab) {
        console.log("Schedules screen received activeTab param:", activeTab);
        handleTabPress(1);
      }

      return () => {
        if (activeTab) {
          router.setParams({ activeTab: undefined });
        }
      };
    }, [activeTab, handleTabPress, router]),
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(Math.max(index, 0), statusTabs.length - 1);
      setActiveStatus(statusTabs[clampedIndex]);
      scrollTabIntoView(clampedIndex);
    },
    [screenWidth, scrollTabIntoView, statusTabs],
  );

  const profileStore = useProfileData();

  const scheduledShifts =
    scheduledQuery.data?.pages.flatMap(
      (page) => page?.data?.shifts?.data ?? [],
    ) || [];

  useEffect(() => {
    if (scheduledShifts.length === 1) {
      profileStore.setAcceptedShift(scheduledShifts[0]);
    }
  }, [scheduledShifts.length]);

  const isFocused = useIsFocused();

  useFirstVisitTour("myShifts", isFocused && !runningQuery.isLoading);

  const { colors } = useAppTheme();
  const hasDateFilter = !!startDate || !!endDate;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader
        title="Schedule"
        right={
          <CopilotStep
            name="my-shifts-date-filter"
            order={1}
            active={isFocused}
            text="Filter by date range to find shifts on a specific day or week."
          >
            <WalkthroughableView>
              <IconButton
                icon="calendar-outline"
                accessibilityLabel={hasDateFilter ? "Filter by date (active)" : "Filter by date"}
                badge={hasDateFilter}
                onPress={() =>
                  router.push({
                    pathname: "/date-sheet",
                  })
                }
              />
            </WalkthroughableView>
          </CopilotStep>
        }
      />
      <View style={styles.container}>
        <CopilotStep
          name="my-shifts-tabs"
          order={2}
          active={isFocused}
          text="Running, Scheduled, Pending Approval, Approved, Cancelled, and Transferred — track every stage of your shifts here."
        >
          <WalkthroughableView style={styles.tabsWrap}>
            <SegmentedTabs
              scrollable
              scrollRef={tabScrollRef}
              tabs={statusTabs}
              activeIndex={statusTabs.indexOf(activeStatus)}
              onTabPress={handleTabPress}
              onTabLayout={(index, layout) => {
                tabOffsetsRef.current[index] = layout.x;
                tabWidthsRef.current[index] = layout.width;
              }}
            />
          </WalkthroughableView>
        </CopilotStep>

        {/* Horizontal paging ScrollView for tab content */}
        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          onScrollBeginDrag={() => {}} // prevent flicker
        >
          {statusTabs.map((status, index) => (
            // Page width must stay screenWidth - 16 (the paging maths above);
            // the inner padding brings the cards to the 20pt page gutter.
            <View
              key={status}
              style={{ width: screenWidth - 16, paddingHorizontal: 12 }}
            >
              {(() => {
                let isLoading = false;
                let data: IShift[] = [];
                let refetchFn = undefined as undefined | (() => Promise<any>);
                let isError = false;
                let shiftError: any = null;
                let isFetchingNextPage = false;
                let hasNextPage = false;
                let fetchNextPage: undefined | (() => Promise<any>) = undefined;
                let isRefetching = false;
                switch (status) {
                  case "Approved":
                    isLoading = pastQuery.isLoading;
                    data =
                      pastQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = pastQuery.isError;
                    shiftError = pastQuery.error;
                    refetchFn = pastQuery.refetch;
                    isFetchingNextPage = pastQuery.isFetchingNextPage;
                    hasNextPage = !!pastQuery.hasNextPage;
                    fetchNextPage = pastQuery.fetchNextPage;
                    isRefetching = pastQuery.isRefetching;
                    break;
                  case "Running":
                    isLoading = runningQuery.isLoading;
                    data =
                      runningQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = runningQuery.isError;
                    shiftError = runningQuery.error;
                    refetchFn = runningQuery.refetch;
                    isFetchingNextPage = runningQuery.isFetchingNextPage;
                    hasNextPage = !!runningQuery.hasNextPage;
                    fetchNextPage = runningQuery.fetchNextPage;
                    isRefetching = runningQuery.isRefetching;
                    break;
                  case "Scheduled":
                    isLoading = scheduledQuery.isLoading;
                    data =
                      scheduledQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = scheduledQuery.isError;
                    shiftError = scheduledQuery.error;
                    refetchFn = scheduledQuery.refetch;
                    isFetchingNextPage = scheduledQuery.isFetchingNextPage;
                    hasNextPage = !!scheduledQuery.hasNextPage;
                    fetchNextPage = scheduledQuery.fetchNextPage;
                    isRefetching = scheduledQuery.isRefetching;
                    break;
                  case "Cancelled":
                    isLoading = cancelledQuery.isLoading;
                    data =
                      cancelledQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = cancelledQuery.isError;
                    shiftError = cancelledQuery.error;
                    refetchFn = cancelledQuery.refetch;
                    isFetchingNextPage = cancelledQuery.isFetchingNextPage;
                    hasNextPage = !!cancelledQuery.hasNextPage;
                    fetchNextPage = cancelledQuery.fetchNextPage;
                    isRefetching = cancelledQuery.isRefetching;
                    break;
                  case "Transferred":
                    isLoading = transferredQuery.isLoading;
                    data =
                      transferredQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = transferredQuery.isError;
                    shiftError = transferredQuery.error;
                    refetchFn = transferredQuery.refetch;
                    isFetchingNextPage = transferredQuery.isFetchingNextPage;
                    hasNextPage = !!transferredQuery.hasNextPage;
                    fetchNextPage = transferredQuery.fetchNextPage;
                    isRefetching = transferredQuery.isRefetching;
                    break;
                  case "Pending Approval":
                    isLoading = completedQuery.isLoading;
                    data =
                      completedQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = completedQuery.isError;
                    shiftError = completedQuery.error;
                    refetchFn = completedQuery.refetch;
                    isFetchingNextPage = completedQuery.isFetchingNextPage;
                    hasNextPage = !!completedQuery.hasNextPage;
                    fetchNextPage = completedQuery.fetchNextPage;
                    isRefetching = completedQuery.isRefetching;
                    break;
                  default:
                    data = [];
                }
                const handlePullToRefresh = async () => {
                  // reset start date and end date
                  filterState.setStartDate(null);
                  filterState.setEndDate(null);
                  if (refetchFn) await refetchFn();
                };
                const handleLoadMore = () => {
                  if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
                    fetchNextPage();
                  }
                };
                if (isLoading) {
                  return (
                    <FlatList
                      data={Array.from({ length: 5 })}
                      renderItem={() => <ShiftCardBaseSkeleton />}
                      keyExtractor={(_, idx) => `skeleton-${idx}`}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.listContent(screenHeight)}
                      refreshing={isRefetching && !isFetchingNextPage}
                      onRefresh={handlePullToRefresh}
                    />
                  );
                }

                if (isError) {
                  return (
                    <EmptyState
                      icon="cloud-offline-outline"
                      tone="danger"
                      title="Couldn't load shifts"
                      message={
                        `Something went wrong while fetching ${status.toLowerCase()} shifts. Pull to refresh or try again later.` +
                        (shiftError instanceof Error ? `\n(${shiftError.message})` : "")
                      }
                      actionLabel="Retry"
                      onAction={handlePullToRefresh}
                      style={{ marginTop: screenHeight * 0.1 }}
                    />
                  );
                }
                return (
                  <FlatList
                    data={data}
                    renderItem={({ item, index }) =>
                      status === "Running" && index === 0 ? (
                        <CopilotStep
                          name="my-shifts-first-card"
                          order={3}
                          active={isFocused}
                          text="Tap any shift to see its full details."
                        >
                          <WalkthroughableView>
                            <ShiftCardBase shift={item} />
                          </WalkthroughableView>
                        </CopilotStep>
                      ) : (
                        <ShiftCardBase shift={item} />
                      )
                    }
                    keyExtractor={(item) =>
                      item.id?.toString?.() || String(item.id)
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent(screenHeight)}
                    refreshing={isRefetching && !isFetchingNextPage}
                    onRefresh={handlePullToRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.6}
                    ListFooterComponent={
                      isFetchingNextPage ? (
                        <View style={styles.footer}>
                          <ShiftCardBaseSkeleton />
                          <ShiftCardBaseSkeleton />
                        </View>
                      ) : null
                    }
                    ListEmptyComponent={
                      <EmptyState
                        icon={EMPTY_ICONS[status] ?? "calendar-outline"}
                        title={`No ${status.toLowerCase()} shifts`}
                        message={`You have no ${status.toLowerCase()} shifts at the moment. Check back later or explore other tabs.`}
                        style={{ marginTop: screenHeight * 0.1 }}
                      />
                    }
                  />
                );
              })()}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const EMPTY_ICONS: Record<string, React.ComponentProps<typeof EmptyState>["icon"]> = {
  Running: "play-circle-outline",
  Scheduled: "calendar-outline",
  "Pending Approval": "hourglass-outline",
  Approved: "checkmark-done-outline",
  Cancelled: "close-circle-outline",
  Transferred: "swap-horizontal-outline",
};

const styles = {
  ...StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      // Keep at 8: the paging width above is screenWidth - 2 × this.
      paddingHorizontal: 8,
    },
    tabsWrap: {
      paddingHorizontal: 12,
    },
    footer: {
      gap: Space.sm,
      paddingTop: Space.sm,
    },
  }),
  listContent: (screenHeight: number) => ({
    paddingBottom: 120,
    paddingTop: Space.md,
    minHeight: screenHeight,
    gap: Space.sm,
  }),
};
