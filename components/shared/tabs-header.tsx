import { AppText } from "@/components/design";
import { Space, Touch } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";

interface TabsHeaderProps {
  title: string;
  right?: React.ReactNode;
}

/** Large page title for the tab screens, on the page background. */
const TabsHeader: React.FC<TabsHeaderProps> = ({ title, right }) => (
  <View style={styles.header}>
    <AppText variant="title1" accessibilityRole="header" style={styles.title}>
      {title}
    </AppText>
    {right}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Space.sm,
    minHeight: Touch.min,
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.sm,
  },
  title: {
    flexShrink: 1,
  },
});

export default TabsHeader;
