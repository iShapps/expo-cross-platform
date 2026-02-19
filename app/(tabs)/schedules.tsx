import {
  postCancelledShifts,
  postCompletedShifts,
  postPastShifts,
  postRunningShifts,
  postScheduledShifts,
  postTransferedShifts,
} from "@/api-queries/post-pending-shifts";
import { ShiftCardBase } from "@/components/pay-run";
import { ShiftCardBaseSkeleton } from "@/components/skeletons/payrun-card-base-skeleton";
import { IShift } from "@/data-types/shifts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// a4cfbbf7-fae5-470b-bb0c-b6bc8f673ade -android app id

const useShiftInfiniteQuery = (
  key: string,
  queryFn: (page?: number) => Promise<any>,
) => {
  return useInfiniteQuery({
    queryKey: [key],
    queryFn: ({ pageParam = 1 }) => queryFn(pageParam),
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

export default function Schedules() {
  const statusTabs = [
    "Running",
    "Scheduled",
    "Pending Payment",
    "Paid",
    "Cancelled",
    "Transferred",
  ] as const;
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusTabs)[number]>("Running");
  const { width: screenWidth } = useWindowDimensions();

  const contentScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabOffsetsRef = useRef<number[]>([]);
  const tabWidthsRef = useRef<number[]>([]);

  // upcoming shifts
  const scheduledQuery = useShiftInfiniteQuery(
    "scheduled-shifts",
    postScheduledShifts,
  );

  // running shifts
  const runningQuery = useShiftInfiniteQuery(
    "running-shifts",
    postRunningShifts,
  );

  // cancelled shifts
  const cancelledQuery = useShiftInfiniteQuery(
    "cancelled-shifts",
    postCancelledShifts,
  );

  // transfered shifts
  const transferedQuery = useShiftInfiniteQuery(
    "transfered-shifts",
    postTransferedShifts,
  );

  // past shifts
  const pastQuery = useShiftInfiniteQuery("past-shifts", postPastShifts);

  // completed shifts
  const completedQuery = useShiftInfiniteQuery(
    "completed-shifts",
    postCompletedShifts,
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
      setActiveStatus(statusTabs[index]);
      scrollTabIntoView(index);
      contentScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth, scrollTabIntoView],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(Math.max(index, 0), statusTabs.length - 1);
      setActiveStatus(statusTabs[clampedIndex]);
      scrollTabIntoView(clampedIndex);
    },
    [screenWidth, scrollTabIntoView],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
      </View>
      <View style={styles.container}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {statusTabs.map((status, index) => {
            const isActive = activeStatus === status;
            return (
              <Pressable
                key={status}
                onPress={() => handleTabPress(index)}
                style={styles.tabButton}
                android_ripple={{ color: "#ccc" }}
                onLayout={(e) => {
                  tabOffsetsRef.current[index] = e.nativeEvent.layout.x;
                  tabWidthsRef.current[index] = e.nativeEvent.layout.width;
                }}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {status}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    isActive && styles.tabUnderlineActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>
        {/* <FlatList
          // style={{ flex: 1 }}
          data={sample_payruns}
          renderItem={({ item }) => <PayrunCardBase payrun={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 10,
            flexGrow: 1,
            gap: 10,
          }}
        /> */}

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
            <View
              key={status}
              style={{ width: screenWidth - 16, paddingHorizontal: 4 }}
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
                  case "Paid":
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
                    isLoading = transferedQuery.isLoading;
                    data =
                      transferedQuery.data?.pages.flatMap(
                        (page) => page?.data?.shifts?.data ?? [],
                      ) || [];
                    isError = transferedQuery.isError;
                    shiftError = transferedQuery.error;
                    refetchFn = transferedQuery.refetch;
                    isFetchingNextPage = transferedQuery.isFetchingNextPage;
                    hasNextPage = !!transferedQuery.hasNextPage;
                    fetchNextPage = transferedQuery.fetchNextPage;
                    isRefetching = transferedQuery.isRefetching;
                    break;
                  case "Pending Payment":
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
                      contentContainerStyle={{
                        paddingBottom: 120,
                        paddingTop: 10,
                        flexGrow: 1,
                        gap: 10,
                      }}
                      refreshing={isRefetching && !isFetchingNextPage}
                      onRefresh={handlePullToRefresh}
                    />
                  );
                }

                if (isError) {
                  return (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={72}
                        color="#ff6f61"
                        style={{ marginBottom: 16 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#ff6f61",
                          marginBottom: 8,
                        }}
                      >
                        Error Loading Shifts
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#818589",
                          textAlign: "center",
                          maxWidth: 260,
                          marginBottom: 12,
                        }}
                      >
                        Something went wrong while fetching{" "}
                        <Text style={{ textTransform: "lowercase" }}>
                          {status}
                        </Text>{" "}
                        shifts. Please pull to refresh or try again later. (
                        {shiftError instanceof Error && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#818589",
                              textAlign: "center",
                            }}
                          >
                            {shiftError.message}
                          </Text>
                        )}
                        )
                      </Text>
                      <TouchableOpacity
                        onPress={handlePullToRefresh}
                        style={{
                          backgroundColor: "#FBF2F2",
                          paddingHorizontal: 24,
                          paddingVertical: 10,
                          borderRadius: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <FontAwesome6
                          name="rotate-left"
                          size={20}
                          color="#71797E"
                        />
                        <Text
                          style={{
                            color: "#71797E",
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          Retry
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (!isLoading && (!data || data.length === 0)) {
                  return (
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
                        color="#e0e0e0"
                        style={{ marginBottom: 16 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#70C601",
                          marginBottom: 8,
                        }}
                      >
                        No Shifts Yet
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#818589",
                          textAlign: "center",
                          maxWidth: 260,
                        }}
                      >
                        You have no{" "}
                        <Text
                          style={{
                            textTransform: "lowercase",
                          }}
                        >
                          {status}
                        </Text>{" "}
                        shifts for this category at the moment. Check back later
                        or explore other tabs!
                      </Text>
                    </View>
                  );
                }
                return (
                  <FlatList
                    data={data}
                    renderItem={({ item }) => <ShiftCardBase shift={item} />}
                    keyExtractor={(item) =>
                      item.id?.toString?.() || String(item.id)
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: 120,
                      paddingTop: 10,
                      flexGrow: 1,
                      gap: 10,
                    }}
                    refreshing={isRefetching && !isFetchingNextPage}
                    onRefresh={handlePullToRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.6}
                    ListFooterComponent={
                      isFetchingNextPage ? (
                        <View style={{ gap: 10, paddingTop: 10 }}>
                          <ShiftCardBaseSkeleton />
                          <ShiftCardBaseSkeleton />
                        </View>
                      ) : null
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#70C601",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    backgroundColor: "#70C601",
    width: "100%",
    margin: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  underline: {
    height: 3,
    width: 56,
    borderRadius: 999,
    backgroundColor: "#70C601",
    opacity: 0.85,
    marginTop: 6,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667085",
  },
  tabTextActive: {
    color: "#70C601",
  },
  tabUnderline: {
    height: 2,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
    marginTop: 6,
  },
  tabUnderlineActive: {
    backgroundColor: "#70C601",
  },
});
