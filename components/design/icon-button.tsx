import { Radius, Touch } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./icon";

type Props = Omit<PressableProps, "style" | "children"> & {
  icon: IconName;
  /** Required: icon-only buttons have no visible label. */
  accessibilityLabel: string;
  /** "surface" on cards/pages, "glass" on the green hero. */
  variant?: "surface" | "glass" | "plain";
  /** Shows a small dot (e.g. unread notifications). */
  badge?: boolean;
  size?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Round icon-only button, never smaller than the 44pt HIG target. */
export function IconButton({ icon, variant = "surface", badge, size = Touch.min, iconColor, style, ...rest }: Props) {
  const { colors } = useAppTheme();
  const look = {
    surface: { bg: colors.surface, border: colors.border, fg: colors.text },
    glass: { bg: colors.heroGlass, border: colors.heroGlassBorder, fg: colors.onHero },
    plain: { bg: "transparent", border: "transparent", fg: colors.text },
  }[variant];
  const dimension = Math.max(size, Touch.min);

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          backgroundColor: look.bg,
          borderColor: look.border,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Icon name={icon} size={22} color={iconColor ?? look.fg} />
      {badge && <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: variant === "glass" ? colors.heroGradient[0] : colors.surface }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
});
