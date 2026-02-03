import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type ShiftType =
  | "Morning"
  | "Afternoon"
  | "Night"
  | "Sleepover"
  | "Public Holiday"
  | "Saturday"
  | "Sunday";

// const shiftTypeColors: Record<ShiftType, string> = {
//   Morning: "#F3F6FB",
//   Afternoon: "#FDF6EC",
//   Night: "#F2F3F7",
//   Sleepover: "#F6F2FB",
//   "Public Holiday": "#F7F7F2",
//   Saturday: "#F2FBF2",
//   Sunday: "#FBF2F2",
// };

const shiftTypeColors: Record<ShiftType, string> = {
  Morning: "#C7DBFF",
  Afternoon: "#FFE1B2",
  Night: "#D1D5F6",
  Sleepover: "#E3C7FF",
  "Public Holiday": "#FFF7B2",
  Saturday: "#B2FFD6",
  Sunday: "#FFB2B2",
};

const shiftTypeTextColors: Record<ShiftType, string> = {
  Morning: "#3A5A97",
  Afternoon: "#B97A3A",
  Night: "#3A3A97",
  Sleepover: "#7A3AB9",
  "Public Holiday": "#97973A",
  Saturday: "#3A974A",
  Sunday: "#973A3A",
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
    borderRadius: 16,
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
  },
});
