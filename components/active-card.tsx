import { Payrun } from "@/data-types/dashboard";
import { useShiftCountdown } from "@/hooks/use-shift-countdown";
import { Ionicons } from "@expo/vector-icons";
import { differenceInMinutes, format } from "date-fns";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface PayrunCardProps {
  payrun: Payrun;
  onPress?: () => void;
}

const ActiveCard: React.FC<PayrunCardProps> = ({ payrun, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            // toValue: 1.02,
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.95,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  const startDate = new Date(payrun.period_start);
  const endDate = new Date(payrun.period_end);
  const { label, time } = useShiftCountdown(
    payrun.period_start,
    payrun.period_end,
  );

  // Format: 10:30 pm to 04:30 am - 6:00Hrs
  const startTime = format(startDate, "hh:mm a");
  const endTime = format(endDate, "hh:mm a");
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}:${minutes.toString().padStart(2, "0")}Hrs`;
  const periodText = `${startTime} to ${endTime} (${duration})`;
  return (
    <Animated.View
      style={[
        payrun.status === "upcoming" ? styles.cardUpcoming : styles.card,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Top Row */}
      <View style={styles.topContent}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Ongoing Shift</Text>
        </View>

        <Text style={styles.remainingText}>
          {label}: {time}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{payrun.facility_name}</Text>
      <Text style={styles.subtitle}>{payrun.category_name}</Text>

      {/* Time & Hours */}
      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Ionicons name="time-outline" size={16} color="#70C601" />
          <View>
            <Text style={styles.infoValue}>{periodText}</Text>
          </View>
        </View>
      </View>

      {/* Address */}
      {/* <View style={styles.addressPill}>
        <Ionicons name="location-outline" size={16} color="#70C601" />
        <Text style={styles.addressText}>{payrun.location}</Text>
      </View> */}

      {/* CTA */}
      {/* <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>View Details</Text>
        <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
      </TouchableOpacity> */}
    </Animated.View>
  );
};

export default ActiveCard;

const getStyles = (colorScheme: string) => StyleSheet.create({
  card: {
    marginTop: 5,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colorScheme === "dark" ? "#36454F" : "#FF9800",
    backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff1db",
    shadowColor: colorScheme === "dark" ? "#000" : "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 5,
  },

  cardUpcoming: {
    borderRadius: 8,
    padding: 10,
    gap: 5,
    marginTop: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: colorScheme === "dark" ? "#FFD966" : "#ffe493",
    borderWidth: 1,
    borderColor: colorScheme === "dark" ? "#FFD966" : "#ffd966",
  },
  topContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorScheme === "dark" ? "#36454F" : "#71c6013b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
  },

  statusText: {
    color: colorScheme === "dark" ? "#FFD966" : "#030303",
    fontSize: 11,
  },

  remainingText: {
    color: colorScheme === "dark" ? "#FFD966" : "#FF9800",
    fontSize: 13,
    fontWeight: "400",
  },

  title: {
    color: colorScheme === "dark" ? "#FFD966" : "#000609",
    fontSize: 17,
    fontWeight: "700",
  },

  subtitle: {
    color: colorScheme === "dark" ? "#FFD966" : "#2f2f2f",
    fontSize: 14,
  },

  infoRow: {
    flexDirection: "row",
    gap: 12,
  },

  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colorScheme === "dark" ? "#36454F" : "#FF9800",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },

  infoLabel: {
    color: colorScheme === "dark" ? "#FFD966" : "rgba(255,255,255,0.85)",
    fontSize: 12,
  },

  infoValue: {
    color: colorScheme === "dark" ? "#FFD966" : "#ffffff",
    fontSize: 15,
  },

  addressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colorScheme === "dark" ? "#36454F" : "rgba(255,255,255,0.25)",
    padding: 12,
    borderRadius: 8,
  },

  addressText: {
    color: colorScheme === "dark" ? "#FFD966" : "#6082B6",
    fontSize: 14,
    flex: 1,
  },

  button: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: colorScheme === "dark" ? "#36454F" : "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    borderRadius: 18,
  },

  buttonText: {
    color: colorScheme === "dark" ? "#FFD966" : "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
