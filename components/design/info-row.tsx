import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText, type AppTextProps } from "./app-text";

type Props = {
  label: string;
  value: ReactNode;
  /** Colour token for the value (e.g. "danger" for an expired date). */
  valueColor?: AppTextProps["color"];
  /** Last row in a card: no divider underneath. */
  isLast?: boolean;
};

/** One label/value line inside a details card (label left, value right). */
export function InfoRow({ label, value, valueColor = "text", isLast }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <AppText variant="subhead" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyMedium" color={valueColor} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Space.md,
    minHeight: 48,
    paddingVertical: Space.sm,
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
});
