import { isAuthError } from "@/api-actions/error-utils";
import { ApiMutationError } from "@/api-actions/mutations";
import { getAllHcps } from "@/api-queries/hcps";
import { transferShift } from "@/api-queries/profile";
import {
  AppButton,
  AppText,
  Avatar,
  Chip,
  EmptyState,
  IconButton,
  PressableCard,
  TextField,
} from "@/components/design";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";
import HcpListSkeleton from "@/components/skeletons/hcp-skeleton";
import { Radius, Space } from "@/constants/design";
import { useConfigSettings } from "@/data-store/config-store";
import { IHcp } from "@/data-types/hcps";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Avatar image source for HCPs
const getAvatarImageSource = (hcp: IHcp, imagePath: string) => {
  if (!hcp?.image) return undefined;
  return `${imagePath}${encodeURIComponent(
    `${hcp.hcp_prefix}${hcp.id}`,
  )}/image/${hcp.image}`;
};

const TransferShift = () => {
  const { shiftId } = useLocalSearchParams();
  const configSettings = useConfigSettings();
  const parsedShiftId = Array.isArray(shiftId)
    ? Number(shiftId[0])
    : Number(shiftId);
  const [searchName, setSearchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHcpId, setSelectedHcpId] = useState<number | null>(null);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: hcpsError,
  } = useInfiniteQuery({
    queryKey: ["all-hcps", searchQuery],
    queryFn: ({ pageParam = 1 }) => getAllHcps(pageParam, searchQuery),
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

  const hcps =
    data?.pages.flatMap((page) => page?.data?.hcps?.data ?? []) ?? [];

  const handlePullToRefresh = async () => {
    await refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();

  const transferShiftMutation = useMutation({
    mutationFn: transferShift,

    onSuccess: (response) => {
      if (response.status) {
        // Invalidate queries
        queryClient.invalidateQueries({
          queryKey: ["shift-details", parsedShiftId],
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["scheduled-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["running-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["cancelled-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["transferred-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["completed-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["pending-shifts"] });
        Alert.alert("Success", response.message, [
          {
            text: "OK",
            onPress: () => {
              router.canGoBack() && router.back();
            },
          },
        ]);
        setSelectedHcpId(null);
      } else {
        Alert.alert("Error", response.message);
      }
    },

    onError: (error: ApiMutationError) => {
      if (isAuthError(error)) return;
      const message =
        error?.message || "Shift transfer failed. Please try again.";
      Alert.alert("Error", message);
      console.error("Shift transfer error:", error);
    },
  });

  const handleSubmit = () => {
    transferShiftMutation.mutate({
      shift_id: parsedShiftId,
      transfer_hcp_id: selectedHcpId!,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="title3" style={styles.flex}>
          Transfer shift
        </AppText>
        <IconButton
          icon="close"
          accessibilityLabel="Close"
          onPress={() => {
            router.canGoBack() && router.back();
          }}
        />
      </View>

      <TextField
        placeholder="Search HCP by name"
        icon="search-outline"
        value={searchName}
        onChangeText={setSearchName}
        editable
        autoComplete="name"
        autoFocus
        clearButtonMode="while-editing"
        enterKeyHint="search"
        inputMode="text"
        keyboardAppearance={isDark ? "dark" : "light"}
        returnKeyLabel="search"
        returnKeyType="search"
        onSubmitEditing={() => setSearchQuery(searchName)}
      />

      {/* HCP List UI */}
      <View style={styles.flex}>
        <FlatList
          data={isLoading ? [...Array(6)] : hcps}
          renderItem={
            isLoading
              ? () => <HcpListSkeleton />
              : ({ item }) => {
                  const selected = selectedHcpId === item.id;
                  return (
                    <PressableCard
                      onPress={() =>
                        setSelectedHcpId(selectedHcpId === item.id ? null : item.id)
                      }
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      radius={Radius.lg}
                      padding={Space.sm}
                      style={[
                        styles.row,
                        selected && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primarySoft,
                        },
                      ]}
                    >
                      {/* Avatar image source for HCPs */}
                      <Avatar
                        name={`${item.first_name ?? ""} ${item.last_name ?? ""}`}
                        uri={getAvatarImageSource(
                          item,
                          configSettings?.configSettings?.image_path?.hcp_path ??
                            "",
                        )}
                        size={44}
                      />
                      <View style={styles.rowText}>
                        <AppText variant="headline" numberOfLines={1}>
                          {item.first_name} {item.last_name}
                        </AppText>
                        <AppText variant="footnote" color="textSecondary" numberOfLines={1}>
                          {item?.one_hcp_professions?.category?.name ?? "—"}{" "}
                          {item?.one_hcp_professions?.level?.name ?? "—"}{" "}
                          {item?.profession?.name ?? "—"}
                        </AppText>
                        {/* status i.e online and offline  based on available_for_job */}
                        <Chip
                          label={item.available_for_job ? "Online" : "Offline"}
                          tone={item.available_for_job ? "success" : "danger"}
                          style={styles.statusChip}
                        />
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: selected ? colors.primary : colors.borderStrong },
                        ]}
                      >
                        {selected && (
                          <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                    </PressableCard>
                  );
                }
          }
          keyExtractor={
            isLoading ? (_, idx) => `hcp-${idx}` : (item) => String(item.id)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isFetchingNextPage}
          onRefresh={handlePullToRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            !isLoading && isFetchingNextPage ? (
              <View style={styles.footerSkeletons}>
                <ShiftCardBaseSkeleton />
                <ShiftCardBaseSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading && !isError && hcps.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No HCPs found"
                message="There are no HCPs to show at the moment. Try a different name or check back later."
                style={styles.flex}
              />
            ) : null
          }
        />

        {isError && (
          <View style={[styles.errorOverlay, { backgroundColor: colors.background }]}>
            <EmptyState
              icon="cloud-offline-outline"
              tone="danger"
              title="Couldn't load HCPs"
              message={
                "Something went wrong while fetching hcps. Please pull to refresh or try again later." +
                (hcpsError instanceof Error ? `\n(${hcpsError.message})` : "")
              }
              actionLabel="Retry"
              onAction={handlePullToRefresh}
            />
          </View>
        )}
      </View>

      {/* transfer button */}
      {selectedHcpId && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + Space.sm,
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <AppButton
            title="Transfer shift"
            icon="swap-horizontal"
            onPress={handleSubmit}
            loading={transferShiftMutation.isPending}
            loadingTitle="Transferring shift…"
            disabled={transferShiftMutation.isPending}
            fullWidth
          />
        </View>
      )}

    </View>
  );
};

export default TransferShift;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Space.gutter,
    paddingTop: Space.md,
    gap: Space.md,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  listContent: {
    paddingBottom: 140,
    paddingTop: Space.xxs,
    flexGrow: 1,
    gap: Space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  statusChip: {
    marginTop: Space.xxs,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Space.xxs,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  footerSkeletons: {
    gap: Space.sm,
    paddingTop: Space.sm,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Space.gutter,
    paddingTop: Space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
