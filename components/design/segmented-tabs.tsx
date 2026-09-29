import { elevation, Radius, Space, Touch, Type } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { RefObject } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutRectangle } from "react-native";

type Props = {
  tabs: readonly string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  /** Reports each tab's layout (screens use it to scroll the active tab into view). */
  onTabLayout?: (index: number, layout: LayoutRectangle) => void;
  /** Many tabs: a horizontally scrolling row of pills instead of equal segments. */
  scrollable?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
};

/**
 * Pill segmented control. Visual only — the screen owns which tab is active
 * and what pressing one does.
 */
export function SegmentedTabs({ tabs, activeIndex, onTabPress, onTabLayout, scrollable = false, scrollRef }: Props) {
  const { colors, isDark } = useAppTheme();

  const items = tabs.map((label, index) => {
    const isActive = index === activeIndex;
    return (
      <Pressable
        key={label}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        onPress={() => onTabPress(index)}
        onLayout={(e) => onTabLayout?.(index, e.nativeEvent.layout)}
        style={[
          styles.tab,
          !scrollable && styles.tabEqual,
          isActive && [{ backgroundColor: colors.surface }, elevation(colors, isDark, 1)],
          isActive && isDark && { backgroundColor: colors.surfaceSunken },
        ]}
      >
        <Text
          style={[Type.subhead, { color: isActive ? colors.text : colors.textSecondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
  });

  const trackStyle = [styles.track, { backgroundColor: colors.surfaceMuted }];

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={trackStyle}
      >
        {items}
      </ScrollView>
    );
  }

  return <View style={[trackStyle, styles.trackEqual]}>{items}</View>;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: Space.xxs,
    borderRadius: Radius.full,
    gap: Space.xxs,
  },
  trackEqual: {
    alignSelf: "stretch",
  },
  tab: {
    // 40pt pill inside a 48pt track: the whole track row is the touch zone.
    minHeight: Touch.min - Space.xxs,
    paddingHorizontal: Space.md,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabEqual: {
    flex: 1,
  },
});
