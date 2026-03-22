import { IShift } from "@/data-types/shifts";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Voltra } from "voltra";
import { startLiveActivity, updateLiveActivity } from "voltra/client";

// MANUAL LIVE ACTIVITY COMPONENT FOR TESTING PURPOSES - NOT USED IN PRODUCTION
interface Props {
  shift: IShift;
}

function buildVariants(shift: IShift, now: Date) {
  const shiftStart = new Date(shift.start_time).getTime();
  const shiftEnd = new Date(shift.end_time).getTime();

  const total = shiftEnd - shiftStart;
  const elapsed = now.getTime() - shiftStart;
  const progress = Math.min(Math.max(elapsed / total, 0), 1);
  const progressPercent = Math.round(progress * 100);

  const remainingDiff = shiftEnd - now.getTime();
  const timeRemaining =
    remainingDiff <= 0
      ? "Completed"
      : (() => {
          const h = Math.floor(remainingDiff / (1000 * 60 * 60));
          const m = Math.floor((remainingDiff / (1000 * 60)) % 60);
          const s = Math.floor((remainingDiff / 1000) % 60);
          return `${h}h ${m}m ${s}s`;
        })();

  const elapsedDiff = now.getTime() - shiftStart;
  const timeElapsed =
    elapsedDiff <= 0
      ? "Not started"
      : (() => {
          const h = Math.floor(elapsedDiff / (1000 * 60 * 60));
          const m = Math.floor((elapsedDiff / (1000 * 60)) % 60);
          return `${h}h ${m}m elapsed`;
        })();

  // Dynamic Island pill
  const minimal = (
    <Voltra.Text style={{ color: "#70C601", fontSize: 12, fontWeight: "700" }}>
      {timeRemaining}
    </Voltra.Text>
  );

  // Dynamic Island collapsed
  const compact = (
    <Voltra.HStack
      style={{ alignItems: "center", gap: 8, paddingHorizontal: 8 }}
    >
      <Voltra.Text style={{ fontSize: 11 }}>🟢</Voltra.Text>
      <Voltra.Text
        style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}
      >
        {shift.facility?.name}
      </Voltra.Text>
      <Voltra.Text
        style={{ color: "#70C601", fontSize: 12, fontWeight: "700" }}
      >
        {timeRemaining}
      </Voltra.Text>
    </Voltra.HStack>
  );

  // Expanded for Dynamic Island expanded + lock screen
  const expanded = (
    <Voltra.VStack
      style={{
        padding: 18,
        paddingVertical: 20,
        alignItems: "flex-start",
        gap: 0,
      }}
    >
      {/* Top row: badge + countdown */}
      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Voltra.HStack
          style={{
            backgroundColor: "rgba(112,198,1,0.18)",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            alignItems: "flex-start",
            gap: 5,
            flex: 1,
          }}
        >
          <Voltra.Text style={{ fontSize: 11 }}>🟢</Voltra.Text>
          <Voltra.Text
            style={{
              color: "#70C601",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              textAlign: "left",
            }}
          >
            {shift.shift_type} · shift in progress
          </Voltra.Text>
        </Voltra.HStack>

        <Voltra.Text
          style={{
            color: "#ffffff",
            fontSize: 13,
            fontWeight: "700",
            textAlign: "right",
            fontVariant: ["tabular-nums"],
            letterSpacing: 0.3,
          }}
        >
          {timeRemaining}
        </Voltra.Text>
      </Voltra.HStack>

      {/* Facility name */}
      <Voltra.Text
        style={{
          color: "#ffffff",
          fontSize: 17,
          fontWeight: "800",
          textAlign: "left",
          letterSpacing: 0.1,
          marginBottom: 10,
          width: "100%",
        }}
      >
        🏢 {shift.facility?.name}
      </Voltra.Text>

      {/* Address */}
      <Voltra.HStack
        style={{
          alignItems: "flex-start",
          width: "100%",
          gap: 4,
          marginBottom: 14,
          marginTop: 5,
        }}
      >
        <Voltra.Text
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            textAlign: "left",
            flex: 1,
          }}
        >
          📍 {shift.facility?.address}
        </Voltra.Text>
      </Voltra.HStack>

      {/* Progress bar */}
      <Voltra.VStack style={{ width: "100%", gap: 6, marginBottom: 10 }}>
        {/* Track */}
        <Voltra.View
          style={{
            width: "100%",
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.15)",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          <Voltra.View
            style={{
              flex: progressPercent / 100,
              borderRadius: 999,
              height: "100%",
              backgroundColor: "#70C601",
            }}
          />

          <Voltra.View
            style={{
              flex: 1 - progressPercent / 100,
              borderRadius: 999,
              height: "100%",
            }}
          />
        </Voltra.View>
      </Voltra.VStack>

      {/* Divider */}
      <Voltra.View
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "rgba(255,255,255,0.08)",
          marginBottom: 10,
        }}
      />

      {/* Bottom meta row */}
      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Voltra.HStack style={{ alignItems: "center", gap: 4 }}>
          <Voltra.Text style={{ fontSize: 11 }}>👤</Voltra.Text>
          <Voltra.Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              textAlign: "left",
              flex: 1,
            }}
          >
            {shift.hcp?.first_name} {shift.hcp?.last_name}
          </Voltra.Text>
        </Voltra.HStack>

        <Voltra.HStack style={{ alignItems: "center", gap: 4 }}>
          <Voltra.Text style={{ fontSize: 11 }}>💼</Voltra.Text>
          <Voltra.Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              textAlign: "right",
            }}
          >
            {shift.profession?.name}
          </Voltra.Text>
        </Voltra.HStack>
      </Voltra.HStack>
    </Voltra.VStack>
  );

  return { minimal, compact, expanded, lockScreen: expanded };
}

export default function ShiftLiveActivity({ shift }: Props) {
  const [isActive, setIsActive] = useState(false);
  const activityIdRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsActive(false);
    activityIdRef.current = null;
  }, []);

  useEffect(() => () => stopUpdates(), [stopUpdates]);

  const handleStart = async () => {
    const now = new Date();

    try {
      const activityId = await startLiveActivity(buildVariants(shift, now));
      activityIdRef.current = activityId;
      setIsActive(true);

      updateIntervalRef.current = setInterval(async () => {
        const tick = new Date();
        const id = activityIdRef.current;
        if (!id) return;

        try {
          await updateLiveActivity(id, buildVariants(shift, tick));
        } catch (err) {
          console.warn("updateLiveActivity failed:", err);
          stopUpdates();
          return;
        }

        if (tick.getTime() >= new Date(shift.end_time).getTime()) {
          stopUpdates();
        }
      }, 1000);

      Alert.alert("✅ Live Activity Started");
    } catch (err) {
      Alert.alert("Error", "Failed to start live activity");
      console.log(err);
    }
  };

  return (
    <View style={{ alignItems: "flex-start" }}>
      <Pressable
        onPress={isActive ? undefined : handleStart}
        style={({ pressed }) => ({
          backgroundColor: isActive
            ? "#3a6e00"
            : pressed
              ? "#5fa800"
              : "#70C601",
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          shadowColor: "#70C601",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isActive ? 0.15 : 0.35,
          shadowRadius: 8,
          elevation: 4,
          opacity: pressed && !isActive ? 0.88 : 1,
        })}
      >
        <Text style={{ fontSize: 14 }}>{isActive ? "🟢" : "⚡"}</Text>
        <Text
          style={{
            color: "#fff",
            fontWeight: "700",
            fontSize: 13,
            letterSpacing: 0.3,
          }}
        >
          {isActive ? "Activity Running..." : "Start Live Activity"}
        </Text>
      </Pressable>
    </View>
  );
}

// TEST SHIFT
export const sample_shift: IShift = {
  id: 1,
  shift_prefix: "#SFI",
  facility_group_id: null,
  facility_id: 1,
  word_wing: "A",
  hcp_id: 3,
  buddy_hcp_id: null,
  category_id: 2,
  profession_id: 12,
  hcp_level_id: 11,
  select_date: null,
  is_sleepover_shift: 0,
  hcp_sleepover_rate: "0.00",
  facility_sleepover_rate: null,
  start_time: "2026-03-22 17:50:00",
  end_time: "2026-03-22 18:40:00",
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
