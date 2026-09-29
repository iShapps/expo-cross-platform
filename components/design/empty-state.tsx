import { Space, type Tone } from "@/constants/design";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "./app-text";
import { AppButton } from "./button";
import { IconBadge } from "./chip";
import { type IconName } from "./icon";

type Props = {
  icon: IconName;
  title: string;
  message?: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Centred empty/error placeholder for lists and screens. */
export function EmptyState({ icon, title, message, tone = "primary", actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <IconBadge icon={icon} tone={tone} size={72} />
      <AppText variant="title3" align="center" style={styles.title}>
        {title}
      </AppText>
      {message && (
        <AppText variant="callout" color="textSecondary" align="center" style={styles.message}>
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <AppButton title={actionLabel} onPress={onAction} variant="secondary" size="compact" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Space.xxl,
    paddingHorizontal: Space.xl,
  },
  title: { marginTop: Space.md },
  message: { marginTop: Space.xs, maxWidth: 280 },
  action: { marginTop: Space.lg },
});
