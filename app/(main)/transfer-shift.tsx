import { ApiMutationError } from "@/api-actions/mutations";
import { getAllHcps } from "@/api-queries/hcps";
import { transferShift } from "@/api-queries/profile";
import { ShiftCardBaseSkeleton } from "@/components/skeletons";
import HcpListSkeleton from "@/components/skeletons/hcp-skeleton";
import { Colors } from "@/constants/theme";
import { useConfigSettings } from "@/data-store/config-store";
import { IHcp } from "@/data-types/hcps";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  AntDesign,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isLoading, spinAnim]);

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
    <View style={styles.container}>
      {/* go back icon */}
      <View
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => {
            router.canGoBack() && router.back();
          }}
        >
          <Ionicons name="close-outline" size={25} color={theme.darkText} />
        </Pressable>
        {/* transfer button */}
        {selectedHcpId && (
          <TouchableOpacity
            style={[
              styles.button,
              transferShiftMutation.isPending && { opacity: 0.6 },
              { backgroundColor: theme.activeText },
            ]}
            onPress={handleSubmit}
            disabled={transferShiftMutation.isPending}
          >
            {transferShiftMutation.isPending && (
              <Animated.View
                style={{
                  marginRight: 10,
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <AntDesign
                  name="loading-3-quarters"
                  size={20}
                  color={theme.white}
                />
              </Animated.View>
            )}
            <Text style={[styles.buttonText, { color: theme.white }]}>
              {isLoading ? "transferring shift..." : "Transfer Shift"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        placeholder="Search HCP by name"
        value={searchName}
        onChangeText={setSearchName}
        editable
        autoComplete="name"
        autoFocus
        clearButtonMode="while-editing"
        cursorColor="#70C601"
        enterKeyHint="search"
        inlineImageLeft="search_icon"
        inputMode="text"
        // TODO: update to match app theme
        keyboardAppearance={colorScheme === "dark" ? "dark" : "light"}
        returnKeyLabel="search"
        returnKeyType="search"
        style={styles.searchInput}
        onSubmitEditing={() => setSearchQuery(searchName)}
      />

      {/* HCP List UI */}
      <FlatList
        data={isLoading ? [...Array(6)] : hcps}
        renderItem={
          isLoading
            ? () => <HcpListSkeleton />
            : ({ item }) => (
                <Pressable
                  onPress={() =>
                    setSelectedHcpId(selectedHcpId === item.id ? null : item.id)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  {/* Avatar image source for HCPs */}
                  <Image
                    source={{
                      uri: getAvatarImageSource(
                        item,
                        configSettings?.configSettings?.image_path?.hcp_path ??
                          "",
                      ),
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#f0f0f0",
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text
                      style={{
                        fontWeight: "500",
                        fontSize: 16,
                        color: theme.darkText,
                      }}
                    >
                      {item.first_name} {item.last_name}
                    </Text>
                    <Text style={{ color: theme.grayBorder, fontSize: 14 }}>
                      {item?.one_hcp_professions?.category?.name ?? "—"}{" "}
                      {item?.one_hcp_professions?.level?.name ?? "—"}{" "}
                      {item?.profession?.name ?? "—"}
                    </Text>
                    {/* status i.e online and offline  based on available_for_job */}
                    <Text
                      style={{
                        color: item.available_for_job ? "#70C601" : "#FF0000",
                        fontSize: 12,
                      }}
                    >
                      {item.available_for_job ? "Online" : "Offline"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setSelectedHcpId(
                        selectedHcpId === item.id ? null : item.id,
                      )
                    }
                    style={{ padding: 8 }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedHcpId === item.id }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor:
                          selectedHcpId === item.id ? "#70C601" : "#ccc",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedHcpId === item.id && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: "#70C601",
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                </Pressable>
              )
        }
        keyExtractor={
          isLoading ? (_, idx) => `hcp-${idx}` : (item) => String(item.id)
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
          !isLoading && !isError && hcps.length === 0 ? (
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
                No hcps found
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: theme.secondaryText,
                  textAlign: "center",
                  maxWidth: 260,
                }}
              >
                There&apos;s no hcps for this the moment. Check back later!
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
            Something went wrong while fetching hcps. Please pull to refresh or
            try again later. (
            {hcpsError instanceof Error && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.secondaryText,
                  textAlign: "center",
                }}
              >
                {hcpsError.message}
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
  );
};

export default TransferShift;
const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.safeAreaBg,
      paddingHorizontal: 10,
      paddingVertical: 15,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: theme.grayBorder,
      borderRadius: 5,
      width: "100%",
      padding: 10,
      marginTop: 10,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 9,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      borderTopRightRadius: 20,
    },
    buttonText: {
      color: theme.white,
      fontSize: 13,
      fontWeight: "400",
    },
  });
