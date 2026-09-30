import { AppText, Icon, PressableCard } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { IShift } from "@/data-types/shifts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { differenceInMinutes, format } from "date-fns";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ShiftType, ShiftTypePill } from "./shift-type-pill";

interface ShiftCardProps {
  shift: IShift;
  onPress?: () => void;
}

export const ShiftCardBase: React.FC<ShiftCardProps> = ({ shift }) => {
  const { colors } = useAppTheme();

  const startDate = new Date(shift?.start_time);
  const endDate = new Date(shift?.end_time);

  // e.g. "10:30 pm – 4:30 am" and "6h 00m"
  const timeRange = `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`;
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}h ${minutes.toString().padStart(2, "0")}m`;

  return (
    <Link
      href={{
        pathname: "/(main)/[shiftId]",
        params: { shiftId: shift.id },
      }}
      asChild
    >
      <PressableCard
        accessibilityRole="link"
        radius={Radius.lg}
        padding={Space.md}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={[styles.dateTile, { backgroundColor: colors.primarySoft }]}>
            <AppText variant="title2" color="primaryStrong" style={styles.dateDay}>
              {format(startDate, "dd")}
            </AppText>
            <AppText variant="overline" color="primaryStrong">
              {format(startDate, "MMM")}
            </AppText>
          </View>

          <View style={styles.titleBlock}>
            <AppText variant="caption" color="textTertiary">
              {shift?.shift_prefix ?? "-"}
              {shift?.id ?? "—"} · {format(startDate, "EEEE")}
            </AppText>
            <AppText variant="headline" numberOfLines={2}>
              {shift?.facility?.name}
            </AppText>
            {!!shift?.profession?.name && (
              <AppText variant="footnote" color="textSecondary" numberOfLines={1}>
                {shift.profession.name}
              </AppText>
            )}
          </View>

          <ShiftTypePill
            type={
              shift?.is_sleepover_shift
                ? "sleepover"
                : (shift?.shift_type as ShiftType)
            }
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.metaRow}>
          <Icon name="time-outline" size={16} color={colors.primaryStrong} />
          <AppText variant="subhead" style={styles.metaText} numberOfLines={1}>
            {timeRange}
          </AppText>
          <View style={[styles.durationChip, { backgroundColor: colors.surfaceMuted }]}>
            <AppText variant="caption" color="textSecondary">
              {duration}
            </AppText>
          </View>
        </View>

        {!!shift?.facility?.address && (
          <View style={styles.metaRow}>
            <Icon name="location-outline" size={16} color={colors.primaryStrong} />
            <AppText
              variant="footnote"
              color="textSecondary"
              style={styles.metaText}
              numberOfLines={2}
            >
              {shift.facility.address}
            </AppText>
          </View>
        )}
      </PressableCard>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Space.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  dateTile: {
    width: 56,
    height: 60,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    lineHeight: 26,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },
  metaText: {
    flex: 1,
  },
  durationChip: {
    paddingHorizontal: Space.xs,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
});
