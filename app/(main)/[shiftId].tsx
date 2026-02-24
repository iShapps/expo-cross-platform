import {
  postAcceptShift,
  postEndShift,
  postShiftTracking,
  postStartShift,
} from "@/api-queries/post-pending-shifts";
import { postShiftDetails } from "@/api-queries/shifts";
import Header from "@/components/Header";
import { ShiftType, ShiftTypePill } from "@/components/shift-type-pill";
import { ShiftDetailsSkeleton } from "@/components/skeletons";
import { SwipeButton } from "@/components/swipe-button";
import { useProfileData } from "@/data-store/use-account-store";
import { IShift } from "@/data-types/shifts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const iconMap: Record<string, { name: string; bg: string; color: string }> = {
  "Afternoon start": {
    name: "white-balance-sunny",
    bg: "#FFF7E6",
    color: "#FFB300",
  },
  "Afternoon end": {
    name: "white-balance-sunny",
    bg: "#FFF7E6",
    color: "#FFB300",
  },
  "Night start": { name: "weather-night", bg: "#E6E8FF", color: "#5C6BC0" },
  "Night end": { name: "weather-night", bg: "#E6E8FF", color: "#5C6BC0" },
  "Morning start": {
    name: "weather-sunset-up",
    bg: "#FFFDE7",
    color: "#FFD600",
  },
  "Morning end": { name: "weather-sunset-up", bg: "#FFFDE7", color: "#FFD600" },
};

const formatTimeWithAmPm = (time: string | null, baseDate?: Date) => {
  if (!time) return "--:--";
  const trimmed = time.trim();

  const formatDate = (date: Date) =>
    date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

  const formatClock = (hours: number, minutes: number) => {
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const minuteStr = String(minutes).padStart(2, "0");
    return `${hour12}:${minuteStr} ${period}`;
  };

  if (/\b(am|pm)\b/i.test(trimmed)) {
    return baseDate ? `${formatDate(baseDate)} ${trimmed}` : trimmed;
  }

  let parsed: Date | null = null;

  if (trimmed.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const candidate = new Date(trimmed);
    if (!Number.isNaN(candidate.getTime())) parsed = candidate;
  }

  if (!parsed) {
    const match = trimmed.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (match && baseDate) {
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const combined = new Date(baseDate);
      combined.setHours(hours, minutes, 0, 0);
      parsed = combined;
    }
  }

  if (!parsed) return trimmed;
  return `${formatDate(parsed)} ${formatClock(parsed.getHours(), parsed.getMinutes())}`;
};

const TimelineItem = ({
  label,
  time,
  baseDate,
  isFirst,
  isLast,
}: {
  label: string;
  time: string | null;
  baseDate?: Date;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const icon = iconMap[label] || {
    name: "circle",
    bg: "#F0F0F0",
    color: "#70C601",
  };
  const colorScheme = useColorScheme() || "light";
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.timelineItemWrap}>
      <View style={styles.timelineIconColumn}>
        {!isFirst && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor: icon.color,
                opacity: 0.35,
                top: 0,
                bottom: "50%",
              },
            ]}
          />
        )}
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: icon.bg, borderColor: icon.color },
          ]}
        >
          <MaterialCommunityIcons
            name={icon.name as any}
            size={18}
            color={icon.color}
          />
        </View>
        {/* Vertical line below */}
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor: icon.color,
                opacity: 0.35,
                top: "50%",
                bottom: 0,
              },
            ]}
          />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineTime}>
          {formatTimeWithAmPm(time, baseDate)}
        </Text>
      </View>
    </View>
  );
};

export default function ShiftDetails() {
  const router = useRouter();
  // receive shiftId from params

  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  const profileStore = useProfileData();
  const { shiftId } = useLocalSearchParams();
  const {
    getCurrentLocation,
    loading: locationLoading,
    errorMsg,
  } = useLocation();

  const {
    data,
    isLoading,
    isError,
    refetch,
    // isFetching,
    isRefetching,
    isRefetchError,
  } = useQuery({
    queryKey: ["shift-details", shiftId],
    queryFn: () => postShiftDetails(shiftId as string),
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchIntervalInBackground: true,
    enabled: !!shiftId,
  });

  const shift = data?.data?.shift as IShift;
  const shiftStatus = Number(shift?.shift_status);

  const acceptShiftMutation = useMutation({
    mutationFn: (id: number) => postAcceptShift(id),
  });
  const startShiftMutation = useMutation({
    mutationFn: (id: number) => postStartShift(id),
  });
  const endShiftMutation = useMutation({
    mutationFn: (id: number) => postEndShift(id),
  });
  const trackingMutation = useMutation({
    mutationFn: (params: {
      shift_id: number;
      facility_id: number;
      latitude: number;
      longitude: number;
    }) => postShiftTracking(params),
  });

  const isAccepting = acceptShiftMutation.isPending;
  const isStarting =
    locationLoading ||
    trackingMutation.isPending ||
    startShiftMutation.isPending;
  const isEnding = endShiftMutation.isPending;
  const isBusy = isAccepting || isStarting || isEnding;

  const openMaps = async () => {
    const address = shift?.address;

    if (!address) return;

    const encodedAddress = encodeURIComponent(address);

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open maps application.");
    }
  };

  const showAlert = (title: string, message?: string) => {
    Alert.alert(title, message || "Something went wrong.", [{ text: "OK" }]);
  };

  const handleAcceptShift = async () => {
    if (!shift?.id) return;
    try {
      const response = await acceptShiftMutation.mutateAsync(shift.id);
      if (!response.status) {
        showAlert("Shift not accepted", response.message);
        return;
      }
      showAlert("Success", response.message);
      profileStore.setAcceptedShift(shift); // Store accepted shift in global state
      await refetch();
    } catch (error) {
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to accept shift.",
      );
    }
  };

  const handleStartShift = async () => {
    if (!shift?.id) return;
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        showAlert("Location Error", errorMsg || "Unable to fetch location.");
        return;
      }
      const facilityId = shift?.facility?.id ?? shift?.facility_id;
      if (!facilityId) {
        showAlert("Error", "Missing facility information.");
        return;
      }
      console.log({
        shift_id: shift.id,
        facility_id: facilityId,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const trackingResponse = await trackingMutation.mutateAsync({
        shift_id: shift.id,
        facility_id: facilityId,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      if (!trackingResponse.status) {
        showAlert("Shift not started", trackingResponse.message);
        return;
      }
      const startResponse = await startShiftMutation.mutateAsync(shift.id);
      if (!startResponse.status) {
        showAlert("Shift not started", startResponse.message);
        return;
      }
      showAlert("Success", startResponse.message);
      profileStore.setAcceptedShift(null); // remove accepted shift from global state on start
      await refetch();
    } catch (error) {
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to start shift.",
      );
    }
  };

  const handleEndShift = async () => {
    if (!shift?.id) return;
    try {
      const response = await endShiftMutation.mutateAsync(shift.id);
      if (!response.status) {
        showAlert("Shift not ended", response.message);
        return;
      }
      showAlert("Success", response.message);
      profileStore.setAcceptedShift(null); // remove accepted shift from global state on end
      await refetch();
    } catch (error) {
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to end shift.",
      );
    }
  };

  const handleRefetch = async () => {
    await refetch();
  };

  const colorScheme = useColorScheme() || "light";
  const styles = getStyles(colorScheme);

  if (isLoading || isRefetching) {
    return <ShiftDetailsSkeleton />;
  }

  if (!isLoading && (isError || !shift || isRefetchError)) {
    return (
      <View
        style={[
          styles.errorScreen,
          { backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff" },
        ]}
      >
        <View
          style={[
            styles.errorCard,
            { backgroundColor: colorScheme === "dark" ? "#36454F" : "#fff" },
          ]}
        >
          <View
            style={[
              styles.errorIconWrap,
              {
                backgroundColor: colorScheme === "dark" ? "#232A2E" : "#FBF2F2",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={34}
              color="#FFB2B2"
            />
          </View>
          <Text
            style={[
              styles.errorTitle,
              { color: colorScheme === "dark" ? "#FFD966" : "#111" },
            ]}
          >
            Something went wrong
          </Text>
          <Text
            style={[
              styles.errorSubtitle,
              { color: colorScheme === "dark" ? "#FFD966" : "#6B7280" },
            ]}
          >
            {data?.message ??
              "We couldn’t load this shift right now. Check your connection and try again."}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              style={[
                styles.errorPrimaryBtn,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#FFD966" : "#FFB2B2",
                },
              ]}
              onPress={handleRefetch}
            >
              <Feather
                name="rotate-ccw"
                size={18}
                color={colorScheme === "dark" ? "#232A2E" : "#ffffff"}
              />
              <Text
                style={[
                  styles.errorPrimaryText,
                  { color: colorScheme === "dark" ? "#232A2E" : "#fff" },
                ]}
              >
                Try again
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.errorSecondaryBtn,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#232A2E" : "#F2F5EF",
                },
              ]}
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons
                name="return-up-back"
                size={18}
                color={colorScheme === "dark" ? "#FFD966" : "#4B5563"}
              />
              <Text
                style={[
                  styles.errorSecondaryText,
                  { color: colorScheme === "dark" ? "#FFD966" : "#4B5563" },
                ]}
              >
                Go back
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const isSleepover = Boolean(shift?.is_sleepover_shift);
  const startDate = new Date(shift?.start_time);
  const endDate = new Date(shift?.end_time);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      }}
    >
      <Header
        title="Shift Details"
        onBack={() => router.canGoBack() && router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={openMaps}
          style={[
            styles.heroCard,
            {
              backgroundColor: colorScheme === "dark" ? "#232A2E" : "#F8FFF0",
              borderColor: colorScheme === "dark" ? "#36454F" : "#E6F0D8",
            },
          ]}
        >
          <View
            style={[
              styles.heroIconWrap,
              {
                backgroundColor: colorScheme === "dark" ? "#36454F" : "#EAF7D2",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="office-building-marker"
              size={32}
              color={colorScheme === "dark" ? "#FFD966" : "#70C601"}
            />
          </View>
          <View style={styles.heroContent}>
            <Text
              style={[
                styles.heroName,
                { color: colorScheme === "dark" ? "#FFD966" : "#111" },
              ]}
            >
              {shift?.facility?.name ?? "—"}
            </Text>
            <Text
              style={[
                styles.heroMeta,
                { color: colorScheme === "dark" ? "#FFD966" : "#6B7280" },
              ]}
            >
              {shift?.address ?? "—"}
            </Text>
            <Text
              style={[
                styles.heroMeta,
                { color: colorScheme === "dark" ? "#FFD966" : "#6B7280" },
              ]}
            >
              {shift?.state?.name ?? "—"}
            </Text>
            <View style={styles.chipRow}>
              {shift?.shift_type && (
                <ShiftTypePill
                  type={
                    shift?.is_sleepover_shift
                      ? "sleepover"
                      : (shift?.shift_type as ShiftType)
                  }
                />
              )}
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shift Info</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {startDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {startDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              -{" "}
              {endDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>

            <Text
              style={{ ...styles.detailValue, textTransform: "capitalize" }}
            >
              {shift?.is_sleepover_shift ? "Sleepover" : shift?.shift_type}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={{ ...styles.detailValue, textTransform: "capitalize" }}
            >
              {shift?.status}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profession</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Profession</Text>
            <Text style={styles.detailValue}>
              {shift?.profession?.name ?? "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>
              {shift?.category?.name ?? "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Level</Text>
            <Text style={styles.detailValue}>{shift?.level?.name ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rates & Hours</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate per hour</Text>
            <Text style={styles.detailValue}>${shift?.hcp_per_rate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Hours</Text>
            <Text style={styles.detailValue}>{shift?.hours}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>${shift?.hcp_amount}</Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: "#818589",
              marginTop: 6,
              fontStyle: "italic",
            }}
          >
            All amounts are tax inclusive.
          </Text>
        </View>

        {isSleepover && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sleepover Timeline</Text>
            <View style={styles.timelineContainer}>
              <TimelineItem
                label="Afternoon start"
                time={shift?.sleepover_afternoon_start_time}
                baseDate={startDate}
                isFirst
              />
              <TimelineItem
                label="Afternoon end"
                time={shift?.sleepover_afternoon_end_time}
                baseDate={startDate}
              />
              <TimelineItem
                label="Night start"
                time={shift?.sleepover_night_start_time}
                baseDate={startDate}
              />
              <TimelineItem
                label="Night end"
                time={shift?.sleepover_night_end_time}
                baseDate={startDate}
              />
              <TimelineItem
                label="Morning start"
                time={shift?.sleepover_morning_start_time}
                baseDate={startDate}
              />
              <TimelineItem
                label="Morning end"
                time={shift?.sleepover_morning_end_time}
                baseDate={startDate}
                isLast
              />
            </View>
          </View>
        )}
      </ScrollView>

      {[0, 1, 2].includes(shiftStatus) && (
        <BottomSheet
          ref={bottomSheetRef}
          enablePanDownToClose={false}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          enableOverDrag={false}
          onChange={undefined}
          index={0}
          snapPoints={[110]}
          backgroundStyle={{
            backgroundColor: colorScheme === "dark" ? "#232A2E" : "#E6F0D8",
            borderTopWidth: 3,
            borderTopColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          }}
          handleIndicatorStyle={{
            backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
          }}
        >
          <BottomSheetView style={styles.contentContainer}>
            {shiftStatus === 0 && (
              <SwipeButton
                text="Swipe to Accept"
                onSwipeComplete={async () => {
                  try {
                    await handleAcceptShift();
                  } catch {
                  } finally {
                    setTimeout(() => acceptShiftMutation.reset(), 1500);
                  }
                }}
                disabled={isBusy}
                bgColor={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                processing={isAccepting}
                completed={acceptShiftMutation.isSuccess}
              />
            )}
            {shiftStatus === 1 && (
              <SwipeButton
                text="Swipe to Start"
                onSwipeComplete={async () => {
                  // await handleStartShift();
                  // startShiftMutation.reset();
                  // trackingMutation.reset();

                  try {
                    await handleStartShift();
                  } catch {
                  } finally {
                    setTimeout(() => startShiftMutation.reset(), 1500);
                    trackingMutation.reset();
                  }
                }}
                disabled={isBusy}
                bgColor={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                processing={isStarting}
                completed={startShiftMutation.isSuccess}
              />
            )}
            {shiftStatus === 2 && (
              <SwipeButton
                text="Swipe to End"
                onSwipeComplete={async () => {
                  try {
                    await handleEndShift();
                  } catch {
                  } finally {
                    setTimeout(() => endShiftMutation.reset(), 1500);
                  }
                }}
                disabled={isBusy}
                bgColor={colorScheme === "dark" ? "#E55353" : "#E55353"}
                processing={isEnding}
                completed={endShiftMutation.isSuccess}
              />
            )}
          </BottomSheetView>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    contentContainer: {
      height: 110,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 50,
    },
    container: {
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      width: "100%",
      height: "13%",
      display: "flex",
      flexDirection: "column",
      paddingVertical: 30,
    },
    backIconContainer: {
      height: 40,
      width: 40,
      borderRadius: 50,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      padding: 2,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#FFD966" : "#D3D3D3",
    },
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#FFD966" : "#fff",
    },
    faintbackIconContainer: {
      height: 40,
      width: 40,
      borderRadius: 50,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      padding: 2,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    topBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      marginTop: 20,
    },
    iconCircle: {
      height: 40,
      width: 40,
      borderRadius: 20,
      backgroundColor: "#F0F0F0",
      alignItems: "center",
      justifyContent: "center",
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111",
    },
    content: {
      paddingBottom: 140,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      paddingHorizontal: 10,
      // flex: 1,
    },
    actionBarTop: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 4,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: "#E6F0D8",
    },
    actionButton: {
      borderRadius: 999,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#E6F0D8",
      shadowColor: "#70C601",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 5,
    },
    actionButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    actionButtonAccept: {
      backgroundColor: "#70C601",
    },
    actionButtonStart: {
      backgroundColor: "#4CAF50",
    },
    actionButtonEnd: {
      backgroundColor: "#E55353",
    },
    heroCard: {
      marginTop: 8,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#F8FFF0",
      borderRadius: 5,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#E6F0D8",
      marginBottom: 12,
    },
    heroIconWrap: {
      height: 64,
      width: 64,
      borderRadius: 5,
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#EAF7D2",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroContent: {
      flex: 1,
    },
    heroName: {
      fontSize: 16,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
    },
    heroMeta: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#6B7280",
      marginTop: 2,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: "#F0F0F0",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
      fontSize: 12,
      color: "#6B7280",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
      marginTop: 4,
    },
    chipRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      marginBottom: -8,
    },
    chip: {
      backgroundColor: "#F0F8E8",
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginRight: 4,
    },
    chipText: {
      color: "#70C601",
      fontWeight: "700",
      fontSize: 13,
      letterSpacing: 0.5,
    },
    timelineContainer: {
      marginTop: 8,
      paddingLeft: 18,
    },
    timelineItemWrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      minHeight: 75,
    },
    timelineIconColumn: {
      width: 36,
      alignItems: "center",
      position: "relative",
      minHeight: 75,
      justifyContent: "flex-start",
    },
    timelineLine: {
      position: "absolute",
      left: "50%",
      transform: [{ translateX: -1.5 }],
      width: 2,
      borderRadius: 2,
      backgroundColor: "#E0E0E0",
      zIndex: 0,
      height: "50%",
    },
    timelineDot: {
      width: 40,
      height: 40,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      borderWidth: 1,
      borderColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    timelineContent: {
      flex: 1,
      marginLeft: 8,
      flexDirection: "column",
      justifyContent: "center",
    },
    timelineLabel: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#b0b8ca" : "#36454F",
      fontWeight: "400",
      textTransform: "capitalize",
    },
    timelineTime: {
      fontSize: 13,
      color: "#818589",
      fontWeight: "300",
      textTransform: "capitalize",
    },
    errorScreen: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    errorCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#fff",
      borderRadius: 8,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#232A2E" : "#E6F0D8",
      alignItems: "center",
      shadowColor: colorScheme === "dark" ? "#70C601" : "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 3,
    },
    errorIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#FBF2F2",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#FFD966" : "#111",
    },
    errorSubtitle: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#FFD966" : "#6B7280",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 18,
    },
    errorActions: {
      width: "100%",
      marginTop: 18,
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
    },
    errorPrimaryBtn: {
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#FFB2B2",
      display: "flex",
      flexDirection: "row",
      gap: 8,
      alignContent: "center",
      justifyContent: "center",
      borderRadius: 5,
      width: "45%",
      alignItems: "center",
    },
    errorPrimaryText: {
      color: colorScheme === "dark" ? "#232A2E" : "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    errorSecondaryBtn: {
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#F2F5EF",
      paddingVertical: 12,
      borderRadius: 5,
      alignItems: "center",
      width: "50%",
      display: "flex",
      alignContent: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    errorSecondaryText: {
      color: colorScheme === "dark" ? "#FFD966" : "#4B5563",
      fontSize: 14,
      fontWeight: "500",
    },
  });
