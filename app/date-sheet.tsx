import { Colors, Radii } from "@/constants/theme";
import { useProfileData } from "@/data-store/use-account-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";

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

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

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
        />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Select Date Range</Text>

          <View style={styles.pillRow}>
            <Pressable
              style={[styles.pill, picking === "start" && styles.pillActive]}
              onPress={() => setPicking("start")}
            >
              <Text style={styles.pillLabel}>FROM</Text>
              <Text
                style={[styles.pillValue, !selStart && styles.pillPlaceholder]}
              >
                {selStart ? formatDisplay(selStart) : "Start date"}
              </Text>
            </Pressable>

            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={theme.secondaryText}
              style={styles.pillArrow}
            />

            <Pressable
              style={[styles.pill, picking === "end" && styles.pillActive]}
              onPress={() => {
                if (selStart) setPicking("end");
              }}
            >
              <Text style={styles.pillLabel}>TO</Text>
              <Text
                style={[styles.pillValue, !selEnd && styles.pillPlaceholder]}
              >
                {selEnd ? formatDisplay(selEnd) : "End date"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable
              onPress={prevMonth}
              disabled={!canGoBack}
              hitSlop={12}
              style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={canGoBack ? theme.primary : theme.secondaryText}
              />
            </Pressable>

            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <Pressable
              onPress={nextMonth}
              disabled={!canGoForward}
              hitSlop={12}
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={canGoForward ? theme.primary : theme.secondaryText}
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

          <Text style={styles.hint}>
            {picking === "start"
              ? "Tap to select a start date"
              : "Now tap an end date"}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!canApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const CELL_SIZE = 44;

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: theme.whiteBackground,
      borderTopLeftRadius: Radii.lg,
      borderTopRightRadius: Radii.lg,
      padding: 20,
      paddingHorizontal: 10,
      paddingBottom: 36,
    },

    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: Radii.xs,
      backgroundColor: theme.grayBorder,
      marginBottom: 16,
    },

    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primaryText,
      textAlign: "center",
      marginBottom: 16,
    },

    pillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
    },
    pill: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.secondaryText,
      borderRadius: Radii.sm,
      padding: 10,
    },
    pillActive: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}12`,
    },
    pillLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: theme.secondaryText,
      marginBottom: 3,
    },
    pillValue: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primaryText,
    },
    pillPlaceholder: {
      color: theme.secondaryText,
      fontWeight: "400",
    },
    pillArrow: {
      marginTop: 10,
    },

    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    navBtn: {
      width: 34,
      height: 34,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.safeAreaBg ?? "#f5f5f5",
    },
    navBtnDisabled: { opacity: 0.35 },
    monthLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.primaryText,
    },

    dayLabelsRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    dayLabel: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      color: theme.secondaryText,
      paddingVertical: 4,
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
      backgroundColor: `${theme.primary}18`,
    },
    cellRangeLeft: {
      borderTopLeftRadius: CELL_SIZE / 2,
      borderBottomLeftRadius: CELL_SIZE / 2,
      backgroundColor: `${theme.primary}18`,
    },
    cellRangeRight: {
      borderTopRightRadius: CELL_SIZE / 2,
      borderBottomRightRadius: CELL_SIZE / 2,
      backgroundColor: `${theme.primary}18`,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCircleSelected: {
      backgroundColor: theme.primary,
    },
    dayText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.primaryText,
    },
    dayTextDisabled: { color: theme.greyBorder },
    dayTextInRange: { color: theme.primary, fontWeight: "600" },
    dayTextSelected: { color: "#fff", fontWeight: "700" },
    dayTextToday: { color: theme.primary, fontWeight: "700" },
    todayDot: {
      position: "absolute",
      bottom: 2,
      width: 4,
      height: 4,
      borderRadius: Radii.full,
      backgroundColor: theme.primary,
    },

    hint: {
      textAlign: "center",
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 8,
      marginBottom: 16,
    },

    actions: {
      flexDirection: "row",
      gap: 10,
    },
    clearBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: Radii.full,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.greyBorder,
    },
    clearBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    applyBtn: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: Radii.full,
      alignItems: "center",
      backgroundColor: theme.primary,
    },
    applyBtnDisabled: { opacity: 0.45 },
    applyBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
  });
