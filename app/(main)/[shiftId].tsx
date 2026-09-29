import { isAuthError } from "@/api-actions/error-utils";
import {
  postAcceptShift,
  postAcceptShiftTransfer,
  postEndShift,
  postShiftTracking,
  postStartShift,
} from "@/api-queries/post-pending-shifts";
import { postShiftDetails } from "@/api-queries/shifts";
import {
  AppText,
  Card,
  Chip,
  Icon,
  IconBadge,
  InfoRow,
  PressableCard,
  ScreenHeader,
  type IconName,
} from "@/components/design";
import { ShiftType, ShiftTypePill } from "@/components/shift-type-pill";
import { ShiftDetailsSkeleton } from "@/components/skeletons";
import { SwipeButton } from "@/components/swipe-button";
import {
  elevation,
  Radius,
  Space,
  toneColors,
  type Tone,
} from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { IShift } from "@/data-types/shifts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCalendarAndReminders } from "@/hooks/use-calendar-and-reminders";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useLiveActivity } from "@/hooks/use-live-activity";
import { useLocation } from "@/hooks/use-location";
import { shiftToCalendarEvent } from "@/utils/shift-calendar-utils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

const iconMap: Record<string, { name: IconName; tone: Tone }> = {
  "Afternoon start": { name: "sunny-outline", tone: "amber" },
  "Afternoon end": { name: "sunny-outline", tone: "amber" },
  "Night start": { name: "moon-outline", tone: "violet" },
  "Night end": { name: "moon-outline", tone: "violet" },
  "Morning start": { name: "partly-sunny-outline", tone: "blue" },
  "Morning end": { name: "partly-sunny-outline", tone: "blue" },
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
  const { colors } = useAppTheme();
  const icon = iconMap[label] || { name: "ellipse-outline", tone: "primary" };
  const { fg } = toneColors(colors, icon.tone);

  return (
    <View style={styles.timelineItemWrap}>
      <View style={styles.timelineIconColumn}>
        {!isFirst && (
          <View
            style={[styles.timelineLine, { backgroundColor: fg, top: 0, bottom: "50%" }]}
          />
        )}
        <IconBadge icon={icon.name} tone={icon.tone} size={40} />
        {!isLast && (
          <View
            style={[styles.timelineLine, { backgroundColor: fg, top: "50%", bottom: 0 }]}
          />
        )}
      </View>
      <View style={styles.timelineContent}>
        <AppText variant="subhead">{label}</AppText>
        <AppText variant="footnote" color="textSecondary">
          {formatTimeWithAmPm(time, baseDate)}
        </AppText>
      </View>
    </View>
  );
};

export default function ShiftDetails() {
  const router = useRouter();
  // receive shiftId from params

  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);
  const hasShownDetailsErrorAlertRef = useRef(false);

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
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: true,
    enabled: !!shiftId,
  });

  const shift = data?.data?.shift as IShift;
  const shiftStatus = Number(shift?.shift_status);

  const isFocused = useIsFocused();

  useFirstVisitTour("shiftDetails", isFocused && !isLoading && !!shift);

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

  const { colors, isDark } = useAppTheme();

  const hasDetailsError = !isLoading && (isError || !shift || isRefetchError);

  useEffect(() => {
    if (!hasDetailsError) {
      hasShownDetailsErrorAlertRef.current = false;
      return;
    }
    if (hasShownDetailsErrorAlertRef.current) return;
    hasShownDetailsErrorAlertRef.current = true;

    const goBack = () => router.canGoBack() && router.back();

    Alert.alert(
      "Something went wrong",
      data?.message ??
        "We couldn’t load this shift right now. Check your connection and try again.",
      [{ text: "OK", onPress: goBack }],
      { cancelable: true, onDismiss: goBack },
    );
  }, [hasDetailsError, data?.message, router]);

  if (isLoading || isRefetching || hasDetailsError) {
    return <ShiftDetailsSkeleton />;
  }

  const isSleepover = Boolean(shift?.is_sleepover_shift);
  const startDate = new Date(shift?.start_time);
  const endDate = new Date(shift?.end_time);


  const statusLabel =
    shift?.shift_status === "0"
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
                  : "-";
  const statusTone: Record<string, Tone> = {
    Pending: "warning",
    Scheduled: "blue",
    Running: "primary",
    Cancelled: "danger",
    Completed: "success",
    Transferred: "violet",
  };
  const timeOf = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        title="Shift details"
        onBack={() => router.canGoBack() && router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CopilotStep
          name="shift-details-hero"
          order={1}
          active={isFocused}
          text="Tap the address to open it in Maps and get directions."
        >
          <WalkthroughableView>
            <PressableCard
              onPress={openMaps}
              accessibilityRole="button"
              accessibilityHint="Opens the address in Maps"
              radius={Radius.xl}
              padding={Space.lg}
              raised
              style={styles.heroCard}
            >
              <View style={styles.heroRow}>
                <IconBadge icon="business-outline" tone="primary" size={52} />
                <View style={styles.heroText}>
                  <AppText variant="title3">
                    {shift?.facility?.name ?? "—"}
                  </AppText>
                  <AppText variant="footnote" color="textSecondary">
                    {shift?.facility?.address ?? "—"}
                  </AppText>
                  <AppText variant="caption" color="textTertiary">
                    {shift?.state?.name ?? "—"}
                  </AppText>
                </View>
              </View>

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
                <Chip label={statusLabel} tone={statusTone[statusLabel] ?? "neutral"} />
              </View>

              <View style={[styles.directions, { borderTopColor: colors.border }]}>
                <Icon name="navigate-outline" size={18} color={colors.primaryStrong} />
                <AppText variant="subhead" color="primaryStrong" style={styles.flex}>
                  Get directions
                </AppText>
                <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </PressableCard>
          </WalkthroughableView>
        </CopilotStep>

        {/* When */}
        <Card radius={Radius.xl} padding={Space.lg} style={styles.whenCard}>
          <AppText variant="overline" color="textTertiary">
            When
          </AppText>
          <AppText variant="title2">{format(startDate, "EEEE, d MMM yyyy")}</AppText>
          <View style={styles.whenRow}>
            <Icon name="time-outline" size={18} color={colors.primaryStrong} />
            <AppText variant="bodyMedium" style={styles.flex}>
              {timeOf(startDate)} – {timeOf(endDate)}
            </AppText>
            {!!shift?.hours && (
              <View style={[styles.hoursChip, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="caption" color="primaryStrong">
                  {shift.hours} hrs
                </AppText>
              </View>
            )}
          </View>
        </Card>

        {/* Details */}
        <AppText variant="overline" color="textTertiary" style={styles.sectionLabel}>
          Details
        </AppText>
        <Card radius={Radius.xl} padding={Space.md} style={styles.infoCard}>
          <InfoRow
            label="Shift ID"
            value={`${shift?.shift_prefix ?? "-"}${shift?.id ?? "—"}`}
          />
          <InfoRow
            label="Type"
            value={
              shift?.is_sleepover_shift
                ? "Sleepover"
                : shift?.shift_type
                  ? shift.shift_type.replace(/\b\w/g, (c) => c.toUpperCase())
                  : "—"
            }
          />
          <InfoRow label="Status" value={statusLabel} />
          <InfoRow label="Profession" value={shift?.profession?.name ?? "—"} />
          <InfoRow label="Category" value={shift?.category?.name ?? "—"} />
          <InfoRow label="Level" value={shift?.level?.name ?? "—"} />
          <InfoRow label="Total hours" value={shift?.hours ?? "—"} isLast />
        </Card>

        {/* Notes */}
        <AppText variant="overline" color="textTertiary" style={styles.sectionLabel}>
          Notes
        </AppText>
        <Card radius={Radius.xl} padding={Space.lg}>
          <AppText
            variant="callout"
            color={shift?.notes ? "text" : "textTertiary"}
          >
            {shift?.notes ?? "No notes for this shift."}
          </AppText>
        </Card>

        {isSleepover && (
          <>
            <AppText variant="overline" color="textTertiary" style={styles.sectionLabel}>
              Sleepover timeline
            </AppText>
            <Card radius={Radius.xl} padding={Space.lg}>
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
            </Card>
          </>
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
          backgroundStyle={[
            styles.sheetBackground,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            elevation(colors, isDark, 2),
          ]}
          handleIndicatorStyle={{
            backgroundColor: colors.borderStrong,
          }}
        >
          <BottomSheetView style={styles.contentContainer}>
            {shiftStatus === 0 && (
              <CopilotStep
                name="shift-details-swipe-button"
                order={2}
                active={isFocused}
                text="Swipe to confirm your next step here — Accept a shift, Start it when you arrive, or End it when you're done. The button updates depending on where the shift is at."
              >
                <WalkthroughableView>
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
                    bgColor={colors.gradient[0]}
                    processing={isAccepting}
                    completed={acceptShiftMutation.isSuccess}
                  />
                </WalkthroughableView>
              </CopilotStep>
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
                  bgColor={colors.gradient[0]}
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
                  bgColor={colors.gradient[0]}
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
                bgColor={colors.danger}
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
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.busyCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="headline" align="center">
              {isAccepting
                ? "Accepting shift..."
                : isStarting
                  ? "Starting shift..."
                  : isEnding
                    ? "Ending shift..."
                    : isAcceptingTransfer
                      ? "Accepting shift transfer..."
                      : "Processing shift action..."}
            </AppText>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  // Keep the sheet's content box as before: the swipe button is laid out for it.
  contentContainer: {
    height: 110,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  sheetBackground: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: 160,
    gap: Space.md,
  },
  heroCard: {
    gap: Space.md,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.xs,
  },
  directions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    paddingTop: Space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  whenCard: {
    gap: Space.xs,
  },
  whenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    marginTop: Space.xxs,
  },
  hoursChip: {
    paddingHorizontal: Space.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sectionLabel: {
    marginTop: Space.xs,
    marginBottom: -Space.xs,
    paddingHorizontal: Space.xxs,
  },
  infoCard: {
    paddingVertical: Space.xxs,
  },
  timelineItemWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 64,
  },
  timelineIconColumn: {
    width: 40,
    alignItems: "center",
    position: "relative",
    minHeight: 64,
  },
  timelineLine: {
    position: "absolute",
    left: 19,
    width: 2,
    opacity: 0.3,
    borderRadius: Radius.xs,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Space.sm,
    paddingTop: 2,
    gap: 2,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  busyCard: {
    minWidth: 220,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.lg,
    borderRadius: Radius.xl,
    alignItems: "center",
    gap: Space.sm,
  },
});
