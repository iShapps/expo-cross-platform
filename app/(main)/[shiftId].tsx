import { isAuthError } from "@/api-actions/error-utils";
import {
  postAcceptShift,
  postAcceptShiftTransfer,
  postEndShift,
  postShiftTracking,
  postStartShift,
} from "@/api-queries/post-pending-shifts";
import { postShiftDetails } from "@/api-queries/shifts";
import Header from "@/components/Header";
import { ShiftType, ShiftTypePill } from "@/components/shift-type-pill";
import { ShiftDetailsSkeleton } from "@/components/skeletons";
import { SwipeButton } from "@/components/swipe-button";
import { Colors } from "@/constants/theme";
import { useProfileData } from "@/data-store/use-account-store";
import { IShift } from "@/data-types/shifts";
import { useCalendarAndReminders } from "@/hooks/use-calendar-and-reminders";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLiveActivity } from "@/hooks/use-live-activity";
import { useLocation } from "@/hooks/use-location";
import { formatMediumDate } from "@/utils/date-time";
import { shiftToCalendarEvent } from "@/utils/shift-calendar-utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
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

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
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
  const queryClient = useQueryClient();
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

  const { start: startLiveActivityForShift, stop: endLiveActivityForShift } =
    useLiveActivity();

  const { addShiftToCalendar, removeShiftFromCalendar } =
    useCalendarAndReminders();

  const acceptShiftMutation = useMutation({
    mutationFn: (id: number) => postAcceptShift(id),
  });
  const startShiftMutation = useMutation({
    mutationFn: (id: number) => postStartShift(id),
  });
  const endShiftMutation = useMutation({
    mutationFn: (id: number) => postEndShift(id),
  });

  const acceptShiftTransferMutation = useMutation({
    mutationFn: (id: number) => postAcceptShiftTransfer(id),
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
  const isAcceptingTransfer = acceptShiftTransferMutation.isPending;
  const isStarting =
    locationLoading ||
    trackingMutation.isPending ||
    startShiftMutation.isPending;
  const isEnding = endShiftMutation.isPending;
  const isBusy = isAccepting || isAcceptingTransfer || isStarting || isEnding;

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

      // Add shift to calendar and set up reminders
      try {
        console.log("calendarEvent", shift);

        const calendarEvent = shiftToCalendarEvent(shift);
        const result = await addShiftToCalendar(calendarEvent);

        // Store the eventId linked to this shift
        await AsyncStorage.setItem(
          `calendar_event_${shift.id}`,
          result.eventId,
        );
      } catch (calendarError) {
        console.error("Failed to add shift to calendar:", calendarError);
        // Don't fail the entire shift acceptance if calendar fails
        Alert.alert(
          "Info",
          "Shift accepted but calendar/reminder setup failed. You can set reminders manually.",
        );
      }

      showAlert("Success", response.message);
      profileStore.setAcceptedShift(shift); // Store accepted shift in global state
      await refetch();

      // invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["scheduled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["running-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["cancelled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["transferred-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["completed-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (error) {
      if (isAuthError(error)) return;
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to accept shift.",
      );
    }
  };

  const handleAcceptShiftTransfer = async () => {
    if (!shift?.id) return;
    try {
      const response = await acceptShiftTransferMutation.mutateAsync(shift.id);
      if (!response.status) {
        showAlert("Shift transfer not accepted", response.message);
        return;
      }

      // Add shift to calendar and set up reminders
      try {
        console.log("calendarEvent", shift);

        const calendarEvent = shiftToCalendarEvent(shift);
        const result = await addShiftToCalendar(calendarEvent);

        // Store the eventId linked to this shift
        await AsyncStorage.setItem(
          `calendar_event_${shift.id}`,
          result.eventId,
        );
      } catch (calendarError) {
        console.error("Failed to add shift to calendar:", calendarError);
        // Don't fail the entire shift acceptance if calendar fails
        Alert.alert(
          "Info",
          "Shift transfer accepted but calendar/reminder setup failed. You can set reminders manually.",
        );
      }

      showAlert("Success", response.message);
      profileStore.setAcceptedShift(shift); // Store accepted shift in global state
      await refetch();

      // invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["scheduled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["running-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["cancelled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["transferred-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["completed-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (error) {
      if (isAuthError(error)) return;
      showAlert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to accept shift transfer.",
      );
    }
  };

  const handleStartShift = async () => {
    if (!shift?.id) return;
    try {
      // Retrieve the stored eventId for this shift
      const eventId = await AsyncStorage.getItem(`calendar_event_${shift.id}`);

      if (eventId) {
        await removeShiftFromCalendar(eventId);
        await AsyncStorage.removeItem(`calendar_event_${shift.id}`); // clean up
      }
    } catch (calendarError) {
      console.error("Failed to remove shift from calendar:", calendarError);
    }
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

      console.log("About to start live activity");
      await startLiveActivityForShift(shift);
      console.log("Live activity started call completed");
      profileStore.setAcceptedShift(null); // remove accepted shift from global state on start
      await refetch();
      // invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["scheduled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["running-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["cancelled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["transferred-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["completed-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (error) {
      if (isAuthError(error)) return;
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
      // stop live activity
      await endLiveActivityForShift();

      await refetch();
      // invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["scheduled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["running-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["cancelled-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["transferred-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["completed-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      // router.push({
      //   pathname: "/review",
      //   params: {
      //     shift_id: shift.id,
      //     facility_id: shift.facility?.id ?? shift.facility_id,
      //     category_id: shift.category?.id ?? shift.category_id,
      //     profession_id: shift.profession?.id ?? shift.profession_id,
      //   },
      // });
    } catch (error) {
      if (isAuthError(error)) return;
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to end shift.",
      );
    }
  };

  // Test review formsheet navigation
  // useEffect(() => {
  //   if (shift?.id) {
  //     router.push({
  //       pathname: "/review",
  //       params: {
  //         shift_id: shift.id,
  //         facility_id: shift.facility?.id ?? shift.facility_id,
  //         category_id: shift.category?.id ?? shift.category_id,
  //         profession_id: shift.profession?.id ?? shift.profession_id,
  //       },
  //     });
  //   }
  // }, [shift?.id]);

  const handleRefetch = async () => {
    await refetch();
  };

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  if (isLoading || isRefetching) {
    return <ShiftDetailsSkeleton />;
  }

  if (!isLoading && (isError || !shift || isRefetchError)) {
    return (
      <View
        style={[styles.errorScreen, { backgroundColor: theme.whiteBackground }]}
      >
        <View
          style={[styles.errorCard, { backgroundColor: theme.whiteBackground }]}
        >
          <View
            style={[
              styles.errorIconWrap,
              {
                backgroundColor: theme.errorBg,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={34}
              color={theme.danger}
            />
          </View>
          <Text style={[styles.errorTitle, { color: theme.errorTitle }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.errorTitle }]}>
            {data?.message ??
              "We couldn’t load this shift right now. Check your connection and try again."}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              style={[
                styles.errorPrimaryBtn,
                {
                  backgroundColor: theme.errorBg,
                },
              ]}
              onPress={handleRefetch}
            >
              <Feather name="rotate-ccw" size={18} color={theme.white} />
              <Text style={[styles.errorPrimaryText, { color: theme.white }]}>
                Try again
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.errorSecondaryBtn,
                {
                  backgroundColor: theme.whiteBackground,
                },
              ]}
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons
                name="return-up-back"
                size={18}
                color={theme.errorSubtitle}
              />
              <Text
                style={[
                  styles.errorSecondaryText,
                  { color: theme.errorSubtitle },
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
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <Header
        title="Shift Details"
        onBack={() => router.canGoBack() && router.back()}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { backgroundColor: theme.whiteBackground },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={openMaps}
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.heroBg,
              borderColor: theme.heroBorder,
            },
          ]}
        >
          <View
            style={[
              styles.heroIconWrap,
              {
                backgroundColor: theme.heroIconBg,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="office-building-marker"
              size={32}
              color={theme.primary}
            />
          </View>
          <View style={styles.heroContent}>
            <Text style={[styles.heroName, { color: theme.primaryText }]}>
              {shift?.facility?.name ?? "—"}
            </Text>
            <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
              {shift?.facility?.address ?? "—"}
            </Text>
            <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
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
        {/* show transfer button for shifts accepted but not started */}
        {/* {[1].includes(shiftStatus) && (
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            <Pressable
              style={[styles.button, { backgroundColor: theme.activeText }]}
              onPress={() =>
                router.push(`/(main)/transfer-shift?shiftId=${shift?.id}`)
              }
            >
              <MaterialIcons
                name="transfer-within-a-station"
                size={18}
                color={theme.whiteText}
              />
              <Text style={styles.buttonText}>Transfer shift</Text>
            </Pressable>
          </View>
        )} */}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shift Info</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID</Text>
            <Text style={styles.detailValue}>
              {shift?.shift_prefix ?? "-"}
              {shift?.id ?? "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {formatMediumDate(startDate)}
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
              {shift?.shift_status === "0"
                ? "Pending"
                : shift?.shift_status === "1"
                  ? "Scheduled"
                  : shift?.shift_status === "2"
                    ? "Running"
                    : shift?.shift_status === "3"
                      ? "Cancelled"
                      : shift?.shift_status === "4"
                        ? "Completed"
                        : shift?.shift_status === "5"
                          ? "Transferred"
                          : shift?.shift_status === "6"
                            ? "Past"
                            : "-"}
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
          <Text style={styles.sectionTitle}>Hours</Text>
          {/* <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate per hour</Text>
            <Text style={styles.detailValue}>${shift?.hcp_per_rate}</Text>
          </View> */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Hours</Text>
            <Text style={styles.detailValue}>{shift?.hours}</Text>
          </View>
          {/* <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>${shift?.hcp_amount}</Text>
          </View> */}
          {/* <Text
            style={{
              fontSize: 11,
              color: "#818589",
              marginTop: 6,
              fontStyle: "italic",
            }}
          >
            All amounts are tax inclusive.
          </Text> */}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}></Text>
            <Text style={styles.detailValue}>{shift?.notes ?? "—"}</Text>
          </View>
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
            backgroundColor: theme.heroBorder,
            // borderTopWidth: 3,
            // borderTopColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
            // borderTopLeftRadius: 15,
            // borderTopRightRadius: 15,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.primary,
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
                bgColor={theme.primary}
                processing={isAccepting}
                completed={acceptShiftMutation.isSuccess}
              />
            )}

            {shiftStatus === 1 &&
              shift?.shift_transfer_to &&
              shift.shift_transfer_to.status === "pending" && (
                <SwipeButton
                  text="Swipe to Accept Transfer"
                  onSwipeComplete={async () => {
                    try {
                      await handleAcceptShiftTransfer();
                    } catch {
                    } finally {
                      setTimeout(
                        () => acceptShiftTransferMutation.reset(),
                        1500,
                      );
                    }
                  }}
                  disabled={isBusy}
                  bgColor={theme.primary}
                  processing={isAccepting}
                  completed={acceptShiftTransferMutation.isSuccess}
                />
              )}
            {shiftStatus === 1 &&
              (!shift?.shift_transfer_to ||
                shift.shift_transfer_to.status !== "pending") && (
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
                  bgColor={theme.primary}
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
                bgColor={theme.danger}
                processing={isEnding}
                completed={endShiftMutation.isSuccess}
              />
            )}
          </BottomSheetView>
        </BottomSheet>
      )}

      {isBusy && (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <BlurView
            intensity={45}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.busyCard}>
            <ActivityIndicator size="large" color={theme.white} />
            <Text style={styles.busyText}>
              {isAccepting
                ? "Accepting shift..."
                : isStarting
                  ? "Starting shift..."
                  : isEnding
                    ? "Ending shift..."
                    : isAcceptingTransfer
                      ? "Accepting shift transfer..."
                      : "Processing shift action..."}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    contentContainer: {
      height: 110,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 50,
    },

    content: {
      paddingBottom: 140,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
      // flex: 1,
    },

    heroCard: {
      marginTop: 8,
      backgroundColor: theme.heroBg,
      borderRadius: 5,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.heroBorder,
      marginBottom: 12,
    },
    heroIconWrap: {
      height: 64,
      width: 64,
      borderRadius: 5,
      backgroundColor: theme.heroIconBg,
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
      color: theme.primaryText,
    },
    heroMeta: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.whiteBackground,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.tertiaryText,
      marginTop: 4,
    },
    chipRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      marginBottom: -8,
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
      backgroundColor: theme.grayBorder,
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
      borderColor: theme.white,
      shadowColor: theme.shadow,
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
      color: theme.tertiaryText,
      fontWeight: "400",
      textTransform: "capitalize",
    },
    timelineTime: {
      fontSize: 13,
      color: theme.secondaryText,
      fontWeight: "300",
      textTransform: "capitalize",
    },
    errorScreen: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    errorCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.whiteBackground,
      borderRadius: 8,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: theme.grayBorder,
      alignItems: "center",
      shadowColor: theme.darkText,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 3,
    },
    errorIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.mutedText,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.errorTitle,
    },
    errorSubtitle: {
      fontSize: 13,
      color: theme.errorSubtitle,
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
      backgroundColor: theme.errorBg,
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
      color: theme.errorTitle,
      fontSize: 14,
      fontWeight: "500",
    },
    errorSecondaryBtn: {
      backgroundColor: theme.whiteBackground,
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
      color: theme.errorSubtitle,
      fontSize: 14,
      fontWeight: "500",
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 9,
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    buttonText: {
      color: theme.white,
      fontSize: 13,
      fontWeight: "400",
    },
    busyOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      elevation: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 16, 26, 0.2)",
    },
    busyCard: {
      minWidth: 220,
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: 10,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      gap: 12,
    },
    busyText: {
      color: theme.white,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
  });
