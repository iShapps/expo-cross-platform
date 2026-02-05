import { postShiftDetails } from "@/api-queries/shifts";
import { ShiftType, ShiftTypePill } from "@/components/shift-type-pill";
import { ShiftDetailsSkeleton } from "@/components/skeletons";
import { IShift } from "@/data-types/shifts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

const TimelineItem = ({
  label,
  time,
  isFirst,
  isLast,
}: {
  label: string;
  time: string | null;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const icon = iconMap[label] || {
    name: "circle",
    bg: "#F0F0F0",
    color: "#70C601",
  };
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
        <Text style={styles.timelineTime}>{time ? time : "--:--"}</Text>
      </View>
    </View>
  );
};

export default function ShiftDetails() {
  const router = useRouter();
  // receive shiftId from params
  const { shiftId } = useLocalSearchParams();

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
    enabled: !!shiftId,
  });

  const shift = data?.data?.shift as IShift;

  const handleRefetch = async () => {
    await refetch();
  };

  if (isLoading || isRefetching) {
    return <ShiftDetailsSkeleton />;
  }

  if (!isLoading && (isError || !shift || isRefetchError)) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={34}
              color="#FFB2B2"
            />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            {data?.message ??
              "We couldn’t load this shift right now. Check your connection and try again."}
          </Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.errorPrimaryBtn} onPress={handleRefetch}>
              <Feather name="rotate-ccw" size={18} color="#ffffff" />
              <Text style={styles.errorPrimaryText}>Try again</Text>
            </Pressable>
            <Pressable
              style={styles.errorSecondaryBtn}
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons name="return-up-back" size={18} color="#4B5563" />
              <Text style={styles.errorSecondaryText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const isSleepover = shift?.shift_type === "sleepover";
  const startDate = new Date(shift?.start_time);
  const endDate = new Date(shift?.end_time);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.topBarContainer}>
          <Pressable
            onPress={() => router.canGoBack() && router.back()}
            style={styles.backIconContainer}
          >
            <Fontisto name="arrow-left-l" size={15} color="black" />
          </Pressable>
          <Text style={styles.locationText}>Shift Details</Text>
          <Pressable style={styles.faintbackIconContainer}></Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name="office-building-marker"
                size={32}
                color="#70C601"
              />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroName}>
                {shift?.facility?.name ?? "—"}
              </Text>
              <Text style={styles.heroMeta}>{shift?.address ?? "—"}</Text>
              <Text style={styles.heroMeta}>{shift?.state?.name ?? "—"}</Text>
              <View style={styles.chipRow}>
                {shift?.shift_type && (
                  <ShiftTypePill type={shift?.shift_type as ShiftType} />
                )}
                {/* <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {shift?.status?.toUpperCase()}
                  </Text>
                </View> */}
              </View>
            </View>
          </View>

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
                })}{" "}
                -{" "}
                {endDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{shift?.shift_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{shift?.status}</Text>
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
              <Text style={styles.detailValue}>
                {shift?.level?.name ?? "—"}
              </Text>
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
                  isFirst
                />
                <TimelineItem
                  label="Afternoon end"
                  time={shift?.sleepover_afternoon_end_time}
                />
                <TimelineItem
                  label="Night start"
                  time={shift?.sleepover_night_start_time}
                />
                <TimelineItem
                  label="Night end"
                  time={shift?.sleepover_night_end_time}
                />
                <TimelineItem
                  label="Morning start"
                  time={shift?.sleepover_morning_start_time}
                />
                <TimelineItem
                  label="Morning end"
                  time={shift?.sleepover_morning_end_time}
                  isLast
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ...existing code...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 10,
    paddingVertical: 60,
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
    borderColor: "#D3D3D3",
  },
  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
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
    borderColor: "#fff",
  },
  topBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
    paddingBottom: 32,
  },
  heroCard: {
    marginTop: 8,
    backgroundColor: "#F8FFF0",
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6F0D8",
    marginBottom: 12,
  },
  heroIconWrap: {
    height: 64,
    width: 64,
    borderRadius: 5,
    backgroundColor: "#EAF7D2",
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
    color: "#111",
  },
  heroMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionCard: {
    marginTop: 12,
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
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
    color: "#111",
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
    color: "#36454F",
    fontWeight: "400",
  },
  timelineTime: {
    fontSize: 13,
    color: "#818589",
    fontWeight: "300",
  },
  errorScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E6F0D8",
    alignItems: "center",
    shadowColor: "#70C601",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FBF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#6B7280",
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
    backgroundColor: "#FFB2B2",
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  errorSecondaryBtn: {
    backgroundColor: "#F2F5EF",
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
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
  },
});
