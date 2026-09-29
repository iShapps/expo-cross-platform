import { postPendingShifts } from "@/api-queries/post-pending-shifts";
import { EmptyState, SegmentedTabs } from "@/components/design";
import { ShiftCardBase } from "@/components/pay-run";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";

import TabsHeader from "@/components/shared/tabs-header";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback, useRef, useState } from "react";
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

const STATUS_TABS = ["Available", "Transfers"] as const;

export default function Shifts() {
  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: shiftError,
  } = useInfiniteQuery({
    queryKey: ["pending-shifts"],
    queryFn: ({ pageParam = 1 }) => postPendingShifts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.shifts?.available_shifts;

      if (!pagination) return undefined;

      if (pagination.current_page < pagination.last_page) {
        return pagination.current_page + 1;
      }

      return undefined;
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    refetchIntervalInBackground: true,
    gcTime: 1000 * 60 * 60,
    staleTime: 0,

    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: "always",
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const [activeStatus, setActiveStatus] =
    useState<(typeof STATUS_TABS)[number]>("Available");

  console.log("Pending shifts data:", data);

  const shifts =
    data?.pages.flatMap(
      (page) => page?.data?.shifts?.available_shifts?.data ?? [],
    ) ?? [];

  const transferShifts =
    data?.pages.flatMap(
      (page) => page?.data?.shifts?.transfer_shifts?.data ?? [],
    ) ?? [];

  const showSkeletonLoading =
    isLoading || (isRefetching && !isFetchingNextPage);

  const isFocused = useIsFocused();

  useFirstVisitTour("shifts", isFocused && !showSkeletonLoading);

  const handlePullToRefresh = async () => {
    await refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentPageWidth = screenWidth - 20;

  const contentScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabOffsetsRef = useRef<number[]>([]);
  const tabWidthsRef = useRef<number[]>([]);

  const scrollTabIntoView = useCallback(
    (index: number) => {
      const offset = tabOffsetsRef.current[index];
      const width = tabWidthsRef.current[index];
      if (offset == null || width == null) return;
      tabScrollRef.current?.scrollTo({
        x: offset - contentPageWidth / 2 + width / 2, // center the active tab
        animated: true,
      });
    },
    [contentPageWidth],
  );

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveStatus(STATUS_TABS[index]);
      scrollTabIntoView(index);
      contentScrollRef.current?.scrollTo({
        x: index * contentPageWidth,
        animated: true,
      });
    },
    [contentPageWidth, scrollTabIntoView],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / contentPageWidth);
      const clampedIndex = Math.min(Math.max(index, 0), STATUS_TABS.length - 1);
      setActiveStatus(STATUS_TABS[clampedIndex]);
      scrollTabIntoView(clampedIndex);
    },
    [contentPageWidth, scrollTabIntoView],
  );


  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader title="Shifts" />
      <View style={styles.container}>
        <CopilotStep
          name="shifts-tabs"
          order={1}
          active={isFocused}
          text='"Available" is open shifts you can accept. "Transfers" is shifts other HCPs are offering to you directly.'
        >
          <WalkthroughableView style={styles.tabsWrap}>
            <SegmentedTabs
              tabs={STATUS_TABS}
              activeIndex={STATUS_TABS.indexOf(activeStatus)}
              onTabPress={handleTabPress}
              onTabLayout={(index, layout) => {
                tabOffsetsRef.current[index] = layout.x;
                tabWidthsRef.current[index] = layout.width;
              }}
            />
          </WalkthroughableView>
        </CopilotStep>

        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          directionalLockEnabled
          nestedScrollEnabled
        >
          {STATUS_TABS.map((status) => {
            const tabData = status === "Available" ? shifts : transferShifts;

            return (
              // Page width must stay screenWidth - 20 (the paging maths above);
              // the inner padding brings the cards to the 20pt page gutter.
              <View
                key={status}
                style={{ width: screenWidth - 20, paddingHorizontal: 10 }}
              >
                <FlatList
                  data={showSkeletonLoading ? [...Array(6)] : tabData}
                  renderItem={
                    showSkeletonLoading
                      ? () => <ShiftCardBaseSkeleton />
                      : ({ item, index }) =>
                          status === "Available" && index === 0 ? (
                            <CopilotStep
                              name="shifts-first-card"
                              order={2}
                              active={isFocused}
                              text="Tap any shift to see the full details before you commit."
                            >
                              <WalkthroughableView>
                                <ShiftCardBase shift={item} />
                              </WalkthroughableView>
                            </CopilotStep>
                          ) : (
                            <ShiftCardBase shift={item} />
                          )
                  }
                  keyExtractor={
                    showSkeletonLoading
                      ? (_, idx) => `${status.toLowerCase()}-skeleton-${idx}`
                      : (item) => String(item.id)
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingBottom: 120,
                    paddingTop: Space.md,
                    flexGrow: 1,
                    minHeight: screenHeight,
                    gap: Space.sm,
                  }}
                  refreshing={false}
                  onRefresh={handlePullToRefresh}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.6}
                  nestedScrollEnabled
                  ListFooterComponent={
                    !showSkeletonLoading && isFetchingNextPage ? (
                      <View style={styles.footer}>
                        <ShiftCardBaseSkeleton />
                        <ShiftCardBaseSkeleton />
                      </View>
                    ) : null
                  }
                  ListEmptyComponent={
                    !showSkeletonLoading && !isError && tabData.length === 0 ? (
                      <EmptyState
                        icon={status === "Available" ? "briefcase-outline" : "swap-horizontal-outline"}
                        title={`No shifts ${status.toLowerCase()} yet`}
                        message={`There are no shifts ${status.toLowerCase()} at the moment. Pull to refresh or check back later.`}
                        style={{ marginTop: screenHeight * 0.1 }}
                      />
                    ) : null
                  }
                />
              </View>
            );
          })}
        </ScrollView>
        {isError && !showSkeletonLoading && (
          <View style={[styles.errorOverlay, { backgroundColor: colors.background }]}>
            <EmptyState
              icon="cloud-offline-outline"
              tone="danger"
              title="Couldn't load shifts"
              message={
                "Something went wrong while fetching shifts. Pull to refresh or try again later." +
                (shiftError instanceof Error ? `\n(${shiftError.message})` : "")
              }
              actionLabel="Retry"
              onAction={handlePullToRefresh}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    // Keep at 10: the paging width above is screenWidth - 2 × this.
    paddingHorizontal: 10,
  },
  tabsWrap: {
    paddingHorizontal: 10,
  },
  footer: {
    gap: Space.sm,
    paddingTop: Space.sm,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
