import { Space, Touch } from "@/constants/design";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "./app-text";
import { IconButton } from "./icon-button";

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
};

/** Pushed-screen header: round back button, centred title, optional right action. */
export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={onBack} />
      ) : (
        <View style={styles.slot} />
      )}
      <AppText variant="headline" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {right ?? <View style={styles.slot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    minHeight: Touch.min + Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xxs,
  },
  slot: {
    width: Touch.min,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
});
