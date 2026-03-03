import { postPendingShifts } from "@/api-queries/post-pending-shifts";
import { ShiftCardBase } from "@/components/pay-run";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import TabsHeader from "@/components/shared/tabs-header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shifts() {
  const {
    data,
    isLoading,
    isError,
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
      const pagination = lastPage?.data?.shifts;
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

  const shifts =
    data?.pages.flatMap((page) => page?.data?.shifts?.data ?? []) ?? [];

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <TabsHeader title="Shifts" />
      <View style={styles.container}>
        <FlatList
          data={isLoading ? [...Array(6)] : shifts}
          renderItem={
            isLoading
              ? () => <ShiftCardBaseSkeleton />
              : ({ item }) => <ShiftCardBase shift={item} />
          }
          keyExtractor={
            isLoading
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
            !isLoading && isFetchingNextPage ? (
              <View style={{ gap: 10, paddingTop: 10 }}>
                <ShiftCardBaseSkeleton />
                <ShiftCardBaseSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading && !isError && shifts.length === 0 ? (
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
                  No Shifts Yet
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: theme.secondaryText,
                    textAlign: "center",
                    maxWidth: 260,
                  }}
                >
                  There&apos;s no shifts for this the moment. Check back later
                  or explore other tabs!
                </Text>
              </View>
            ) : null
          }
        />
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
      borderRadius: 999,
      backgroundColor: theme.activeText,
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
      color: theme.secondaryText,
    },
    tabTextActive: {
      color: theme.primary,
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      borderRadius: 999,
      backgroundColor: "transparent",
      marginTop: 6,
    },
    tabUnderlineActive: {
      backgroundColor: theme.primary,
    },
  });
