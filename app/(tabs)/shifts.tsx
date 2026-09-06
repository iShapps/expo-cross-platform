import { postPendingShifts } from "@/api-queries/post-pending-shifts";
import { ShiftCardBase } from "@/components/pay-run";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import TabsHeader from "@/components/shared/tabs-header";
import { Colors, Radii } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];

  const styles = getStyles(theme);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <TabsHeader title="Shifts" />
      <View style={styles.container}>
        <CopilotStep
          name="shifts-tabs"
          order={1}
          active={isFocused}
          text='"Available" is open shifts you can accept. "Transfers" is shifts other HCPs are offering to you directly.'
        >
          <WalkthroughableView>
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {STATUS_TABS.map((status, index) => {
                const isActive = activeStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => handleTabPress(index)}
                    style={styles.tabButton}
                    android_ripple={{ color: theme.grayBorder }}
                    onLayout={(e) => {
                      tabOffsetsRef.current[index] = e.nativeEvent.layout.x;
                      tabWidthsRef.current[index] = e.nativeEvent.layout.width;
                    }}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.tabTextActive,
                      ]}
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
              <View
                key={status}
                style={{ width: screenWidth - 20, paddingHorizontal: 4 }}
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
                    paddingTop: 10,
                    flexGrow: 1,
                    minHeight: screenHeight,
                    gap: 10,
                  }}
                  refreshing={false}
                  onRefresh={handlePullToRefresh}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.6}
                  nestedScrollEnabled
                  ListFooterComponent={
                    !showSkeletonLoading && isFetchingNextPage ? (
                      <View style={{ gap: 10, paddingTop: 10 }}>
                        <ShiftCardBaseSkeleton />
                        <ShiftCardBaseSkeleton />
                      </View>
                    ) : null
                  }
                  ListEmptyComponent={
                    !showSkeletonLoading && !isError && tabData.length === 0 ? (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          top: screenHeight * 0.2,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="calendar-remove-outline"
                          size={72}
                          color={theme.grayBorder}
                          style={{ marginBottom: 16 }}
                        />
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: theme.primary,
                            marginBottom: 8,
                          }}
                        >
                          No shifts {status.toLowerCase()} yet
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            color: theme.secondaryText,
                            textAlign: "center",
                            maxWidth: 260,
                          }}
                        >
                          There are no shifts {status.toLowerCase()} at the
                          moment. Pull to refresh or check back later.
                        </Text>
                      </View>
                    ) : null
                  }
                />
              </View>
            );
          })}
        </ScrollView>
        {isError && !showSkeletonLoading && (
          <View
            style={{
              // flex: 1,
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
              color={theme.danger}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: theme.danger,
                marginBottom: 8,
              }}
            >
              Error Loading Shifts
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: theme.secondaryText,
                textAlign: "center",
                maxWidth: 260,
                marginBottom: 12,
              }}
            >
              Something went wrong while fetching shifts. Please pull to refresh
              or try again later. (
              {shiftError instanceof Error && (
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.secondaryText,
                    textAlign: "center",
                  }}
                >
                  {shiftError.message}
                </Text>
              )}
              )
            </Text>
            <Pressable
              onPress={handlePullToRefresh}
              style={{
                backgroundColor: theme.mutedText,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: Radii.full,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <FontAwesome6
                name="rotate-left"
                size={20}
                color={theme.secondaryText}
              />
              <Text
                style={{
                  color: theme.secondaryText,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.safeAreaBg,
      paddingHorizontal: 10,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.white,
    },
    underline: {
      height: 3,
      width: 56,
      borderRadius: Radii.full,
      backgroundColor: theme.activeText,
      opacity: 0.85,
      marginTop: 6,
    },
    tabsRow: {
      flexDirection: "row",
      gap: 8,
      paddingBottom: 2,
      paddingTop: 10,
    },
    tabButton: {
      paddingVertical: 6,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    tabTextActive: {
      color: theme.primary,
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      borderRadius: Radii.full,
      backgroundColor: "transparent",
      marginTop: 6,
    },
    tabUnderlineActive: {
      backgroundColor: theme.primary,
    },
  });
