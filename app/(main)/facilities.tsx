import { getFacilities } from "@/api-queries/facilities";
import FacilityCard from "@/components/facility";
import Header from "@/components/Header";
import FacilityCardSkeleton from "@/components/skeletons/facility-card-skeleton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Header title="Facilities" onBack={() => router.back()} />

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
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 10,
            flexGrow: 1,
            gap: 5,
          }}
          refreshing={isRefetching}
          onRefresh={handlePullToRefresh}
          ListEmptyComponent={
            !isLoading && !isError && facilities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={72}
                  color={theme.mutedText}
                  style={{ marginBottom: 16 }}
                />
                <Text style={styles.emptyTitle}>No Facilities Found</Text>
                <Text style={styles.emptySubtitle}>
                  You don’t have any facilities yet. Pull down to refresh or
                  check again later.
                </Text>
              </View>
            ) : null
          }
        />

        {isError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={72}
              color={theme.danger}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.errorTitle}>Error Loading Facilities</Text>
            <Text style={styles.errorSubtitle}>
              Something went wrong. Please try again.
              {"\n"}
              {facilitiesError instanceof Error ? facilitiesError.message : ""}
            </Text>

            <Pressable onPress={handlePullToRefresh} style={styles.retryButton}>
              <FontAwesome6 name="rotate-left" size={18} color="#71797E" />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
    },
    card: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: theme.whiteBackground,
      shadowColor: theme.primaryText,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primaryText,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.activeText,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: theme.secondaryText,
      textAlign: "center",
      maxWidth: 260,
    },
    errorOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.danger,
      marginBottom: 8,
    },
    errorSubtitle: {
      fontSize: 15,
      color: theme.secondaryText,
      textAlign: "center",
      marginBottom: 12,
    },
    retryButton: {
      backgroundColor: theme.mutedText,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    retryText: {
      color: theme.secondaryText,
      fontSize: 16,
      fontWeight: "700",
    },
  });
