import { getNotifications } from "@/api-queries/notifcations";
import { NotificationCard } from "@/components/notification-card";
import { NotificationCardSkeleton } from "@/components/skeletons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const {
    data,
    isLoading: notificationsLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: notificationsError,
  } = useInfiniteQuery({
    queryKey: ["noifications"],
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
  });

  const notifications =
    data?.pages.flatMap((page) => page?.data?.hcps?.data ?? []) ?? [];
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
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <View style={styles.container}>
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
                  No Notifications Yet
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#818589",
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

      {isError && (
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
            Error Loading Notifications
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
            Something went wrong while fetching notifications. Please pull to
            refresh or try again later. (
            {notificationsError instanceof Error && (
              <Text
                style={{
                  fontSize: 13,
                  color: "#818589",
                  textAlign: "center",
                }}
              >
                {notificationsError.message}
              </Text>
            )}
            )
          </Text>
          <Pressable
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
            <FontAwesome6 name="rotate-left" size={20} color="#71797E" />
            <Text
              style={{
                color: "#71797E",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      paddingHorizontal: 10,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      width: "100%",
      margin: 8,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#ffffff",
    },
    underline: {
      height: 3,
      width: 56,
      borderRadius: 999,
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
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
      color: colorScheme === "dark" ? "#a8a49f" : "#667085",
    },
    tabTextActive: {
      color: colorScheme === "dark" ? "#a8a49f" : "#70C601",
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      borderRadius: 999,
      backgroundColor: "transparent",
      marginTop: 6,
    },
    tabUnderlineActive: {
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
    },
  });
