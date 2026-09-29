import { AppButton, AppText, Icon } from "@/components/design";
import {
  FontFamily,
  Radius,
  Space,
  Touch,
  Type,
  type AppColors,
} from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_YEAR = 2021;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isBefore(a: Date, b: Date) {
  return a < b && !sameDay(a, b);
}
function formatDisplay(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DateSelectorScreen() {
  const setStartDate = useProfileData((s) => s.setStartDate);
  const setEndDate = useProfileData((s) => s.setEndDate);

  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selStart, setSelStart] = useState<Date | null>(null);
  const [selEnd, setSelEnd] = useState<Date | null>(null);
  const [picking, setPicking] = useState<"start" | "end">("start");

  const canGoBack =
    viewYear > MIN_YEAR || (viewYear === MIN_YEAR && viewMonth > 0);
  const canGoForward =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const prevMonth = () => {
    if (!canGoBack) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoForward) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const isDisabled = (day: Date) => {
    if (day < new Date(MIN_YEAR, 0, 1)) return true;
    if (day > today) return true;
    if (picking === "end" && selStart && isBefore(day, selStart)) return true;
    return false;
  };
  const isStart = (day: Date) => selStart != null && sameDay(day, selStart);
  const isEnd = (day: Date) => selEnd != null && sameDay(day, selEnd);
  const isInRange = (day: Date) =>
    selStart != null && selEnd != null && day > selStart && day < selEnd;
  const isToday = (day: Date) => sameDay(day, today);

  const handleDayPress = (day: Date) => {
    if (isDisabled(day)) return;
    if (picking === "start") {
      setSelStart(day);
      setSelEnd(null);
      setPicking("end");
    } else {
      if (selStart && isBefore(day, selStart)) {
        setSelStart(day);
        setSelEnd(null);
      } else {
        setSelEnd(day);
        setPicking("start");
      }
    }
  };

  const canApply = selStart != null && selEnd != null;
  const handleApply = () => {
    if (!canApply) return;
    setStartDate(formatISO(selStart!));
    setEndDate(formatISO(selEnd!));
    router.back();
  };

  const handleClear = () => {
    setSelStart(null);
    setSelEnd(null);
    setPicking("start");
  };

  // Pull-down-to-close logic
  const sheetY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          router.back();
        } else {
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Space.lg, transform: [{ translateY: sheetY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          <AppText variant="title3" align="center" style={styles.title}>
            Select date range
          </AppText>

          <View style={styles.pillRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: picking === "start" }}
              style={[styles.pill, picking === "start" && styles.pillActive]}
              onPress={() => setPicking("start")}
            >
              <Text style={styles.pillLabel}>FROM</Text>
              <Text style={[styles.pillValue, !selStart && styles.pillPlaceholder]}>
                {selStart ? formatDisplay(selStart) : "Start date"}
              </Text>
            </Pressable>

            <Icon name="arrow-forward" size={18} color={colors.textTertiary} />

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: picking === "end" }}
              style={[styles.pill, picking === "end" && styles.pillActive]}
              onPress={() => {
                if (selStart) setPicking("end");
              }}
            >
              <Text style={styles.pillLabel}>TO</Text>
              <Text style={[styles.pillValue, !selEnd && styles.pillPlaceholder]}>
                {selEnd ? formatDisplay(selEnd) : "End date"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable
              onPress={prevMonth}
              disabled={!canGoBack}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            >
              <Icon
                name="chevron-back"
                size={20}
                color={canGoBack ? colors.primaryStrong : colors.textTertiary}
              />
            </Pressable>

            <AppText variant="headline">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </AppText>

            <Pressable
              onPress={nextMonth}
              disabled={!canGoForward}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            >
              <Icon
                name="chevron-forward"
                size={20}
                color={canGoForward ? colors.primaryStrong : colors.textTertiary}
              />
            </Pressable>
          </View>

          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={styles.cell} />;

              const disabled = isDisabled(day);
              const start = isStart(day);
              const end = isEnd(day);
              const inRange = isInRange(day);
              const todayMark = isToday(day);
              const selected = start || end;

              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.cell,
                    inRange && styles.cellInRange,
                    start && selEnd && styles.cellRangeLeft,
                    end && styles.cellRangeRight,
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={disabled}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      selected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        inRange && styles.dayTextInRange,
                        selected && styles.dayTextSelected,
                        todayMark && !selected && styles.dayTextToday,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {todayMark && !selected && <View style={styles.todayDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <AppText variant="footnote" color="textSecondary" align="center" style={styles.hint}>
            {picking === "start"
              ? "Tap to select a start date"
              : "Now tap an end date"}
          </AppText>

          <View style={styles.actions}>
            <AppButton
              title="Clear"
              variant="outline"
              onPress={handleClear}
              style={styles.clearBtn}
            />
            <AppButton
              title="Apply"
              icon="checkmark"
              onPress={handleApply}
              disabled={!canApply}
              style={styles.applyBtn}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const CELL_SIZE = 44;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      paddingTop: Space.sm,
      paddingHorizontal: Space.md,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 5,
      borderRadius: Radius.full,
      backgroundColor: colors.borderStrong,
      marginBottom: Space.md,
    },
    title: {
      marginBottom: Space.md,
    },
    pillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      marginBottom: Space.lg,
    },
    pill: {
      flex: 1,
      minHeight: Touch.button,
      borderWidth: 1.5,
      borderColor: colors.surfaceMuted,
      backgroundColor: colors.surfaceMuted,
      borderRadius: Radius.md,
      paddingHorizontal: Space.sm,
      paddingVertical: Space.xs,
      justifyContent: "center",
    },
    pillActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    pillLabel: {
      ...Type.overline,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    pillValue: {
      ...Type.subhead,
      color: colors.text,
    },
    pillPlaceholder: {
      fontFamily: FontFamily.regular,
      color: colors.textTertiary,
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Space.xs,
    },
    navBtn: {
      width: Touch.min,
      height: Touch.min,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    navBtnDisabled: { opacity: 0.4 },
    dayLabelsRow: {
      flexDirection: "row",
      marginBottom: Space.xxs,
    },
    dayLabel: {
      ...Type.caption,
      flex: 1,
      textAlign: "center",
      color: colors.textTertiary,
      paddingVertical: Space.xxs,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    cell: {
      width: `${100 / 7}%`,
      height: CELL_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    cellInRange: {
      backgroundColor: colors.primarySoft,
    },
    cellRangeLeft: {
      borderTopLeftRadius: CELL_SIZE / 2,
      borderBottomLeftRadius: CELL_SIZE / 2,
      backgroundColor: colors.primarySoft,
    },
    cellRangeRight: {
      borderTopRightRadius: CELL_SIZE / 2,
      borderBottomRightRadius: CELL_SIZE / 2,
      backgroundColor: colors.primarySoft,
    },
    dayCircle: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCircleSelected: {
      backgroundColor: colors.primary,
    },
    dayText: {
      fontFamily: FontFamily.medium,
      fontSize: 15,
      color: colors.text,
    },
    dayTextDisabled: { color: colors.borderStrong },
    dayTextInRange: { color: colors.primaryStrong, fontFamily: FontFamily.semibold },
    dayTextSelected: { color: colors.textOnPrimary, fontFamily: FontFamily.bold },
    dayTextToday: { color: colors.primaryStrong, fontFamily: FontFamily.bold },
    todayDot: {
      position: "absolute",
      bottom: 4,
      width: 4,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: colors.primary,
    },
    hint: {
      marginTop: Space.xs,
      marginBottom: Space.md,
    },
    actions: {
      flexDirection: "row",
      gap: Space.sm,
    },
    clearBtn: { flex: 1 },
    applyBtn: { flex: 2 },
  });
