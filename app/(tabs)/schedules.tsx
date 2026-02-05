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
import { useQuery } from "@tanstack/react-query";
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

  // upcoming shifts
  const {
    data: scheduled,
    isLoading: scheduledLoading,
    isError: scheduledError,
    refetch: refetchScheduled,
  } = useQuery({
    queryKey: ["scheduled-shifts"],
    queryFn: postScheduledShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // running shifts
  const {
    data: running,
    isLoading: runningLoading,
    isError: runningError,
    refetch: refetchRunning,
  } = useQuery({
    queryKey: ["running-shifts"],
    queryFn: postRunningShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // cancelled shifts
  const {
    data: cancelled,
    isLoading: cancelledLoading,
    isError: cancelledError,
    refetch: refetchCancelled,
  } = useQuery({
    queryKey: ["cancelled-shifts"],
    queryFn: postCancelledShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // transfered shifts
  const {
    data: transfered,
    isLoading: transferedLoading,
    isError: transferedError,
    refetch: refetchTransfered,
  } = useQuery({
    queryKey: ["transfered-shifts"],
    queryFn: postTransferedShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // past shifts
  const {
    data: past,
    isLoading: pastLoading,
    isError: pastError,
    refetch: refetchPast,
  } = useQuery({
    queryKey: ["past-shifts"],
    queryFn: postPastShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // completed shifts
  const {
    data: completed,
    isLoading: completedLoading,
    isError: completedError,
    refetch: refetchCompleted,
  } = useQuery({
    queryKey: ["completed-shifts"],
    queryFn: postCompletedShifts,
    refetchInterval: 30 * 60 * 1000,
  });

  // paid -- > past
  // running -- > running
  // scheduled -- > scheduled
  // cancelled -- > cancelled
  // transfered -- > transfered
  // pending payment -- > completed

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveStatus(statusTabs[index]);
      contentScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(Math.max(index, 0), statusTabs.length - 1);
      setActiveStatus(statusTabs[clampedIndex]);
    },
    [screenWidth],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedules</Text>
          <View style={styles.underline} />
        </View>
        <ScrollView
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
                let refetchFn = undefined;
                let isError = false;
                switch (status) {
                  case "Paid":
                    isLoading = pastLoading;
                    data = past?.data?.shifts?.data || [];
                    isError = pastError;
                    refetchFn = refetchPast;
                    break;
                  case "Running":
                    isLoading = runningLoading;
                    data = running?.data?.shifts?.data || [];
                    isError = runningError;
                    refetchFn = refetchRunning;
                    break;
                  case "Scheduled":
                    isLoading = scheduledLoading;
                    data = scheduled?.data?.shifts?.data || [];
                    isError = scheduledError;
                    refetchFn = refetchScheduled;
                    break;
                  case "Cancelled":
                    isLoading = cancelledLoading;
                    data = cancelled?.data?.shifts?.data || [];
                    isError = cancelledError;
                    refetchFn = refetchCancelled;
                    break;
                  case "Transferred":
                    isLoading = transferedLoading;
                    data = transfered?.data?.shifts?.data || [];
                    isError = transferedError;
                    refetchFn = refetchTransfered;
                    break;
                  case "Pending Payment":
                    isLoading = completedLoading;
                    data = completed?.data?.shifts?.data || [];
                    isError = completedError;
                    refetchFn = refetchCompleted;
                    break;
                  default:
                    data = [];
                }
                const handlePullToRefresh = async () => {
                  if (refetchFn) await refetchFn();
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
                      refreshing={isLoading}
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
                        shifts. Please pull to refresh or try again later.
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
                    refreshing={isLoading}
                    onRefresh={handlePullToRefresh}
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
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
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
