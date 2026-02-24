import { Payrun } from "@/data-types/dashboard";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

export const PayrunCard: React.FC<PayrunCardProps> = ({ payrun, onPress }) => {
  const startDate = new Date(payrun.period_start);
  const endDate = new Date(payrun.period_end);

  // Format: 10:30 pm to 04:30 am - 6:00Hrs
  const startTime = format(startDate, "hh:mm a");
  const endTime = format(endDate, "hh:mm a");
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}:${minutes.toString().padStart(2, "0")}Hrs`;
  const periodText = `${startTime} to ${endTime} - ${duration}`;

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  const getStatusColor = () => {
    switch (payrun.status) {
      case "current":
        return "#70C601";
      case "processing":
        return "#FFA500";
      case "paid":
        return "#28A745";
      default:
        return "#70C601";
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.mainContent}>
        <Text
          style={{
            ...styles.title,

            fontFamily: Platform.select({
              android: "Inter_900Black",
              ios: "Inter-Black",
            }),
          }}
        >
          {payrun.facility_name}
        </Text>
        <Text
          style={{
            ...styles.categoryText,
            fontFamily: Platform.select({
              android: "Inter_900Black",
              ios: "Inter-Black",
            }),
          }}
        >
          {payrun.category_name}
        </Text>
        <Text
          style={{
            ...styles.periodText,
            fontFamily: Platform.select({
              android: "Inter_300Light",
              ios: "Inter-Light",
            }),
          }}
        >
          {periodText}
        </Text>
        <Text
          style={{
            ...styles.locationText,
            fontFamily: Platform.select({
              android: "Inter_900Black",
              ios: "Inter-Black",
            }),
          }}
        >
          {payrun.location}
        </Text>
      </View>
      <View style={styles.dateCard}>
        <Text
          style={{
            ...styles.dateText,
            fontFamily: Platform.select({
              android: "Inter_900Black",
              ios: "Inter-Black",
            }),
          }}
        >
          15
        </Text>
        <Text
          style={{
            ...styles.dateText,
            fontFamily: Platform.select({
              android: "Inter_900Black",
              ios: "Inter-Black",
            }),
          }}
        >
          Jan
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      borderRadius: 5,
      padding: 8,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
      display: "flex",
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      gap: 14,
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 3,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#a8a49f" : "#70C601",
    },
    categoryText: {
      fontSize: 10,
      color: colorScheme === "dark" ? "#a8a49f" : "#000",
      fontWeight: "bold",
    },
    periodText: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#a8a49f" : "gray",
    },
    locationText: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#a8a49f" : "#000",
      fontWeight: "700",
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    dateCard: {
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#70C601",
      borderRadius: 8,
      padding: 4,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "auto",
      width: 55,
    },
    dateText: {
      fontSize: 17,
      color: colorScheme === "dark" ? "#a8a49f" : "#fff",
      fontWeight: "bold",
      textAlign: "center",
    },
    statusText: {
      color: colorScheme === "dark" ? "#a8a49f" : "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
  });
