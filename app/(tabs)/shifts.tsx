import { postPendingShifts } from "@/api-queries/post-pending-shifts";
import { EmptyState } from "@/components/design";
import { ShiftCardBase } from "@/components/pay-run";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";

import TabsHeader from "@/components/shared/tabs-header";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

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

  console.log("Pending shifts data:", data);

  const shifts =
    data?.pages.flatMap(
      (page) => page?.data?.shifts?.available_shifts?.data ?? [],
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
  const { height: screenHeight } = useWindowDimensions();

  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader title="Shifts" />
      <View style={styles.container}>
        <FlatList
          data={showSkeletonLoading ? [...Array(6)] : shifts}
          renderItem={
            showSkeletonLoading
              ? () => <ShiftCardBaseSkeleton />
              : ({ item, index }) =>
                  index === 0 ? (
                    <CopilotStep
                      name="shifts-first-card"
                      order={1}
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
              ? (_, idx) => `skeleton-${idx}`
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
            !showSkeletonLoading && !isError && shifts.length === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="No shifts available yet"
                message="There are no shifts available at the moment. Pull to refresh or check back later."
                style={{ marginTop: screenHeight * 0.1 }}
              />
            ) : null
          }
        />
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
