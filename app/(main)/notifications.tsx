import { getNotifications } from "@/api-queries/notifcations";
import { EmptyState, ScreenHeader, SegmentedTabs } from "@/components/design";
import { NotificationCard } from "@/components/notification-card";
import { NotificationCardSkeleton } from "@/components/skeletons";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    error,
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
  });

  const notifications =
    data?.pages.flatMap((page) => page?.data?.hcps?.data ?? []) ?? [];

  const tabTypes = useMemo(() => ["Shifts", "Documents", "General"], []);

  const shiftsNotifications = notifications.filter(
    (n) => n.notification_type === "shifts",
  );

  const documentsNotifications = notifications.filter(
    (n) => n.notification_type === "documents",
  );

  const othersNotifications = notifications.filter(
    (n) =>
      n.notification_type !== "shifts" && n.notification_type !== "documents",
  );

  const tabData = [
    shiftsNotifications,
    documentsNotifications,
    othersNotifications,
  ];

  const [activeTab, setActiveTab] = useState(tabTypes[0]);
  const activeTabIndex = tabTypes.indexOf(activeTab);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentScrollRef = useRef<ScrollView>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [tabsRowHeight, setTabsRowHeight] = useState(0);
  const pageHeight =
    containerHeight > 0 && tabsRowHeight > 0
      ? containerHeight - tabsRowHeight
      : undefined;

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveTab(tabTypes[index]);
      contentScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth, tabTypes],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(Math.max(index, 0), tabTypes.length - 1);
      setActiveTab(tabTypes[clampedIndex]);
    },
    [screenWidth, tabTypes],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handlePullToRefresh = async () => {
    await refetch();
  };


  const { colors } = useAppTheme();
  const listContainer = {
    minHeight: screenHeight,
    paddingBottom: 120,
    paddingTop: Space.md,
    gap: Space.sm,
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />

      <View
        style={styles.container}
        onLayout={(event) =>
          setContainerHeight(event.nativeEvent.layout.height)
        }
      >
        {/* Tabs */}
        <View
          style={styles.tabsWrap}
          onLayout={(event) =>
            setTabsRowHeight(event.nativeEvent.layout.height)
          }
        >
          <SegmentedTabs
            tabs={tabTypes}
            activeIndex={activeTabIndex}
            onTabPress={handleTabPress}
          />
        </View>

        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {}}
          style={pageHeight ? { height: pageHeight } : { flex: 1 }}
        >
          {tabData.map((tabNotifications, index) => (
            // Page width kept as before (screenWidth - 18); the inner padding
            // brings the cards to the page gutter.
            <View
              key={tabTypes[index]}
              style={{
                width: screenWidth - 18,
                paddingHorizontal: 12,
                ...(pageHeight ? { height: pageHeight } : { flex: 1 }),
              }}
            >
              {isLoading ? (
                <FlatList
                  data={[...Array(2)]}
                  renderItem={() => <NotificationCardSkeleton />}
                  keyExtractor={(_, i) => `skeleton-${i}`}
                  refreshing={isFetchingNextPage}
                  onRefresh={handlePullToRefresh}
                  contentContainerStyle={listContainer}
                />
              ) : (
                <FlatList
                  data={tabNotifications}
                  renderItem={({ item }) => (
                    <NotificationCard notification={item} />
                  )}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={(item, i) => String(item.id ?? i)}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.6}
                  refreshing={isRefetching && !isFetchingNextPage}
                  onRefresh={handlePullToRefresh}
                  ListFooterComponent={
                    isFetchingNextPage ? (
                      <View style={styles.footer}>
                        <NotificationCardSkeleton />
                        <NotificationCardSkeleton />
                      </View>
                    ) : null
                  }
                  contentContainerStyle={listContainer}
                />
              )}
            </View>
          ))}
        </ScrollView>

        {!isLoading && tabData[activeTabIndex]?.length === 0 && (
          <View style={styles.emptyState} pointerEvents="none">
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              message={`You have no ${tabTypes[activeTabIndex].toLowerCase()} notifications at the moment.`}
            />
          </View>
        )}

        {/* Error Overlay */}
        {isError && (
          <View style={[styles.errorOverlay, { backgroundColor: colors.background }]}>
            <EmptyState
              icon="cloud-offline-outline"
              tone="danger"
              title="Couldn't load notifications"
              message={error instanceof Error ? error.message : undefined}
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
    paddingHorizontal: 8,
    flexDirection: "column",
  },
  tabsWrap: {
    paddingHorizontal: 12,
  },
  footer: {
    gap: Space.sm,
    paddingTop: Space.sm,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
