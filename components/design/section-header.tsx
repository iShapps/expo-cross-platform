import { Space, Touch } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "./app-text";
import { Icon } from "./icon";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Section title with an optional trailing text action ("See all ›"). */
export function SectionHeader({ title, actionLabel, onAction, style }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, style]}>
      <AppText variant="title3">{title}</AppText>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppText variant="subhead" color="primaryStrong">
            {actionLabel}
          </AppText>
          <Icon name="chevron-forward" size={16} color={colors.primaryStrong} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Touch.min,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: Touch.min,
    paddingLeft: Space.xs,
  },
});
