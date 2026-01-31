import { Payrun } from "@/data-types/dashboard";
import Ionicons from "@expo/vector-icons/Ionicons";
import { differenceInMinutes, format } from "date-fns";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PayrunCardProps {
  payrun: Payrun;
  onPress?: () => void;
}

export const PayrunCardBase: React.FC<PayrunCardProps> = ({
  payrun,
  onPress,
}) => {
  const startDate = new Date(payrun.period_start);
  const endDate = new Date(payrun.period_end);

  // Format: 10:30 pm to 04:30 am - 6:00Hrs
  const startTime = format(startDate, "hh:mm a");
  const endTime = format(endDate, "hh:mm a");
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}:${minutes.toString().padStart(2, "0")}Hrs`;
  const periodText = `${startTime} to ${endTime} (${duration})`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
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
          15
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
          Jan
        </Text>
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
          {payrun.facility_name}
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
          {payrun.category_name}
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
            alignItems: "center",
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
            {payrun.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FFF0",
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
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    color: "#708090",
  },
  periodText: {
    fontSize: 14,
    color: "#36454F",
  },
  locationText: {
    fontSize: 13.3,
    color: "#818589",
    fontWeight: "700",
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
