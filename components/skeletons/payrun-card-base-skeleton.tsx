import { Card } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching ShiftCardBase's layout. */
export const ShiftCardBaseSkeleton: React.FC = () => (
  <Card radius={Radius.lg} padding={Space.md} style={styles.card}>
    <View style={styles.topRow}>
      <SkeletonBase width={56} height={60} borderRadius={Radius.md} />
      <View style={styles.titleBlock}>
        <SkeletonBase width="40%" height={12} borderRadius={Radius.xs} />
        <SkeletonBase width="80%" height={16} borderRadius={Radius.xs} />
        <SkeletonBase width="50%" height={13} borderRadius={Radius.xs} />
      </View>
      <SkeletonBase width={64} height={24} borderRadius={Radius.full} />
    </View>
    <View style={styles.divider} />
    <SkeletonBase width="70%" height={14} borderRadius={Radius.xs} />
    <SkeletonBase width="85%" height={13} borderRadius={Radius.xs} />
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: Space.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  titleBlock: {
    flex: 1,
    gap: Space.xs,
  },
  divider: {
    height: Space.xxs,
  },
});
