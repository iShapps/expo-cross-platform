import { Radius, Space, Touch, type Tone } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View, type StyleProp, type SwitchProps, type ViewStyle } from "react-native";
import { AppText } from "./app-text";
import { Card } from "./card";
import { IconBadge } from "./chip";
import { Icon, type IconName } from "./icon";

/** A titled, rounded group of rows (settings-style). */
export function ListGroup({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.group, style]}>
      {title && (
        <AppText variant="overline" color="textTertiary" style={styles.groupTitle}>
          {title}
        </AppText>
      )}
      <Card padding={0} radius={Radius.xl} style={styles.groupCard}>
        {children}
      </Card>
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: Tone;
  /** Secondary text on the right (e.g. the current organisation). */
  value?: string | null;
  /** Control on the right (e.g. a switch). Replaces the chevron. */
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  /** Last row in its group: no divider underneath. */
  isLast?: boolean;
  accessibilityLabel?: string;
};

/** One row in a ListGroup: icon badge, title/subtitle, value, and chevron or control. */
export function ListRow({
  title,
  subtitle,
  icon,
  tone = "primary",
  value,
  right,
  onPress,
  destructive = false,
  isLast = false,
  accessibilityLabel,
}: RowProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed && !!onPress && { backgroundColor: colors.surfaceMuted }]}
    >
      {icon && <IconBadge icon={icon} tone={destructive ? "danger" : tone} size={36} />}
      <View style={styles.text}>
        <AppText variant="bodyMedium" color={destructive ? "danger" : "text"}>
          {title}
        </AppText>
        {!!subtitle && (
          <AppText variant="footnote" color="textSecondary">
            {subtitle}
          </AppText>
        )}
      </View>
      {!!value && (
        <AppText variant="subhead" color="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      )}
      {right}
      {onPress && !right && !destructive && (
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
      {!isLast && (
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border, left: icon ? Space.md + 36 + Space.sm : Space.md },
          ]}
        />
      )}
    </Pressable>
  );
}

/** Brand-coloured switch. */
export function AppSwitch(props: SwitchProps) {
  const { colors } = useAppTheme();
  return (
    <Switch
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.borderStrong}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Space.xs,
  },
  groupTitle: {
    paddingHorizontal: Space.xxs,
  },
  groupCard: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    minHeight: Touch.button + Space.xxs,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: 160,
  },
  divider: {
    position: "absolute",
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
