import { getNotifications } from "@/api-queries/notifcations";
import Header from "@/components/Header";
import { NotificationCard } from "@/components/notification-card";
import { NotificationCardSkeleton } from "@/components/skeletons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentScrollRef = useRef<ScrollView>(null);

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

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme, screenHeight);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {/* Header */}
      <Header title="Notifications" onBack={() => router.back()} />

      <View style={styles.container}>
        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabTypes.map((tab, index) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(index)}
                style={styles.tabButton}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    isActive && styles.tabUnderlineActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {}}
        >
          {tabData.map((tabNotifications, index) => (
            <View key={tabTypes[index]} style={{ width: screenWidth - 18 }}>
              {isLoading ? (
                <FlatList
                  data={[...Array(2)]}
                  renderItem={() => <NotificationCardSkeleton />}
                  keyExtractor={(_, i) => `skeleton-${i}`}
                  refreshing={isFetchingNextPage}
                  onRefresh={handlePullToRefresh}
                  contentContainerStyle={styles.listContainer}
                />
              ) : tabNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="broadcast-off"
                    size={72}
                    color={theme.grayBorder}
                  />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: theme.primary,
                      marginBottom: 8,
                    }}
                  >
                    No notifications yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: theme.secondaryText,
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
                      {tabTypes[index].toLowerCase()}
                    </Text>{" "}
                    notifications at the moment.
                  </Text>
                </View>
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
                      <View style={{ gap: 10, paddingTop: 10 }}>
                        <NotificationCardSkeleton />
                        <NotificationCardSkeleton />
                      </View>
                    ) : null
                  }
                  contentContainerStyle={styles.listContainer}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Error Overlay */}
      {isError && (
        <View style={styles.errorOverlay}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={72}
            color={theme.danger}
          />
          <Text style={styles.errorTitle}>Error Loading Notifications</Text>
          <Pressable onPress={handlePullToRefresh} style={styles.retryButton}>
            <Text style={{ color: theme.secondaryText, fontWeight: "700" }}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light, screenHeight: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 8,
      display: "flex",
      flexDirection: "column",
    },
    tabsRow: {
      flexDirection: "row",
      gap: 8,
      paddingBottom: 5,
      paddingTop: 15,
    },
    tabButton: {
      alignItems: "center",
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    tabTextActive: {
      color: theme.activeText,
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      backgroundColor: "transparent",
      marginTop: 6,
      borderRadius: 999,
    },
    tabUnderlineActive: {
      backgroundColor: theme.activeText,
    },
    listContainer: {
      minHeight: screenHeight,
      paddingBottom: 120,
      paddingTop: 10,
      paddingHorizontal: 2,
      gap: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      top: screenHeight * 0.2,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.activeText,
      marginTop: 12,
    },
    errorOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.errorTitle,
      marginTop: 12,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 10,
      backgroundColor: "#FBF2F2",
      borderRadius: 20,
    },
  });
