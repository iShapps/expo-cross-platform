import { Card } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching NotificationCard's layout. */
export const NotificationCardSkeleton: React.FC = () => (
  <Card style={styles.card}>
    <SkeletonBase width={44} height={44} borderRadius={Radius.full} />
    <View style={styles.content}>
      <SkeletonBase width="65%" height={16} borderRadius={Radius.xs} />
      <SkeletonBase width="95%" height={13} borderRadius={Radius.xs} />
      <SkeletonBase width="35%" height={12} borderRadius={Radius.xs} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  content: {
    flex: 1,
    gap: Space.xs,
    paddingTop: 2,
  },
});
