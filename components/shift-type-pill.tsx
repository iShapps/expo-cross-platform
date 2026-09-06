import { Radii } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type ShiftType =
  | "morning"
  | "afternoon"
  | "night"
  | "sleepover"
  | "public holiday"
  | "saturday"
  | "sunday";
const shiftTypeColors: Record<ShiftType, string> = {
  morning: "#C7DBFF",
  afternoon: "#FFE1B2",
  night: "#D1D5F6",
  sleepover: "#E3C7FF",
  "public holiday": "#FFF7B2",
  saturday: "#B2FFD6",
  sunday: "#FFB2B2",
};

const shiftTypeTextColors: Record<ShiftType, string> = {
  morning: "#3A5A97",
  afternoon: "#B97A3A",
  night: "#3A3A97",
  sleepover: "#7A3AB9",
  "public holiday": "#97973A",
  saturday: "#3A974A",
  sunday: "#973A3A",
};

export const ShiftTypePill: React.FC<{ type: ShiftType }> = ({ type }) => (
  <View style={[styles.pill, { backgroundColor: shiftTypeColors[type] }]}>
    <Text style={[styles.text, { color: shiftTypeTextColors[type] }]}>
      {type}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: "flex-end",
    marginBottom: 2,
    marginRight: 2,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  text: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
