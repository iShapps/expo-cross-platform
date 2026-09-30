import { Chip } from "@/components/design";
import { type Tone } from "@/constants/design";
import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";

export type ShiftType =
  | "morning"
  | "afternoon"
  | "night"
  | "sleepover"
  | "public holiday"
  | "saturday"
  | "sunday";

const shiftTypeTones: Record<ShiftType, Tone> = {
  morning: "blue",
  afternoon: "amber",
  night: "violet",
  sleepover: "info",
  "public holiday": "warning",
  saturday: "success",
  sunday: "danger",
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Shift type as a tinted pill (theme-aware; unknown types render neutral). */
export const ShiftTypePill: React.FC<{
  type: ShiftType;
  style?: StyleProp<ViewStyle>;
}> = ({ type, style }) => {
  if (!type) return null;
  return (
    <Chip
      label={titleCase(type)}
      tone={shiftTypeTones[type] ?? "neutral"}
      style={style}
    />
  );
};
