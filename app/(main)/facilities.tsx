import { getFacilities } from "@/api-queries/facilities";
import { EmptyState, ScreenHeader } from "@/components/design";
import FacilityCard from "@/components/facility";
import FacilityCardSkeleton from "@/components/skeletons/facility-card-skeleton";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FacilitiesScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    error: facilitiesError,
  } = useQuery({
    queryKey: ["facilities"],
    queryFn: () => getFacilities(),
    refetchInterval: 30 * 60 * 1000,
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchIntervalInBackground: true,
  });

  const facilities = data?.data?.facilities ?? [];

  const handlePullToRefresh = async () => {
    await refetch();
  };


  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Facilities" onBack={() => router.back()} />

      <View style={styles.container}>
        <FlatList
          data={isLoading ? [...Array(6)] : facilities}
          keyExtractor={
            isLoading
              ? (_, idx) => `skeleton-${idx}`
              : (item) => item.id.toString()
          }
          renderItem={
            isLoading
              ? () => <FacilityCardSkeleton />
              : ({ item }) => <FacilityCard facility={item} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={handlePullToRefresh}
          ListEmptyComponent={
            !isLoading && !isError && facilities.length === 0 ? (
              <EmptyState
                icon="business-outline"
                title="No facilities found"
                message="You don't have any facilities yet. Pull down to refresh or check again later."
                style={styles.empty}
              />
            ) : null
          }
        />

        {isError && (
          <View style={[styles.errorOverlay, { backgroundColor: colors.background }]}>
            <EmptyState
              icon="cloud-offline-outline"
              tone="danger"
              title="Couldn't load facilities"
              message={
                "Something went wrong. Please try again." +
                (facilitiesError instanceof Error ? `\n(${facilitiesError.message})` : "")
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
  },
  listContent: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: 120,
    flexGrow: 1,
    gap: Space.sm,
  },
  empty: {
    flex: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
