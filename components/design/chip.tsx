import { Radius, Space, toneColors, Type, type Tone } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./icon";

type Props = {
  label: string;
  tone?: Tone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

/** Pill label for statuses and categories (display only — not a button). */
export function Chip({ label, tone = "neutral", icon, style }: Props) {
  const { colors } = useAppTheme();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {icon && <Icon name={icon} size={13} color={fg} />}
      <Text style={[Type.caption, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Round tinted badge holding an icon (list rows, stat tiles). */
export function IconBadge({ icon, tone = "primary", size = 40 }: { icon: IconName; tone?: Tone; size?: number }) {
  const { colors } = useAppTheme();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: bg }]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Space.xxs,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badge: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
