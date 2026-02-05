import { IShift } from "@/data-types/shifts";
import Ionicons from "@expo/vector-icons/Ionicons";
import { differenceInMinutes, format } from "date-fns";
import { Link } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ShiftType, ShiftTypePill } from "./shift-type-pill";

interface ShiftCardProps {
  shift: IShift;
  onPress?: () => void;
}

export const ShiftCardBase: React.FC<ShiftCardProps> = ({ shift, onPress }) => {
  const startDate = new Date(shift?.start_time);
  const endDate = new Date(shift?.end_time);

  // Format: 10:30 pm to 04:30 am - 6:00Hrs
  const startTime = format(startDate, "hh:mm a");
  const endTime = format(endDate, "hh:mm a");
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}:${minutes.toString().padStart(2, "0")}` + "Hrs";
  const periodText = `${startTime} to ${endTime} (${duration})`;

  return (
    <Link
      href={{
        pathname: "/(tabs)/[shiftId]",
        params: { shiftId: shift.id },
      }}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {shift?.shift_type && (
            <ShiftTypePill type={shift?.shift_type as ShiftType} />
          )}
        </View>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <View style={styles.dateCard}>
            <Text
              style={{
                ...styles.dateText,
                fontFamily: Platform.select({
                  android: "Inter_300Light",
                  ios: "Inter-Light",
                }),
              }}
            >
              {format(shift?.created_at, "dd")}
            </Text>
            <Text
              style={{
                ...styles.dateText,
                fontFamily: Platform.select({
                  android: "Inter_300Light",
                  ios: "Inter-Light",
                }),
              }}
            >
              {format(shift?.created_at, "MMM")}
            </Text>
          </View>
        </View>
        <View style={styles.mainContent}>
          <Text
            style={{
              ...styles.title,
              fontFamily: Platform.select({
                android: "Inter_600SemiBold",
                ios: "Inter-SemiBold",
              }),
            }}
          >
            {shift?.facility?.name}
          </Text>
          <Text
            style={{
              ...styles.categoryText,
              fontFamily: Platform.select({
                android: "Inter_500Medium",
                ios: "Inter-Medium",
              }),
            }}
          >
            {shift?.profession?.name}
            {/* {shift?.category?.name}{" "} */}
            {/* {shift?.level?.name} */}
          </Text>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Ionicons name="time-outline" size={18} color="#70C601" />
            <Text
              style={{
                ...styles.periodText,
                fontFamily: Platform.select({
                  android: "Inter_400Regular",
                  ios: "Inter-Regular",
                }),
              }}
            >
              {periodText}
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              // alignItems: "center",
              gap: 2,
            }}
          >
            <Ionicons name="location-outline" size={18} color="#70C601" />
            <Text
              style={{
                ...styles.locationText,
                fontFamily: Platform.select({
                  android: "Inter_500Medium",
                  ios: "Inter-Medium",
                }),
              }}
            >
              {shift?.facility?.address}
              {/* {shift?.address} */}
            </Text>
          </View>
        </View>
      </View>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    // backgroundColor: "#F8FFF0",
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: "#d0e6a5",
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    position: "relative",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  headerRow: {
    position: "absolute",
    right: -3,
    top: -8,
    zIndex: 100,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#708090",
  },
  periodText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#36454F",
  },
  locationText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#818589",
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateCard: {
    backgroundColor: "#70C601",
    borderRadius: 5,
    padding: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // height: 85,
    height: "auto",
    width: 55,
  },
  dateText: {
    fontSize: 17,
    color: "#fff",
    textAlign: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
