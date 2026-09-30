import { Radius, Space, Touch, Type } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { GradientFill } from "./gradient-fill";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export type AppButtonProps = Omit<PressableProps, "style" | "children"> & {
  title: string;
  variant?: Variant;
  /** "large" = 52pt (primary actions), "compact" = 44pt (the HIG minimum). */
  size?: "large" | "compact";
  icon?: IconName;
  iconPosition?: "left" | "right";
  loading?: boolean;
  /** Shown next to the spinner while loading (e.g. "Signing you in…"). */
  loadingTitle?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pill button. Primary uses the brand gradient, like the web panel. */
export function AppButton({
  title,
  variant = "primary",
  size = "large",
  icon,
  iconPosition = "left",
  loading = false,
  loadingTitle,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;
  const height = size === "large" ? Touch.button : Touch.buttonCompact;

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.textOnPrimary },
    secondary: { bg: colors.primarySoft, fg: colors.primaryStrong },
    outline: { bg: "transparent", fg: colors.text, border: colors.borderStrong },
    ghost: { bg: "transparent", fg: colors.primaryStrong },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const { bg, fg, border } = palette[variant];
  const iconEl = icon ? <Icon name={icon} size={size === "large" ? 20 : 18} color={fg} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          paddingHorizontal: size === "large" ? Space.xl : Space.lg,
          backgroundColor: variant === "primary" ? undefined : bg,
          borderColor: border ?? "transparent",
          borderWidth: border ? 1 : 0,
          opacity: loading ? 0.85 : isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {variant === "primary" && <GradientFill colors={colors.gradient} />}
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator color={fg} />
          {loadingTitle && (
            <Text style={[size === "large" ? Type.button : Type.buttonCompact, { color: fg }]} numberOfLines={1}>
              {loadingTitle}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {iconPosition === "left" && iconEl}
          <Text style={[size === "large" ? Type.button : Type.buttonCompact, { color: fg }]} numberOfLines={1}>
            {title}
          </Text>
          {iconPosition === "right" && iconEl}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fullWidth: { alignSelf: "stretch" },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },
});
