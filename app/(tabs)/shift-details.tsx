import { ShiftType, ShiftTypePill } from "@/components/shift-type-pill";
import { IShift } from "@/data-types/shifts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const iconMap: Record<string, { name: string; bg: string; color: string }> = {
  "Afternoon Start": {
    name: "white-balance-sunny",
    bg: "#FFF7E6",
    color: "#FFB300",
  },
  "Afternoon End": {
    name: "white-balance-sunny",
    bg: "#FFF7E6",
    color: "#FFB300",
  },
  "Night Start": { name: "weather-night", bg: "#E6E8FF", color: "#5C6BC0" },
  "Night End": { name: "weather-night", bg: "#E6E8FF", color: "#5C6BC0" },
  "Morning Start": {
    name: "weather-sunset-up",
    bg: "#FFFDE7",
    color: "#FFD600",
  },
  "Morning End": { name: "weather-sunset-up", bg: "#FFFDE7", color: "#FFD600" },
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
        {/* Vertical line above (colored) */}
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
        {/* Vertical line below (colored) */}
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
  const shift: IShift = {
    id: 1,
    shift_prefix: "#SFI",
    facility_group_id: null,
    facility_id: 1,
    word_wing: "A",
    hcp_id: 3,
    buddy_hcp_id: null,
    category_id: 2,
    profession_id: 12,
    hcp_level_id: 1,
    select_date: null,
    is_sleepover_shift: 0,
    hcp_sleepover_rate: "0.00",
    facility_sleepover_rate: null,
    start_time: "2021-07-18 12:00:00",
    end_time: "2021-07-18 20:00:00",
    hcp_shift_start_time: null,
    hcp_shift_end_time: null,
    sleepover_afternoon_start_time: null,
    sleepover_afternoon_end_time: null,
    sleepover_night_start_time: null,
    sleepover_night_end_time: null,
    sleepover_start_time: null,
    sleepover_end_time: null,
    sleepover_morning_start_time: null,
    sleepover_morning_end_time: null,
    approved_shift_start_time: null,
    approved_shift_end_time: null,
    break: 30,
    hours: "8.0",
    working_hours: "7.50",
    shift_status: "3",
    cancel_by: null,
    cancel_time: null,
    cancel_reason: null,
    hcp_amount: "301.88",
    facility_amount: "361.20",
    admin_amount: "33.90",
    admin_fees: "4.52",
    facility_per_rate: "27.52",
    hcp_per_rate: "23.00",
    no_of_openings: 1,
    booked_by: "Roli",
    shift_loading: "75",
    notes: null,
    notes_attachments: null,
    gender: null,
    shift_type: "sunday",
    shift_transfered: "no",
    shift_swapped: "no",
    shift_transfer_swap_status: null,
    shift_time: "afternoon",
    address: "110 William Street, Perth WA, Australia",
    shift_approved_time: null,
    mentor_hcp_name: null,
    mentor_hcp_email: null,
    mentor_hcp_id: null,
    scheduled_shift_id: null,
    trainee_hcp_name: null,
    trainee_hcp_email: null,
    trainee_hcp_id: null,
    trainee_buddy_shift_id: null,
    country_id: 1,
    state_id: 2,
    city_id: null,
    suburb_id: null,
    shift_broadcast: "all",
    shift_rebroadcast_time: "2021-07-18 09:00:00",
    hcp_reached_at_location_notification: "no",
    time_over_notification_sent: "no",
    reminder_notification_sent_count: 0,
    multiple_shifts: "no",
    total_hours_time: "08:00",
    final_hours_time: "07:30",
    total_admin_fees_with_loading: "59.33",
    hcp_shift_loading: "17.25",
    hcp_shift_total_loading: "129.38",
    facility_shift_loading: "20.64",
    facility_shift_total_loading: "154.80",
    status: "active",
    created_by: 558,
    updated_by: 558,
    created_at: "2021-07-17T19:55:22.000000Z",
    updated_at: "2021-07-17T23:04:53.000000Z",
    deleted_at: null,
    approved_sleepover_afternoon_start_time: null,
    approved_sleepover_afternoon_end_time: null,
    approved_sleepover_night_start_time: null,
    approved_sleepover_night_end_time: null,
    approved_sleepover_start_time: null,
    approved_sleepover_end_time: null,
    approved_sleepover_morning_start_time: null,
    approved_sleepover_morning_end_time: null,
    sleepover_afternoon_admin_fees: null,
    sleepover_afternoon_loading: null,
    sleepover_afternoon_working_hours: null,
    sleepover_afternoon_faciliy_amount: null,
    sleepover_afternoon_hcp_amount: null,
    sleepover_night_admin_fees: null,
    sleepover_night_loading: null,
    sleepover_night_working_hours: null,
    sleepover_night_faciliy_amount: null,
    sleepover_night_hcp_amount: null,
    sleepover_morning_admin_fees: null,
    sleepover_morning_loading: null,
    sleepover_morning_working_hours: null,
    sleepover_morning_faciliy_amount: null,
    sleepover_morning_hcp_amount: null,
    extra_night_hours_details: null,
    hcp: {
      id: 3,
      first_name: "Mogammad",
      last_name: "Fakier",
      average_rating: null,
    },
    category: {
      id: 2,
      name: "Non Clinical",
    },
    profession: {
      id: 12,
      name: "Cleaner",
    },
    level: null,
    facility: {
      id: 1,
      name: "Brightwater  The Cove",
      facility_group_id: 85,
      address: "30 Regents Park Road, Joondalup WA, Australia",
      average_rating: null,
    },
    cancelled_shift: null,
    shift_transfer_from: null,
    shift_transfer_to: null,
    state: {
      id: 2,
      name: "Western Australia",
      short_form: "WA",
      country_id: 1,
      time_zone: "UTC+8",
      status: "active",
      created_by: 1,
      updated_by: 1,
      time_zone_hours: "8",
      time_zone_mints: "0",
      time_zone_name: "Australia/Perth",
    },
  };

  const isSleepover = shift.shift_type === "sunday";
  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.topBarContainer}>
          <TouchableOpacity
            //   onPress={() => router.replace("/(tabs)/account")}
            style={styles.backIconContainer}
          >
            <Fontisto name="arrow-left-l" size={15} color="black" />
          </TouchableOpacity>
          <Text style={styles.locationText}>Shift Details</Text>
          <TouchableOpacity
            style={styles.faintbackIconContainer}
          ></TouchableOpacity>
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
              <Text style={styles.heroName}>{shift.facility?.name ?? "—"}</Text>
              <Text style={styles.heroMeta}>{shift.address ?? "—"}</Text>
              <Text style={styles.heroMeta}>{shift.state?.name ?? "—"}</Text>
              <View style={styles.chipRow}>
                {shift?.shift_type && (
                  <ShiftTypePill type={shift?.shift_type as ShiftType} />
                )}
                {/* <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {shift.status?.toUpperCase()}
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
              <Text style={styles.detailValue}>{shift.shift_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{shift.status}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Profession</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Profession</Text>
              <Text style={styles.detailValue}>
                {shift.profession?.name ?? "—"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>
                {shift.category?.name ?? "—"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Level</Text>
              <Text style={styles.detailValue}>{shift.level?.name ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Rates & Hours</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate per hour</Text>
              <Text style={styles.detailValue}>${shift.hcp_per_rate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Hours</Text>
              <Text style={styles.detailValue}>{shift.hours}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>${shift.hcp_amount}</Text>
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
                  label="Afternoon Start"
                  time={shift.sleepover_afternoon_start_time}
                  isFirst
                />
                <TimelineItem
                  label="Afternoon End"
                  time={shift.sleepover_afternoon_end_time}
                />
                <TimelineItem
                  label="Night Start"
                  time={shift.sleepover_night_start_time}
                />
                <TimelineItem
                  label="Night End"
                  time={shift.sleepover_night_end_time}
                />
                <TimelineItem
                  label="Morning Start"
                  time={shift.sleepover_morning_start_time}
                />
                <TimelineItem
                  label="Morning End"
                  time={shift.sleepover_morning_end_time}
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
    minHeight: 54,
  },
  timelineIconColumn: {
    width: 36,
    alignItems: "center",
    position: "relative",
    minHeight: 54,
    justifyContent: "flex-start",
  },
  timelineLine: {
    position: "absolute",
    left: "50%",
    width: 3,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    zIndex: 0,
    height: "50%",
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    zIndex: 1,
    borderWidth: 2,
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
  },
  timelineLabel: {
    fontSize: 15,
    color: "#36454F",
    fontWeight: "600",
  },
  timelineTime: {
    fontSize: 15,
    color: "#818589",
    fontWeight: "500",
  },
});
